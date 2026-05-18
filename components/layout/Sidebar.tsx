'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_ITEMS } from '@/lib/navigation';
import type { Role } from '@/types/roles';

interface SidebarProps {
  role: Role;
  fullName: string;
}

export default function Sidebar({ role, fullName }: SidebarProps) {
  const pathname = usePathname();
  const items = NAV_ITEMS[role];

  const initials = fullName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <span className="sidebar-pulse" aria-hidden="true" />
        <span className="s-tag">HRMS</span>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav" aria-label="Main navigation">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-item ${active ? 'sidebar-item--active' : ''}`}
            >
              <Icon size={15} strokeWidth={1.5} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User chip */}
      <div className="sidebar-user">
        <div className="sidebar-avatar">{initials}</div>
        <div className="sidebar-user-info">
          <p className="sidebar-user-name">{fullName}</p>
          <p className="sidebar-user-role s-tag">{role}</p>
        </div>
      </div>
    </aside>
  );
}