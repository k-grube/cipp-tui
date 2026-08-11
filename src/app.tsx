import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import { Spinner } from '@inkjs/ui';
import { TabBar, type Tab } from './components/TabBar.js';
import { StatusBar, type KeyHint } from './components/StatusBar.js';
import { Setup } from './pages/Setup.js';
import { Login } from './pages/Login.js';
import { TenantsPage } from './pages/Tenants.js';
import { UsersPage } from './pages/Users.js';
import { TenantProvider, useTenant } from './hooks/useTenant.js';
import { hasRequiredConfig } from './config.js';
import { createOAuthClient, createNoAuthClient, acquireCippToken } from './api/client.js';
import { getConfig } from './config.js';
import { TokenStore } from './auth/token-store.js';
import { acquireTokenSilent } from './auth/pkce-login.js';
import type { AxiosInstance } from 'axios';

type AppState = 'setup' | 'authenticating' | 'signing-in' | 'ready' | 'error';

const TABS: Tab[] = [
  { key: 'tenants', label: 'Tenants' },
  { key: 'users', label: 'Users' },
];

function AppContent() {
  const { exit } = useApp();
  const { activeTenant } = useTenant();
  const [activeTab, setActiveTab] = useState('tenants');
  const [authError, setAuthError] = useState('');
  const [signedInAs, setSignedInAs] = useState<string | null>(null);

  // Use a ref to hold the client so it's available immediately when appState changes
  const [state, setState] = useState<{ appState: AppState; apiClient: AxiosInstance | null }>({
    appState: hasRequiredConfig() ? 'authenticating' : 'setup',
    apiClient: null,
  });
  const { appState, apiClient } = state;

  const setAppState = (newState: AppState) => setState((prev) => ({ ...prev, appState: newState }));

  useEffect(() => {
    if (appState !== 'authenticating') return;

    const config = getConfig();
    const baseUrl = config.get('apiBaseUrl');
    const method = config.get('authMethod');

    if (method === 'none') {
      setState({ appState: 'ready', apiClient: createNoAuthClient(baseUrl) });
      return;
    }

    if (method === 'pkce') {
      // Cached or refreshable token skips the browser entirely
      acquireTokenSilent()
        .then((tokens) => {
          if (!tokens) {
            setAppState('signing-in');
            return;
          }
          setSignedInAs(tokens.username);
          setState({ appState: 'ready', apiClient: createOAuthClient(baseUrl, tokens.accessToken) });
        })
        .catch(() => setAppState('signing-in'));
      return;
    }

    // OAuth client credentials — check cached token first
    const tokenStore = new TokenStore();
    const cachedToken = tokenStore.getAccessToken();

    if (cachedToken) {
      setState({ appState: 'ready', apiClient: createOAuthClient(baseUrl, cachedToken) });
      return;
    }

    acquireCippToken(
      config.get('tenantId'),
      config.get('clientId'),
      config.get('clientSecret'),
      config.get('scope'),
    )
      .then((token) => {
        tokenStore.saveTokens({
          accessToken: token,
          refreshToken: null,
          expiresOn: new Date(Date.now() + 3500 * 1000),
          username: null,
          clientId: config.get('clientId'),
          tokenEndpoint: '',
          scopes: [config.get('scope')],
        });
        setState({ appState: 'ready', apiClient: createOAuthClient(baseUrl, token) });
      })
      .catch((err) => {
        setAuthError(err instanceof Error ? err.message : 'Authentication failed');
        setAppState('error');
      });
  }, [appState]);

  useInput((input, key) => {
    if (appState === 'error' && input === 'r') {
      setAuthError('');
      setAppState('authenticating');
      return;
    }

    // retrying against the wrong instance just fails the same way, so offer the way back out
    if (appState === 'error' && input === 's') {
      setAuthError('');
      setAppState('setup');
      return;
    }

    if (appState !== 'ready') return;

    if (input === 'q') exit();

    if (input === 't') {
      setActiveTab('tenants');
      return;
    }

    // Tab switching — only with Shift+arrow or Tab key to avoid conflicting with page navigation
    if (key.tab) {
      const currentIndex = TABS.findIndex((t) => t.key === activeTab);
      const nextIndex = (currentIndex + 1) % TABS.length;
      const nextTab = TABS[nextIndex];
      if (nextTab.key === 'users' && !activeTenant) return;
      setActiveTab(nextTab.key);
    }

    // Number keys for direct tab switching
    const tabIndex = parseInt(input, 10) - 1;
    if (tabIndex >= 0 && tabIndex < TABS.length) {
      const tab = TABS[tabIndex];
      if (tab.key === 'users' && !activeTenant) return;
      setActiveTab(tab.key);
    }
  });

  if (appState === 'setup') {
    return React.createElement(Setup, {
      onComplete: () => setAppState('authenticating'),
    });
  }

  if (appState === 'signing-in') {
    return React.createElement(Login, {
      apiBaseUrl: getConfig().get('apiBaseUrl'),
      onSuccess: (tokens) => {
        setSignedInAs(tokens.username);
        setState({
          appState: 'ready',
          apiClient: createOAuthClient(getConfig().get('apiBaseUrl'), tokens.accessToken),
        });
      },
      onError: (message) => {
        setAuthError(message);
        setAppState('error');
      },
    });
  }

  if (appState === 'authenticating') {
    return React.createElement(
      Box,
      { padding: 2, flexDirection: 'column' },
      React.createElement(Text, { bold: true, color: 'cyan' }, 'CIPP TUI'),
      React.createElement(Text, null, ''),
      React.createElement(Spinner, { label: 'Authenticating with CIPP API...' }),
    );
  }

  if (appState === 'error') {
    return React.createElement(
      Box,
      { padding: 2, flexDirection: 'column' },
      React.createElement(Text, { bold: true, color: 'cyan' }, 'CIPP TUI'),
      React.createElement(Text, null, ''),
      React.createElement(Text, { color: 'red' }, `Authentication failed: ${authError}`),
      React.createElement(Text, { dimColor: true }, `Instance: ${getConfig().get('apiBaseUrl')}`),
      React.createElement(Text, { dimColor: true }, 'Press r to retry, s to change instance, q to quit'),
    );
  }

  if (!apiClient) return null;

  const tabs = TABS.map((t) => ({
    ...t,
    disabled: t.key === 'users' && !activeTenant,
  }));

  const defaultHints: KeyHint[] = [
    { key: 't', label: 'tenant' },
    { key: 'q', label: 'quit' },
  ];

  return React.createElement(
    Box,
    { flexDirection: 'column', width: '100%', height: '100%' },
    React.createElement(TabBar, { tabs, activeTab, onTabChange: setActiveTab }),
    React.createElement(
      Box,
      { flexDirection: 'column', flexGrow: 1 },
      activeTab === 'tenants' && React.createElement(TenantsPage, { apiClient }),
      activeTab === 'users' && React.createElement(UsersPage, { apiClient }),
    ),
    React.createElement(StatusBar, {
      tenantName: activeTenant?.defaultDomainName ?? null,
      connected: true,
      hints: defaultHints,
      signedInAs,
    }),
  );
}

export function App() {
  return React.createElement(
    TenantProvider,
    null,
    React.createElement(AppContent, null),
  );
}
