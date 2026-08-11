import { describe, it, expect, afterEach } from 'vitest';
import { startLoopback, CallbackError, type LoopbackListener } from '../../src/auth/loopback.js';

describe('startLoopback', () => {
  let listener: LoopbackListener | null = null;

  afterEach(() => {
    listener?.close();
    listener = null;
  });

  it('binds 127.0.0.1 on an ephemeral port, which is what Entra matches', async () => {
    listener = await startLoopback();
    expect(listener.redirectUri).toMatch(/^http:\/\/127\.0\.0\.1:\d+$/);
  });

  it('resolves with the code when state matches', async () => {
    listener = await startLoopback();
    // assertion first: it attaches the handlers, so the rejection paths below never surface as
    // unhandled during the await on fetch
    const assertion = expect(listener.waitForCode('state-abc')).resolves.toBe('the-code');
    await fetch(`${listener.redirectUri}/?code=the-code&state=state-abc`);
    await assertion;
  });

  it('discards a code arriving with the wrong state', async () => {
    listener = await startLoopback();
    const assertion = expect(listener.waitForCode('state-abc')).rejects.toThrow(/state mismatch/);
    await fetch(`${listener.redirectUri}/?code=the-code&state=forged`);
    await assertion;
  });

  it('surfaces an Entra error redirect', async () => {
    listener = await startLoopback();
    const assertion = expect(listener.waitForCode('state-abc')).rejects.toThrow(
      /access_denied: User cancelled/,
    );
    await fetch(`${listener.redirectUri}/?error=access_denied&error_description=User+cancelled`);
    await assertion;
  });

  it('rejects a callback with neither code nor error', async () => {
    listener = await startLoopback();
    const assertion = expect(listener.waitForCode('state-abc')).rejects.toBeInstanceOf(CallbackError);
    await fetch(`${listener.redirectUri}/?state=state-abc`);
    await assertion;
  });

  it('times out rather than hanging forever', async () => {
    listener = await startLoopback();
    await expect(listener.waitForCode('state-abc', 50)).rejects.toThrow(/timed out/);
  });

  it('captures a redirect that lands before the caller starts waiting', async () => {
    listener = await startLoopback();
    await fetch(`${listener.redirectUri}/?code=early&state=state-abc`);
    await expect(listener.waitForCode('state-abc')).resolves.toBe('early');
  });
});
