export interface RegisteredClient {
  clientId: string;
  redirectUri: string;
}

export class RegistrationError extends Error {}

/**
 * RFC 7591 dynamic client registration. CIPP's endpoint creates nothing in Entra — it hands back
 * the instance's existing MCP resource app registration as a public PKCE client
 * (Invoke-PublicMcpRegister.ps1), so no secret is ever issued.
 *
 * Entra only has http://127.0.0.1 registered as a redirect (port-agnostic), so localhost/::1 pass
 * CIPP's allowlist but fail at authorize time.
 */
export async function registerClient(
  registrationEndpoint: string,
  redirectUri: string,
  clientName: string,
): Promise<RegisteredClient> {
  const response = await fetch(registrationEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_name: clientName,
      redirect_uris: [redirectUri],
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      token_endpoint_auth_method: 'none',
    }),
  });

  const body = await response.text();
  let doc: Record<string, unknown>;
  try {
    doc = JSON.parse(body);
  } catch {
    throw new RegistrationError(
      `${registrationEndpoint} returned ${response.status} with a non-JSON body`,
    );
  }

  if (!response.ok) {
    const code = typeof doc.error === 'string' ? doc.error : `HTTP ${response.status}`;
    const detail = typeof doc.error_description === 'string' ? `: ${doc.error_description}` : '';
    throw new RegistrationError(`registration rejected (${code})${detail}`);
  }

  const clientId = doc.client_id;
  if (typeof clientId !== 'string' || !clientId) {
    throw new RegistrationError('registration response has no client_id');
  }

  return { clientId, redirectUri };
}
