/**
 * IDDSI & Safe Swallowing Hook
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/contexts/ProfileContext';
import { toast } from '@/hooks/use-toast';
import type { IddsiConfig, MealtimeObservation, PositioningCheck, VideoView } from '@/types/iddsi';

export function useIddsiConfig(clientId?: string) {
  const { profile } = useProfile();
  const cId = clientId || profile?.id;
  const [config, setConfig] = useState<IddsiConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!cId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('iddsi_config')
      .select('*')
      .eq('client_id', cId)
      .maybeSingle();
    if (!error && data) {
      setConfig({
        id: data.id,
        clientId: data.client_id,
        foodLevel: data.food_level,
        foodLevelVariant: data.food_level_variant,
        drinkLevel: data.drink_level,
        foodLevelSetAt: data.food_level_set_at,
        drinkLevelSetAt: data.drink_level_set_at,
        lastReviewDate: data.last_review_date,
        nextReviewDue: data.next_review_due,
        additionalInstructions: data.additional_instructions,
      });
    } else {
      setConfig(null);
    }
    setLoading(false);
  }, [cId]);

  useEffect(() => { fetch(); }, [fetch]);

  const saveConfig = async (updates: Partial<{
    food_level: number | null;
    food_level_variant: string | null;
    drink_level: number | null;
    last_review_date: string | null;
    next_review_due: string | null;
    additional_instructions: string | null;
  }>) => {
    if (!cId) return;
    const { data: user } = await supabase.auth.getUser();
    const now = new Date().toISOString();

    if (config) {
      const payload: Record<string, any> = { ...updates, updated_by: user.user?.id };
      if ('food_level' in updates) payload.food_level_set_at = now;
      if ('drink_level' in updates) payload.drink_level_set_at = now;
      const { error } = await supabase.from('iddsi_config').update(payload).eq('id', config.id);
      if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    } else {
      const payload: Record<string, any> = {
        client_id: cId,
        ...updates,
        created_by: user.user?.id,
        updated_by: user.user?.id,
      };
      if ('food_level' in updates) payload.food_level_set_at = now;
      if ('drink_level' in updates) payload.drink_level_set_at = now;
      const { error } = await supabase.from('iddsi_config').insert(payload);
      if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    }
    toast({ title: 'Saved', description: 'IDDSI configuration updated.' });
    fetch();
  };

  return { config, loading, refetch: fetch, saveConfig };
}

export function useMealtimeObservations(clientId?: string) {
  const { profile } = useProfile();
  const cId = clientId || profile?.id;
  const [observations, setObservations] = useState<MealtimeObservation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!cId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('mealtime_observations')
      .select('*')
      .eq('client_id', cId)
      .order('event_occurred_at', { ascending: false })
      .limit(50);
    if (!error && data) {
      setObservations(data.map(d => ({
        id: d.id,
        clientId: d.client_id,
        coughing: d.coughing as any,
        wetVoice: d.wet_voice,
        throatClearing: d.throat_clearing,
        pocketing: d.pocketing,
        fatigue: d.fatigue,
        mealCompletionPct: d.meal_completion_pct,
        refusal: d.refusal,
        severity: d.severity as any,
        notes: d.notes,
        completedByName: d.completed_by_name,
        eventOccurredAt: d.event_occurred_at,
        createdAt: d.created_at,
      })));
    }
    setLoading(false);
  }, [cId]);

  useEffect(() => { fetch(); }, [fetch]);

  const logObservation = async (obs: {
    coughing: string;
    wet_voice: boolean;
    throat_clearing: boolean;
    pocketing: boolean;
    fatigue: boolean;
    meal_completion_pct: number | null;
    refusal: boolean;
    severity: string;
    notes: string;
    completed_by_name: string;
  }) => {
    if (!cId) return false;
    const { data: user } = await supabase.auth.getUser();
    const { error } = await supabase.from('mealtime_observations').insert({
      client_id: cId,
      ...obs,
      created_by: user.user?.id,
    });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return false;
    }
    toast({ title: 'Saved', description: 'Mealtime observation logged.' });
    fetch();
    return true;
  };

  return { observations, loading, refetch: fetch, logObservation };
}

export function usePositioningChecks(clientId?: string) {
  const { profile } = useProfile();
  const cId = clientId || profile?.id;
  const [checks, setChecks] = useState<PositioningCheck[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!cId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('positioning_checks')
      .select('*')
      .eq('client_id', cId)
      .order('event_occurred_at', { ascending: false })
      .limit(50);
    if (!error && data) {
      setChecks(data.map(d => ({
        id: d.id,
        clientId: d.client_id,
        angleDegrees: Number(d.angle_degrees),
        personUpright: d.person_upright,
        hipsAtBack: d.hips_at_back,
        feetSupported: d.feet_supported,
        headMidline: d.head_midline,
        status: d.status as any,
        completedByName: d.completed_by_name,
        eventOccurredAt: d.event_occurred_at,
        createdAt: d.created_at,
        notes: d.notes,
      })));
    }
    setLoading(false);
  }, [cId]);

  useEffect(() => { fetch(); }, [fetch]);

  const logCheck = async (check: {
    angle_degrees: number;
    person_upright: boolean;
    hips_at_back: boolean;
    feet_supported: boolean;
    head_midline: boolean;
    status: string;
    completed_by_name: string;
    notes?: string;
  }) => {
    if (!cId) return false;
    const { data: user } = await supabase.auth.getUser();
    const { error } = await supabase.from('positioning_checks').insert({
      client_id: cId,
      ...check,
      created_by: user.user?.id,
    });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return false;
    }
    toast({ title: 'Saved', description: 'Positioning check logged.' });
    fetch();
    return true;
  };

  return { checks, loading, refetch: fetch, logCheck };
}

export function useVideoViews(clientId?: string) {
  const { profile } = useProfile();
  const cId = clientId || profile?.id;
  const [views, setViews] = useState<VideoView[]>([]);

  const fetch = useCallback(async () => {
    if (!cId) return;
    const { data } = await supabase
      .from('swallowing_video_views')
      .select('*')
      .eq('client_id', cId)
      .order('viewed_at', { ascending: false })
      .limit(100);
    if (data) {
      setViews(data.map(d => ({
        id: d.id,
        clientId: d.client_id,
        staffUserId: d.staff_user_id,
        staffName: d.staff_name,
        levelType: d.level_type as any,
        levelValue: d.level_value,
        skipped: d.skipped,
        viewedAt: d.viewed_at,
      })));
    }
  }, [cId]);

  useEffect(() => { fetch(); }, [fetch]);

  const logView = async (levelType: 'food' | 'drink', levelValue: number, staffName: string, skipped: boolean) => {
    if (!cId) return;
    const { data: user } = await supabase.auth.getUser();
    await supabase.from('swallowing_video_views').insert({
      client_id: cId,
      staff_user_id: user.user?.id,
      staff_name: staffName,
      level_type: levelType,
      level_value: levelValue,
      skipped,
    });
    fetch();
  };

  const hasViewed = (levelType: 'food' | 'drink', levelValue: number): boolean => {
    return views.some(v => v.levelType === levelType && v.levelValue === levelValue && !v.skipped);
  };

  return { views, logView, hasViewed, refetch: fetch };
}
