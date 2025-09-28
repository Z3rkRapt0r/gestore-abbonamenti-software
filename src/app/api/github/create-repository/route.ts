import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-server";
import { db } from "@/lib/database";
import { GitHubService, parseGitHubUrl } from "@/lib/github";

// POST /api/github/create-repository - Crea repository GitHub per un cliente
export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    
    const body = await request.json();
    const { subscriberId } = body;

    if (!subscriberId) {
      return NextResponse.json({ error: "subscriberId è obbligatorio" }, { status: 400 });
    }

    console.log(`🔄 Creating GitHub repository for subscriber: ${subscriberId}`);

    // Recupera i dati del subscriber
    const subscriber = await db.getSubscriberById(subscriberId);
    console.log('🔍 Subscriber data:', {
      id: subscriber?.id,
      email: subscriber?.email,
      software_id: subscriber?.software_id,
      software: subscriber?.software ? {
        id: subscriber.software.id,
        name: subscriber.software.name,
        github_repo_template: subscriber.software.github_repo_template,
        github_token: subscriber.software.github_token ? 'Present' : 'Missing'
      } : 'Not loaded'
    });

    if (!subscriber) {
      console.log('❌ Subscriber not found');
      return NextResponse.json({ error: "Subscriber non trovato" }, { status: 404 });
    }

    if (!subscriber.software) {
      console.log('❌ Software not configured for subscriber');
      return NextResponse.json({ error: "Software non configurato per questo subscriber" }, { status: 400 });
    }

    // Verifica che il subscriber non abbia già un repository
    if (subscriber.github_repo_url) {
      return NextResponse.json({ 
        error: "Questo subscriber ha già un repository GitHub",
        existingRepo: subscriber.github_repo_url 
      }, { status: 400 });
    }

    // Parsing del template repository URL
    const templateInfo = parseGitHubUrl(subscriber.software.github_repo_template);
    if (!templateInfo) {
      return NextResponse.json({ 
        error: "URL template repository non valido",
        templateUrl: subscriber.software.github_repo_template 
      }, { status: 400 });
    }

    // Inizializza il servizio GitHub
    const githubService = new GitHubService(subscriber.software.github_token);

    // Verifica che il template repository esista
    const templateExists = await githubService.repositoryExists(
      templateInfo.owner, 
      templateInfo.repo
    );
    
    if (!templateExists) {
      return NextResponse.json({ 
        error: "Template repository non trovato",
        templateRepo: `${templateInfo.owner}/${templateInfo.repo}` 
      }, { status: 404 });
    }

    // Verifica che il repository del cliente non esista già
    const clientRepoName = `cliente-${subscriber.client_slug}`;
    const clientRepoExists = await githubService.repositoryExists(
      templateInfo.owner, 
      clientRepoName
    );
    
    if (clientRepoExists) {
      return NextResponse.json({ 
        error: "Repository cliente già esistente",
        repoName: clientRepoName 
      }, { status: 400 });
    }

    // Crea il repository
    const repoResult = await githubService.createRepositoryFromTemplate(
      {
        token: subscriber.software.github_token,
        templateRepo: templateInfo.repo,
        templateOwner: templateInfo.owner,
      },
      {
        clientSlug: subscriber.client_slug,
        projectName: subscriber.project_name,
        clientName: subscriber.first_name + ' ' + subscriber.last_name,
        clientEmail: subscriber.email,
        softwareName: subscriber.software.name,
      }
    );

    // Aggiorna il subscriber con l'URL del repository
    await db.updateSubscriber(subscriberId, {
      github_repo_url: repoResult.repoUrl,
    });

    console.log(`✅ Repository created successfully: ${repoResult.repoUrl}`);

    return NextResponse.json({
      success: true,
      message: "Repository GitHub creato con successo",
      repository: {
        name: repoResult.repoName,
        url: repoResult.repoUrl,
        cloneUrl: `https://github.com/${templateInfo.owner}/${repoResult.repoName}.git`,
      },
    });

  } catch (error: unknown) {
    console.error("❌ Errore nella creazione repository GitHub:", error);
    return NextResponse.json({
      error: "Errore interno del server",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
