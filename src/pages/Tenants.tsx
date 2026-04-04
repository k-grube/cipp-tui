import React, { useState, useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import { DataTable, type Column } from '../components/DataTable.js';
import { SearchInput } from '../components/SearchInput.js';
import { useApi } from '../hooks/useApi.js';
import { useTenant } from '../hooks/useTenant.js';
import { listTenants } from '../api/endpoints/tenants.js';
import type { AxiosInstance } from 'axios';
import type { Tenant } from '../types.js';

interface TenantsPageProps {
  apiClient: AxiosInstance;
}

const columns = [
  { key: 'displayName', label: 'Name', flexGrow: 1 },
  { key: 'defaultDomainName', label: 'Domain', flexGrow: 1 },
  { key: 'customerId', label: 'Tenant ID', flexGrow: 1 },
] as Column<Tenant>[];

export function TenantsPage({ apiClient }: TenantsPageProps) {
  const { data: tenants, loading, error, refetch } = useApi(
    () => listTenants(apiClient),
    [apiClient],
  );
  const { setActiveTenant } = useTenant();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchActive, setSearchActive] = useState(false);

  const filteredTenants = useMemo(() => {
    if (!tenants) return [];
    if (!searchQuery) return tenants;
    const q = searchQuery.toLowerCase();
    return tenants.filter(
      (t) =>
        t.displayName.toLowerCase().includes(q) ||
        t.defaultDomainName.toLowerCase().includes(q),
    );
  }, [tenants, searchQuery]);

  useInput((input, key) => {
    if (searchActive) {
      if (key.escape) setSearchActive(false);
      return;
    }

    if (input === '/') {
      setSearchActive(true);
      return;
    }
    if (input === 'r') {
      refetch();
      return;
    }
    if (key.upArrow && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
    if (key.downArrow && selectedIndex < filteredTenants.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
    if (key.return && filteredTenants[selectedIndex]) {
      setActiveTenant(filteredTenants[selectedIndex]);
    }
  });

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
    React.createElement(SearchInput, {
      active: searchActive,
      onSearch: (q: string) => { setSearchQuery(q); setSelectedIndex(0); },
      placeholder: 'Filter tenants...',
    }),
    (React.createElement as any)(DataTable, {
      columns,
      data: filteredTenants,
      selectedIndex,
      onSelect: setSelectedIndex,
      loading,
      emptyMessage: searchQuery ? 'No matching tenants' : 'No tenants found',
    }),
    React.createElement(
      Box,
      { paddingX: 1 },
      React.createElement(Text, { dimColor: true },
        `${filteredTenants.length} tenant(s) — Enter:select  /:search  r:refresh`,
      ),
    ),
  );
}
