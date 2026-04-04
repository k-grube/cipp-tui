import React, { useMemo, useState, useEffect } from 'react';
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
  maxRows?: number;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  selectedIndex,
  onSelect,
  loading,
  emptyMessage = 'No data',
  maxRows,
}: DataTableProps<T>) {
  const [terminalHeight, setTerminalHeight] = useState(() => process.stdout.rows || 24);

  useEffect(() => {
    const onResize = () => setTerminalHeight(process.stdout.rows || 24);
    process.stdout.on('resize', onResize);
    return () => { process.stdout.off('resize', onResize); };
  }, []);

  // Reserve rows for: tab bar(3) + search(1) + header(1) + hints(1) + status bar(3) + scroll indicators(2)
  const availableRows = maxRows ?? Math.max(5, terminalHeight - 11);

  // Calculate the visible window around the selected index
  const visibleData = useMemo(() => {
    if (data.length <= availableRows) {
      return { rows: data, startIndex: 0 };
    }

    // Keep selected row centered-ish in the viewport
    let startIndex = Math.max(0, selectedIndex - Math.floor(availableRows / 2));
    if (startIndex + availableRows > data.length) {
      startIndex = Math.max(0, data.length - availableRows);
    }

    return {
      rows: data.slice(startIndex, startIndex + availableRows),
      startIndex,
    };
  }, [data, selectedIndex, availableRows]);

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

  const { rows, startIndex } = visibleData;
  const showScrollUp = startIndex > 0;
  const showScrollDown = startIndex + availableRows < data.length;

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
    // Scroll up indicator
    showScrollUp && React.createElement(
      Box,
      { paddingX: 1 },
      React.createElement(Text, { dimColor: true }, `  ↑ ${startIndex} more above`),
    ),
    // Visible data rows
    ...rows.map((row, viewIndex) => {
      const actualIndex = startIndex + viewIndex;
      const isSelected = actualIndex === selectedIndex;
      return React.createElement(
        Box,
        { key: actualIndex, flexDirection: 'row', paddingX: 1 },
        React.createElement(
          Box,
          { width: 2 },
          React.createElement(Text, { color: 'cyan' }, isSelected ? '>' : ' '),
        ),
        ...columns.map((col) =>
          React.createElement(
            Box,
            { key: col.key, width: col.width ?? 20 },
            React.createElement(
              Text,
              {
                bold: isSelected,
                color: isSelected ? 'cyan' : undefined,
              },
              String(row[col.key] ?? ''),
            ),
          ),
        ),
      );
    }),
    // Scroll down indicator
    showScrollDown && React.createElement(
      Box,
      { paddingX: 1 },
      React.createElement(Text, { dimColor: true }, `  ↓ ${data.length - startIndex - availableRows} more below`),
    ),
  );
}
