import React, { useState } from 'react';
import { Box, Text } from 'ink';
import { TextInput, Select } from '@inkjs/ui';
import { getConfig } from '../config.js';

type SetupStep = 'apiBaseUrl' | 'authMethod' | 'tenantId' | 'clientId' | 'clientSecret' | 'scope' | 'swaUser' | 'done';

interface SetupProps {
  onComplete: () => void;
}

export function Setup({ onComplete }: SetupProps) {
  const [step, setStep] = useState<SetupStep>('apiBaseUrl');
  const config = getConfig();

  const handleApiBaseUrl = (value: string) => {
    config.set('apiBaseUrl', value.replace(/\/+$/, ''));
    setStep('authMethod');
  };

  const handleAuthMethod = (value: string) => {
    config.set('authMethod', value as 'oauth' | 'swa');
    if (value === 'oauth') {
      setStep('tenantId');
    } else {
      setStep('swaUser');
    }
  };

  const handleSwaUser = (value: string) => {
    config.set('swaUser', value || 'admin@cipp-tui');
    config.set('swaRoles', 'admin,superadmin');
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
      React.createElement(Text, null, 'Enter your CIPP API base URL:'),
      React.createElement(Text, { dimColor: true }, '(e.g., https://your-cipp.azurewebsites.net/api or http://localhost:7071/api)'),
      React.createElement(TextInput, { placeholder: 'https://...', onSubmit: handleApiBaseUrl }),
    ),

    step === 'authMethod' && React.createElement(
      Box,
      { flexDirection: 'column' },
      React.createElement(Text, null, 'How do you want to authenticate?'),
      React.createElement(Select, {
        options: [
          { label: 'SWA Headers (local dev / direct access)', value: 'swa' },
          { label: 'OAuth Client Credentials (production API)', value: 'oauth' },
        ],
        onChange: handleAuthMethod,
      }),
    ),

    step === 'swaUser' && React.createElement(
      Box,
      { flexDirection: 'column' },
      React.createElement(Text, null, 'Enter a user email for the SWA principal (or press Enter for default):'),
      React.createElement(TextInput, { placeholder: 'admin@cipp-tui', onSubmit: handleSwaUser }),
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
