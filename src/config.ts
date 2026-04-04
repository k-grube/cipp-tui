import Conf from 'conf';
import type { AppConfig } from './types.js';

let configInstance: Conf<AppConfig> | null = null;

export function getConfig(): Conf<AppConfig> {
  if (!configInstance) {
    configInstance = new Conf<AppConfig>({
      projectName: 'cipp-tui',
      defaults: {
        apiBaseUrl: '',
        authMethod: 'swa',
        tenantId: '',
        clientId: '',
        clientSecret: '',
        scope: '',
        swaUser: 'admin@cipp-tui',
        swaRoles: 'admin,superadmin',
      },
    });
  }
  return configInstance;
}

export function hasRequiredConfig(): boolean {
  const config = getConfig();
  if (!config.get('apiBaseUrl') || !config.get('authMethod')) return false;
  if (config.get('authMethod') === 'oauth') {
    return !!(config.get('tenantId') && config.get('clientId') && config.get('clientSecret') && config.get('scope'));
  }
  // SWA mode just needs the URL
  return true;
}
