import type { AxiosInstance } from 'axios';
import type { User, MfaUser } from '../../types.js';

export async function listUsers(client: AxiosInstance, tenantFilter: string): Promise<User[]> {
  const response = await client.get<User[]>('/ListUsers', {
    params: { TenantFilter: tenantFilter },
  });
  return response.data;
}

export async function resetPassword(
  client: AxiosInstance,
  tenantFilter: string,
  userId: string,
  password: string,
  mustChange: boolean,
): Promise<{ Results: string }> {
  const response = await client.post<{ Results: string }>('/ExecResetPass', {
    TenantFilter: tenantFilter,
    Id: userId,
    password,
    MustChange: mustChange,
  });
  return response.data;
}

export async function disableUser(
  client: AxiosInstance,
  tenantFilter: string,
  userId: string,
  enable: boolean,
): Promise<{ Results: string }> {
  const response = await client.post<{ Results: string }>('/ExecDisableUser', {
    TenantFilter: tenantFilter,
    Id: userId,
    Enable: enable,
  });
  return response.data;
}

export async function convertToSharedMailbox(
  client: AxiosInstance,
  tenantFilter: string,
  userId: string,
): Promise<{ Results: string }> {
  const response = await client.post<{ Results: string }>('/ExecConvertToSharedMailbox', {
    TenantFilter: tenantFilter,
    Id: userId,
  });
  return response.data;
}

export async function listMfaUsers(client: AxiosInstance, tenantFilter: string): Promise<MfaUser[]> {
  const response = await client.get<MfaUser[]>('/ListMFAUsers', {
    params: { TenantFilter: tenantFilter },
  });
  return response.data;
}
