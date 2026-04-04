import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TokenStore } from '../../src/auth/token-store.js';

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
  });

  it('stores and retrieves an access token', () => {
    const expiresOn = new Date(Date.now() + 3600 * 1000);
    store.saveTokens({
      accessToken: 'abc123',
      expiresOn,
      account: { homeAccountId: 'user1', environment: 'login.microsoftonline.com', tenantId: 't1', username: 'user@test.com', localAccountId: 'local1' },
    });
    expect(store.getAccessToken()).toBe('abc123');
  });

  it('returns null when token is expired', () => {
    const expiresOn = new Date(Date.now() - 1000);
    store.saveTokens({
      accessToken: 'expired',
      expiresOn,
      account: { homeAccountId: 'user1', environment: 'login.microsoftonline.com', tenantId: 't1', username: 'user@test.com', localAccountId: 'local1' },
    });
    expect(store.getAccessToken()).toBeNull();
  });

  it('retrieves stored account info', () => {
    const expiresOn = new Date(Date.now() + 3600 * 1000);
    store.saveTokens({
      accessToken: 'abc123',
      expiresOn,
      account: { homeAccountId: 'user1', environment: 'login.microsoftonline.com', tenantId: 't1', username: 'user@test.com', localAccountId: 'local1' },
    });
    const account = store.getAccount();
    expect(account?.username).toBe('user@test.com');
  });

  it('clear removes all stored data', () => {
    const expiresOn = new Date(Date.now() + 3600 * 1000);
    store.saveTokens({
      accessToken: 'abc123',
      expiresOn,
      account: { homeAccountId: 'user1', environment: 'login.microsoftonline.com', tenantId: 't1', username: 'user@test.com', localAccountId: 'local1' },
    });
    store.clear();
    expect(store.getAccessToken()).toBeNull();
    expect(store.getAccount()).toBeNull();
  });
});
