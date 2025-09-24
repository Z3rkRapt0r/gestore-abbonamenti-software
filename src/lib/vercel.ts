import { Vercel } from '@vercel/sdk';

export interface VercelConfig {
  token: string;
  teamId?: string;
}

export function createVercelClient(config: VercelConfig) {
  return new Vercel({
    token: config.token,
    teamId: config.teamId,
  });
}

export async function createProject(
  config: VercelConfig,
  projectName: string,
  gitRepoUrl: string
) {
  const vercel = createVercelClient(config);
  
  try {
    const project = await vercel.projects.create({
      name: projectName,
      gitRepository: {
        type: 'github',
        repo: gitRepoUrl,
      },
    });

    return {
      success: true,
      project,
      projectId: project.id,
      url: project.url,
    };
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('Errore durante la creazione del progetto Vercel:', error);
    return {
      success: false,
      error: err?.message || 'Unknown error',
    };
  }
}

export async function pauseProject(config: VercelConfig, projectId: string) {
  const vercel = createVercelClient(config);
  
  try {
    await vercel.projects.update(projectId, {
      paused: true,
    });

    return { success: true };
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('Errore durante la pausa del progetto:', error);
    return {
      success: false,
      error: err?.message || 'Unknown error',
    };
  }
}

export async function resumeProject(config: VercelConfig, projectId: string) {
  const vercel = createVercelClient(config);
  
  try {
    await vercel.projects.update(projectId, {
      paused: false,
    });

    return { success: true };
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('Errore durante la riattivazione del progetto:', error);
    return {
      success: false,
      error: err?.message || 'Unknown error',
    };
  }
}

