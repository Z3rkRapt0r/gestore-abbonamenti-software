import { NextRequest, NextResponse } from "next/server";

// POST /api/debug-simple - Test semplice
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    return NextResponse.json({
      success: true,
      message: "Debug semplice funziona",
      received: body,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      error: "Errore nel parsing JSON",
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 400 });
  }
}
