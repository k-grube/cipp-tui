import { createHash, randomBytes } from 'node:crypto';

export interface PkcePair {
  verifier: string;
  challenge: string;
  method: 'S256';
}

function base64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * RFC 7636 code verifier + S256 challenge.
 */
export function createPkcePair(): PkcePair {
  // 32 bytes -> 43 base64url chars, the RFC 7636 minimum
  const verifier = base64url(randomBytes(32));
  const challenge = base64url(createHash('sha256').update(verifier).digest());
  return { verifier, challenge, method: 'S256' };
}

/** Opaque value echoed back on the redirect, compared to detect a forged callback */
export function createState(): string {
  return base64url(randomBytes(16));
}
