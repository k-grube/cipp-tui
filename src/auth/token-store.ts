import Conf from 'conf';

interface StoredTokenData {
  accessToken: string;
  expiresOn: string;
  account: StoredAccount | null;
}

interface StoredAccount {
  homeAccountId: string;
  environment: string;
  tenantId: string;
  username: string;
  localAccountId: string;
}

interface SaveTokensInput {
  accessToken: string;
  expiresOn: Date;
  account: StoredAccount | null;
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
      expiresOn: input.expiresOn.toISOString(),
      account: input.account,
    });
  }

  getAccessToken(): string | null {
    const tokens = this.store.get('tokens');
    if (!tokens) return null;
    const expiresOn = new Date(tokens.expiresOn);
    if (expiresOn <= new Date()) return null;
    return tokens.accessToken;
  }

  getAccount(): StoredAccount | null {
    const tokens = this.store.get('tokens');
    return tokens?.account ?? null;
  }

  clear(): void {
    this.store.clear();
  }
}
