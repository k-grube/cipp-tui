import axiosModule, { type AxiosInstance } from 'axios';

// Handle CJS/ESM interop — axios may be { default: fn } in some bundlers
const axios = (axiosModule as any).default ?? axiosModule;

/**
 * Create an API client using OAuth bearer token auth.
 */
export function createOAuthClient(baseUrl: string, accessToken: string): AxiosInstance {
  return axios.create({
    baseURL: baseUrl,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
  });
}

/**
 * Create an API client that sends no principal at all.
 *
 * For the local craft container: it runs in Development, and CraftAuthMiddleware injects a dev
 * principal from App:Auth:Dev* whenever no x-ms-client-principal header arrives. Forging one
 * instead would skip the allowedUsers lookup and exercise a path production never takes.
 */
export function createNoAuthClient(baseUrl: string): AxiosInstance {
  return axios.create({
    baseURL: baseUrl,
    timeout: 30000,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Acquire an OAuth2 access token using client_credentials grant.
 */
export async function acquireCippToken(
  tenantId: string,
  clientId: string,
  clientSecret: string,
  scope: string,
): Promise<string> {
  const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
    scope,
  });

  const response = await axios.post(tokenUrl, params.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  return response.data.access_token;
}
