/**
 * useTeamMembers - Fetches active team members for "on behalf of" dropdown
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface TeamMemberOption {
  id: string;
  full_name: string;
  role: string | null;
}

export function useTeamMembers() {
  const { user } = useAuth();

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['team-members-active'],
    queryFn: async (): Promise<TeamMemberOption[]> => {
      // Fetch active profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('is_active', true)
        .order('full_name');

      if (profilesError || !profiles) return [];

      // Fetch roles
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role');

      const roleMap = new Map<string, string>();
      roles?.forEach(r => roleMap.set(r.user_id, r.role));

      // Exclude current user (they can't log on behalf of themselves)
      return profiles
        .filter(p => p.id !== user?.id)
        .map(p => ({
          id: p.id,
          full_name: p.full_name || 'Unknown',
          role: roleMap.get(p.id) || null,
        }));
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  return { members, isLoading };
}
