'use client';

import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { LogOut, Menu } from 'lucide-react';
import ThemeToggle from '@/components/theme/ThemeToggle';
import { getNavTitle } from '@/lib/navigation';
import type { Role } from '@/types/roles';

interface TopbarProps {
  role: Role;
  onMenuClick?: () => void;
}

export default function Topbar({ role, onMenuClick }: TopbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const title = getNavTitle(pathname, role);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          type="button"
          className="topbar-menu-btn"
          onClick={onMenuClick}
          aria-label="Open sidebar"
        >
          <Menu size={18} strokeWidth={1.6} />
        </button>

        <h2 className="topbar-title">{title}</h2>
      </div>

      <div className="topbar-actions">
        <ThemeToggle />

        <button
          onClick={handleSignOut}
          className="topbar-signout btn-ghost"
          aria-label="Sign out"
        >
          <LogOut size={15} strokeWidth={1.5} />
          <span>Sign out</span>
        </button>
      </div>
    </header>
  );
}