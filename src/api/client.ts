import axiosModule, { type AxiosInstance } from 'axios';

// Handle CJS/ESM interop — axios may be { default: fn } in some bundlers
const axios = (axiosModule as any).default ?? axiosModule;

export function createApiClient(baseUrl: string, accessToken: string): AxiosInstance {
  const client = axios.create({
    baseURL: baseUrl,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  return client;
}

/**
 * Acquire an OAuth2 access token using client_credentials grant.
 * Uses the CIPP app registration's Application ID and Secret.
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
