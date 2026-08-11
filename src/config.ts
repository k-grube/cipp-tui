import Conf from 'conf';
import type { AppConfig } from './types.js';

let configInstance: Conf<AppConfig> | null = null;

export function getConfig(): Conf<AppConfig> {
  if (!configInstance) {
    configInstance = new Conf<AppConfig>({
      projectName: 'cipp-tui',
      defaults: {
        apiBaseUrl: '',
        authMethod: 'pkce',
        tenantId: '',
        clientId: '',
        clientSecret: '',
        scope: '',
      },
    });
  }
  return configInstance;
}

const AUTH_METHODS: AppConfig['authMethod'][] = ['pkce', 'oauth', 'none'];

/**
 * The api base for a CIPP instance, from whatever the user pasted.
 *
 * Always <origin>/api, so it is derived rather than trusted: the discovery documents hand out
 * urls like https://host/api/ExecMcp, and pasting one as the base silently 404s every call while
 * discovery still works (it reads the origin only).
 *
 * Returns null when the input can't be read as a url.
 */
export function deriveApiBaseUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    return `${new URL(withScheme).origin}/api`;
  } catch {
    return null;
  }
}

export function hasRequiredConfig(): boolean {
  const config = getConfig();
  const method = config.get('authMethod');
  if (!config.get('apiBaseUrl')) return false;
  // an unrecognised method is a config from an older build, send it back through setup rather
  // than letting it fall through to a branch that was never meant to handle it
  if (!AUTH_METHODS.includes(method)) return false;
  if (method === 'oauth') {
    return !!(config.get('tenantId') && config.get('clientId') && config.get('clientSecret') && config.get('scope'));
  }
  // pkce discovers everything it needs; none sends no credentials at all
  return true;
}
