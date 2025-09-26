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
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Subscriber ${subscriberId} resettato a PENDING`,
      subscriber: data
    });
  } catch (error) {
    console.error("Errore nel reset subscriber:", error);
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 });
  }
}
