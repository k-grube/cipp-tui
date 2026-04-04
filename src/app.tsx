import React, { useState, useEffect } from 'react';
import { Box, useInput, useApp } from 'ink';
import { TabBar, type Tab } from './components/TabBar.js';
import { StatusBar, type KeyHint } from './components/StatusBar.js';
import { Setup } from './pages/Setup.js';
import { Login } from './pages/Login.js';
import { TenantsPage } from './pages/Tenants.js';
import { UsersPage } from './pages/Users.js';
import { TenantProvider, useTenant } from './hooks/useTenant.js';
import { hasRequiredConfig } from './config.js';
import { acquireTokenSilent } from './auth/device-code.js';
import { createApiClient, type CippAuthHeaders } from './api/client.js';
import { getConfig } from './config.js';
import type { AxiosInstance } from 'axios';

type AppState = 'setup' | 'login' | 'ready';

const TABS: Tab[] = [
  { key: 'tenants', label: 'Tenants' },
  { key: 'users', label: 'Users' },
];

function AppContent() {
  const { exit } = useApp();
  const { activeTenant } = useTenant();
  const [appState, setAppState] = useState<AppState>(hasRequiredConfig() ? 'login' : 'setup');
  const [activeTab, setActiveTab] = useState('tenants');
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [apiClient, setApiClient] = useState<AxiosInstance | null>(null);

  useEffect(() => {
    if (appState !== 'login') return;
    import('./auth/token-store.js').then(({ TokenStore }) => {
      const tokenStore = new TokenStore();
      const token = tokenStore.getAccessToken();
      const account = tokenStore.getAccount();
      if (token) {
        handleAuthSuccess(token, account?.username);
      }
    }).catch(() => {
      // Silent auth failed — will show login page
    });
  }, [appState]);

  const handleAuthSuccess = (token: string, userPrincipalName?: string) => {
    setAccessToken(token);
    const config = getConfig();
    setApiClient(createApiClient(config.get('apiBaseUrl'), {
      userPrincipalName: userPrincipalName ?? 'admin@cipp-tui',
    }));
    setAppState('ready');
  };

  useInput((input, key) => {
    if (appState !== 'ready') return;

    if (input === 'q') exit();

    if (input === 't') {
      setActiveTab('tenants');
      return;
    }

    const tabIndex = parseInt(input, 10) - 1;
    if (tabIndex >= 0 && tabIndex < TABS.length) {
      const tab = TABS[tabIndex];
      if (tab.key === 'users' && !activeTenant) return;
      setActiveTab(tab.key);
    }

    if (key.leftArrow || key.rightArrow) {
      const currentIndex = TABS.findIndex((t) => t.key === activeTab);
      const nextIndex = key.leftArrow
        ? Math.max(0, currentIndex - 1)
        : Math.min(TABS.length - 1, currentIndex + 1);
      const nextTab = TABS[nextIndex];
      if (nextTab.key === 'users' && !activeTenant) return;
      setActiveTab(nextTab.key);
    }
  });

  if (appState === 'setup') {
    return React.createElement(Setup, {
      onComplete: () => setAppState('login'),
    });
  }

  if (appState === 'login' || !apiClient) {
    return React.createElement(Login, {
      onSuccess: handleAuthSuccess,
      onError: () => {},
    });
  }

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
