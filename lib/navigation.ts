import {
  LayoutDashboard,
  Briefcase,
  Users,
  FileText,
  CalendarCheck,
  BarChart2,
  AlertTriangle,
  MessageSquare,
  Settings,
  ClipboardList,
  UserCircle,
} from 'lucide-react';
import type { Role } from '@/types/roles';

export interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

export const NAV_ITEMS: Record<Role, NavItem[]> = {
  admin: [
    { label: 'Overview',       href: '/dashboard/admin',          icon: LayoutDashboard },
    { label: 'Job Postings',   href: '/recruitment/jobs',         icon: Briefcase },
    { label: 'Applications',   href: '/dashboard/admin/applications',  icon: CalendarCheck },
    { label: 'Employees',      href: '/dashboard/admin/employees',   icon: Users },
    { label: 'Analytics',      href: '/dashboard/admin/analytics',                icon: BarChart2 },    
    { label: 'Requests',        href: '/dashboard/admin/requests',    icon: ClipboardList },
    {label : 'Interviews', href : '/dashboard/admin/interviews', icon: CalendarCheck}
  ],
  hr: [
    { label: 'Overview',      href: '/dashboard/hr',             icon: LayoutDashboard },
    { label: 'Job Postings',  href: '/recruitment/jobs',         icon: Briefcase },
    { label: 'Applications',  href: '/dashboard/hr/applications',  icon: FileText },
    { label: 'Interviews',    href: '/recruitment/interviews',    icon: CalendarCheck },
    { label: 'Employees',     href: '/employees',                icon: Users },
    { label: 'Analytics',     href: '/analytics',                icon: BarChart2 },
    { label: 'Requests',        href: '/dashboard/admin/requests',    icon: ClipboardList },
    {label : 'Interviews', href : '/dashboard/hr/interviews', icon: CalendarCheck}
  ],
  employee: [
    { label: 'Overview',      href: '/dashboard/employee',       icon: LayoutDashboard },
    { label: 'Requests',      href: '/dashboard/employee/requests',        icon: ClipboardList },
    
  ],
  candidate: [
    { label: 'Overview',      href: '/dashboard/candidate',      icon: LayoutDashboard },
    { label: 'Browse Jobs',   href: '/jobs',                     icon: Briefcase },
    { label: 'Interviews',    href: '/dashboard/candidate/interviews',    icon: CalendarCheck },
    { label: 'Profile', href: '/dashboard/candidate/profile', icon: UserCircle,}
  ],
};