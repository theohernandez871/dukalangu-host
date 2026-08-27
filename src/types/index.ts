export type Role = 'super_admin' | 'admin' | 'operator' | 'accountant' | 'support' | 'agent';

export interface Profile {
  id: string;
  companyId: string | null;
  fullName: string | null;
  phone: string | null;
  role: Role;
  isActive: boolean;
}

export interface Company {
  id: string;
  name: string;
  currency: string;
  timezone: string;
  logoUrl: string | null;
}
