import Conf from 'conf';

interface StoredTokenData {
  accessToken: string;
  refreshToken: string | null;
  expiresOn: string;
  username: string | null;
  /** What a silent refresh needs to re-post to Entra without re-running discovery */
  clientId: string;
  tokenEndpoint: string;
  scopes: string[];
}

export interface SessionInfo {
  clientId: string;
  tokenEndpoint: string;
  scopes: string[];
}

export interface SaveTokensInput {
  accessToken: string;
  refreshToken: string | null;
  expiresOn: Date;
  username: string | null;
  clientId: string;
  tokenEndpoint: string;
  scopes: string[];
}

export class TokenStore {
  private store: Conf<{ tokens: StoredTokenData | null }>;

  constructor() {
    this.store = new Conf({
      projectName: 'cipp-tui',
      configName: 'tokens',
      defaults: { tokens: null },
    });
  }

  saveTokens(input: SaveTokensInput): void {
    this.store.set('tokens', {
      accessToken: input.accessToken,
      refreshToken: input.refreshToken,
      expiresOn: input.expiresOn.toISOString(),
      username: input.username,
      clientId: input.clientId,
      tokenEndpoint: input.tokenEndpoint,
      scopes: input.scopes,
    });
  }

  getAccessToken(): string | null {
    const tokens = this.store.get('tokens');
    if (!tokens) return null;
    if (new Date(tokens.expiresOn) <= new Date()) return null;
    return tokens.accessToken;
  }

  getRefreshToken(): string | null {
    return this.store.get('tokens')?.refreshToken ?? null;
  }

  getExpiresOn(): Date | null {
    const tokens = this.store.get('tokens');
    return tokens ? new Date(tokens.expiresOn) : null;
  }

  getUsername(): string | null {
    return this.store.get('tokens')?.username ?? null;
  }

  getSession(): SessionInfo | null {
    const tokens = this.store.get('tokens');
    if (!tokens?.clientId || !tokens.tokenEndpoint) return null;
    return {
      clientId: tokens.clientId,
      tokenEndpoint: tokens.tokenEndpoint,
      scopes: tokens.scopes ?? [],
    };
  }

  clear(): void {
    this.store.clear();
  }
}
