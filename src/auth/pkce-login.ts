import { spawn } from 'node:child_process';
import { discover, resourceScopes, type Discovery } from './discovery.js';
import { registerClient } from './dcr.js';
import { createPkcePair, createState } from './pkce.js';
import { startLoopback } from './loopback.js';
import { TokenStore } from './token-store.js';

const CLIENT_NAME = 'CIPP TUI';

export interface TokenSet {
  accessToken: string;
  refreshToken: string | null;
  expiresOn: Date;
  username: string | null;
}

export class TokenError extends Error {}

/** Unverified payload read, display only — the token is validated by EasyAuth, not here */
function readUsername(idToken: string | null): string | null {
  if (!idToken) return null;
  const payload = idToken.split('.')[1];
  if (!payload) return null;
  try {
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return claims.preferred_username ?? claims.upn ?? claims.email ?? null;
  } catch {
    return null;
  }
}

export interface BrowserCommand {
  command: string;
  args: string[];
  verbatim: boolean;
}

/**
 * How to hand a URL to the platform browser.
 *
 * The authorize URL is full of `&`, which cmd reads as a command separator: unquoted, it truncates
 * the URL at the first one and runs the rest as commands, so entra sees only client_id and answers
 * AADSTS900144. Quoting it defuses that, and verbatim args stop node re-quoting what we quoted.
 */
export function browserCommand(url: string, platform: string = process.platform): BrowserCommand {
  if (platform === 'win32') {
    // start's first quoted argument is the window title, hence the empty one before the url
    return { command: 'cmd', args: ['/c', 'start', '""', `"${url}"`], verbatim: true };
  }
  return { command: platform === 'darwin' ? 'open' : 'xdg-open', args: [url], verbatim: false };
}

function openBrowser(url: string): void {
  const { command, args, verbatim } = browserCommand(url);
  // detached so closing the TUI doesn't take the browser with it; errors are non-fatal because
  // the URL is printed too
  spawn(command, args, {
    detached: true,
    stdio: 'ignore',
    windowsVerbatimArguments: verbatim,
  }).unref();
}

async function postToken(tokenEndpoint: string, params: URLSearchParams): Promise<TokenSet> {
  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  const body = await response.text();
  let doc: Record<string, unknown>;
  try {
    doc = JSON.parse(body);
  } catch {
    throw new TokenError(`token endpoint returned ${response.status} with a non-JSON body`);
  }

  if (!response.ok) {
    const code = typeof doc.error === 'string' ? doc.error : `HTTP ${response.status}`;
    const detail = typeof doc.error_description === 'string' ? `: ${doc.error_description}` : '';
    throw new TokenError(`${code}${detail}`);
  }

  const accessToken = doc.access_token;
  if (typeof accessToken !== 'string' || !accessToken) {
    throw new TokenError('token response has no access_token');
  }

  const expiresIn = typeof doc.expires_in === 'number' ? doc.expires_in : 3600;
  return {
    accessToken,
    refreshToken: typeof doc.refresh_token === 'string' ? doc.refresh_token : null,
    // 60s early so a token doesn't expire mid-request
    expiresOn: new Date(Date.now() + (expiresIn - 60) * 1000),
    username: readUsername(typeof doc.id_token === 'string' ? doc.id_token : null),
  };
}

export interface PkceLoginCallbacks {
  onDiscovered?: (discovery: Discovery) => void;
  onAuthorizeUrl?: (url: string) => void;
}

/**
 * Full seamless login: discover -> register -> browser PKCE -> token.
 *
 * Nothing is configured up front beyond the CIPP URL. The client id comes from the instance's own
 * DCR endpoint, and the flow is secretless throughout.
 */
export async function loginWithPkce(
  apiBaseUrl: string,
  callbacks: PkceLoginCallbacks = {},
): Promise<TokenSet> {
  const discovery = await discover(apiBaseUrl);
  callbacks.onDiscovered?.(discovery);

  const { registrationEndpoint, authorizationEndpoint, tokenEndpoint } = discovery.authServer;
  if (!registrationEndpoint) {
    throw new TokenError('instance publishes no registration_endpoint, cannot self-register');
  }

  const scopes = resourceScopes(discovery);
  const loopback = await startLoopback();

  try {
    const client = await registerClient(registrationEndpoint, loopback.redirectUri, CLIENT_NAME);
    const pkce = createPkcePair();
    const state = createState();

    const authorizeUrl = new URL(authorizationEndpoint);
    authorizeUrl.search = new URLSearchParams({
      client_id: client.clientId,
      response_type: 'code',
      redirect_uri: client.redirectUri,
      response_mode: 'query',
      scope: scopes.join(' '),
      state,
      code_challenge: pkce.challenge,
      code_challenge_method: pkce.method,
    }).toString();

    callbacks.onAuthorizeUrl?.(authorizeUrl.toString());
    openBrowser(authorizeUrl.toString());

    const code = await loopback.waitForCode(state);

    const tokens = await postToken(
      tokenEndpoint,
      new URLSearchParams({
        client_id: client.clientId,
        grant_type: 'authorization_code',
        code,
        redirect_uri: client.redirectUri,
        code_verifier: pkce.verifier,
        scope: scopes.join(' '),
      }),
    );

    const store = new TokenStore();
    store.saveTokens({ ...tokens, clientId: client.clientId, tokenEndpoint, scopes });
    return tokens;
  } finally {
    loopback.close();
  }
}

/**
 * Cached access token, refreshed from the stored refresh token when expired. Null means the
 * caller has to run the interactive flow.
 */
export async function acquireTokenSilent(): Promise<TokenSet | null> {
  const store = new TokenStore();

  const cached = store.getAccessToken();
  if (cached) {
    return {
      accessToken: cached,
      refreshToken: store.getRefreshToken(),
      expiresOn: store.getExpiresOn() ?? new Date(),
      username: store.getUsername(),
    };
  }

  const refreshToken = store.getRefreshToken();
  const session = store.getSession();
  if (!refreshToken || !session) return null;

  try {
    const tokens = await postToken(
      session.tokenEndpoint,
      new URLSearchParams({
        client_id: session.clientId,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        scope: session.scopes.join(' '),
      }),
    );
    // Entra rotates refresh tokens, so keep the old one only if the response omitted a new one
    store.saveTokens({
      ...tokens,
      refreshToken: tokens.refreshToken ?? refreshToken,
      username: tokens.username ?? store.getUsername(),
      clientId: session.clientId,
      tokenEndpoint: session.tokenEndpoint,
      scopes: session.scopes,
    });
    return tokens;
  } catch {
    return null;
  }
}
