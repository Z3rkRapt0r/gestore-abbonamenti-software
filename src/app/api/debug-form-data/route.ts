import { NextRequest, NextResponse } from "next/server";

// POST /api/debug-form-data - Debug per vedere cosa invia il form
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Debug form data endpoint chiamato');
    
    const body = await request.json();
    console.log('📋 Body completo ricevuto:', JSON.stringify(body, null, 2));
    
    const {
      firstName,
      lastName,
      email,
      projectName,
      githubRepoTemplate,
      vercelToken,
      vercelTeamId,
      subscriptionPrice,
      supabaseInfo,
      customConfig,
      edgeConfigId,
      edgeKey,
      subscriptionStatus,
    } = body;

    const fieldAnalysis = {
      firstName: { value: firstName, exists: !!firstName, type: typeof firstName },
      lastName: { value: lastName, exists: !!lastName, type: typeof lastName },
      email: { value: email, exists: !!email, type: typeof email },
      projectName: { value: projectName, exists: !!projectName, type: typeof projectName },
      githubRepoTemplate: { value: githubRepoTemplate, exists: !!githubRepoTemplate, type: typeof githubRepoTemplate },
      vercelToken: { value: vercelToken, exists: !!vercelToken, type: typeof vercelToken },
      vercelTeamId: { value: vercelTeamId, exists: !!vercelTeamId, type: typeof vercelTeamId },
      subscriptionPrice: { value: subscriptionPrice, exists: !!subscriptionPrice, type: typeof subscriptionPrice },
      supabaseInfo: { value: supabaseInfo, exists: !!supabaseInfo, type: typeof supabaseInfo },
      customConfig: { value: customConfig, exists: !!customConfig, type: typeof customConfig },
      edgeConfigId: { value: edgeConfigId, exists: !!edgeConfigId, type: typeof edgeConfigId },
      edgeKey: { value: edgeKey, exists: !!edgeKey, type: typeof edgeKey },
      subscriptionStatus: { value: subscriptionStatus, exists: !!subscriptionStatus, type: typeof subscriptionStatus },
    };

    // Validazione come nell'endpoint Edge
    const validationErrors = [];
    if (!firstName) validationErrors.push('firstName mancante');
    if (!lastName) validationErrors.push('lastName mancante');
    if (!email) validationErrors.push('email mancante');
    if (!projectName) validationErrors.push('projectName mancante');
    if (!githubRepoTemplate) validationErrors.push('githubRepoTemplate mancante');
    if (!vercelToken) validationErrors.push('vercelToken mancante');
    if (!subscriptionPrice) validationErrors.push('subscriptionPrice mancante');

    return NextResponse.json({
      success: true,
      message: "Analisi dati form completata",
      body: body,
      fieldAnalysis: fieldAnalysis,
      validationErrors: validationErrors,
      isValid: validationErrors.length === 0,
      timestamp: new Date().toISOString()
    });

  } catch (error: unknown) {
    console.error("❌ Errore nel debug form data:", error);
    return NextResponse.json({ 
      error: "Errore interno del server",
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
