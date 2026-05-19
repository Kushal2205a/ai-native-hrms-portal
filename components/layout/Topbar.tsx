'use client';

import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { LogOut } from 'lucide-react';
import ThemeToggle from '@/components/theme/ThemeToggle';
import { getNavTitle } from '@/lib/navigation';
import type { Role } from '@/types/roles';

interface TopbarProps {
    role: Role;
}

export default function Topbar({ role }: TopbarProps) {
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
            <h2 className="topbar-title">{title}</h2>

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