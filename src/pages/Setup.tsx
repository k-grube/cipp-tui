import React, { useState } from 'react';
import { Box, Text } from 'ink';
import { TextInput } from '@inkjs/ui';
import { getConfig } from '../config.js';

type SetupStep = 'apiBaseUrl' | 'tenantId' | 'clientId' | 'clientSecret' | 'scope' | 'done';

interface SetupProps {
  onComplete: () => void;
}

export function Setup({ onComplete }: SetupProps) {
  const [step, setStep] = useState<SetupStep>('apiBaseUrl');
  const config = getConfig();

  const handleApiBaseUrl = (value: string) => {
    config.set('apiBaseUrl', value.replace(/\/+$/, ''));
    setStep('tenantId');
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
    React.createElement(Text, { dimColor: true }, 'Configure your CIPP API client credentials (see docs.cipp.app/api-documentation)'),
    React.createElement(Text, null, ''),

    step === 'apiBaseUrl' && React.createElement(
      Box,
      { flexDirection: 'column' },
      React.createElement(Text, null, 'Enter your CIPP API base URL:'),
      React.createElement(Text, { dimColor: true }, '(e.g., https://your-cipp.azurewebsites.net/api)'),
      React.createElement(TextInput, { placeholder: 'https://...', onSubmit: handleApiBaseUrl }),
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
