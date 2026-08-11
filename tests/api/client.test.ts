import { describe, it, expect, vi } from 'vitest';
import axios from 'axios';
import { createOAuthClient, createNoAuthClient } from '../../src/api/client.js';

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

describe('createNoAuthClient', () => {
  it('sends no principal header, letting craft inject its dev principal', () => {
    createNoAuthClient('http://localhost:5196/api');
    const config = vi.mocked(axios.create).mock.calls.at(-1)![0]!;
    expect(config.baseURL).toBe('http://localhost:5196/api');
    expect(Object.keys(config.headers!)).toEqual(['Content-Type']);
  });
});
