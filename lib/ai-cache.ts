// lib/ai-cache.ts

type CacheEntry = {
  response: unknown;
  timestamp: number;
};

const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

class AICache {
  private static instance: AICache;
  private cache: Map<string, CacheEntry>;

  private constructor() {
    this.cache = new Map();
  }

  public static getInstance(): AICache {
    if (!AICache.instance) {
      AICache.instance = new AICache();
    }
    return AICache.instance;
  }

  private generateHash(prompt: string): string {
    // Simple string hash for demo purposes
    let hash = 0;
    for (let i = 0; i < prompt.length; i++) {
        const char = prompt.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0;
    }
    return hash.toString();
  }

  public get(prompt: string): unknown {
    const hash = this.generateHash(prompt);
    const entry = this.cache.get(hash);
    
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > CACHE_DURATION) {
        this.cache.delete(hash);
        return null;
    }
    
    return entry.response;
  }

  public set(prompt: string, response: unknown): void {
    const hash = this.generateHash(prompt);
    this.cache.set(hash, {
        response,
        timestamp: Date.now()
    });
  }

  public clear(): void {
    this.cache.clear();
  }
}

export const aiCache = AICache.getInstance();
