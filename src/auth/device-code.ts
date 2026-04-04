import {
  PublicClientApplication,
  type Configuration,
  type DeviceCodeRequest,
  type AuthenticationResult,
  type AccountInfo,
} from '@azure/msal-node';
import { getConfig } from '../config.js';
import { TokenStore } from './token-store.js';

const SCOPES = ['https://graph.microsoft.com/.default'];

function createMsalClient(): PublicClientApplication {
  const config = getConfig();
  const msalConfig: Configuration = {
    auth: {
      clientId: config.get('clientId'),
      authority: `https://login.microsoftonline.com/${config.get('tenantId')}`,
    },
  };
  return new PublicClientApplication(msalConfig);
}

export interface DeviceCodeInfo {
  userCode: string;
  verificationUri: string;
  message: string;
}

export async function loginWithDeviceCode(
  onDeviceCode: (info: DeviceCodeInfo) => void,
): Promise<AuthenticationResult> {
  const client = createMsalClient();
  const tokenStore = new TokenStore();

  const request: DeviceCodeRequest = {
    scopes: SCOPES,
    deviceCodeCallback: (response) => {
      onDeviceCode({
        userCode: response.userCode,
        verificationUri: response.verificationUri,
        message: response.message,
      });
    },
  };

  const result = await client.acquireTokenByDeviceCode(request);
  if (!result) throw new Error('Device code authentication returned null');

  tokenStore.saveTokens({
    accessToken: result.accessToken,
    expiresOn: result.expiresOn ?? new Date(Date.now() + 3600 * 1000),
    account: result.account as AccountInfo | null,
  });

  return result;
}

export async function acquireTokenSilent(): Promise<string | null> {
  const tokenStore = new TokenStore();

  const cachedToken = tokenStore.getAccessToken();
  if (cachedToken) return cachedToken;

  const account = tokenStore.getAccount();
  if (!account) return null;

  try {
    const client = createMsalClient();
    const result = await client.acquireTokenSilent({
      scopes: SCOPES,
      account: account as AccountInfo,
    });
    if (result) {
      tokenStore.saveTokens({
        accessToken: result.accessToken,
        expiresOn: result.expiresOn ?? new Date(Date.now() + 3600 * 1000),
        account: result.account as AccountInfo | null,
      });
      return result.accessToken;
    }
  } catch {
    // Silent refresh failed — caller should trigger interactive login
  }

  return null;
}
