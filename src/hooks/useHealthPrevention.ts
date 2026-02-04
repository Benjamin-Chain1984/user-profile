/**
 * useHealthPrevention Hook
 * Manages health prevention data including screenings, vaccinations, and alerts
 * Using React Query for proper cache invalidation and reactivity
 * 
 * IMPORTANT: After mutations, this hook calls refreshHealthPreventionStatus from ProfileContext
 * to ensure the dashboard indicator stays in sync (single source of truth for global alerts).
 */

import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import { toast } from 'sonner';
import {
  HealthPreventionConfig,
  CancerScreeningRecord,
  VaccinationRecord,
  HealthPreventionAlert,
  ScreeningType,
  VaccinationType,
  CANCER_SCREENING_PROGRAMS,
  VACCINATION_PROGRAMS,
  calculateAge,
  isEligibleForScreening,
  calculateNextDueDate,
  getScreeningDisplayStatus,
  getVaccinationDisplayStatus,
} from '@/types/healthPrevention';
import type { Sex } from '@/types/ideal';
import { calculateHealthPreventionSummary } from '@/utils/healthPreventionStatusCalculator';

interface UseHealthPreventionOptions {
  clientId?: string;
}

export function useHealthPrevention(options: UseHealthPreventionOptions = {}) {
  const { user } = useAuth();
  const { profile, refreshHealthPreventionStatus } = useProfile();
  const clientId = options.clientId || profile?.id;
  const queryClient = useQueryClient();

  // Calculate age and sex from profile
  const age = profile?.dateOfBirth ? calculateAge(profile.dateOfBirth) : null;
  const sex = (profile as { sex?: Sex })?.sex;

  // Fetch config with React Query
  const { data: config, isLoading: isConfigLoading } = useQuery({
    queryKey: ['healthPreventionConfig', clientId],
    queryFn: async () => {
      if (!clientId) return null;

      const { data, error } = await supabase
        .from('health_prevention_config')
        .select('*')
        .eq('client_id', clientId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching health prevention config:', error);
        return null;
      }

      if (data) {
        return {
          id: data.id,
          clientId: data.client_id,
          enableCancerScreening: data.enable_cancer_screening,
          enableVaccinationReminders: data.enable_vaccination_reminders,
          gpPracticeName: data.gp_practice_name,
          gpContactDetails: data.gp_contact_details,
          reminderText: data.reminder_text || 'Discuss at next GP visit',
          lungScreeningSmokingHistory: data.lung_screening_smoking_history as 'yes' | 'no' | 'unsure' | null,
          escalationRecipients: data.escalation_recipients || [],
          createdAt: data.created_at,
          createdBy: data.created_by,
          updatedAt: data.updated_at,
          updatedBy: data.updated_by,
        } as HealthPreventionConfig;
      }

      // Default config
      return {
        id: '',
        clientId,
        enableCancerScreening: true,
        enableVaccinationReminders: true,
        gpPracticeName: null,
        gpContactDetails: null,
        reminderText: 'Discuss at next GP visit',
        lungScreeningSmokingHistory: null,
        escalationRecipients: [],
        createdAt: new Date().toISOString(),
        createdBy: null,
        updatedAt: new Date().toISOString(),
        updatedBy: null,
      } as HealthPreventionConfig;
    },
    enabled: !!clientId,
  });

  // Fetch screening records with React Query
  const { data: screeningRecords = [], isLoading: isScreeningsLoading } = useQuery({
    queryKey: ['cancerScreeningRecords', clientId],
    queryFn: async () => {
      if (!clientId) return [];

      const { data, error } = await supabase
        .from('cancer_screening_records')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching screening records:', error);
        return [];
      }

      return (data || []).map(r => ({
        id: r.id,
        clientId: r.client_id,
        screeningType: r.screening_type as ScreeningType,
        status: r.status as CancerScreeningRecord['status'],
        dateCompleted: r.date_completed,
        location: r.location,
        outcomeKnown: r.outcome_known,
        deferredReason: r.deferred_reason,
        notes: r.notes,
        nextDueDate: r.next_due_date,
        createdAt: r.created_at,
        createdBy: r.created_by,
        editedAt: r.edited_at,
        editedBy: r.edited_by,
        editReason: r.edit_reason,
      })) as CancerScreeningRecord[];
    },
    enabled: !!clientId,
  });

  // Fetch vaccination records with React Query
  const { data: vaccinationRecords = [], isLoading: isVaccinationsLoading } = useQuery({
    queryKey: ['vaccinationRecords', clientId],
    queryFn: async () => {
      if (!clientId) return [];

      const { data, error } = await supabase
        .from('vaccination_records')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching vaccination records:', error);
        return [];
      }

      return (data || []).map(r => ({
        id: r.id,
        clientId: r.client_id,
        vaccinationType: r.vaccination_type as VaccinationType,
        status: r.status as VaccinationRecord['status'],
        dateGiven: r.date_given,
        givenBy: r.given_by,
        vaccineBrand: r.vaccine_brand,
        notes: r.notes,
        nextDueDate: r.next_due_date,
        createdAt: r.created_at,
        createdBy: r.created_by,
        editedAt: r.edited_at,
        editedBy: r.edited_by,
        editReason: r.edit_reason,
      })) as VaccinationRecord[];
    },
    enabled: !!clientId,
  });

  // Fetch alerts with React Query
  const { data: alerts = [], isLoading: isAlertsLoading } = useQuery({
    queryKey: ['healthPreventionAlerts', clientId],
    queryFn: async () => {
      if (!clientId) return [];

      const { data, error } = await supabase
        .from('health_prevention_alerts')
        .select('*')
        .eq('client_id', clientId)
        .is('resolved_at', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching health prevention alerts:', error);
        return [];
      }

      return (data || []).map(a => ({
        id: a.id,
        clientId: a.client_id,
        alertType: a.alert_type as HealthPreventionAlert['alertType'],
        itemType: a.item_type,
        itemName: a.item_name,
        severity: a.severity as 'amber' | 'red',
        message: a.message,
        metadata: a.metadata as Record<string, unknown> | null,
        acknowledgedAt: a.acknowledged_at,
        acknowledgedBy: a.acknowledged_by,
        resolvedAt: a.resolved_at,
        resolvedBy: a.resolved_by,
        resolvedReason: a.resolved_reason,
        createdAt: a.created_at,
        createdBy: a.created_by,
      })) as HealthPreventionAlert[];
    },
    enabled: !!clientId,
  });

  const isLoading = isConfigLoading || isScreeningsLoading || isVaccinationsLoading || isAlertsLoading;

  // Save config mutation
  const saveConfigMutation = useMutation({
    mutationFn: async (updatedConfig: Partial<HealthPreventionConfig>) => {
      if (!clientId || !user) throw new Error('Not authenticated or no client');

      const configData = {
        client_id: clientId,
        enable_cancer_screening: updatedConfig.enableCancerScreening ?? config?.enableCancerScreening ?? true,
        enable_vaccination_reminders: updatedConfig.enableVaccinationReminders ?? config?.enableVaccinationReminders ?? true,
        gp_practice_name: updatedConfig.gpPracticeName ?? config?.gpPracticeName,
        gp_contact_details: updatedConfig.gpContactDetails ?? config?.gpContactDetails,
        reminder_text: updatedConfig.reminderText ?? config?.reminderText ?? 'Discuss at next GP visit',
        lung_screening_smoking_history: updatedConfig.lungScreeningSmokingHistory ?? config?.lungScreeningSmokingHistory,
        escalation_recipients: updatedConfig.escalationRecipients ?? config?.escalationRecipients ?? [],
        updated_by: user.id,
      };

      if (config?.id) {
        const { error } = await supabase
          .from('health_prevention_config')
          .update(configData)
          .eq('id', config.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('health_prevention_config')
          .insert({
            ...configData,
            created_by: user.id,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['healthPreventionConfig', clientId] });
      // Sync with global dashboard status (config changes may affect status)
      refreshHealthPreventionStatus();
      toast.success('Configuration saved');
    },
    onError: (error) => {
      toast.error('Failed to save configuration');
      console.error('Error saving config:', error);
    },
  });

  // Log screening completion mutation
  const logScreeningMutation = useMutation({
    mutationFn: async ({
      screeningType,
      data,
    }: {
      screeningType: ScreeningType;
      data: {
        dateCompleted: string;
        location?: string;
        outcomeKnown?: boolean;
        notes?: string;
      };
    }) => {
      if (!clientId || !user) throw new Error('Not authenticated or no client');

      const program = CANCER_SCREENING_PROGRAMS.find(p => p.id === screeningType);
      const nextDueDate = program ? calculateNextDueDate(data.dateCompleted, program.frequencyYears) : null;

      const { error } = await supabase
        .from('cancer_screening_records')
        .insert({
          client_id: clientId,
          screening_type: screeningType,
          status: 'completed',
          date_completed: data.dateCompleted,
          location: data.location || null,
          outcome_known: data.outcomeKnown ?? null,
          notes: data.notes || null,
          next_due_date: nextDueDate,
          created_by: user.id,
        });

      if (error) throw error;

      // Resolve any existing alerts for this screening
      await supabase
        .from('health_prevention_alerts')
        .update({
          resolved_at: new Date().toISOString(),
          resolved_by: user.id,
          resolved_reason: 'Screening completed',
        })
        .eq('client_id', clientId)
        .eq('item_type', 'screening')
        .ilike('item_name', `%${screeningType}%`)
        .is('resolved_at', null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cancerScreeningRecords', clientId] });
      queryClient.invalidateQueries({ queryKey: ['healthPreventionAlerts', clientId] });
      // Sync with global dashboard status
      refreshHealthPreventionStatus();
      toast.success('Screening logged successfully');
    },
    onError: (error) => {
      toast.error('Failed to log screening');
      console.error('Error logging screening:', error);
    },
  });

  // Defer screening mutation
  const deferScreeningMutation = useMutation({
    mutationFn: async ({
      screeningType,
      reason,
    }: {
      screeningType: ScreeningType;
      reason: string;
    }) => {
      if (!clientId || !user) throw new Error('Not authenticated or no client');

      const { error } = await supabase
        .from('cancer_screening_records')
        .insert({
          client_id: clientId,
          screening_type: screeningType,
          status: 'deferred',
          deferred_reason: reason,
          created_by: user.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cancerScreeningRecords', clientId] });
      // Sync with global dashboard status
      refreshHealthPreventionStatus();
      toast.success('Screening deferred');
    },
    onError: (error) => {
      toast.error('Failed to defer screening');
      console.error('Error deferring screening:', error);
    },
  });

  // Log vaccination mutation
  const logVaccinationMutation = useMutation({
    mutationFn: async ({
      vaccinationType,
      data,
    }: {
      vaccinationType: VaccinationType;
      data: {
        dateGiven: string;
        givenBy?: string;
        vaccineBrand?: string;
        notes?: string;
      };
    }) => {
      if (!clientId || !user) throw new Error('Not authenticated or no client');

      const program = VACCINATION_PROGRAMS.find(p => p.id === vaccinationType);
      const nextDueDate = program?.frequencyYears 
        ? calculateNextDueDate(data.dateGiven, program.frequencyYears) 
        : null;

      const { error } = await supabase
        .from('vaccination_records')
        .insert({
          client_id: clientId,
          vaccination_type: vaccinationType,
          status: 'completed',
          date_given: data.dateGiven,
          given_by: data.givenBy || null,
          vaccine_brand: data.vaccineBrand || null,
          notes: data.notes || null,
          next_due_date: nextDueDate,
          created_by: user.id,
        });

      if (error) throw error;

      // Resolve any existing alerts for this vaccination
      await supabase
        .from('health_prevention_alerts')
        .update({
          resolved_at: new Date().toISOString(),
          resolved_by: user.id,
          resolved_reason: 'Vaccination completed',
        })
        .eq('client_id', clientId)
        .eq('item_type', 'vaccination')
        .ilike('item_name', `%${vaccinationType}%`)
        .is('resolved_at', null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vaccinationRecords', clientId] });
      queryClient.invalidateQueries({ queryKey: ['healthPreventionAlerts', clientId] });
      // Sync with global dashboard status
      refreshHealthPreventionStatus();
      toast.success('Vaccination logged successfully');
    },
    onError: (error) => {
      toast.error('Failed to log vaccination');
      console.error('Error logging vaccination:', error);
    },
  });

  // Wrapper functions that maintain backward compatibility
  const saveConfig = async (updatedConfig: Partial<HealthPreventionConfig>) => {
    await saveConfigMutation.mutateAsync(updatedConfig);
  };

  const logScreeningCompletion = async (
    screeningType: ScreeningType,
    data: {
      dateCompleted: string;
      location?: string;
      outcomeKnown?: boolean;
      notes?: string;
    }
  ) => {
    await logScreeningMutation.mutateAsync({ screeningType, data });
  };

  const deferScreening = async (screeningType: ScreeningType, reason: string) => {
    await deferScreeningMutation.mutateAsync({ screeningType, reason });
  };

  const logVaccination = async (
    vaccinationType: VaccinationType,
    data: {
      dateGiven: string;
      givenBy?: string;
      vaccineBrand?: string;
      notes?: string;
    }
  ) => {
    await logVaccinationMutation.mutateAsync({ vaccinationType, data });
  };

  // Get eligible screenings for this profile
  const getEligibleScreenings = useCallback(() => {
    if (age === null) return [];
    
    return CANCER_SCREENING_PROGRAMS.map(program => {
      const isEligible = isEligibleForScreening(program, age, sex);
      const latestRecord = screeningRecords.find(r => r.screeningType === program.id);
      const displayStatus = getScreeningDisplayStatus(latestRecord || null, program, isEligible);
      
      return {
        program,
        isEligible,
        latestRecord,
        displayStatus,
      };
    });
  }, [age, sex, screeningRecords]);

  // Get vaccination status
  const getVaccinationsWithStatus = useCallback(() => {
    return VACCINATION_PROGRAMS.map(program => {
      const latestRecord = vaccinationRecords.find(r => r.vaccinationType === program.id);
      const displayStatus = getVaccinationDisplayStatus(latestRecord || null);
      const isAgeEligible = program.minAge === null || (age !== null && age >= program.minAge);
      
      return {
        program,
        latestRecord,
        displayStatus,
        isAgeEligible,
      };
    });
  }, [age, vaccinationRecords]);

  // Calculate overall module status
  const getModuleStatus = useCallback((): 'stable' | 'monitor' | 'action' => {
    const summary = calculateHealthPreventionSummary({
      profile: { dateOfBirth: profile?.dateOfBirth, sex },
      config: config
        ? {
            enableCancerScreening: config.enableCancerScreening,
            enableVaccinationReminders: config.enableVaccinationReminders,
          }
        : null,
      screeningRecords,
      vaccinationRecords,
    });

    return summary.status;
  }, [config, profile?.dateOfBirth, screeningRecords, vaccinationRecords, sex]);

  // Get due/overdue count
  const getDueCount = useCallback(() => {
    const summary = calculateHealthPreventionSummary({
      profile: { dateOfBirth: profile?.dateOfBirth, sex },
      config: config
        ? {
            enableCancerScreening: config.enableCancerScreening,
            enableVaccinationReminders: config.enableVaccinationReminders,
          }
        : null,
      screeningRecords,
      vaccinationRecords,
    });

    return summary.dueCount;
  }, [config, profile?.dateOfBirth, screeningRecords, vaccinationRecords, sex]);

  // Refresh data function
  const refreshData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['healthPreventionConfig', clientId] }),
      queryClient.invalidateQueries({ queryKey: ['cancerScreeningRecords', clientId] }),
      queryClient.invalidateQueries({ queryKey: ['vaccinationRecords', clientId] }),
      queryClient.invalidateQueries({ queryKey: ['healthPreventionAlerts', clientId] }),
    ]);
  };

  return {
    config,
    screeningRecords,
    vaccinationRecords,
    alerts,
    isLoading,
    age,
    sex,
    saveConfig,
    logScreeningCompletion,
    deferScreening,
    logVaccination,
    getEligibleScreenings,
    getVaccinationsWithStatus,
    getModuleStatus,
    getDueCount,
    refreshData,
  };
}
