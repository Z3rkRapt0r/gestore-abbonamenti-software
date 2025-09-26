import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// POST /api/debug-reset-subscriber - Reset di un subscriber a PENDING per test
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscriberId } = body;

    if (!subscriberId) {
      return NextResponse.json({ error: "ID subscriber richiesto" }, { status: 400 });
    }

    console.log('🔄 Reset subscriber:', subscriberId);

    // Reset subscriber a PENDING
    const { data, error } = await supabase
      .from('subscribers')
      .update({
        subscription_status: 'PENDING',
        is_active: false,
        stripe_customer_id: null,
        stripe_subscription_id: null,
        next_billing_date: null,
        last_payment_date: null
      })
      .eq('id', subscriberId)
      .select()
      .single();

    if (error) {
      console.error('❌ Errore Supabase:', error);
      return NextResponse.json({ 
        error: error.message,
        details: error,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

    console.log('✅ Subscriber resettato:', data);

    return NextResponse.json({
      success: true,
      message: `Subscriber ${subscriberId} resettato a PENDING`,
      subscriber: data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Errore nel reset subscriber:", error);
    return NextResponse.json({ 
      error: "Errore interno del server",
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
