import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// GET /api/debug-subscriber-status - Debug dello stato dei subscriber
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('subscribers')
      .select('id, first_name, last_name, project_name, subscription_status, is_active, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Errore Supabase:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      count: data?.length || 0,
      subscribers: data || [],
      debug: {
        pending_count: data?.filter(s => s.subscription_status === 'PENDING').length || 0,
        active_count: data?.filter(s => s.subscription_status === 'ACTIVE').length || 0,
        inactive_count: data?.filter(s => s.is_active === false).length || 0
      }
    });
  } catch (error) {
    console.error("Errore nel debug subscriber:", error);
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 });
  }
}
