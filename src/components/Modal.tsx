import React from 'react';
import { Box, Text } from 'ink';

interface ModalProps {
  title: string;
  visible: boolean;
  children: React.ReactNode;
}

export function Modal({ title, visible, children }: ModalProps) {
  if (!visible) return null;

  return React.createElement(
    Box,
    {
      flexDirection: 'column',
      borderStyle: 'double',
      borderColor: 'yellow',
      paddingX: 2,
      paddingY: 1,
      width: 60,
    },
    React.createElement(Text, { bold: true, color: 'yellow' }, title),
    React.createElement(Box, { marginTop: 1, flexDirection: 'column' }, children),
  );
}
