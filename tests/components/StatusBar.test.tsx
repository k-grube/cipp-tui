import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import { StatusBar } from '../../src/components/StatusBar.js';

describe('StatusBar', () => {
  it('renders tenant name when provided', () => {
    const { lastFrame } = render(
      React.createElement(StatusBar, { tenantName: 'contoso.com', connected: true, hints: [] }),
    );
    expect(lastFrame()!).toContain('contoso.com');
  });

  it('shows Connected when connected', () => {
    const { lastFrame } = render(
      React.createElement(StatusBar, { tenantName: 'contoso.com', connected: true, hints: [] }),
    );
    expect(lastFrame()!).toContain('Connected');
  });

  it('shows Disconnected when not connected', () => {
    const { lastFrame } = render(
      React.createElement(StatusBar, { tenantName: null, connected: false, hints: [] }),
    );
    expect(lastFrame()!).toContain('Disconnected');
  });

  it('renders keyboard hints', () => {
    const { lastFrame } = render(
      React.createElement(StatusBar, {
        tenantName: 'contoso.com',
        connected: true,
        hints: [{ key: '?', label: 'help' }, { key: 'q', label: 'quit' }],
      }),
    );
    const frame = lastFrame()!;
    expect(frame).toContain('?');
    expect(frame).toContain('help');
    expect(frame).toContain('q');
    expect(frame).toContain('quit');
  });
});
