import React from 'react';
import { Box, Text } from 'ink';

export interface Tab {
  key: string;
  label: string;
  disabled?: boolean;
}

interface TabBarProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (key: string) => void;
}

export function TabBar({ tabs, activeTab, onTabChange }: TabBarProps) {
  return React.createElement(
    Box,
    { flexDirection: 'row', borderStyle: 'single', borderBottom: true, paddingX: 1 },
    ...tabs.map((tab, index) => {
      const isActive = tab.key === activeTab;
      return React.createElement(
        Box,
        { key: tab.key, marginRight: 1 },
        React.createElement(
          Text,
          {
            bold: isActive,
            color: tab.disabled ? 'gray' : isActive ? 'cyan' : 'white',
            dimColor: tab.disabled,
          },
          `${index + 1}:${tab.label}`,
        ),
      );
    }),
  );
}
