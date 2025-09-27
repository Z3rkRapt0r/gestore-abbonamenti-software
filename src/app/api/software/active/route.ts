import { NextResponse } from "next/server";
import { db } from "@/lib/database";

// GET /api/software/active - Recupera solo i software attivi (per form)
export async function GET() {
  try {
    const software = await db.getActiveSoftware();
    
    return NextResponse.json({
      success: true,
      software,
    });
  } catch (error: unknown) {
    console.error("Errore nel recupero software attivi:", error);
    return NextResponse.json({ 
      error: "Errore interno del server" 
    }, { status: 500 });
  }
}
