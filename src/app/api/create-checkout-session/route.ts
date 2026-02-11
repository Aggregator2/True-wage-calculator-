import { NextResponse } from 'next/server';
import Stripe from 'stripe';

let _stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
  }
  return _stripe;
}

export async function POST(request: Request) {
  try {
    const { lookupKey, userId, userEmail } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'Must be logged in' },
        { status: 401 }
      );
    }

    if (!lookupKey) {
      return NextResponse.json(
        { error: 'Lookup key is required' },
        { status: 400 }
      );
    }

    // Determine if it's a one-time payment (lifetime) or subscription
    const isLifetime = lookupKey.toLowerCase().includes('lifetime');

    let session: Stripe.Checkout.Session;

    if (isLifetime) {
      // For one-time payments, get the price by lookup key
      const prices = await getStripe().prices.list({
        lookup_keys: [lookupKey],
        expand: ['data.product'],
      });

      if (!prices.data.length) {
        return NextResponse.json(
          { error: 'Price not found' },
          { status: 404 }
        );
      }

      session = await getStripe().checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        customer_email: userEmail,
        line_items: [
          {
            price: prices.data[0].id,
            quantity: 1,
          },
        ],
        success_url: `${process.env.NEXT_PUBLIC_URL}/?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_URL}/?canceled=true`,
        metadata: {
          userId,
          planType: 'lifetime',
        },
      });
    } else {
      // For subscriptions, use lookup key directly
      const prices = await getStripe().prices.list({
        lookup_keys: [lookupKey],
        expand: ['data.product'],
      });

      if (!prices.data.length) {
        return NextResponse.json(
          { error: 'Price not found' },
          { status: 404 }
        );
      }

      session = await getStripe().checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        customer_email: userEmail,
        line_items: [
          {
            price: prices.data[0].id,
            quantity: 1,
          },
        ],
        success_url: `${process.env.NEXT_PUBLIC_URL}/?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_URL}/?canceled=true`,
        metadata: {
          userId,
          planType: lookupKey.includes('annual') ? 'annual' : 'monthly',
        },
      });
    }

    return NextResponse.json({ url: session.url });
  } catch (error: unknown) {
    console.error('Stripe session error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
