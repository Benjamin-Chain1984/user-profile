/**
 * useCurrentStaff - Returns the authenticated user's staff profile
 * Used to auto-stamp entries with the logged-in staff member's identity.
 */

import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CurrentStaff {
  id: string;
  full_name: string;
  verified_phone: string | null;
}

export function useCurrentStaff() {
  const { user } = useAuth();

  const { data: staff, isLoading } = useQuery({
    queryKey: ['current-staff', user?.id],
    queryFn: async (): Promise<CurrentStaff | null> => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, verified_phone')
        .eq('id', user.id)
        .single();
      if (error || !data) return null;
      return {
        id: data.id,
        full_name: data.full_name || user.email || 'Unknown',
        verified_phone: data.verified_phone,
      };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  return {
    staff: staff ?? null,
    staffName: staff?.full_name || user?.email || 'Unknown',
    staffId: user?.id || null,
    isLoading,
  };
}
