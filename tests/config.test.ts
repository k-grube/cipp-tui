import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Conf from 'conf';
import { getConfig, hasRequiredConfig, deriveApiBaseUrl } from '../src/config.js';

describe('deriveApiBaseUrl', () => {
  it('accepts the instance url', () => {
    expect(deriveApiBaseUrl('https://cipp5bgso.azurewebsites.net')).toBe(
      'https://cipp5bgso.azurewebsites.net/api',
    );
  });

  it('recovers the base from a resource url pasted out of the discovery document', () => {
    expect(deriveApiBaseUrl('https://cipp5bgso.azurewebsites.net/api/ExecMcp')).toBe(
      'https://cipp5bgso.azurewebsites.net/api',
    );
  });

  it('is idempotent on a url that already ends in /api', () => {
    expect(deriveApiBaseUrl('https://cipp5bgso.azurewebsites.net/api')).toBe(
      'https://cipp5bgso.azurewebsites.net/api',
    );
  });

  it('keeps scheme and port for a local container', () => {
    expect(deriveApiBaseUrl('http://localhost:5196')).toBe('http://localhost:5196/api');
  });

  it('tolerates trailing slashes, whitespace and a missing scheme', () => {
    expect(deriveApiBaseUrl('  cipp5bgso.azurewebsites.net/  ')).toBe(
      'https://cipp5bgso.azurewebsites.net/api',
    );
  });

  it('returns null for input that is not a url', () => {
    expect(deriveApiBaseUrl('')).toBeNull();
    expect(deriveApiBaseUrl('   ')).toBeNull();
    expect(deriveApiBaseUrl('http://')).toBeNull();
  });
});

describe('config', () => {
  let config: Conf<any>;

  beforeEach(() => {
    config = getConfig();
    config.clear();
  });

  afterEach(() => {
    config.clear();
  });

  it('returns a Conf instance with project name cipp-tui', () => {
    expect(config).toBeInstanceOf(Conf);
    expect(config.path).toContain('cipp-tui');
  });

  it('hasRequiredConfig returns false when config is empty', () => {
    expect(hasRequiredConfig()).toBe(false);
  });

  it('hasRequiredConfig returns true for pkce mode with just a URL', () => {
    config.set('apiBaseUrl', 'https://cipp.example.net/api');
    config.set('authMethod', 'pkce');
    expect(hasRequiredConfig()).toBe(true);
  });

  it('hasRequiredConfig returns true for none mode with just a URL', () => {
    config.set('apiBaseUrl', 'http://localhost:5196/api');
    config.set('authMethod', 'none');
    expect(hasRequiredConfig()).toBe(true);
  });

  it('hasRequiredConfig returns true for OAuth mode with all fields', () => {
    config.set('apiBaseUrl', 'https://example.com/api');
    config.set('authMethod', 'oauth');
    config.set('tenantId', 'tenant-123');
    config.set('clientId', 'client-456');
    config.set('clientSecret', 'secret-789');
    config.set('scope', 'api://client-456/.default');
    expect(hasRequiredConfig()).toBe(true);
  });

  it('hasRequiredConfig returns false when apiBaseUrl is missing', () => {
    config.set('authMethod', 'oauth');
    config.set('tenantId', 'tenant-123');
    config.set('clientId', 'client-456');
    expect(hasRequiredConfig()).toBe(false);
  });

  it('hasRequiredConfig sends a config from an older build back through setup', () => {
    config.set('apiBaseUrl', 'http://localhost:7071/api');
    config.set('authMethod', 'swa');
    expect(hasRequiredConfig()).toBe(false);
  });
});
