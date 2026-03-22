/**
 * Enteral Nutrition Module - Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import type {
  EnteralConfig,
  EnteralFeedLog,
  EnteralMedicationConfig,
  EnteralMedicationLog,
  EnteralStomaCheck,
  EnteralAlert,
} from '@/types/enteral';

/** Helper: resolve created_by UUIDs → full_name via profiles table */
async function enrichWithStaffNames<T extends { created_by?: string | null }>(rows: T[]): Promise<(T & { staff_name?: string | null })[]> {
  const ids = [...new Set(rows.map(r => r.created_by).filter(Boolean))] as string[];
  if (ids.length === 0) return rows.map(r => ({ ...r, staff_name: null }));
  const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', ids);
  const map: Record<string, string> = {};
  (profiles || []).forEach((p: any) => { map[p.id] = p.full_name || 'Unknown'; });
  return rows.map(r => ({ ...r, staff_name: r.created_by ? map[r.created_by] || null : null }));
}

// ── Config ──────────────────────────────────────────────────────
export function useEnteralConfig(clientId?: string) {
  return useQuery({
    queryKey: ['enteral-config', clientId],
    queryFn: async () => {
      let query = supabase
        .from('enteral_config')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1);

      if (clientId) {
        query = query.eq('client_id', clientId);
      } else {
        query = query.is('client_id', null);
      }

      const { data, error } = await query.limit(1).maybeSingle();
      if (error) throw error;
      return data as unknown as EnteralConfig | null;
    },
  });
}

export function useSaveEnteralConfig(clientId?: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (config: Partial<EnteralConfig>) => {
      // Check for existing config first (NULL client_id can't use onConflict)
      let query = supabase
        .from('enteral_config')
        .select('id')
        .order('updated_at', { ascending: false })
        .limit(1);

      if (clientId) {
        query = query.eq('client_id', clientId);
      } else {
        query = query.is('client_id', null);
      }
      const { data: existing } = await query.limit(1).maybeSingle();

      const payload = {
        ...config,
        client_id: clientId || null,
        updated_by: user?.id || null,
      };

      if (existing?.id) {
        const { error } = await supabase
          .from('enteral_config')
          .update(payload as any)
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('enteral_config')
          .insert(payload as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enteral-config'] });
      toast({ title: 'Settings saved', description: 'Enteral nutrition settings updated.' });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });
}

// ── Medication Config ───────────────────────────────────────────
export function useEnteralMedications(clientId?: string) {
  return useQuery({
    queryKey: ['enteral-medications', clientId],
    queryFn: async () => {
      let query = supabase.from('enteral_medication_config').select('*').eq('is_active', true).order('display_order');
      if (clientId) query = query.eq('client_id', clientId);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as EnteralMedicationConfig[];
    },
  });
}

export function useSaveEnteralMedication() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (med: Partial<EnteralMedicationConfig> & { client_id?: string }) => {
      const payload = { ...med, updated_by: user?.id || null };
      if (med.id) {
        const { error } = await supabase.from('enteral_medication_config').update(payload as any).eq('id', med.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('enteral_medication_config').insert({ ...payload, created_by: user?.id || null } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enteral-medications'] });
      toast({ title: 'Medication saved' });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });
}

// ── Feed Logs ───────────────────────────────────────────────────
export function useEnteralFeedLogs(clientId?: string) {
  return useQuery({
    queryKey: ['enteral-feed-logs', clientId],
    queryFn: async () => {
      let query = supabase.from('enteral_feed_logs').select('*').order('event_occurred_at', { ascending: false }).limit(100);
      if (clientId) query = query.eq('client_id', clientId);
      const { data, error } = await query;
      if (error) throw error;
      return enrichWithStaffNames((data || []) as unknown as EnteralFeedLog[]);
    },
  });
}

export function useLogEnteralFeed(clientId?: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (entry: Partial<EnteralFeedLog>) => {
      const { error } = await supabase.from('enteral_feed_logs').insert({
        ...entry,
        client_id: clientId || null,
        created_by: user?.id || null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enteral-feed-logs'] });
      toast({ title: 'Feed logged', description: 'Feed entry recorded successfully.' });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });
}

/**
 * Combined mutation: logs a feed entry AND its associated before/after flushes
 * into the enteral_flush_logs table so they count toward flush totals.
 */
export function useLogEnteralFeedWithFlushes(clientId?: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (payload: {
      feed: Partial<EnteralFeedLog>;
      flushBeforeMl: number;
      flushAfterMl: number;
    }) => {
      const { feed, flushBeforeMl, flushAfterMl } = payload;
      const common = { client_id: clientId || null, created_by: user?.id || null };

      // Insert feed log
      const { error: feedErr } = await supabase.from('enteral_feed_logs').insert({
        ...feed,
        ...common,
      } as any);
      if (feedErr) throw feedErr;

      // Insert flush-before log (if > 0)
      if (flushBeforeMl > 0) {
        const { error } = await supabase.from('enteral_flush_logs').insert({
          flush_reason: 'flush_before_feed',
          flush_volume_ml: flushBeforeMl,
          notes: null,
          ...common,
        } as any);
        if (error) throw error;
      }

      // Insert flush-after log (if > 0)
      if (flushAfterMl > 0) {
        const { error } = await supabase.from('enteral_flush_logs').insert({
          flush_reason: 'flush_after_feed',
          flush_volume_ml: flushAfterMl,
          notes: null,
          ...common,
        } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enteral-feed-logs'] });
      queryClient.invalidateQueries({ queryKey: ['enteral-flush-logs'] });
      toast({ title: 'Feed logged', description: 'Feed and flushes recorded successfully.' });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });
}

// ── Medication Logs ─────────────────────────────────────────────
export function useEnteralMedicationLogs(clientId?: string) {
  return useQuery({
    queryKey: ['enteral-med-logs', clientId],
    queryFn: async () => {
      let query = supabase.from('enteral_medication_logs').select('*').order('event_occurred_at', { ascending: false }).limit(100);
      if (clientId) query = query.eq('client_id', clientId);
      const { data, error } = await query;
      if (error) throw error;
      return enrichWithStaffNames((data || []) as unknown as EnteralMedicationLog[]);
    },
  });
}

export function useLogEnteralMedication(clientId?: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (entry: Partial<EnteralMedicationLog>) => {
      const { error } = await supabase.from('enteral_medication_logs').insert({
        ...entry,
        client_id: clientId || null,
        created_by: user?.id || null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enteral-med-logs'] });
      toast({ title: 'Medication logged', description: 'Medication administration recorded.' });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });
}

// ── Flush Logs ──────────────────────────────────────────────────
export function useEnteralFlushLogs(clientId?: string) {
  return useQuery({
    queryKey: ['enteral-flush-logs', clientId],
    queryFn: async () => {
      let query = supabase.from('enteral_flush_logs').select('*').order('event_occurred_at', { ascending: false }).limit(100);
      if (clientId) query = query.eq('client_id', clientId);
      const { data, error } = await query;
      if (error) throw error;
      return enrichWithStaffNames((data || []) as any[]);
    },
  });
}

export function useLogEnteralFlush(clientId?: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (entry: { flush_reason: string; flush_volume_ml: number; notes: string | null; scheduled_time?: string | null }) => {
      const { error } = await supabase.from('enteral_flush_logs').insert({
        ...entry,
        client_id: clientId || null,
        created_by: user?.id || null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enteral-flush-logs'] });
      toast({ title: 'Flush logged', description: 'Flush entry recorded successfully.' });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });
}

// ── Stoma Checks ────────────────────────────────────────────────
export function useEnteralStomaChecks(clientId?: string) {
  return useQuery({
    queryKey: ['enteral-stoma-checks', clientId],
    queryFn: async () => {
      let query = supabase.from('enteral_stoma_checks').select('*').order('event_occurred_at', { ascending: false }).limit(50);
      if (clientId) query = query.eq('client_id', clientId);
      const { data, error } = await query;
      if (error) throw error;
      return enrichWithStaffNames((data || []) as unknown as EnteralStomaCheck[]);
    },
  });
}

export function useLogEnteralStomaCheck(clientId?: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (entry: Partial<EnteralStomaCheck>) => {
      const { error } = await supabase.from('enteral_stoma_checks').insert({
        ...entry,
        client_id: clientId || null,
        created_by: user?.id || null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enteral-stoma-checks'] });
      toast({ title: 'Stoma check logged', description: 'Stoma check recorded successfully.' });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });
}
