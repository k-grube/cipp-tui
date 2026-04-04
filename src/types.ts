export interface Tenant {
  customerId: string;
  defaultDomainName: string;
  displayName: string;
  domains: string[];
}

export interface User {
  id: string;
  displayName: string;
  userPrincipalName: string;
  mail: string | null;
  jobTitle: string | null;
  department: string | null;
  mobilePhone: string | null;
  businessPhones: string[];
  accountEnabled: boolean;
  assignedLicenses: License[];
  onPremisesSyncEnabled: boolean | null;
  createdDateTime: string;
  lastSignInDateTime: string | null;
}

export interface License {
  skuId: string;
  skuPartNumber: string;
}

export interface MfaUser {
  userPrincipalName: string;
  accountEnabled: boolean;
  perUser: string;
  MFARegistration: boolean;
  CoveredByCA: string;
  CoveredBySD: string;
}

export interface ApiError {
  message: string;
  statusCode: number;
}

export interface AppConfig {
  apiBaseUrl: string;
  tenantId: string;
  clientId: string;
  clientSecret: string;
  scope: string;
}
