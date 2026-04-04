import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Conf from 'conf';
import { getConfig, hasRequiredConfig } from '../src/config.js';

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

  it('hasRequiredConfig returns true for SWA mode with just a URL', () => {
    config.set('apiBaseUrl', 'http://localhost:7071/api');
    config.set('authMethod', 'swa');
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
});
