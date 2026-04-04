import React, { useState, useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import { ConfirmInput } from '@inkjs/ui';
import { DataTable, type Column } from '../components/DataTable.js';
import { SearchInput } from '../components/SearchInput.js';
import { Modal } from '../components/Modal.js';
import { useApi } from '../hooks/useApi.js';
import { useTenant } from '../hooks/useTenant.js';
import { listUsers, resetPassword, disableUser, convertToSharedMailbox } from '../api/endpoints/users.js';
import type { AxiosInstance } from 'axios';
import type { User } from '../types.js';

interface UsersPageProps {
  apiClient: AxiosInstance;
}

type ModalType = 'none' | 'detail' | 'resetPassword' | 'blockUser' | 'convertMailbox';

const columns: Column<{ displayName: string; userPrincipalName: string; accountEnabled: string; licenses: string }>[] = [
  { key: 'displayName', label: 'Name', width: 25 },
  { key: 'userPrincipalName', label: 'UPN', width: 35 },
  { key: 'accountEnabled', label: 'Enabled', width: 10 },
  { key: 'licenses', label: 'Licenses', width: 20 },
];

export function UsersPage({ apiClient }: UsersPageProps) {
  const { activeTenant } = useTenant();
  const tenantDomain = activeTenant?.defaultDomainName ?? '';

  const { data: users, loading, error, refetch } = useApi(
    () => listUsers(apiClient, tenantDomain),
    [apiClient, tenantDomain],
  );

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchActive, setSearchActive] = useState(false);
  const [modal, setModal] = useState<ModalType>('none');
  const [actionResult, setActionResult] = useState<string | null>(null);

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    if (!searchQuery) return users;
    const q = searchQuery.toLowerCase();
    return users.filter(
      (u) =>
        u.displayName.toLowerCase().includes(q) ||
        u.userPrincipalName.toLowerCase().includes(q),
    );
  }, [users, searchQuery]);

  const tableData = useMemo(
    () =>
      filteredUsers.map((u) => ({
        displayName: u.displayName,
        userPrincipalName: u.userPrincipalName,
        accountEnabled: u.accountEnabled ? 'Yes' : 'No',
        licenses: u.assignedLicenses?.map((l) => l.skuPartNumber).join(', ') || 'None',
      })),
    [filteredUsers],
  );

  const selectedUser = filteredUsers[selectedIndex] ?? null;

  const handleResetPassword = async () => {
    if (!selectedUser) return;
    try {
      const result = await resetPassword(apiClient, tenantDomain, selectedUser.id, '', true);
      setActionResult(result.Results);
    } catch (err: any) {
      setActionResult(`Error: ${err.message}`);
    }
    setModal('none');
  };

  const handleBlockUser = async (block: boolean) => {
    if (!selectedUser) return;
    try {
      const result = await disableUser(apiClient, tenantDomain, selectedUser.id, !block);
      setActionResult(result.Results);
      refetch();
    } catch (err: any) {
      setActionResult(`Error: ${err.message}`);
    }
    setModal('none');
  };

  const handleConvertMailbox = async () => {
    if (!selectedUser) return;
    try {
      const result = await convertToSharedMailbox(apiClient, tenantDomain, selectedUser.id);
      setActionResult(result.Results);
    } catch (err: any) {
      setActionResult(`Error: ${err.message}`);
    }
    setModal('none');
  };

  useInput((input, key) => {
    if (modal !== 'none') {
      if (key.escape) setModal('none');
      return;
    }

    if (searchActive) {
      if (key.escape) setSearchActive(false);
      return;
    }

    if (input === '/') { setSearchActive(true); return; }
    if (input === 'r') { refetch(); setActionResult(null); return; }
    if (key.upArrow && selectedIndex > 0) setSelectedIndex(selectedIndex - 1);
    if (key.downArrow && selectedIndex < filteredUsers.length - 1) setSelectedIndex(selectedIndex + 1);
    if (key.return) setModal('detail');

    // Context actions
    if (selectedUser) {
      if (input === 'p') setModal('resetPassword');
      if (input === 'b') setModal('blockUser');
      if (input === 'c') setModal('convertMailbox');
    }
  });

  if (!activeTenant) {
    return React.createElement(
      Box,
      { padding: 1 },
      React.createElement(Text, { dimColor: true }, 'Select a tenant first (go to Tenants tab)'),
    );
  }

  if (error) {
    return React.createElement(
      Box,
      { padding: 1 },
      React.createElement(Text, { color: 'red' }, `Error: ${error} — press r to retry`),
    );
  }

  return React.createElement(
    Box,
    { flexDirection: 'column' },

    // Action result banner
    actionResult && React.createElement(
      Box,
      { paddingX: 1 },
      React.createElement(Text, { color: actionResult.startsWith('Error') ? 'red' : 'green' }, actionResult),
    ),

    // Search
    React.createElement(SearchInput, {
      active: searchActive,
      onSearch: (q: string) => { setSearchQuery(q); setSelectedIndex(0); },
      placeholder: 'Filter users...',
    }),

    // Table
    (React.createElement as any)(DataTable, {
      columns,
      data: tableData,
      selectedIndex,
      onSelect: setSelectedIndex,
      loading,
      emptyMessage: searchQuery ? 'No matching users' : 'No users found',
    }),

    // Hints
    React.createElement(
      Box,
      { paddingX: 1 },
      React.createElement(Text, { dimColor: true },
        `${filteredUsers.length} user(s) — Enter:detail  p:password  b:block  c:convert  /:search  r:refresh`,
      ),
    ),

    // Detail modal
    (React.createElement as any)(
      Modal,
      { title: `User: ${selectedUser?.displayName ?? ''}`, visible: modal === 'detail' },
      selectedUser && React.createElement(
        Box,
        { flexDirection: 'column' },
        React.createElement(Text, null, `UPN: ${selectedUser.userPrincipalName}`),
        React.createElement(Text, null, `Email: ${selectedUser.mail ?? 'N/A'}`),
        React.createElement(Text, null, `Job Title: ${selectedUser.jobTitle ?? 'N/A'}`),
        React.createElement(Text, null, `Department: ${selectedUser.department ?? 'N/A'}`),
        React.createElement(Text, null, `Phone: ${selectedUser.mobilePhone ?? 'N/A'}`),
        React.createElement(Text, null, `Enabled: ${selectedUser.accountEnabled ? 'Yes' : 'No'}`),
        React.createElement(Text, null, `On-Prem Sync: ${selectedUser.onPremisesSyncEnabled ? 'Yes' : 'No'}`),
        React.createElement(Text, null, `Created: ${selectedUser.createdDateTime}`),
        React.createElement(Text, null, `Last Sign-In: ${selectedUser.lastSignInDateTime ?? 'Never'}`),
        React.createElement(Text, { dimColor: true }, '\nEsc to close'),
      ),
    ),

    // Reset password modal
    (React.createElement as any)(
      Modal,
      { title: `Reset Password: ${selectedUser?.displayName ?? ''}`, visible: modal === 'resetPassword' },
      React.createElement(
        Box,
        { flexDirection: 'column' },
        React.createElement(Text, null, 'Reset password with a temporary password? User must change on next login.'),
        React.createElement(Text, null, ''),
        React.createElement(ConfirmInput, {
          onConfirm: handleResetPassword,
          onCancel: () => setModal('none'),
        }),
      ),
    ),

    // Block user modal
    (React.createElement as any)(
      Modal,
      { title: `${selectedUser?.accountEnabled ? 'Block' : 'Unblock'}: ${selectedUser?.displayName ?? ''}`, visible: modal === 'blockUser' },
      React.createElement(
        Box,
        { flexDirection: 'column' },
        React.createElement(Text, null, `${selectedUser?.accountEnabled ? 'Block' : 'Unblock'} this user's sign-in?`),
        React.createElement(Text, null, ''),
        React.createElement(ConfirmInput, {
          onConfirm: () => handleBlockUser(selectedUser?.accountEnabled ?? false),
          onCancel: () => setModal('none'),
        }),
      ),
    ),

    // Convert mailbox modal
    (React.createElement as any)(
      Modal,
      { title: `Convert to Shared Mailbox: ${selectedUser?.displayName ?? ''}`, visible: modal === 'convertMailbox' },
      React.createElement(
        Box,
        { flexDirection: 'column' },
        React.createElement(Text, null, 'Convert this user to a shared mailbox? This cannot be easily undone.'),
        React.createElement(Text, { color: 'yellow' }, `User: ${selectedUser?.userPrincipalName}`),
        React.createElement(Text, null, ''),
        React.createElement(ConfirmInput, {
          onConfirm: handleConvertMailbox,
          onCancel: () => setModal('none'),
        }),
      ),
    ),
  );
}
