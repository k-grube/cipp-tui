import React, { useState } from 'react';
import { Box, Text } from 'ink';
import { TextInput } from '@inkjs/ui';
import { getConfig } from '../config.js';

type SetupStep = 'apiBaseUrl' | 'tenantId' | 'clientId' | 'done';

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
    config.set('authMethod', 'device-code');
    setStep('done');
    onComplete();
  };

  return React.createElement(
    Box,
    { flexDirection: 'column', padding: 2 },
    React.createElement(Text, { bold: true, color: 'cyan' }, 'CIPP TUI — First Run Setup'),
    React.createElement(Text, { dimColor: true }, ''),

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
      React.createElement(Text, null, 'Enter your Azure AD App Registration Client ID:'),
      React.createElement(TextInput, { placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', onSubmit: handleClientId }),
    ),
  );
}
