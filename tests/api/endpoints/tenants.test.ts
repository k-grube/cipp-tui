import { describe, it, expect, vi } from 'vitest';
import { listTenants } from '../../../src/api/endpoints/tenants.js';

const mockGet = vi.fn();
const mockClient = { get: mockGet } as any;

describe('listTenants', () => {
  it('calls GET /ListTenants and returns tenant array', async () => {
    const tenants = [
      { customerId: '1', defaultDomainName: 'contoso.com', displayName: 'Contoso', domains: ['contoso.com'] },
      { customerId: '2', defaultDomainName: 'fabrikam.com', displayName: 'Fabrikam', domains: ['fabrikam.com'] },
    ];
    mockGet.mockResolvedValueOnce({ data: tenants });

    const result = await listTenants(mockClient);
    expect(mockGet).toHaveBeenCalledWith('/ListTenants');
    expect(result).toEqual(tenants);
  });
});
