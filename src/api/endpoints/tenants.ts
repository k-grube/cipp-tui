import type { AxiosInstance } from 'axios';
import type { Tenant } from '../../types.js';

export async function listTenants(client: AxiosInstance): Promise<Tenant[]> {
  const response = await client.get<Tenant[]>('/ListTenants');
  return response.data;
}
