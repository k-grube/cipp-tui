import { describe, it, expect, vi, beforeEach } from 'vitest';
import { listUsers, resetPassword, disableUser, convertToSharedMailbox, listMfaUsers } from '../../../src/api/endpoints/users.js';

const mockGet = vi.fn();
const mockPost = vi.fn();
const mockClient = { get: mockGet, post: mockPost } as any;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('listUsers', () => {
  it('calls GET /ListUsers with TenantFilter', async () => {
    const users = [{ id: '1', displayName: 'Alice', userPrincipalName: 'alice@contoso.com' }];
    mockGet.mockResolvedValueOnce({ data: users });

    const result = await listUsers(mockClient, 'contoso.com');
    expect(mockGet).toHaveBeenCalledWith('/ListUsers', { params: { TenantFilter: 'contoso.com' } });
    expect(result).toEqual(users);
  });
});

describe('resetPassword', () => {
  it('calls POST /ExecResetPass with user ID and password', async () => {
    mockPost.mockResolvedValueOnce({ data: { Results: 'Password reset' } });

    const result = await resetPassword(mockClient, 'contoso.com', 'user-1', 'NewPass123!', true);
    expect(mockPost).toHaveBeenCalledWith('/ExecResetPass', {
      TenantFilter: 'contoso.com',
      Id: 'user-1',
      password: 'NewPass123!',
      MustChange: true,
    });
    expect(result).toEqual({ Results: 'Password reset' });
  });
});

describe('disableUser', () => {
  it('calls POST /ExecDisableUser with user ID and enable flag', async () => {
    mockPost.mockResolvedValueOnce({ data: { Results: 'User disabled' } });

    const result = await disableUser(mockClient, 'contoso.com', 'user-1', false);
    expect(mockPost).toHaveBeenCalledWith('/ExecDisableUser', {
      TenantFilter: 'contoso.com',
      Id: 'user-1',
      Enable: false,
    });
    expect(result).toEqual({ Results: 'User disabled' });
  });
});

describe('convertToSharedMailbox', () => {
  it('calls POST /ExecConvertToSharedMailbox', async () => {
    mockPost.mockResolvedValueOnce({ data: { Results: 'Converted' } });

    const result = await convertToSharedMailbox(mockClient, 'contoso.com', 'user-1');
    expect(mockPost).toHaveBeenCalledWith('/ExecConvertToSharedMailbox', {
      TenantFilter: 'contoso.com',
      Id: 'user-1',
    });
    expect(result).toEqual({ Results: 'Converted' });
  });
});

describe('listMfaUsers', () => {
  it('calls GET /ListMFAUsers with TenantFilter', async () => {
    const mfaUsers = [{ userPrincipalName: 'alice@contoso.com', MFARegistration: true }];
    mockGet.mockResolvedValueOnce({ data: mfaUsers });

    const result = await listMfaUsers(mockClient, 'contoso.com');
    expect(mockGet).toHaveBeenCalledWith('/ListMFAUsers', { params: { TenantFilter: 'contoso.com' } });
    expect(result).toEqual(mfaUsers);
  });
});
