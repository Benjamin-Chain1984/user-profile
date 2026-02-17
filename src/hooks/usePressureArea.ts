/**
 * Pressure Area Prevention Data Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { PressureReliefEvent, SkinCheckSession, SkinFindingMarker, PressureAreaConfig } from '@/types/pressureArea';

export function usePressureAreaConfig(clientId?: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: config } = useQuery({
    queryKey: ['pressureAreaConfig', clientId],
    queryFn: async () => {
      let query = supabase.from('pressure_area_config').select('*');
      if (clientId) {
        query = query.eq('client_id', clientId);
      } else {
        query = query.is('client_id', null);
      }
      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      return data as PressureAreaConfig | null;
    },
  });

  const saveConfig = useMutation({
    mutationFn: async (updates: Partial<PressureAreaConfig>) => {
      if (!user?.id) throw new Error('Not authenticated');
      if (config?.id) {
        const { data, error } = await supabase
          .from('pressure_area_config')
          .update({ ...updates, updated_by: user.id })
          .eq('id', config.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('pressure_area_config')
          .insert({ client_id: clientId || null, ...updates, created_by: user.id, updated_by: user.id })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pressureAreaConfig', clientId] });
      toast({ title: 'Settings saved' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  return { config, saveConfig: saveConfig.mutate, isSaving: saveConfig.isPending };
}

export function usePressureReliefEvents(clientId?: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['pressureReliefEvents', clientId],
    queryFn: async () => {
      let query = supabase
        .from('pressure_relief_events')
        .select('*')
        .order('event_occurred_at', { ascending: false })
        .limit(100);
      if (clientId) query = query.eq('client_id', clientId);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as PressureReliefEvent[];
    },
  });

  const logEvent = useMutation({
    mutationFn: async (entry: Partial<PressureReliefEvent>) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { created_by, created_at, id, edited_at, edited_by, edit_reason, ...rest } = entry as any;
      const { data, error } = await supabase
        .from('pressure_relief_events')
        .insert({
          client_id: clientId || null,
          ...rest,
          created_by: user.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pressureReliefEvents', clientId] });
      toast({ title: 'Logged', description: 'Pressure relief event recorded.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  return { events, isLoading, logEvent: logEvent.mutate, isLogging: logEvent.isPending };
}

export function useSkinChecks(clientId?: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['skinCheckSessions', clientId],
    queryFn: async () => {
      let query = supabase
        .from('skin_check_sessions')
        .select('*')
        .order('event_occurred_at', { ascending: false })
        .limit(50);
      if (clientId) query = query.eq('client_id', clientId);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as SkinCheckSession[];
    },
  });

  const logSkinCheck = useMutation({
    mutationFn: async (entry: { session: Partial<SkinCheckSession>; markers: { location: string; finding_type: string; severity: string; notes: string | null }[] }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data: sessionData, error: sessionError } = await supabase
        .from('skin_check_sessions')
        .insert({
          client_id: clientId || null,
          overall_status: entry.session.overall_status || 'healthy',
          notes: entry.session.notes || null,
          event_occurred_at: entry.session.event_occurred_at || new Date().toISOString(),
          created_by: user.id,
        })
        .select()
        .single();
      if (sessionError) throw sessionError;

      if (entry.markers.length > 0) {
        const markersToInsert = entry.markers.map(m => ({
          session_id: sessionData.id,
          location: m.location,
          finding_type: m.finding_type,
          severity: m.severity,
          notes: m.notes,
        }));
        const { error: markersError } = await supabase
          .from('skin_finding_markers')
          .insert(markersToInsert);
        if (markersError) throw markersError;
      }

      return sessionData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skinCheckSessions', clientId] });
      toast({ title: 'Skin check recorded' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  return { sessions, isLoading, logSkinCheck: logSkinCheck.mutate, isLogging: logSkinCheck.isPending };
}
