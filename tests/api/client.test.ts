import { describe, it, expect, vi } from 'vitest';
import axios from 'axios';
import { createApiClient } from '../../src/api/client.js';

vi.mock('axios', () => {
  const mockAxios = {
    create: vi.fn(() => mockAxios),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
    get: vi.fn(),
    post: vi.fn(),
    defaults: { baseURL: '' },
  };
  return { default: mockAxios };
});

describe('createApiClient', () => {
  it('creates an axios instance with the given base URL and CIPP auth headers', () => {
    createApiClient('https://cipp.example.com/api', { userPrincipalName: 'admin@test.com' });
    expect(axios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL: 'https://cipp.example.com/api',
        timeout: 30000,
      }),
    );
  });

  it('sets x-ms-client-principal header with base64-encoded user info', () => {
    createApiClient('https://cipp.example.com/api', { userPrincipalName: 'admin@test.com' });
    const callArgs = (axios.create as any).mock.calls[0][0];
    expect(callArgs.headers['x-ms-client-principal']).toBeDefined();
    expect(callArgs.headers['x-ms-client-principal-idp']).toBe('aad');
  });
});
