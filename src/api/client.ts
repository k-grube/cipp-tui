import axiosModule, { type AxiosInstance } from 'axios';

// Handle CJS/ESM interop — axios may be { default: fn } in some bundlers
const axios = (axiosModule as any).default ?? axiosModule;

export interface CippAuthHeaders {
  userPrincipalName: string;
  roles?: string[];
}

export function createApiClient(baseUrl: string, auth: CippAuthHeaders): AxiosInstance {
  // CIPP API uses Azure SWA-style headers, not bearer tokens.
  // We construct the x-ms-client-principal header with user details and roles.
  const principalPayload = JSON.stringify({
    userDetails: auth.userPrincipalName,
    userRoles: auth.roles ?? ['authenticated', 'admin'],
    claims: [],
  });
  const principalBase64 = Buffer.from(principalPayload).toString('base64');

  const client = axios.create({
    baseURL: baseUrl,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
      'x-ms-client-principal': principalBase64,
      'x-ms-client-principal-idp': 'aad',
      'x-forwarded-for': '127.0.0.1',
    },
  });

  return client;
}
