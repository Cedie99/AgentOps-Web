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

  // visit_logs.store_id has no FK to surveys, so join manually (no PostgREST embed).
  const { data, error } = await supabase
    .from('visit_logs')
    .select(`
      id,
      store_id,
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
      check_out_notes
    `)
    .eq('user_id', parseInt(userId))
    .gte('timestamp', `${date}T00:00:00`)
    .lte('timestamp', `${date}T23:59:59`)
    .order('timestamp', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const storeIds = [...new Set((data ?? []).map((r: any) => r.store_id).filter(Boolean))];
  let storeMap: Record<number, any> = {};
  if (storeIds.length) {
    const { data: stores } = await supabase
      .from('surveys')
      .select('id, store_name, address, city')
      .in('id', storeIds);
    storeMap = Object.fromEntries((stores ?? []).map((s: any) => [s.id, s]));
  }

  const visits = (data ?? []).map((v: any) => ({
    ...v,
    store: storeMap[v.store_id]
      ? {
          store_name: storeMap[v.store_id].store_name,
          address: storeMap[v.store_id].address,
          city: storeMap[v.store_id].city,
        }
      : null,
  }));

  return NextResponse.json({ visits });
}
