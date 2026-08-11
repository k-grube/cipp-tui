import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { browserCommand } from '../../src/auth/pkce-login.js';

const URL_WITH_AMPERSANDS =
  'https://login.microsoftonline.com/tid/oauth2/v2.0/authorize?client_id=abc&response_type=code&scope=a+b';

describe('browserCommand', () => {
  it('quotes the url on windows so cmd does not split it on &', () => {
    const { command, args, verbatim } = browserCommand(URL_WITH_AMPERSANDS, 'win32');
    expect(command).toBe('cmd');
    expect(verbatim).toBe(true);
    // empty title first, then the quoted url — start reads the first quoted arg as the title
    expect(args).toEqual(['/c', 'start', '""', `"${URL_WITH_AMPERSANDS}"`]);
  });

  it('passes the url through untouched elsewhere', () => {
    expect(browserCommand(URL_WITH_AMPERSANDS, 'darwin')).toEqual({
      command: 'open',
      args: [URL_WITH_AMPERSANDS],
      verbatim: false,
    });
    expect(browserCommand(URL_WITH_AMPERSANDS, 'linux').command).toBe('xdg-open');
  });

  it.runIf(process.platform === 'win32')('survives a real cmd round trip intact', () => {
    const { args, verbatim } = browserCommand(URL_WITH_AMPERSANDS, 'win32');
    // same shape as the real call, with echo standing in for start so nothing launches
    const echoArgs = [args[0], 'echo', args[3]];
    const result = spawnSync('cmd', echoArgs, {
      encoding: 'utf8',
      windowsVerbatimArguments: verbatim,
    });
    expect(result.stdout.trim()).toContain('scope=a+b');
    expect(result.stderr).toBe('');
  });
});
