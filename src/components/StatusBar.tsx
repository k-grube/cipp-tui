import React from 'react';
import { Box, Text, Spacer } from 'ink';

export interface KeyHint {
  key: string;
  label: string;
}

interface StatusBarProps {
  tenantName: string | null;
  connected: boolean;
  hints: KeyHint[];
}

export function StatusBar({ tenantName, connected, hints }: StatusBarProps) {
  return React.createElement(
    Box,
    { flexDirection: 'row', borderStyle: 'single', borderTop: true, paddingX: 1 },
    React.createElement(
      Text,
      { color: 'cyan', bold: true },
      tenantName ? `<${tenantName}>` : '<no tenant>',
    ),
    React.createElement(Text, null, '  '),
    React.createElement(
      Text,
      { color: connected ? 'green' : 'red' },
      connected ? 'Connected' : 'Disconnected',
    ),
    React.createElement(Spacer, null),
    ...hints.map((hint) =>
      React.createElement(
        Box,
        { key: hint.key, marginLeft: 1 },
        React.createElement(Text, { dimColor: true }, `${hint.key}:${hint.label}`),
      ),
    ),
  );
}
