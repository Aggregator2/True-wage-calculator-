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

/**
 * POST /api/verify-payment
 *
 * Called by the client after payment succeeds to verify with Stripe and
 * upgrade the user's profile directly. Acts as a fallback in case the
 * webhook is delayed or fails.
 */
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

    // Get the user's stripe_customer_id from their profile
    const { data: profile } = await getSupabaseAdmin()
      .from('user_profiles')
      .select('stripe_customer_id, subscription_status')
      .eq('id', user.id)
      .single();

    // Already premium — no need to check Stripe
    if (profile?.subscription_status === 'premium' || profile?.subscription_status === 'lifetime') {
      return NextResponse.json({ status: profile.subscription_status });
    }

    let customerId = profile?.stripe_customer_id;

    // If no stripe_customer_id in DB, look up by email in Stripe
    if (!customerId && user.email) {
      const customers = await getStripe().customers.list({
        email: user.email,
        limit: 1,
      });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        // Save it so future lookups are faster
        await getSupabaseAdmin()
          .from('user_profiles')
          .update({ stripe_customer_id: customerId, updated_at: new Date().toISOString() })
          .eq('id', user.id);
        console.log(`Saved missing stripe_customer_id ${customerId} for user ${user.id}`);
      }
    }

    if (!customerId) {
      return NextResponse.json({ status: 'free', message: 'No Stripe customer found' });
    }

    // Check for active subscriptions
    const subscriptions = await getStripe().subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1,
    });

    if (subscriptions.data.length > 0) {
      const sub = subscriptions.data[0];

      // Safely extract expiry — current_period_end may be a number (unix) or missing
      let expiresAt: string | null = null;
      const periodEnd = (sub as any).current_period_end;
      if (typeof periodEnd === 'number' && periodEnd > 0) {
        expiresAt = new Date(periodEnd * 1000).toISOString();
      }

      await getSupabaseAdmin()
        .from('user_profiles')
        .update({
          subscription_status: 'premium',
          subscription_id: sub.id,
          stripe_customer_id: customerId,
          subscription_expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      console.log(`✅ User ${user.id} verified as premium via verify-payment`);
      return NextResponse.json({ status: 'premium' });
    }

    // Check for successful one-time payments (lifetime)
    const paymentIntents = await getStripe().paymentIntents.list({
      customer: customerId,
      limit: 5,
    });

    const lifetimePayment = paymentIntents.data.find(
      (pi) => pi.status === 'succeeded' && pi.metadata?.plan_type === 'lifetime'
    );

    if (lifetimePayment) {
      await getSupabaseAdmin()
        .from('user_profiles')
        .update({
          subscription_status: 'lifetime',
          stripe_customer_id: customerId,
          subscription_expires_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      console.log(`✅ User ${user.id} verified as lifetime via verify-payment`);
      return NextResponse.json({ status: 'lifetime' });
    }

    return NextResponse.json({ status: 'free', message: 'No active subscription or lifetime payment found' });
  } catch (error) {
    console.error('verify-payment error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
