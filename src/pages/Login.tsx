import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { Spinner, StatusMessage } from '@inkjs/ui';
import { loginWithPkce, type TokenSet } from '../auth/pkce-login.js';

interface LoginProps {
  apiBaseUrl: string;
  onSuccess: (tokens: TokenSet) => void;
  onError: (error: string) => void;
}

type Phase = 'discovering' | 'browser' | 'success' | 'error';

export function Login({ apiBaseUrl, onSuccess, onError }: LoginProps) {
  const [phase, setPhase] = useState<Phase>('discovering');
  const [authorizeUrl, setAuthorizeUrl] = useState('');
  const [resource, setResource] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let cancelled = false;

    loginWithPkce(apiBaseUrl, {
      onDiscovered: (discovery) => {
        if (!cancelled) setResource(discovery.resource.resource);
      },
      onAuthorizeUrl: (url) => {
        if (!cancelled) {
          setAuthorizeUrl(url);
          setPhase('browser');
        }
      },
    })
      .then((tokens) => {
        if (cancelled) return;
        setPhase('success');
        onSuccess(tokens);
      })
      .catch((err) => {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : 'Authentication failed';
        setPhase('error');
        setErrorMessage(msg);
        onError(msg);
      });

    return () => { cancelled = true; };
  }, [apiBaseUrl]);

  return React.createElement(
    Box,
    { flexDirection: 'column', padding: 2 },
    React.createElement(Text, { bold: true, color: 'cyan' }, 'CIPP TUI — Sign In'),
    React.createElement(Text, null, ''),

    phase === 'discovering' && React.createElement(Spinner, { label: 'Discovering sign-in settings...' }),

    phase === 'browser' && React.createElement(
      Box,
      { flexDirection: 'column' },
      resource && React.createElement(Text, { dimColor: true }, `Resource: ${resource}`),
      React.createElement(Text, null, ''),
      React.createElement(Text, null, 'A browser window should have opened. If not, visit:'),
      React.createElement(Text, { color: 'yellow' }, `  ${authorizeUrl}`),
      React.createElement(Text, null, ''),
      React.createElement(Spinner, { label: 'Waiting for sign-in...' }),
    ),

    phase === 'success' && React.createElement(
      StatusMessage, { variant: 'success', children: 'Signed in.' },
    ),

    phase === 'error' && React.createElement(
      StatusMessage, { variant: 'error', children: `Sign-in failed: ${errorMessage}` },
    ),
  );
}
