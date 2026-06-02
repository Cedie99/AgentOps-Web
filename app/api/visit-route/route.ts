import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/visit-route?user_id=42&date=2026-06-03
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('user_id');
  const date = searchParams.get('date');

  if (!userId || !date) {
    return NextResponse.json({ error: 'user_id and date required' }, { status: 400 });
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('visit_logs')
    .select(`
      id,
      timestamp,
      check_out_time,
      visit_lat,
      visit_lng,
      photo_url,
      notes,
      outcome,
      check_out_photo_url,
      check_out_lat,
      check_out_lng,
      check_out_notes,
      store:surveys!store_id (
        store_name,
        address,
        city
      )
    `)
    .eq('user_id', parseInt(userId))
    .gte('timestamp', `${date}T00:00:00`)
    .lte('timestamp', `${date}T23:59:59`)
    .order('timestamp', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ visits: data || [] });
}
