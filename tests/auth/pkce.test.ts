import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { createPkcePair, createState } from '../../src/auth/pkce.js';

const BASE64URL = /^[A-Za-z0-9_-]+$/;

describe('createPkcePair', () => {
  it('produces a verifier in the RFC 7636 length range', () => {
    const { verifier } = createPkcePair();
    expect(verifier.length).toBeGreaterThanOrEqual(43);
    expect(verifier.length).toBeLessThanOrEqual(128);
  });

  it('emits base64url with no padding', () => {
    const { verifier, challenge } = createPkcePair();
    expect(verifier).toMatch(BASE64URL);
    expect(challenge).toMatch(BASE64URL);
  });

  it('challenge is the S256 hash of the verifier', () => {
    const { verifier, challenge, method } = createPkcePair();
    const expected = createHash('sha256').update(verifier).digest('base64url');
    expect(challenge).toBe(expected);
    expect(method).toBe('S256');
  });

  it('is different every call', () => {
    expect(createPkcePair().verifier).not.toBe(createPkcePair().verifier);
    expect(createState()).not.toBe(createState());
  });
});
