import { NextRequest, NextResponse } from "next/server";

// GET /api/debug-test - Test semplice
export async function GET() {
  return NextResponse.json({ 
    message: "Debug endpoint funziona",
    timestamp: new Date().toISOString()
  });
}

// POST /api/debug-test - Test POST
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return NextResponse.json({ 
      message: "POST ricevuto",
      body: body,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({ 
      error: "Errore nel parsing JSON",
      timestamp: new Date().toISOString()
    }, { status: 400 });
  }
}
