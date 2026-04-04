import { describe, it, expect, vi } from 'vitest';
import axios from 'axios';
import { createOAuthClient, createSwaClient } from '../../src/api/client.js';

vi.mock('axios', () => {
  const mockAxios = {
    create: vi.fn(() => mockAxios),
    get: vi.fn(),
    post: vi.fn(),
    defaults: { baseURL: '' },
  };
  return { default: mockAxios };
});

describe('createOAuthClient', () => {
  it('creates an axios instance with bearer token auth', () => {
    createOAuthClient('https://cipp.example.com/api', 'test-token');
    expect(axios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL: 'https://cipp.example.com/api',
        timeout: 30000,
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-token',
        }),
      }),
    );
  });
});

describe('createSwaClient', () => {
  it('creates an axios instance with SWA auth headers', () => {
    createSwaClient('http://localhost:7071/api', 'admin@test.com', ['admin']);
    expect(axios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL: 'http://localhost:7071/api',
        headers: expect.objectContaining({
          'x-ms-client-principal-idp': 'aad',
        }),
      }),
    );
  });
});
