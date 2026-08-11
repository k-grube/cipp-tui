import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  discover,
  normalizeOrigin,
  originOf,
  resourceScopes,
  DiscoveryError,
} from '../../src/auth/discovery.js';

// Exactly what Invoke-ExecApiClient.ps1 writes into CRAFT_PRM / CRAFT_PRM_AS, after Craft
// substitutes {origin}. Craft always renders https, even for a plain-http local container.
const PRM = {
  resource: 'https://localhost:5196/api/ExecMcp',
  authorization_servers: ['https://localhost:5196'],
  scopes_supported: ['https://localhost:5196/user_impersonation'],
  bearer_methods_supported: ['header'],
};

const AS = {
  issuer: 'https://localhost:5196',
  authorization_endpoint: 'https://login.microsoftonline.com/tid/oauth2/v2.0/authorize',
  token_endpoint: 'https://login.microsoftonline.com/tid/oauth2/v2.0/token',
  jwks_uri: 'https://login.microsoftonline.com/tid/discovery/v2.0/keys',
  registration_endpoint: 'https://localhost:5196/api/PublicMcpRegister',
  response_types_supported: ['code'],
  grant_types_supported: ['authorization_code', 'refresh_token'],
  code_challenge_methods_supported: ['S256'],
  scopes_supported: ['openid', 'profile', 'offline_access', 'https://localhost:5196/user_impersonation'],
};

const SPA_FALLBACK = '<!DOCTYPE html><html><head><title>Loading</title></head></html>';

function jsonResponse(body: unknown) {
  return { ok: true, status: 200, text: async () => JSON.stringify(body) } as Response;
}

function htmlResponse() {
  return { ok: true, status: 200, text: async () => SPA_FALLBACK } as Response;
}

function notFound() {
  return { ok: false, status: 404, text: async () => '' } as Response;
}

describe('originOf', () => {
  it('strips the /api suffix the well-known paths do not carry', () => {
    expect(originOf('http://localhost:5196/api')).toBe('http://localhost:5196');
    expect(originOf('https://cipp.example.net/api')).toBe('https://cipp.example.net');
  });
});

describe('normalizeOrigin', () => {
  it('adopts the scheme we actually reached the host on', () => {
    expect(normalizeOrigin('https://localhost:5196/api/PublicMcpRegister', 'http://localhost:5196'))
      .toBe('http://localhost:5196/api/PublicMcpRegister');
  });

  it('leaves a different host untouched', () => {
    expect(normalizeOrigin('https://login.microsoftonline.com/tid', 'http://localhost:5196'))
      .toBe('https://login.microsoftonline.com/tid');
  });

  it('leaves a matching scheme untouched', () => {
    expect(normalizeOrigin('https://cipp.example.net/api/PublicMcpRegister', 'https://cipp.example.net'))
      .toBe('https://cipp.example.net/api/PublicMcpRegister');
  });

  it('passes through a non-URL rather than throwing', () => {
    expect(normalizeOrigin('not a url', 'http://localhost:5196')).toBe('not a url');
  });
});

describe('discover', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('resolves PRM then authorization server metadata', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(PRM))
      .mockResolvedValueOnce(jsonResponse(AS));

    const result = await discover('http://localhost:5196/api');

    expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:5196/.well-known/oauth-protected-resource');
    expect(fetchMock.mock.calls[1][0]).toBe('http://localhost:5196/.well-known/oauth-authorization-server');
    expect(result.authServer.registrationEndpoint).toBe('http://localhost:5196/api/PublicMcpRegister');
    expect(result.authServer.tokenEndpoint).toBe(AS.token_endpoint);
    expect(result.resource.resource).toBe('http://localhost:5196/api/ExecMcp');
  });

  it('falls back to the OIDC alias when RFC 8414 404s', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(PRM))
      .mockResolvedValueOnce(notFound())
      .mockResolvedValueOnce(jsonResponse(AS));

    const result = await discover('http://localhost:5196/api');

    expect(fetchMock.mock.calls[2][0]).toBe('http://localhost:5196/.well-known/openid-configuration');
    expect(result.authServer.issuer).toBe('http://localhost:5196');
  });

  it('names the unset app settings when the SPA fallback answers', async () => {
    fetchMock.mockResolvedValue(htmlResponse());
    await expect(discover('https://cipp.example.net/api')).rejects.toThrow(/CRAFT_PRM/);
  });

  it('rejects a PRM with no authorization server', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ ...PRM, authorization_servers: [] }));
    await expect(discover('http://localhost:5196/api')).rejects.toBeInstanceOf(DiscoveryError);
  });

  it('rejects when neither authorization server path answers', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(PRM))
      .mockResolvedValueOnce(notFound())
      .mockResolvedValueOnce(notFound());
    await expect(discover('http://localhost:5196/api')).rejects.toThrow(/no authorization server metadata/);
  });
});

describe('resourceScopes', () => {
  const discovery = {
    resource: {
      resource: 'http://localhost:5196/api/ExecMcp',
      authorizationServers: ['http://localhost:5196'],
      scopesSupported: ['https://localhost:5196/user_impersonation'],
    },
    authServer: {
      issuer: 'http://localhost:5196',
      authorizationEndpoint: AS.authorization_endpoint,
      tokenEndpoint: AS.token_endpoint,
      registrationEndpoint: 'http://localhost:5196/api/PublicMcpRegister',
      scopesSupported: AS.scopes_supported,
      codeChallengeMethodsSupported: ['S256'],
    },
  };

  it('requests the delegated scope plus the OIDC set', () => {
    expect(resourceScopes(discovery)).toEqual([
      'https://localhost:5196/user_impersonation',
      'openid',
      'profile',
      'offline_access',
    ]);
  });

  it('falls back to the authorization server scopes, dropping the OIDC ones', () => {
    const noResourceScopes = {
      ...discovery,
      resource: { ...discovery.resource, scopesSupported: [] },
    };
    expect(resourceScopes(noResourceScopes)[0]).toBe('https://localhost:5196/user_impersonation');
  });

  it('throws when nothing delegated is published', () => {
    const oidcOnly = {
      ...discovery,
      resource: { ...discovery.resource, scopesSupported: [] },
      authServer: { ...discovery.authServer, scopesSupported: ['openid', 'profile'] },
    };
    expect(() => resourceScopes(oidcOnly)).toThrow(DiscoveryError);
  });
});
