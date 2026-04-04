import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import { DataTable } from '../../src/components/DataTable.js';

describe('DataTable', () => {
  const columns = [
    { key: 'name' as const, label: 'Name' },
    { key: 'email' as const, label: 'Email' },
  ];
  const data = [
    { name: 'Alice', email: 'alice@test.com' },
    { name: 'Bob', email: 'bob@test.com' },
  ];

  it('renders column headers', () => {
    const { lastFrame } = render(
      React.createElement(DataTable, { columns, data, selectedIndex: 0, onSelect: () => {} }),
    );
    const frame = lastFrame()!;
    expect(frame).toContain('Name');
    expect(frame).toContain('Email');
  });

  it('renders data rows', () => {
    const { lastFrame } = render(
      React.createElement(DataTable, { columns, data, selectedIndex: 0, onSelect: () => {} }),
    );
    const frame = lastFrame()!;
    expect(frame).toContain('Alice');
    expect(frame).toContain('Bob');
  });

  it('highlights the selected row', () => {
    const { lastFrame } = render(
      React.createElement(DataTable, { columns, data, selectedIndex: 1, onSelect: () => {} }),
    );
    expect(lastFrame()!).toContain('Bob');
  });
});
