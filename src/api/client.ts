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
 * Create an API client using SWA-style headers (for local dev or direct SWA access).
 */
export function createSwaClient(baseUrl: string, userEmail: string, roles: string[]): AxiosInstance {
  const principalPayload = JSON.stringify({
    userDetails: userEmail,
    userRoles: ['authenticated', ...roles],
    claims: [],
  });
  const principalBase64 = Buffer.from(principalPayload).toString('base64');

  return axios.create({
    baseURL: baseUrl,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
      'x-ms-client-principal': principalBase64,
      'x-ms-client-principal-idp': 'aad',
      'x-forwarded-for': '127.0.0.1',
    },
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
