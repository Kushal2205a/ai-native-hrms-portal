'use client';

import { useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import type { Role } from '@/types/roles';

interface DashboardClientProps {
  children: React.ReactNode;
  role: Role;
  fullName: string;
}

export default function DashboardClient({
  children,
  role,
  fullName,
}: DashboardClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function openSidebar() {
    setSidebarOpen(true);
  }

  function closeSidebar() {
    setSidebarOpen(false);
  }

  return (
    <div className="dash-shell">
      <Sidebar
        role={role}
        fullName={fullName}
        isOpen={sidebarOpen}
        onClose={closeSidebar}
      />

      <button
        type="button"
        className={`sidebar-backdrop ${
          sidebarOpen ? 'sidebar-backdrop--visible' : ''
        }`}
        aria-label="Close sidebar"
        onClick={closeSidebar}
      />

      <div className="dash-main">
        <Topbar role={role} onMenuClick={openSidebar} />
        <main className="dash-content">{children}</main>
      </div>
    </div>
  );
}