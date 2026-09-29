import { DocumentAnalysis } from './types';

interface StoredSession {
  analysis: DocumentAnalysis;
  expiresAt: number;
}

class SessionStore {
  private sessions = new Map<string, StoredSession>();
  private readonly TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

  constructor() {
    // Periodic cleanup of expired sessions every 10 minutes
    setInterval(() => {
      this.cleanup();
    }, 10 * 60 * 1000);
  }

  public set(id: string, analysis: DocumentAnalysis): void {
    this.sessions.set(id, {
      analysis,
      expiresAt: Date.now() + this.TTL_MS,
    });
  }

  public get(id: string): DocumentAnalysis | null {
    const item = this.sessions.get(id);
    if (!item) return null;

    if (Date.now() > item.expiresAt) {
      this.sessions.delete(id);
      return null;
    }

    // Refresh TTL on active access
    item.expiresAt = Date.now() + this.TTL_MS;
    return item.analysis;
  }

  public delete(id: string): boolean {
    return this.sessions.delete(id);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [id, item] of this.sessions.entries()) {
      if (now > item.expiresAt) {
        this.sessions.delete(id);
      }
    }
  }
}

export const sessionStore = new SessionStore();
