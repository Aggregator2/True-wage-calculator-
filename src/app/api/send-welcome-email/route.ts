import { NextResponse } from 'next/server';

// Simple welcome email API
// For production, integrate with Resend, SendGrid, or similar
// npm install resend && add RESEND_API_KEY to .env.local

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    // Check if Resend is configured
    if (process.env.RESEND_API_KEY) {
      // Dynamic import to avoid errors if not installed
      try {
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);

        await resend.emails.send({
          from: process.env.EMAIL_FROM || 'TrueWage <onboarding@resend.dev>',
          to: email,
          subject: 'Welcome to TrueWage - Your FIRE Journey Starts Now',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <div style="width: 60px; height: 60px; border-radius: 50%; background: linear-gradient(135deg, #10b981, #059669); margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
                  <span style="color: #050505; font-weight: bold; font-size: 24px;">£</span>
                </div>
                <h1 style="color: #050505; margin: 0;">Welcome to TrueWage!</h1>
              </div>

              <p>Thanks for subscribing to our weekly FIRE tips newsletter.</p>

              <p>Here's what you can expect:</p>

              <ul style="padding-left: 20px;">
                <li><strong>Weekly optimisation tips</strong> - WFH strategies, tax efficiency, geographic arbitrage</li>
                <li><strong>New calculator launches</strong> - Be the first to try new tools</li>
                <li><strong>FIRE community insights</strong> - Real strategies from UK professionals</li>
                <li><strong>Exclusive content</strong> - Premium tips not available on the site</li>
              </ul>

              <div style="background: #f5f5f5; border-radius: 12px; padding: 20px; margin: 25px 0; text-align: center;">
                <p style="margin: 0 0 15px 0; font-weight: 600;">Ready to calculate your True Hourly Wage?</p>
                <a href="${process.env.NEXT_PUBLIC_URL || 'https://truewage.uk'}"
                   style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">
                  Start Calculating →
                </a>
              </div>

              <p style="color: #666; font-size: 14px;">
                Quick tip: Most people discover they're earning 20-40% less per hour than they thought when factoring in commute time and work-related costs.
              </p>

              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

              <p style="color: #999; font-size: 12px; text-align: center;">
                You're receiving this because you subscribed at TrueWage Calculator.<br>
                <a href="${process.env.NEXT_PUBLIC_URL || 'https://truewage.uk'}/unsubscribe?email=${encodeURIComponent(email)}"
                   style="color: #999;">Unsubscribe</a>
              </p>
            </body>
            </html>
          `,
        });

        console.log('Welcome email sent to:', email);
        return NextResponse.json({ success: true });
      } catch (emailError) {
        console.error('Failed to send email via Resend:', emailError);
        // Don't fail the request, just log
        return NextResponse.json({ success: true, emailSent: false });
      }
    }

    // If no email service configured, just log
    console.log('Welcome email would be sent to:', email);
    console.log('Configure RESEND_API_KEY to enable email sending');

    return NextResponse.json({ success: true, emailSent: false });
  } catch (error) {
    console.error('Welcome email error:', error);
    return NextResponse.json({ error: 'Failed to process' }, { status: 500 });
  }
}
