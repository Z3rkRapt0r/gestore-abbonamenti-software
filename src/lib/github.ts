import { Octokit } from '@octokit/rest';

export interface GitHubConfig {
  token: string;
  templateRepo: string;
  templateOwner: string;
}

export interface ClientRepoData {
  clientSlug: string;
  projectName: string;
  clientName: string;
  clientEmail: string;
  softwareName: string;
}

export class GitHubService {
  private octokit: Octokit;

  constructor(token: string) {
    this.octokit = new Octokit({
      auth: token,
    });
  }

  /**
   * Crea un nuovo repository clonando un template
   */
  async createRepositoryFromTemplate(
    config: GitHubConfig,
    clientData: ClientRepoData
  ): Promise<{ repoUrl: string; repoName: string }> {
    const { templateOwner, templateRepo } = config;
    const { clientSlug, projectName } = clientData;
    
    const newRepoName = `cliente-${clientSlug}`;
    
    try {
      console.log(`🔄 Creating repository ${newRepoName} from template ${templateOwner}/${templateRepo}`);
      
      // Crea il repository dal template
      const { data: repo } = await this.octokit.rest.repos.createUsingTemplate({
        template_owner: templateOwner,
        template_repo: templateRepo,
        owner: templateOwner, // Assumiamo che il template sia dello stesso owner
        name: newRepoName,
        description: `Repository per ${projectName} - Cliente: ${clientData.clientName}`,
        private: true, // Repository privati per i clienti
      });

      console.log(`✅ Repository created: ${repo.html_url}`);

      // Personalizza i file del repository
      await this.customizeRepositoryFiles(repo.owner.login, newRepoName, clientData);

      return {
        repoUrl: repo.html_url,
        repoName: newRepoName,
      };
    } catch (error: any) {
      console.error('❌ Error creating repository:', error);
      throw new Error(`Errore nella creazione del repository: ${error.message}`);
    }
  }

  /**
   * Elimina un repository GitHub
   */
  async deleteRepository(owner: string, repoName: string): Promise<boolean> {
    try {
      console.log(`🗑️ Eliminando repository GitHub: ${owner}/${repoName}`);
      
      await this.octokit.rest.repos.delete({
        owner,
        repo: repoName,
      });
      
      console.log(`✅ Repository ${owner}/${repoName} eliminato con successo`);
      return true;
    } catch (error: any) {
      console.error(`❌ Errore nell'eliminazione repository ${owner}/${repoName}:`, error);
      if (error.status === 404) {
        console.log(`⚠️ Repository ${owner}/${repoName} non trovato (già eliminato?)`);
        return true; // Considera come successo se non esiste
      }
      throw error;
    }
  }

  /**
   * Personalizza i file del repository con i dati del cliente
   */
  private async customizeRepositoryFiles(
    owner: string,
    repoName: string,
    clientData: ClientRepoData
  ): Promise<void> {
    try {
      console.log(`🔄 Customizing files for ${owner}/${repoName}`);

      // Lista dei file da personalizzare
      const filesToCustomize = [
        'package.json',
        'README.md',
        '.env.example',
        'src/config/client.ts', // Se esiste
      ];

      for (const filePath of filesToCustomize) {
        try {
          await this.customizeFile(owner, repoName, filePath, clientData);
        } catch (error: any) {
          // Se il file non esiste, continua con il prossimo
          if (error.status === 404) {
            console.log(`⚠️ File ${filePath} not found, skipping`);
            continue;
          }
          throw error;
        }
      }

      console.log(`✅ Files customized for ${owner}/${repoName}`);
    } catch (error: any) {
      console.error('❌ Error customizing files:', error);
      throw new Error(`Errore nella personalizzazione dei file: ${error.message}`);
    }
  }

  /**
   * Personalizza un singolo file
   */
  private async customizeFile(
    owner: string,
    repoName: string,
    filePath: string,
    clientData: ClientRepoData
  ): Promise<void> {
    try {
      // Ottieni il contenuto del file
      const { data: fileData } = await this.octokit.rest.repos.getContent({
        owner,
        repo: repoName,
        path: filePath,
      });

      if (!('content' in fileData)) {
        throw new Error('File is not a regular file');
      }

      // Decodifica il contenuto
      const content = Buffer.from(fileData.content, 'base64').toString('utf-8');
      
      // Personalizza il contenuto
      const customizedContent = this.replacePlaceholders(content, clientData);

      // Aggiorna il file
      await this.octokit.rest.repos.createOrUpdateFileContents({
        owner,
        repo: repoName,
        path: filePath,
        message: `Customize ${filePath} for ${clientData.clientName}`,
        content: Buffer.from(customizedContent).toString('base64'),
        sha: fileData.sha,
      });

      console.log(`✅ Customized ${filePath}`);
    } catch (error: any) {
      console.error(`❌ Error customizing ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Sostituisce i placeholder nel contenuto del file
   */
  private replacePlaceholders(content: string, clientData: ClientRepoData): string {
    const replacements: Record<string, string> = {
      '{{CLIENT_NAME}}': clientData.clientName,
      '{{CLIENT_EMAIL}}': clientData.clientEmail,
      '{{PROJECT_NAME}}': clientData.projectName,
      '{{CLIENT_SLUG}}': clientData.clientSlug,
      '{{SOFTWARE_NAME}}': clientData.softwareName,
      '{{CLIENT_SLUG_UPPER}}': clientData.clientSlug.toUpperCase(),
      '{{PROJECT_NAME_UPPER}}': clientData.projectName.toUpperCase(),
    };

    let customizedContent = content;
    
    for (const [placeholder, value] of Object.entries(replacements)) {
      customizedContent = customizedContent.replace(new RegExp(placeholder, 'g'), value);
    }

    return customizedContent;
  }

  /**
   * Ottiene informazioni su un repository
   */
  async getRepositoryInfo(owner: string, repoName: string) {
    try {
      const { data: repo } = await this.octokit.rest.repos.get({
        owner,
        repo: repoName,
      });

      return {
        name: repo.name,
        fullName: repo.full_name,
        url: repo.html_url,
        cloneUrl: repo.clone_url,
        sshUrl: repo.ssh_url,
        private: repo.private,
        createdAt: repo.created_at,
      };
    } catch (error: any) {
      console.error('❌ Error getting repository info:', error);
      throw new Error(`Errore nel recupero informazioni repository: ${error.message}`);
    }
  }

  /**
   * Verifica se un repository esiste
   */
  async repositoryExists(owner: string, repoName: string): Promise<boolean> {
    try {
      await this.octokit.rest.repos.get({
        owner,
        repo: repoName,
      });
      return true;
    } catch (error: any) {
      if (error.status === 404) {
        return false;
      }
      throw error;
    }
  }
}

/**
 * Utility per estrarre owner e repo da un URL GitHub
 */
export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  try {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (match) {
      return {
        owner: match[1],
        repo: match[2].replace(/\.git$/, ''), // Rimuovi .git dalla fine
      };
    }
    return null;
  } catch {
    return null;
  }
}