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
  it('creates an axios instance with the given base URL and bearer token', () => {
    createApiClient('https://cipp.example.com/api', 'test-token');
    expect(axios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL: 'https://cipp.example.com/api',
        timeout: 30000,
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json',
        }),
      }),
    );
  });
});
