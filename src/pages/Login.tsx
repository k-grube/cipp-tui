import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { Spinner, StatusMessage } from '@inkjs/ui';
import { loginWithDeviceCode, type DeviceCodeInfo } from '../auth/device-code.js';

interface LoginProps {
  onSuccess: (accessToken: string, userPrincipalName?: string) => void;
  onError: (error: string) => void;
}

export function Login({ onSuccess, onError }: LoginProps) {
  const [deviceCode, setDeviceCode] = useState<DeviceCodeInfo | null>(null);
  const [status, setStatus] = useState<'waiting' | 'polling' | 'success' | 'error'>('waiting');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let cancelled = false;

    loginWithDeviceCode((info) => {
      if (!cancelled) {
        setDeviceCode(info);
        setStatus('polling');
      }
    })
      .then((result) => {
        if (!cancelled) {
          setStatus('success');
          onSuccess(result.accessToken, result.account?.username);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setStatus('error');
          const msg = err instanceof Error ? err.message : 'Authentication failed';
          setErrorMessage(msg);
          onError(msg);
        }
      });

    return () => { cancelled = true; };
  }, []);

  return React.createElement(
    Box,
    { flexDirection: 'column', padding: 2 },
    React.createElement(Text, { bold: true, color: 'cyan' }, 'CIPP TUI — Sign In'),
    React.createElement(Text, null, ''),

    status === 'waiting' && React.createElement(Spinner, { label: 'Preparing authentication...' }),

    status === 'polling' && deviceCode && React.createElement(
      Box,
      { flexDirection: 'column' },
      React.createElement(Text, null, 'To sign in, open a browser and go to:'),
      React.createElement(Text, { bold: true, color: 'yellow' }, `  ${deviceCode.verificationUri}`),
      React.createElement(Text, null, ''),
      React.createElement(Text, null, 'Enter the code:'),
      React.createElement(Text, { bold: true, color: 'green' }, `  ${deviceCode.userCode}`),
      React.createElement(Text, null, ''),
      React.createElement(Spinner, { label: 'Waiting for authentication...' }),
    ),

    status === 'success' && React.createElement(
      StatusMessage,
      { variant: 'success', children: 'Authenticated successfully!' },
    ),

    status === 'error' && React.createElement(
      StatusMessage,
      { variant: 'error', children: `Authentication failed: ${errorMessage}` },
    ),
  );
}
