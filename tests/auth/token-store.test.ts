import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TokenStore, type SaveTokensInput } from '../../src/auth/token-store.js';

const SESSION = {
  clientId: '1f1b20aa-5c1c-4448-9649-49bc8349d676',
  tokenEndpoint: 'https://login.microsoftonline.com/tid/oauth2/v2.0/token',
  scopes: ['https://cipp.example.net/user_impersonation', 'openid', 'offline_access'],
};

function tokens(overrides: Partial<SaveTokensInput> = {}): SaveTokensInput {
  return {
    accessToken: 'abc123',
    refreshToken: 'refresh-1',
    expiresOn: new Date(Date.now() + 3600 * 1000),
    username: 'user@test.com',
    ...SESSION,
    ...overrides,
  };
}

describe('TokenStore', () => {
  let store: TokenStore;

  beforeEach(() => {
    store = new TokenStore();
    store.clear();
  });

  afterEach(() => {
    store.clear();
  });

  it('returns null when no token is stored', () => {
    expect(store.getAccessToken()).toBeNull();
    expect(store.getRefreshToken()).toBeNull();
    expect(store.getSession()).toBeNull();
  });

  it('stores and retrieves an access token', () => {
    store.saveTokens(tokens());
    expect(store.getAccessToken()).toBe('abc123');
    expect(store.getUsername()).toBe('user@test.com');
  });

  it('returns null for an expired access token but keeps the refresh token', () => {
    store.saveTokens(tokens({ expiresOn: new Date(Date.now() - 1000) }));
    expect(store.getAccessToken()).toBeNull();
    expect(store.getRefreshToken()).toBe('refresh-1');
  });

  it('keeps what a silent refresh needs', () => {
    store.saveTokens(tokens());
    expect(store.getSession()).toEqual(SESSION);
  });

  it('has no session when the client credentials path stored no token endpoint', () => {
    store.saveTokens(tokens({ tokenEndpoint: '', refreshToken: null }));
    expect(store.getSession()).toBeNull();
  });

  it('clear removes all stored data', () => {
    store.saveTokens(tokens());
    store.clear();
    expect(store.getAccessToken()).toBeNull();
    expect(store.getRefreshToken()).toBeNull();
    expect(store.getUsername()).toBeNull();
  });
});
