import { NextRequest, NextResponse } from "next/server";

// POST /api/utils/generate-slug - Genera slug da nome cliente
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ error: "Nome richiesto" }, { status: 400 });
    }

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return NextResponse.json({ slug });
  } catch (error) {
    console.error("Errore nella generazione slug:", error);
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 });
  }
}


