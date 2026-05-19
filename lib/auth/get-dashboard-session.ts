import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DASHBOARD_PATH } from '@/types/roles';
import type { Role } from '@/types/roles';

export type DashboardSession = {
  userId: string;
  profileId: string;
  role: Role;
  fullName: string;
  email: string | null;
};

export const getDashboardSession = cache(async (): Promise<DashboardSession | null> => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, full_name, email')
    .eq('id', user.id)
    .single();

  if (!profile?.role) {
    return null;
  }

  return {
    userId: user.id,
    profileId: profile.id,
    role: profile.role as Role,
    fullName: profile.full_name ?? 'User',
    email: profile.email,
  };
});

export async function requireDashboardSession(
  ...allowedRoles: Role[]
): Promise<DashboardSession> {
  const session = await getDashboardSession();

  if (!session) {
    redirect('/login');
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(session.role)) {
    redirect(DASHBOARD_PATH[session.role] ?? '/login');
  }

  return session;
}
