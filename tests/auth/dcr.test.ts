import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { registerClient, RegistrationError } from '../../src/auth/dcr.js';

const ENDPOINT = 'http://localhost:5196/api/PublicMcpRegister';
const REDIRECT = 'http://127.0.0.1:51234';

function response(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
  } as Response;
}

describe('registerClient', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('posts RFC 7591 metadata and returns the issued client id', async () => {
    fetchMock.mockResolvedValue(response(201, {
      client_id: '1f1b20aa-5c1c-4448-9649-49bc8349d676',
      client_name: 'CIPP TUI',
      redirect_uris: [REDIRECT],
      token_endpoint_auth_method: 'none',
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
    }));

    const client = await registerClient(ENDPOINT, REDIRECT, 'CIPP TUI');

    expect(client.clientId).toBe('1f1b20aa-5c1c-4448-9649-49bc8349d676');
    expect(client.redirectUri).toBe(REDIRECT);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(ENDPOINT);
    expect(init.method).toBe('POST');
    const sent = JSON.parse(init.body);
    expect(sent.redirect_uris).toEqual([REDIRECT]);
    expect(sent.token_endpoint_auth_method).toBe('none');
  });

  it('surfaces the RFC 7591 error code and description', async () => {
    fetchMock.mockResolvedValue(response(400, {
      error: 'invalid_redirect_uri',
      error_description: "Redirect URI 'http://evil.test' is not an allowed MCP client callback for this server.",
    }));

    await expect(registerClient(ENDPOINT, 'http://evil.test', 'CIPP TUI'))
      .rejects.toThrow(/invalid_redirect_uri.*not an allowed MCP client callback/);
  });

  it('reports the no-MCP-client case rather than a parse error', async () => {
    fetchMock.mockResolvedValue(response(400, {
      error: 'invalid_client_metadata',
      error_description: 'No MCP resource client is configured on this instance.',
    }));

    await expect(registerClient(ENDPOINT, REDIRECT, 'CIPP TUI'))
      .rejects.toThrow(/No MCP resource client is configured/);
  });

  it('rejects a non-JSON body instead of throwing a parse error', async () => {
    fetchMock.mockResolvedValue(response(404, '<html>not found</html>'));
    await expect(registerClient(ENDPOINT, REDIRECT, 'CIPP TUI'))
      .rejects.toBeInstanceOf(RegistrationError);
  });

  it('rejects a 200 with no client_id', async () => {
    fetchMock.mockResolvedValue(response(201, { client_name: 'CIPP TUI' }));
    await expect(registerClient(ENDPOINT, REDIRECT, 'CIPP TUI'))
      .rejects.toThrow(/no client_id/);
  });
});
