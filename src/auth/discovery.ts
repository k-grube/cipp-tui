export interface ProtectedResourceMetadata {
  resource: string;
  authorizationServers: string[];
  scopesSupported: string[];
}

export interface AuthServerMetadata {
  issuer: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  registrationEndpoint: string | null;
  scopesSupported: string[];
  codeChallengeMethodsSupported: string[];
}

export interface Discovery {
  resource: ProtectedResourceMetadata;
  authServer: AuthServerMetadata;
}

const PRM_PATH = '/.well-known/oauth-protected-resource';
const AS_PATHS = ['/.well-known/oauth-authorization-server', '/.well-known/openid-configuration'];

export class DiscoveryError extends Error {}

/** Site origin for a configured apiBaseUrl, which carries a /api suffix the well-known paths don't */
export function originOf(apiBaseUrl: string): string {
  return new URL(apiBaseUrl).origin;
}

/**
 * Craft renders {origin} as https://{host} unconditionally (PrmEndpoint.cs), so a plain-http
 * local container advertises an https origin that isn't listening. Same host:port means same
 * server, so trust the scheme we already reached it on.
 */
export function normalizeOrigin(discovered: string, configuredOrigin: string): string {
  let url: URL;
  let base: URL;
  try {
    url = new URL(discovered);
    base = new URL(configuredOrigin);
  } catch {
    return discovered;
  }
  if (url.host !== base.host) {
    return discovered;
  }
  url.protocol = base.protocol;
  return url.toString().replace(/\/$/, '');
}

async function getJson(url: string): Promise<unknown> {
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) {
    throw new DiscoveryError(`${url} returned ${response.status}`);
  }
  const body = await response.text();
  try {
    return JSON.parse(body);
  } catch {
    // The SPA fallback answers 200 with HTML for any unmapped route, so a parse failure here
    // means the discovery document isn't published, not that the server is broken.
    throw new DiscoveryError(
      `${url} did not return JSON — CRAFT_PRM/CRAFT_PRM_AS are probably unset on this instance`,
    );
  }
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
}

function required(doc: Record<string, unknown>, key: string, url: string): string {
  const value = doc[key];
  if (typeof value !== 'string' || !value) {
    throw new DiscoveryError(`${url} is missing required field '${key}'`);
  }
  return value;
}

export async function discover(apiBaseUrl: string): Promise<Discovery> {
  const origin = originOf(apiBaseUrl);

  const prmDoc = (await getJson(origin + PRM_PATH)) as Record<string, unknown>;
  const authorizationServers = strings(prmDoc.authorization_servers).map((s) =>
    normalizeOrigin(s, origin),
  );
  if (authorizationServers.length === 0) {
    throw new DiscoveryError(`${origin + PRM_PATH} lists no authorization_servers`);
  }

  const resource: ProtectedResourceMetadata = {
    resource: normalizeOrigin(required(prmDoc, 'resource', origin + PRM_PATH), origin),
    authorizationServers,
    scopesSupported: strings(prmDoc.scopes_supported),
  };

  const asOrigin = authorizationServers[0];
  const failures: string[] = [];
  for (const path of AS_PATHS) {
    const url = asOrigin + path;
    let doc: Record<string, unknown>;
    try {
      doc = (await getJson(url)) as Record<string, unknown>;
    } catch (err) {
      failures.push(err instanceof Error ? err.message : String(err));
      continue;
    }
    const registration = doc.registration_endpoint;
    return {
      resource,
      authServer: {
        issuer: normalizeOrigin(required(doc, 'issuer', url), origin),
        authorizationEndpoint: required(doc, 'authorization_endpoint', url),
        tokenEndpoint: required(doc, 'token_endpoint', url),
        registrationEndpoint:
          typeof registration === 'string' && registration
            ? normalizeOrigin(registration, origin)
            : null,
        scopesSupported: strings(doc.scopes_supported),
        codeChallengeMethodsSupported: strings(doc.code_challenge_methods_supported),
      },
    };
  }

  throw new DiscoveryError(`no authorization server metadata at ${asOrigin}: ${failures.join('; ')}`);
}

const OIDC_SCOPES = ['openid', 'profile', 'email', 'offline_access'];

/**
 * Scopes for the token request: the resource's delegated scope (CIPP publishes
 * https://{host}/user_impersonation) plus the OIDC set.
 *
 * Entra allows scopes for only one resource per token request, but openid/profile/offline_access
 * are exempt from that rule — they buy an id_token for the username and a refresh token without
 * splitting the audience.
 */
export function resourceScopes(discovery: Discovery): string[] {
  const fromResource = discovery.resource.scopesSupported;
  const scopes = fromResource.length > 0 ? fromResource : discovery.authServer.scopesSupported;
  const delegated = scopes.filter((s) => !OIDC_SCOPES.includes(s));
  if (delegated.length === 0) {
    throw new DiscoveryError('discovery published no delegated scope for the resource');
  }
  return [...delegated, 'openid', 'profile', 'offline_access'];
}
