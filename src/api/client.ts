import axiosModule, { type AxiosInstance } from 'axios';

// Handle CJS/ESM interop — axios may be { default: fn } in some bundlers
const axios = (axiosModule as any).default ?? axiosModule;

export function createApiClient(baseUrl: string, accessToken: string): AxiosInstance {
  const client = axios.create({
    baseURL: baseUrl,
    timeout: 30000,
    headers: { 'Content-Type': 'application/json' },
  });

  client.interceptors.request.use((config: any) => {
    config.headers.Authorization = `Bearer ${accessToken}`;
    return config;
  });

  return client;
}
