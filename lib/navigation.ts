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
    { label: 'Applications',   href: '/recruitment/applications',  icon: FileText },
    { label: 'Interviews',     href: '/recruitment/interviews',    icon: CalendarCheck },
    { label: 'Employees',      href: '/employees',                icon: Users },
    { label: 'Analytics',      href: '/analytics',                icon: BarChart2 },
    { label: 'Flight Risk',    href: '/analytics/flight-risk',    icon: AlertTriangle },
    { label: 'Chatbot',        href: '/chatbot',                  icon: MessageSquare },
    { label: 'Admin Settings', href: '/settings/admin',           icon: Settings },
  ],
  hr: [
    { label: 'Overview',      href: '/dashboard/hr',             icon: LayoutDashboard },
    { label: 'Job Postings',  href: '/recruitment/jobs',         icon: Briefcase },
    { label: 'Applications',  href: '/recruitment/applications',  icon: FileText },
    { label: 'Interviews',    href: '/recruitment/interviews',    icon: CalendarCheck },
    { label: 'Employees',     href: '/employees',                icon: Users },
    { label: 'Analytics',     href: '/analytics',                icon: BarChart2 },
    { label: 'Flight Risk',   href: '/analytics/flight-risk',    icon: AlertTriangle },
    { label: 'Chatbot',       href: '/chatbot',                  icon: MessageSquare },
  ],
  employee: [
    { label: 'Overview',      href: '/dashboard/employee',       icon: LayoutDashboard },
    { label: 'My Profile',    href: '/settings/profile',         icon: UserCircle },
    { label: 'Requests',      href: '/employee/requests',        icon: ClipboardList },
    { label: 'Chatbot',       href: '/chatbot',                  icon: MessageSquare },
  ],
  candidate: [
    { label: 'Overview',      href: '/dashboard/candidate',      icon: LayoutDashboard },
    { label: 'Browse Jobs',   href: '/jobs',                     icon: Briefcase },
    { label: 'Applications',  href: '/recruitment/applications',  icon: FileText },
    { label: 'Interviews',    href: '/recruitment/interviews',    icon: CalendarCheck },
  ],
};