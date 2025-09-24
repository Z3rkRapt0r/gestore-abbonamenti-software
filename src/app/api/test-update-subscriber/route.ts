import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// PUT /api/test-update-subscriber - Aggiorna abbonato con Edge Config per test
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscriberId, edgeConfigId, edgeKey, vercelToken, vercelTeamId } = body;

    if (!subscriberId) {
      return NextResponse.json({ 
        error: "subscriberId è obbligatorio" 
      }, { status: 400 });
    }

    console.log('🔄 Aggiornamento abbonato per test:', {
      subscriberId,
      edgeConfigId,
      edgeKey: edgeKey || 'maintenance',
      vercelToken: vercelToken ? vercelToken.substring(0, 10) + '...' : 'null',
      vercelTeamId
    });

    const updateData: any = {};
    
    if (edgeConfigId) updateData.edge_config_id = edgeConfigId;
    if (edgeKey) updateData.edge_key = edgeKey;
    if (vercelToken) updateData.vercel_token = vercelToken;
    if (vercelTeamId) updateData.vercel_team_id = vercelTeamId;

    const { data, error } = await supabase
      .from('subscribers')
      .update(updateData)
      .eq('id', subscriberId)
      .select()
      .single();

    if (error) {
      console.error('❌ Errore Supabase:', error);
      return NextResponse.json({ 
        error: error.message,
        details: error
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Abbonato aggiornato con successo",
      subscriber: data
    });

  } catch (error: any) {
    console.error('❌ Errore aggiornamento abbonato:', error);
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
