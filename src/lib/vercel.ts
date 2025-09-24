export interface VercelConfig {
  token: string;
  teamId?: string;
}

const apiBase = 'https://api.vercel.com';

export async function createProject(
  config: VercelConfig,
  projectName: string,
  gitRepoUrl: string
) {
  try {
    const qs = new URLSearchParams();
    if (config.teamId) qs.set('teamId', config.teamId);
    const res = await fetch(`${apiBase}/v10/projects?${qs.toString()}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: projectName,
        gitRepository: { type: 'github', repo: gitRepoUrl },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Vercel create project failed (${res.status}): ${text}`);
    }
    const project = (await res.json()) as { id: string; url?: string };
    return { success: true, project, projectId: project.id, url: project.url };
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('Errore durante la creazione del progetto Vercel:', error);
    return { success: false, error: err?.message || 'Unknown error' };
  }
}

export async function pauseProject(config: VercelConfig, projectId: string) {
  try {
    const qs = new URLSearchParams();
    if (config.teamId) qs.set('teamId', config.teamId);
    const res = await fetch(`${apiBase}/v10/projects/${projectId}?${qs.toString()}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${config.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paused: true }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Vercel pause failed (${res.status}): ${text}`);
    }
    return { success: true };
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('Errore durante la pausa del progetto:', error);
    return { success: false, error: err?.message || 'Unknown error' };
  }
}

export async function resumeProject(config: VercelConfig, projectId: string) {
  try {
    const qs = new URLSearchParams();
    if (config.teamId) qs.set('teamId', config.teamId);
    const res = await fetch(`${apiBase}/v10/projects/${projectId}?${qs.toString()}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${config.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paused: false }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Vercel resume failed (${res.status}): ${text}`);
    }
    return { success: true };
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('Errore durante la riattivazione del progetto:', error);
    return { success: false, error: err?.message || 'Unknown error' };
  }
}

