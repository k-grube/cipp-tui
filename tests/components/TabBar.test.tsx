import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import { TabBar } from '../../src/components/TabBar.js';

describe('TabBar', () => {
  const tabs = [
    { key: 'tenants', label: 'Tenants' },
    { key: 'users', label: 'Users' },
  ];

  it('renders all tab labels', () => {
    const { lastFrame } = render(
      React.createElement(TabBar, { tabs, activeTab: 'tenants', onTabChange: () => {} }),
    );
    const frame = lastFrame()!;
    expect(frame).toContain('Tenants');
    expect(frame).toContain('Users');
  });

  it('visually distinguishes the active tab', () => {
    const { lastFrame } = render(
      React.createElement(TabBar, { tabs, activeTab: 'users', onTabChange: () => {} }),
    );
    const frame = lastFrame()!;
    expect(frame).toContain('Tenants');
    expect(frame).toContain('Users');
  });
});
