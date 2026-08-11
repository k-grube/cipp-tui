#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import { App } from './app.js';
import { getConfig } from './config.js';
import { TokenStore } from './auth/token-store.js';

// setup only runs while the config is incomplete, so a stored instance url is otherwise
// unreachable from inside the tui
if (process.argv.includes('--reset')) {
  getConfig().clear();
  new TokenStore().clear();
}

// Prevent unhandled rejections from crashing the TUI
process.on('unhandledRejection', (err) => {
  // Silently handled — errors surface through useApi hook
});

const { waitUntilExit } = render(React.createElement(App));
await waitUntilExit();
