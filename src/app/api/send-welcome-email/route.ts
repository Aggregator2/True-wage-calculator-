import { NextResponse } from 'next/server';

// Simple welcome email API
// For production, integrate with Resend, SendGrid, or similar
// npm install resend && add RESEND_API_KEY to .env.local

// In-memory rate limiting (per serverless instance)
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 3;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now >= entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return true;
  }

  entry.count++;
  return false;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    // Rate limit by IP
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const { email } = await request.json();

    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }

    // Check if Resend is configured
    if (process.env.RESEND_API_KEY) {
      // Dynamic import to avoid errors if not installed
      try {
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);

        const siteUrl = process.env.NEXT_PUBLIC_URL || 'https://truewage.uk';

        await resend.emails.send({
          from: process.env.EMAIL_FROM || 'TrueWage <onboarding@resend.dev>',
          to: email,
          subject: "You're probably earning less than you think",
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; background-color: #050505; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
              <div style="max-width: 600px; margin: 0 auto; padding: 0;">

                <!-- Header -->
                <div style="padding: 40px 30px 20px; text-align: center;">
                  <div style="width: 56px; height: 56px; border-radius: 50%; background: linear-gradient(135deg, #10b981, #059669); margin: 0 auto 20px; line-height: 56px; text-align: center;">
                    <span style="color: #050505; font-weight: bold; font-size: 22px;">&#163;</span>
                  </div>
                  <h1 style="color: #ffffff; font-size: 26px; font-weight: 700; margin: 0 0 6px 0; letter-spacing: -0.5px;">Welcome to TrueWage</h1>
                  <p style="color: #10b981; font-size: 14px; font-weight: 500; margin: 0;">Your financial clarity starts here</p>
                </div>

                <!-- The Hook -->
                <div style="padding: 10px 30px 30px;">
                  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 16px; padding: 28px; text-align: center;">
                    <p style="color: #050505; font-size: 32px; font-weight: 800; margin: 0 0 8px 0; letter-spacing: -1px;">20-40%</p>
                    <p style="color: #050505; font-size: 15px; font-weight: 600; margin: 0; opacity: 0.85;">That's how much less most people <em>actually</em> earn per hour once you factor in commute, stress, and hidden costs.</p>
                  </div>
                </div>

                <!-- What You Get Free -->
                <div style="padding: 0 30px 30px;">
                  <h2 style="color: #ffffff; font-size: 18px; font-weight: 600; margin: 0 0 16px 0;">Here's what you've unlocked:</h2>

                  <table role="presentation" style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 12px 16px; background: #111111; border-radius: 10px 10px 0 0; border-bottom: 1px solid #1a1a1a;">
                        <span style="color: #10b981; font-size: 16px; margin-right: 10px;">&#10003;</span>
                        <span style="color: #e5e5e5; font-size: 14px;">Full calculator with all <strong style="color: #ffffff;">13 UK-specific factors</strong></span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 16px; background: #111111; border-bottom: 1px solid #1a1a1a;">
                        <span style="color: #10b981; font-size: 16px; margin-right: 10px;">&#10003;</span>
                        <span style="color: #e5e5e5; font-size: 14px;">Income Tax, NI, and Student Loan breakdowns</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 16px; background: #111111; border-bottom: 1px solid #1a1a1a;">
                        <span style="color: #10b981; font-size: 16px; margin-right: 10px;">&#10003;</span>
                        <span style="color: #e5e5e5; font-size: 14px;">Commute, WFH, and stress cost analysis</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 16px; background: #111111; border-radius: 0 0 10px 10px;">
                        <span style="color: #10b981; font-size: 16px; margin-right: 10px;">&#10003;</span>
                        <span style="color: #e5e5e5; font-size: 14px;">Basic FIRE projection &amp; 3 saved scenarios</span>
                      </td>
                    </tr>
                  </table>
                </div>

                <!-- CTA: Calculate -->
                <div style="padding: 0 30px 35px; text-align: center;">
                  <a href="${siteUrl}/calculator"
                     style="display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: #050505; padding: 16px 40px; border-radius: 50px; text-decoration: none; font-weight: 700; font-size: 16px; letter-spacing: -0.3px;">
                    Calculate My True Hourly Wage &#8594;
                  </a>
                  <p style="color: #666666; font-size: 12px; margin: 12px 0 0 0;">Takes 2 minutes. No credit card needed.</p>
                </div>

                <!-- Divider -->
                <div style="padding: 0 30px;">
                  <div style="height: 1px; background: linear-gradient(to right, transparent, #333333, transparent);"></div>
                </div>

                <!-- Premium Teaser -->
                <div style="padding: 35px 30px;">
                  <div style="background: #111111; border: 1px solid #1f1f1f; border-radius: 16px; padding: 28px; position: relative; overflow: hidden;">
                    <div style="position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(to right, #10b981, #3b82f6, #8b5cf6);"></div>

                    <p style="color: #a78bfa; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 12px 0;">Premium</p>
                    <h3 style="color: #ffffff; font-size: 20px; font-weight: 700; margin: 0 0 12px 0; letter-spacing: -0.3px;">Want the full picture?</h3>
                    <p style="color: #999999; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">Premium members get AI-powered reports that tell you <em style="color: #e5e5e5;">exactly</em> where your money is leaking, personalised strategies to hit FIRE faster, and unlimited scenario planning.</p>

                    <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                      <tr>
                        <td style="padding: 8px 0; color: #e5e5e5; font-size: 13px;">
                          <span style="color: #a78bfa; margin-right: 8px;">&#9733;</span> Full AI financial reports &amp; PDF export
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #e5e5e5; font-size: 13px;">
                          <span style="color: #a78bfa; margin-right: 8px;">&#9733;</span> Unlimited scenarios &amp; side-by-side comparison
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #e5e5e5; font-size: 13px;">
                          <span style="color: #a78bfa; margin-right: 8px;">&#9733;</span> Advanced FIRE projections with multiple paths
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #e5e5e5; font-size: 13px;">
                          <span style="color: #a78bfa; margin-right: 8px;">&#9733;</span> Priority support &amp; early access to new tools
                        </td>
                      </tr>
                    </table>

                    <div style="text-align: center;">
                      <a href="${siteUrl}/calculator"
                         style="display: inline-block; background: transparent; color: #a78bfa; padding: 12px 32px; border-radius: 50px; text-decoration: none; font-weight: 600; font-size: 14px; border: 2px solid #a78bfa;">
                        Explore Premium &#8594;
                      </a>
                      <p style="color: #666666; font-size: 12px; margin: 12px 0 0 0;">From &#163;5/month &middot; Cancel anytime</p>
                    </div>
                  </div>
                </div>

                <!-- Weekly Tips Teaser -->
                <div style="padding: 0 30px 35px;">
                  <h3 style="color: #ffffff; font-size: 16px; font-weight: 600; margin: 0 0 14px 0;">Coming to your inbox every week:</h3>
                  <table role="presentation" style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 6px 0; color: #b0b0b0; font-size: 13px;">&#128200; &nbsp;Tax optimisation strategies for UK earners</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; color: #b0b0b0; font-size: 13px;">&#127968; &nbsp;WFH savings and remote work financial tips</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; color: #b0b0b0; font-size: 13px;">&#128293; &nbsp;Real FIRE strategies from UK professionals</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; color: #b0b0b0; font-size: 13px;">&#128161; &nbsp;New calculator features before anyone else</td>
                    </tr>
                  </table>
                </div>

                <!-- Footer -->
                <div style="padding: 30px; text-align: center; border-top: 1px solid #1a1a1a;">
                  <p style="color: #444444; font-size: 11px; margin: 0 0 8px 0;">
                    You're receiving this because you subscribed at TrueWage.
                  </p>
                  <a href="${siteUrl}/unsubscribe?email=${encodeURIComponent(email)}"
                     style="color: #444444; font-size: 11px; text-decoration: underline;">Unsubscribe</a>
                </div>

              </div>
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
