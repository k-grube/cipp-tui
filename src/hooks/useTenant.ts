import React, { createContext, useContext, useState, type ReactNode } from 'react';
import type { Tenant } from '../types.js';

interface TenantContextValue {
  activeTenant: Tenant | null;
  setActiveTenant: (tenant: Tenant) => void;
}

const TenantContext = createContext<TenantContextValue>({
  activeTenant: null,
  setActiveTenant: () => {},
});

export function TenantProvider({ children }: { children: ReactNode }) {
  const [activeTenant, setActiveTenant] = useState<Tenant | null>(null);

  return React.createElement(
    TenantContext.Provider,
    { value: { activeTenant, setActiveTenant } },
    children,
  );
}

export function useTenant(): TenantContextValue {
  return useContext(TenantContext);
}
