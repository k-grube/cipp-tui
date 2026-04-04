import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import { Spinner } from '@inkjs/ui';
import { TabBar, type Tab } from './components/TabBar.js';
import { StatusBar, type KeyHint } from './components/StatusBar.js';
import { Setup } from './pages/Setup.js';
import { TenantsPage } from './pages/Tenants.js';
import { UsersPage } from './pages/Users.js';
import { TenantProvider, useTenant } from './hooks/useTenant.js';
import { hasRequiredConfig } from './config.js';
import { createOAuthClient, createSwaClient, acquireCippToken } from './api/client.js';
import { getConfig } from './config.js';
import { TokenStore } from './auth/token-store.js';
import type { AxiosInstance } from 'axios';

type AppState = 'setup' | 'authenticating' | 'ready' | 'error';

const TABS: Tab[] = [
  { key: 'tenants', label: 'Tenants' },
  { key: 'users', label: 'Users' },
];

function AppContent() {
  const { exit } = useApp();
  const { activeTenant } = useTenant();
  const [activeTab, setActiveTab] = useState('tenants');
  const [authError, setAuthError] = useState('');

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
    const method = config.get('authMethod');

    if (method === 'swa') {
      const roles = (config.get('swaRoles') || 'admin,superadmin').split(',').map((r: string) => r.trim());
      const client = createSwaClient(config.get('apiBaseUrl'), config.get('swaUser') || 'admin@cipp-tui', roles);
      setState({ appState: 'ready', apiClient: client });
      return;
    }

    // OAuth mode — check cached token first
    const tokenStore = new TokenStore();
    const cachedToken = tokenStore.getAccessToken();

    if (cachedToken) {
      setState({ appState: 'ready', apiClient: createOAuthClient(config.get('apiBaseUrl'), cachedToken) });
      return;
    }

    // Acquire a new token via client credentials
    acquireCippToken(
      config.get('tenantId'),
      config.get('clientId'),
      config.get('clientSecret'),
      config.get('scope'),
    )
      .then((token) => {
        tokenStore.saveTokens({
          accessToken: token,
          expiresOn: new Date(Date.now() + 3500 * 1000),
          account: null,
        });
        setState({ appState: 'ready', apiClient: createOAuthClient(config.get('apiBaseUrl'), token) });
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
      React.createElement(Text, { dimColor: true }, 'Press r to retry or q to quit'),
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
