import Conf from 'conf';
import type { AppConfig } from './types.js';

let configInstance: Conf<AppConfig> | null = null;

export function getConfig(): Conf<AppConfig> {
  if (!configInstance) {
    configInstance = new Conf<AppConfig>({
      projectName: 'cipp-tui',
      defaults: {
        apiBaseUrl: '',
        tenantId: '',
        clientId: '',
        authMethod: 'device-code',
      },
    });
  }
  return configInstance;
}

export function hasRequiredConfig(): boolean {
  const config = getConfig();
  return !!(config.get('apiBaseUrl') && config.get('tenantId') && config.get('clientId'));
}
