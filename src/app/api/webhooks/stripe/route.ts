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

let _supabase: SupabaseClient | null = null;
function getSupabaseAdmin(): SupabaseClient {
  if (!_supabase) {
    _supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
  }
  return _supabase;
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET || '');
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Webhook signature verification failed:', message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  console.log(`Received webhook: ${event.type}`);

  // ─── Handle checkout.session.completed (Stripe Checkout redirect flow) ───
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;

    if (!userId) {
      console.error('No userId in session metadata');
      return NextResponse.json({ error: 'No user ID' }, { status: 400 });
    }

    const isLifetime = session.mode === 'payment';
    const subscriptionId = session.subscription as string | null;
    const customerId = session.customer as string;

    let expiresAt: string | null = null;
    if (!isLifetime && subscriptionId) {
      const subscriptionResponse = await getStripe().subscriptions.retrieve(subscriptionId);
      const subscriptionData = subscriptionResponse as unknown as { current_period_end: number };
      expiresAt = new Date(subscriptionData.current_period_end * 1000).toISOString();
    }

    const { error } = await getSupabaseAdmin()
      .from('user_profiles')
      .update({
        subscription_status: isLifetime ? 'lifetime' : 'premium',
        subscription_id: subscriptionId,
        stripe_customer_id: customerId,
        subscription_expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      console.error('Failed to update user profile:', error);
      return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
    }

    console.log(`✅ User ${userId} upgraded via checkout session`);
  }

  // ─── Handle invoice.paid (fires when embedded PaymentElement subscription succeeds) ───
  if (event.type === 'invoice.paid') {
    const invoice = event.data.object as Stripe.Invoice;
    const customerId = typeof invoice.customer === 'string' ? invoice.customer : (invoice.customer as any)?.id;
    const invoiceAny = invoice as any;
    const subscriptionId = typeof invoiceAny.subscription === 'string' ? invoiceAny.subscription : invoiceAny.subscription?.id as string | undefined;

    if (!customerId) {
      console.log('invoice.paid: no customer ID, skipping');
      return NextResponse.json({ status: 'success' });
    }

    // Find user by stripe_customer_id
    const { data: profile } = await getSupabaseAdmin()
      .from('user_profiles')
      .select('id, subscription_status')
      .eq('stripe_customer_id', customerId)
      .single();

    // Also try finding by metadata on the customer
    let userId = profile?.id;
    if (!userId) {
      try {
        const customer = await getStripe().customers.retrieve(customerId) as Stripe.Customer;
        const metaUserId = customer.metadata?.supabase_user_id;
        if (metaUserId) {
          userId = metaUserId;
        }
      } catch (e) {
        console.error('Could not retrieve customer:', e);
      }
    }

    if (userId) {
      let expiresAt: string | null = null;
      if (subscriptionId) {
        try {
          const sub = await getStripe().subscriptions.retrieve(subscriptionId);
          const subData = sub as unknown as { current_period_end: number };
          expiresAt = new Date(subData.current_period_end * 1000).toISOString();
        } catch (e) {
          console.error('Could not retrieve subscription for expiry:', e);
        }
      }

      const { error } = await getSupabaseAdmin()
        .from('user_profiles')
        .update({
          subscription_status: 'premium',
          subscription_id: subscriptionId || null,
          stripe_customer_id: customerId,
          subscription_expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        console.error('invoice.paid: failed to update profile:', error);
      } else {
        console.log(`✅ User ${userId} upgraded via invoice.paid`);
      }
    } else {
      console.warn('invoice.paid: could not find user for customer', customerId);
    }
  }

  // ─── Handle payment_intent.succeeded (fires for one-time payments like lifetime) ───
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const userId = paymentIntent.metadata?.supabase_user_id;
    const planType = paymentIntent.metadata?.plan_type;
    const customerId = typeof paymentIntent.customer === 'string' ? paymentIntent.customer : (paymentIntent.customer as any)?.id;

    if (userId && planType === 'lifetime') {
      const { error } = await getSupabaseAdmin()
        .from('user_profiles')
        .update({
          subscription_status: 'lifetime',
          stripe_customer_id: customerId || null,
          subscription_expires_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        console.error('payment_intent.succeeded: failed to update profile:', error);
      } else {
        console.log(`✅ User ${userId} upgraded to lifetime via payment_intent.succeeded`);
      }
    } else if (userId) {
      // For subscription payment intents — invoice.paid will also handle this,
      // but we set it here too as a safety net
      const subscriptionId = paymentIntent.metadata?.subscription_id;

      if (subscriptionId) {
        let expiresAt: string | null = null;
        try {
          const sub = await getStripe().subscriptions.retrieve(subscriptionId);
          const subData = sub as unknown as { current_period_end: number };
          expiresAt = new Date(subData.current_period_end * 1000).toISOString();
        } catch (e) {
          console.error('Could not retrieve subscription:', e);
        }

        const { error } = await getSupabaseAdmin()
          .from('user_profiles')
          .update({
            subscription_status: 'premium',
            subscription_id: subscriptionId,
            stripe_customer_id: customerId || null,
            subscription_expires_at: expiresAt,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        if (error) {
          console.error('payment_intent.succeeded: failed to update subscription profile:', error);
        } else {
          console.log(`✅ User ${userId} subscription activated via payment_intent.succeeded`);
        }
      }
    }
  }

  // ─── Handle subscription created ───
  if (event.type === 'customer.subscription.created') {
    const subscription = event.data.object as Stripe.Subscription;
    const customerId = typeof subscription.customer === 'string' ? subscription.customer : (subscription.customer as any)?.id;
    const userId = (subscription as any).metadata?.supabase_user_id;

    console.log(`Subscription created: ${subscription.id} for customer ${customerId}`);

    // If subscription is active immediately (e.g. $0 trial), update the profile
    if (userId && (subscription as any).status === 'active') {
      const subData = subscription as unknown as { current_period_end: number };
      const expiresAt = new Date(subData.current_period_end * 1000).toISOString();

      await getSupabaseAdmin()
        .from('user_profiles')
        .update({
          subscription_status: 'premium',
          subscription_id: subscription.id,
          stripe_customer_id: customerId,
          subscription_expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      console.log(`✅ User ${userId} subscription activated immediately`);
    }
  }

  // ─── Handle subscription updated (renewal, plan change, etc.) ───
  if (event.type === 'customer.subscription.updated') {
    const subscription = event.data.object as Stripe.Subscription;
    const subscriptionData = subscription as unknown as { customer: string; current_period_end: number; status: string };
    const customerId = subscriptionData.customer;

    const { data: profile } = await getSupabaseAdmin()
      .from('user_profiles')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .single();

    if (profile) {
      const expiresAt = new Date(subscriptionData.current_period_end * 1000).toISOString();
      const status = subscriptionData.status === 'active' ? 'premium' : 'free';

      await getSupabaseAdmin()
        .from('user_profiles')
        .update({
          subscription_status: status,
          subscription_expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      console.log(`Subscription updated for user ${profile.id}, status: ${status}`);
    }
  }

  // ─── Handle subscription deleted/canceled ───
  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription;
    const subscriptionData = subscription as unknown as { customer: string };
    const customerId = subscriptionData.customer;

    const { data: profile } = await getSupabaseAdmin()
      .from('user_profiles')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .single();

    if (profile) {
      await getSupabaseAdmin()
        .from('user_profiles')
        .update({
          subscription_status: 'free',
          subscription_id: null,
          subscription_expires_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      console.log(`❌ Subscription cancelled for user ${profile.id}`);
    }
  }

  // ─── Handle subscription trial ending ───
  if (event.type === 'customer.subscription.trial_will_end') {
    const subscription = event.data.object as Stripe.Subscription;
    console.log(`Subscription trial will end: ${subscription.id}`);
    // TODO: Send email reminder
  }

  // ─── Handle failed payment ───
  if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object as Stripe.Invoice;
    console.warn('⚠️ Payment failed for:', invoice.customer_email);
    // TODO: Send email notification
  }

  return NextResponse.json({ status: 'success' });
}
