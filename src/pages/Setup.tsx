import React, { useState } from 'react';
import { Box, Text } from 'ink';
import { TextInput, Select } from '@inkjs/ui';
import { getConfig, deriveApiBaseUrl } from '../config.js';
import type { AppConfig } from '../types.js';

type SetupStep = 'apiBaseUrl' | 'authMethod' | 'tenantId' | 'clientId' | 'clientSecret' | 'scope' | 'done';

interface SetupProps {
  onComplete: () => void;
}

export function Setup({ onComplete }: SetupProps) {
  const [step, setStep] = useState<SetupStep>('apiBaseUrl');
  const [urlError, setUrlError] = useState('');
  const config = getConfig();

  const handleApiBaseUrl = (value: string) => {
    const apiBaseUrl = deriveApiBaseUrl(value);
    if (!apiBaseUrl) {
      setUrlError(`Could not read '${value}' as a URL.`);
      return;
    }
    setUrlError('');
    config.set('apiBaseUrl', apiBaseUrl);
    setStep('authMethod');
  };

  const handleAuthMethod = (value: string) => {
    config.set('authMethod', value as AppConfig['authMethod']);
    if (value === 'oauth') {
      setStep('tenantId');
      return;
    }
    setStep('done');
    onComplete();
  };

  const handleTenantId = (value: string) => {
    config.set('tenantId', value);
    setStep('clientId');
  };

  const handleClientId = (value: string) => {
    config.set('clientId', value);
    setStep('clientSecret');
  };

  const handleClientSecret = (value: string) => {
    config.set('clientSecret', value);
    setStep('scope');
  };

  const handleScope = (value: string) => {
    config.set('scope', value);
    setStep('done');
    onComplete();
  };

  return React.createElement(
    Box,
    { flexDirection: 'column', padding: 2 },
    React.createElement(Text, { bold: true, color: 'cyan' }, 'CIPP TUI — First Run Setup'),
    React.createElement(Text, null, ''),

    step === 'apiBaseUrl' && React.createElement(
      Box,
      { flexDirection: 'column' },
      React.createElement(Text, null, 'Enter your CIPP instance URL:'),
      React.createElement(Text, { dimColor: true }, '(e.g., https://your-cipp.azurewebsites.net or http://localhost:5196)'),
      React.createElement(TextInput, { placeholder: 'https://...', onSubmit: handleApiBaseUrl }),
      urlError && React.createElement(Text, { color: 'red' }, urlError),
    ),

    step === 'authMethod' && React.createElement(
      Box,
      { flexDirection: 'column' },
      React.createElement(Text, null, 'How do you want to authenticate?'),
      React.createElement(Select, {
        options: [
          { label: 'Sign in with your browser (recommended)', value: 'pkce' },
          { label: 'Client credentials (headless / CI)', value: 'oauth' },
          { label: 'None (local craft dev container)', value: 'none' },
        ],
        onChange: handleAuthMethod,
      }),
    ),

    step === 'tenantId' && React.createElement(
      Box,
      { flexDirection: 'column' },
      React.createElement(Text, null, 'Enter your Azure AD Tenant ID:'),
      React.createElement(TextInput, { placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', onSubmit: handleTenantId }),
    ),

    step === 'clientId' && React.createElement(
      Box,
      { flexDirection: 'column' },
      React.createElement(Text, null, 'Enter your CIPP API Client (Application) ID:'),
      React.createElement(TextInput, { placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', onSubmit: handleClientId }),
    ),

    step === 'clientSecret' && React.createElement(
      Box,
      { flexDirection: 'column' },
      React.createElement(Text, null, 'Enter your CIPP API Client Secret:'),
      React.createElement(TextInput, { placeholder: 'your-client-secret', onSubmit: handleClientSecret }),
    ),

    step === 'scope' && React.createElement(
      Box,
      { flexDirection: 'column' },
      React.createElement(Text, null, 'Enter the API scope (APP ID URI):'),
      React.createElement(Text, { dimColor: true }, '(e.g., api://your-client-id/.default)'),
      React.createElement(TextInput, { placeholder: 'api://.../.default', onSubmit: handleScope }),
    ),
  );
}
