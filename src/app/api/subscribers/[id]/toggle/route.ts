import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-server";
import { db } from "@/lib/database";
import { supabaseAdmin } from "@/lib/supabase-admin";

// PUT /api/subscribers/[id]/toggle - Attiva/disattiva abbonato
export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();

    const { id } = await context.params;
    const updatedSubscriber = await db.toggleSubscriberStatus(id);

    if (!updatedSubscriber) {
      return NextResponse.json({ error: "Abbonato non trovato" }, { status: 404 });
    }

    // Logica Pause/Resume Vercel via Alias Switch
    // Requisiti nei dati del subscriber:
    // - vercel_token (obbl.)
    // - vercel_project_id (per riattivazione)
    // - custom_config.maintenanceDeploymentId (per pausa)
    // - custom_config.domains: string[] (domini da spostare)

    const url = new URL(request.url);
    const dryRun = url.searchParams.get("dry") === "1";

    const vercel_token: string | undefined = (updatedSubscriber as unknown as { vercel_token?: string }).vercel_token;
    const vercel_team_id: string | undefined = (updatedSubscriber as unknown as { vercel_team_id?: string }).vercel_team_id;
    const vercel_project_id: string | undefined = (updatedSubscriber as unknown as { vercel_project_id?: string }).vercel_project_id;
    const custom_config: Record<string, unknown> | undefined = (updatedSubscriber as unknown as { custom_config?: Record<string, unknown> }).custom_config;

    // Fallback globale dalla tabella configurations
    let maintenanceDeploymentId: string | undefined = undefined;
    if (custom_config && typeof (custom_config as Record<string, unknown>)["maintenanceDeploymentId"] === "string") {
      maintenanceDeploymentId = (custom_config as Record<string, unknown>)["maintenanceDeploymentId"] as string;
    }
    if (!maintenanceDeploymentId) {
      const { data: globalCfg } = await supabaseAdmin
        .from('configurations')
        .select('maintenance_deployment_id')
        .limit(1)
        .single();
      maintenanceDeploymentId = (globalCfg as unknown as { maintenance_deployment_id?: string })?.maintenance_deployment_id || maintenanceDeploymentId;
    }
    let domains: string[] = [];
    const domainsValue = custom_config ? (custom_config as Record<string, unknown>)["domains"] : undefined;
    if (Array.isArray(domainsValue)) {
      domains = (domainsValue as unknown[]).filter((d): d is string => typeof d === "string");
    }

    const isNowActive = !!updatedSubscriber.is_active;

    // Se mancano dati essenziali, rispondi comunque con updatedSubscriber e warning
    const warnings: string[] = [];
    if (!vercel_token) warnings.push("Vercel token mancante");
    if (!domains.length) warnings.push("Nessun dominio configurato in custom_config.domains");
    if (!isNowActive && !maintenanceDeploymentId) warnings.push("maintenanceDeploymentId mancante per pausa");
    if (isNowActive && !vercel_project_id) warnings.push("vercel_project_id mancante per riattivazione");

    // Se non abbiamo token o domini, non procediamo con chiamate Vercel
    if (!vercel_token || !domains.length) {
      return NextResponse.json({
        subscriber: updatedSubscriber,
        warnings,
        vercel: { executed: false },
      });
    }

    const base = "https://api.vercel.com";
    const authHeaders: Record<string, string> = {
      Authorization: `Bearer ${vercel_token}`,
      "Content-Type": "application/json",
    };
    const teamQuery = vercel_team_id ? `teamId=${encodeURIComponent(vercel_team_id)}` : "";

    const execCalls: Array<{ action: string; domain: string; targetDeployment?: string; status?: number; ok?: boolean; error?: unknown }> = [];

    if (!isNowActive) {
      // PAUSA → sposta domini alla maintenance deployment
      if (!maintenanceDeploymentId) {
        return NextResponse.json({
          subscriber: updatedSubscriber,
          warnings,
          vercel: { executed: false, reason: "maintenanceDeploymentId mancante" },
        });
      }

      for (const domain of domains) {
        execCalls.push({ action: "alias_to_maintenance", domain, targetDeployment: maintenanceDeploymentId });
        if (dryRun) continue;
        const qs = teamQuery ? `?${teamQuery}` : "";
        const res = await fetch(`${base}/v2/deployments/${maintenanceDeploymentId}/aliases${qs}`, {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({ alias: domain }),
        });
        execCalls[execCalls.length - 1].status = res.status;
        execCalls[execCalls.length - 1].ok = res.ok;
        if (!res.ok) {
          execCalls[execCalls.length - 1].error = await res.text();
        }
      }
    } else {
      // RIATTIVA → sposta domini sull'ultima production deployment del progetto
      if (!vercel_project_id) {
        return NextResponse.json({
          subscriber: updatedSubscriber,
          warnings,
          vercel: { executed: false, reason: "vercel_project_id mancante" },
        });
      }

      let latestDeploymentId: string | undefined;
      if (!dryRun) {
        const qs = new URLSearchParams({ projectId: vercel_project_id, target: "production", limit: "1" });
        if (vercel_team_id) qs.set("teamId", vercel_team_id);
        const res = await fetch(`${base}/v13/deployments?${qs.toString()}`, { headers: authHeaders });
        if (!res.ok) {
          warnings.push(`Impossibile recuperare latest production deployment (${res.status})`);
        } else {
          const json = (await res.json()) as { deployments?: Array<{ uid?: string }> };
          latestDeploymentId = json?.deployments?.[0]?.uid;
          if (!latestDeploymentId) {
            warnings.push("Nessuna production deployment trovata");
          }
        }
      } else {
        latestDeploymentId = "dry-run-latest-deployment";
      }

      if (!latestDeploymentId) {
        return NextResponse.json({
          subscriber: updatedSubscriber,
          warnings,
          vercel: { executed: false, reason: "deployment di produzione non trovata" },
        });
      }

      for (const domain of domains) {
        execCalls.push({ action: "alias_to_production", domain, targetDeployment: latestDeploymentId });
        if (dryRun) continue;
        const qs = teamQuery ? `?${teamQuery}` : "";
        const res = await fetch(`${base}/v2/deployments/${latestDeploymentId}/aliases${qs}`, {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({ alias: domain }),
        });
        execCalls[execCalls.length - 1].status = res.status;
        execCalls[execCalls.length - 1].ok = res.ok;
        if (!res.ok) {
          execCalls[execCalls.length - 1].error = await res.text();
        }
      }
    }

    return NextResponse.json({
      subscriber: updatedSubscriber,
      vercel: { executed: !dryRun, dryRun },
      calls: execCalls,
      warnings,
    });
  } catch (error) {
    console.error("Errore nel toggle stato abbonato:", error);
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 });
  }
}