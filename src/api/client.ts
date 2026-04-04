import axios, { type AxiosInstance } from 'axios';

export function createApiClient(baseUrl: string, accessToken: string): AxiosInstance {
  const client = axios.create({
    baseURL: baseUrl,
    timeout: 30000,
    headers: { 'Content-Type': 'application/json' },
  });

  client.interceptors.request.use((config) => {
    config.headers.Authorization = `Bearer ${accessToken}`;
    return config;
  });

  return client;
}
