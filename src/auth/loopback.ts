import { createServer, type Server } from 'node:http';
import { AddressInfo } from 'node:net';

export interface LoopbackListener {
  /** Exactly what goes in redirect_uri and what Entra must match */
  redirectUri: string;
  /** Resolves with the authorization code, or rejects on error/timeout/state mismatch */
  waitForCode: (expectedState: string, timeoutMs?: number) => Promise<string>;
  close: () => void;
}

export class CallbackError extends Error {}

interface Callback {
  code: string;
  state: string | null;
}

const PAGE = (heading: string, detail: string) =>
  `<!doctype html><meta charset="utf-8"><title>CIPP TUI</title>` +
  `<body style="font:16px system-ui;margin:4rem auto;max-width:32rem;text-align:center">` +
  `<h1 style="font-size:1.25rem">${heading}</h1><p style="color:#666">${detail}</p></body>`;

/**
 * One-shot loopback receiver for the authorization code.
 *
 * 127.0.0.1, not localhost: that is the literal redirect registered on the app registration
 * (Get-CippMcpKnownClients.ps1), and Entra ignores only the port when matching, not the host.
 *
 * The receive promise is created here rather than in waitForCode, so a redirect that arrives
 * before the caller starts awaiting is still captured.
 */
export async function startLoopback(): Promise<LoopbackListener> {
  let settle: ((result: Callback) => void) | null = null;
  let fail: ((err: Error) => void) | null = null;

  const received = new Promise<Callback>((resolve, reject) => {
    settle = resolve;
    fail = reject;
  });
  // Nothing may be awaiting yet; the rejection is re-raised to whoever calls waitForCode.
  received.catch(() => {});

  const server: Server = createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://127.0.0.1');
    if (url.pathname !== '/') {
      res.writeHead(404).end();
      return;
    }

    const error = url.searchParams.get('error');
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');

    if (error) {
      const detail = url.searchParams.get('error_description') ?? '';
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(PAGE('Sign-in failed', detail || error));
      fail?.(new CallbackError(`${error}${detail ? `: ${detail}` : ''}`));
      return;
    }

    if (!code) {
      res.writeHead(400, { 'Content-Type': 'text/html' });
      res.end(PAGE('Sign-in failed', 'No authorization code in the callback.'));
      fail?.(new CallbackError('callback carried no authorization code'));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(PAGE('Signed in', 'You can close this tab and return to the terminal.'));
    settle?.({ code, state });
  });

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });

  const { port } = server.address() as AddressInfo;

  return {
    redirectUri: `http://127.0.0.1:${port}`,

    waitForCode: async (expectedState: string, timeoutMs = 300_000) => {
      let timer: NodeJS.Timeout;
      const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new CallbackError('timed out waiting for the browser redirect')),
          timeoutMs,
        );
      });

      try {
        const callback = await Promise.race([received, timeout]);
        if (callback.state !== expectedState) {
          throw new CallbackError('state mismatch on the callback, discarding the code');
        }
        return callback.code;
      } finally {
        clearTimeout(timer!);
      }
    },

    close: () => server.close(),
  };
}
