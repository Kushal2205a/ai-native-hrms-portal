export type Role = 'admin' | 'hr' | 'employee' | 'candidate';

export const DASHBOARD_PATH: Record<Role, string> = {
  admin:     '/dashboard/admin',
  hr:        '/dashboard/hr',
  employee:  '/dashboard/employee',
  candidate: '/dashboard/candidate',
};