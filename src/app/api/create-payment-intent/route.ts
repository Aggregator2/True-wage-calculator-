import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
  }
  return _stripe;
}

let _supabaseAdmin: SupabaseClient | null = null;
function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    _supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
  }
  return _supabaseAdmin;
}

async function verifyUser(token: string) {
  const supabaseAuth = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    {
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
    }
  );
  const { data: { user }, error } = await supabaseAuth.auth.getUser();
  return { user, error };
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const { user, error: authError } = await verifyUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;
    const userEmail = user.email!;

    const { lookupKey } = await request.json();

    console.log('Creating payment intent for:', { lookupKey, userId, userEmail });

    if (!lookupKey) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Get the price from lookup key
    const prices = await getStripe().prices.list({
      lookup_keys: [lookupKey],
      active: true,
      limit: 1,
    });

    console.log('Found prices:', prices.data.length);

    if (prices.data.length === 0) {
      return NextResponse.json(
        { error: 'Price not found' },
        { status: 404 }
      );
    }

    const price = prices.data[0];
    const isSubscription = price.type === 'recurring';

    console.log('Price:', { id: price.id, type: price.type, amount: price.unit_amount });

    // Check if customer already exists
    const existingCustomers = await getStripe().customers.list({
      email: userEmail,
      limit: 1,
    });

    let customerId: string;
    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;
      console.log('Existing customer:', customerId);
      // Update metadata if not set
      await getStripe().customers.update(customerId, {
        metadata: {
          supabase_user_id: userId,
        },
      });
    } else {
      // Create a new customer
      const customer = await getStripe().customers.create({
        email: userEmail,
        metadata: {
          supabase_user_id: userId,
        },
      });
      customerId = customer.id;
      console.log('Created customer:', customerId);
    }

    // Save stripe_customer_id to user_profiles so webhooks can find the user
    await getSupabaseAdmin()
      .from('user_profiles')
      .update({ stripe_customer_id: customerId, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (isSubscription) {
      console.log('Creating subscription with SetupIntent approach...');

      // Create a SetupIntent for collecting payment method first
      // This is more reliable than trying to expand payment_intent on the invoice
      const subscription = await getStripe().subscriptions.create({
        customer: customerId,
        items: [{ price: price.id }],
        payment_behavior: 'default_incomplete',
        payment_settings: {
          save_default_payment_method: 'on_subscription',
          payment_method_types: ['card', 'link'],
        },
        expand: ['pending_setup_intent', 'latest_invoice'],
        metadata: {
          supabase_user_id: userId,
        },
      });

      console.log('Subscription created:', subscription.id);
      console.log('Subscription status:', subscription.status);

      // Get the latest invoice and finalize it to create the payment intent
      const invoice = subscription.latest_invoice;

      if (invoice && typeof invoice !== 'string') {
        console.log('Invoice ID:', invoice.id);
        console.log('Invoice status:', invoice.status);

        // If the invoice is in draft, finalize it
        if (invoice.status === 'draft') {
          console.log('Finalizing invoice...');
          await getStripe().invoices.finalizeInvoice(invoice.id);
        }

        // Retrieve the invoice with the payment intent expanded
        const finalInvoice = await getStripe().invoices.retrieve(invoice.id, {
          expand: ['payment_intent'],
        }) as Stripe.Invoice & { payment_intent?: Stripe.PaymentIntent | string | null };

        console.log('Final invoice status:', finalInvoice.status);
        console.log('Payment intent on invoice:', typeof finalInvoice.payment_intent);

        if (finalInvoice.payment_intent && typeof finalInvoice.payment_intent !== 'string') {
          console.log('Payment intent found:', finalInvoice.payment_intent.id);
          return NextResponse.json({
            clientSecret: finalInvoice.payment_intent.client_secret,
            subscriptionId: subscription.id,
            type: 'subscription',
            amount: price.unit_amount,
            currency: price.currency,
          });
        }
      }

      // Fallback: Check if there's a pending_setup_intent
      if (subscription.pending_setup_intent && typeof subscription.pending_setup_intent !== 'string') {
        console.log('Using pending setup intent:', subscription.pending_setup_intent.id);
        return NextResponse.json({
          clientSecret: subscription.pending_setup_intent.client_secret,
          subscriptionId: subscription.id,
          type: 'setup',
          amount: price.unit_amount,
          currency: price.currency,
        });
      }

      // Last resort: Create a payment intent manually
      console.log('Creating payment intent manually...');
      const paymentIntent = await getStripe().paymentIntents.create({
        amount: price.unit_amount!,
        currency: price.currency,
        customer: customerId,
        setup_future_usage: 'off_session',
        metadata: {
          supabase_user_id: userId,
          subscription_id: subscription.id,
          plan_type: lookupKey.includes('monthly') ? 'monthly' : 'annual',
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      console.log('Manual payment intent created:', paymentIntent.id);

      return NextResponse.json({
        clientSecret: paymentIntent.client_secret,
        subscriptionId: subscription.id,
        type: 'subscription',
        amount: price.unit_amount,
        currency: price.currency,
      });

    } else {
      // For one-time payment (lifetime)
      console.log('Creating one-time payment intent...');

      const paymentIntent = await getStripe().paymentIntents.create({
        amount: price.unit_amount!,
        currency: price.currency,
        customer: customerId,
        metadata: {
          supabase_user_id: userId,
          price_id: price.id,
          plan_type: 'lifetime',
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      console.log('Payment intent created:', paymentIntent.id);

      return NextResponse.json({
        clientSecret: paymentIntent.client_secret,
        type: 'one_time',
        amount: price.unit_amount,
        currency: price.currency,
      });
    }
  } catch (error) {
    console.error('Payment intent error:', error);
    // Return more detailed error in development
    const errorMessage = error instanceof Error ? error.message : 'Failed to create payment intent';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
