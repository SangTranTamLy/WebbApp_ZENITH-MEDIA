export interface GithubCacheEntry {
  value: any;
  source_url: string;
  fetched_at: number;
  expires_at: number;
  status: 'SUCCESS' | 'ERROR';
  error?: string;
}

const githubCache = new Map<string, GithubCacheEntry>();
const TTL = 3600 * 1000; // 1 hour

export class GithubService {
  static async getProfileStats(): Promise<GithubCacheEntry> {
    const url = "https://api.github.com/users/SangTranTamLy";
    const cached = githubCache.get(url);
    if (cached && cached.expires_at > Date.now()) {
      return cached;
    }
    
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "Zenith-MDA-Assistant" },
        signal: AbortSignal.timeout(8_000),
      });
      if (!res.ok) throw new Error("Failed to fetch Github profile");
      const data = await res.json();
      
      const entry: GithubCacheEntry = {
        value: {
          followers: data.followers,
          public_repos: data.public_repos,
        },
        source_url: url,
        fetched_at: Date.now(),
        expires_at: Date.now() + TTL,
        status: 'SUCCESS'
      };
      githubCache.set(url, entry);
      return entry;
    } catch (err: any) {
       if (cached) return cached;
       return {
         value: null,
         source_url: url,
         fetched_at: Date.now(),
         expires_at: Date.now() + 60000,
         status: 'ERROR',
         error: err.message
       }
    }
  }

  static async getRepoStats(repoName: string): Promise<GithubCacheEntry> {
    const url = `https://api.github.com/repos/SangTranTamLy/${repoName}`;
    const cached = githubCache.get(url);
    if (cached && cached.expires_at > Date.now()) {
      return cached;
    }
    
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "Zenith-MDA-Assistant" },
        signal: AbortSignal.timeout(8_000),
      });
      if (!res.ok) throw new Error("Failed to fetch repo");
      const data = await res.json();
      
      const entry: GithubCacheEntry = {
        value: {
          stars: data.stargazers_count,
          forks: data.forks_count,
        },
        source_url: url,
        fetched_at: Date.now(),
        expires_at: Date.now() + TTL,
        status: 'SUCCESS'
      };
      githubCache.set(url, entry);
      return entry;
    } catch(err: any) {
      if (cached) return cached;
      return { value: null, source_url: url, fetched_at: Date.now(), expires_at: Date.now() + 60000, status: 'ERROR', error: err.message };
    }
  }
}
