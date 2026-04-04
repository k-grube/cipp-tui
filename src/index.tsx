#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import { App } from './app.js';

// Prevent unhandled rejections from crashing the TUI
process.on('unhandledRejection', (err) => {
  // Silently handled — errors surface through useApi hook
});

const { waitUntilExit } = render(React.createElement(App));
await waitUntilExit();
