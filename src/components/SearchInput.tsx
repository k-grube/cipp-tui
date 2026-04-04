import React from 'react';
import { Box, Text } from 'ink';
import { TextInput } from '@inkjs/ui';

interface SearchInputProps {
  active: boolean;
  onSearch: (query: string) => void;
  placeholder?: string;
}

export function SearchInput({ active, onSearch, placeholder = 'Search...' }: SearchInputProps) {
  if (!active) {
    return React.createElement(
      Box,
      { paddingX: 1 },
      React.createElement(Text, { dimColor: true }, `/ ${placeholder}`),
    );
  }

  return React.createElement(
    Box,
    { paddingX: 1 },
    React.createElement(Text, null, '/ '),
    React.createElement(TextInput, {
      placeholder,
      onSubmit: onSearch,
      onChange: onSearch,
    }),
  );
}
