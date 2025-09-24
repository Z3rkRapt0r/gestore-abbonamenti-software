import { Octokit } from '@octokit/rest';

export function createGitHubClient(token: string) {
  return new Octokit({
    auth: token,
  });
}

export interface GitHubConfig {
  token: string;
  username: string;
}

export async function cloneRepository(
  config: GitHubConfig,
  templateRepo: string,
  newRepoName: string,
  isPrivate: boolean = true
) {
  const octokit = createGitHubClient(config.token);
  
  try {
    // Crea il nuovo repository
    const { data: newRepo } = await octokit.repos.createForAuthenticatedUser({
      name: newRepoName,
      private: isPrivate,
      description: `Repository clonato da ${templateRepo}`,
    });

    // TODO: Implementare la clonazione effettiva del contenuto
    // Questo richiede l'uso di git clone e push
    
    return {
      success: true,
      repo: newRepo,
      url: newRepo.html_url,
    };
  } catch (error: any) {
    console.error('Errore durante la clonazione del repository:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

