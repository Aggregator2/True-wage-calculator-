import { NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy Supabase admin client initialization
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

export async function GET(request: Request) {
  try {
    // Protect this endpoint with admin API key
    const authHeader = request.headers.get('authorization');
    const adminKey = process.env.ADMIN_API_KEY;

    // Require admin key for security
    if (!adminKey || authHeader !== `Bearer ${adminKey}`) {
      return NextResponse.json(
        { error: 'Unauthorized. Provide valid admin API key.' },
        { status: 401 }
      );
    }

    // Get query params for filtering
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') !== 'false';
    const format = searchParams.get('format') || 'json';

    // Fetch all subscribers
    let query = getSupabaseAdmin()
      .from('email_subscribers')
      .select('*')
      .order('subscribed_at', { ascending: false });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data: subscribers, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch subscribers' },
        { status: 500 }
      );
    }

    // Format the data
    const formattedData = subscribers?.map((sub) => ({
      email: sub.email,
      subscribed_at: sub.subscribed_at,
      source: sub.source,
      gdpr_consent: sub.gdpr_consent,
      is_active: sub.is_active,
      unsubscribed_at: sub.unsubscribed_at,
    })) || [];

    // Return based on format
    if (format === 'csv') {
      // CSV format
      const headers = ['email', 'subscribed_at', 'source', 'gdpr_consent', 'is_active', 'unsubscribed_at'];
      const csvRows = [
        headers.join(','),
        ...formattedData.map((row) =>
          headers.map((header) => {
            const value = row[header as keyof typeof row];
            // Escape commas and quotes in values
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value ?? '';
          }).join(',')
        ),
      ];

      return new NextResponse(csvRows.join('\n'), {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="email-subscribers-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    // JSON format (default)
    return NextResponse.json({
      success: true,
      count: formattedData.length,
      exported_at: new Date().toISOString(),
      subscribers: formattedData,
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Failed to export subscribers' },
      { status: 500 }
    );
  }
}

// Also allow POST for saving a local backup
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const adminKey = process.env.ADMIN_API_KEY;

    if (!adminKey || authHeader !== `Bearer ${adminKey}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all subscribers
    const { data: subscribers, error } = await getSupabaseAdmin()
      .from('email_subscribers')
      .select('*')
      .order('subscribed_at', { ascending: false });

    if (error) throw error;

    // Create a backup object with metadata
    const backup = {
      exported_at: new Date().toISOString(),
      total_subscribers: subscribers?.length || 0,
      active_subscribers: subscribers?.filter((s) => s.is_active).length || 0,
      subscribers: subscribers?.map((sub) => ({
        email: sub.email,
        subscribed_at: sub.subscribed_at,
        source: sub.source,
        gdpr_consent: sub.gdpr_consent,
        is_active: sub.is_active,
      })) || [],
    };

    return NextResponse.json({
      success: true,
      message: 'Backup data ready for download',
      backup,
    });
  } catch (error) {
    console.error('Backup error:', error);
    return NextResponse.json({ error: 'Failed to create backup' }, { status: 500 });
  }
}
