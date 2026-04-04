import React from 'react';
import { Box, Text } from 'ink';

export interface Column<T> {
  key: keyof T & string;
  label: string;
  width?: number;
}

interface DataTableProps<T extends Record<string, any>> {
  columns: Column<T>[];
  data: T[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  loading?: boolean;
  emptyMessage?: string;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  selectedIndex,
  onSelect,
  loading,
  emptyMessage = 'No data',
}: DataTableProps<T>) {
  if (loading) {
    return React.createElement(
      Box,
      { padding: 1 },
      React.createElement(Text, { dimColor: true }, 'Loading...'),
    );
  }

  if (data.length === 0) {
    return React.createElement(
      Box,
      { padding: 1 },
      React.createElement(Text, { dimColor: true }, emptyMessage),
    );
  }

  return React.createElement(
    Box,
    { flexDirection: 'column' },
    // Header row
    React.createElement(
      Box,
      { flexDirection: 'row', paddingX: 1 },
      ...columns.map((col) =>
        React.createElement(
          Box,
          { key: col.key, width: col.width ?? 20 },
          React.createElement(Text, { bold: true, underline: true }, col.label),
        ),
      ),
    ),
    // Data rows
    ...data.map((row, index) => {
      const isSelected = index === selectedIndex;
      return React.createElement(
        Box,
        { key: index, flexDirection: 'row', paddingX: 1 },
        ...columns.map((col) =>
          React.createElement(
            Box,
            { key: col.key, width: col.width ?? 20 },
            React.createElement(
              Text,
              {
                bold: isSelected,
                color: isSelected ? 'cyan' : undefined,
                inverse: isSelected,
              },
              String(row[col.key] ?? ''),
            ),
          ),
        ),
      );
    }),
  );
}
