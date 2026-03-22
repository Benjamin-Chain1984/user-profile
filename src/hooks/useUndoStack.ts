/**
 * Hook to manage the global undo stack for clinical data entries.
 * Queries undo_action_records for the active client, supports multi-step undo.
 */

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/contexts/ProfileContext';
import { auditService } from '@/services/audit';
import { toast } from 'sonner';

export interface UndoableEntry {
  id: string;
  client_id: string | null;
  table_name: string;
  entry_id: string;
  module_name: string;
  entry_type: string;
  entry_snapshot: Record<string, any>;
  created_at: string;
  created_by: string | null;
  is_undone: boolean;
}

// Map of table_name → module label for display
const MODULE_LABELS: Record<string, string> = {
  abbey_pain_assessments: 'Pain Assessment',
  painad_assessments: 'PAINAD Assessment',
  pain_action_records: 'Pain Action',
  bowel_log_entries: 'Bowel Care',
  bowel_prn_administrations: 'PRN Administration',
  bowel_escalation_records: 'Bowel Escalation',
  catheter_change_logs: 'Catheter Change',
  catheter_flush_logs: 'Catheter Flush',
  catheter_bag_change_logs: 'Bag Change',
  catheter_stoma_checks: 'Catheter Stoma Check',
  catheter_autonomic_risk_logs: 'Autonomic Dysreflexia',
  continence_pad_changes: 'Pad Change',
  continence_skin_checks: 'Continence Skin Check',
  continence_uti_tests: 'UTI Test',
  continence_consumables_checks: 'Consumables Check',
  enteral_feed_logs: 'Enteral Feed',
  enteral_flush_logs: 'Enteral Flush',
  enteral_medication_logs: 'Enteral Medication',
  enteral_stoma_checks: 'Enteral Stoma Check',
  seizure_events: 'Seizure Event',
  seizure_actions: 'Seizure Action',
  epilepsy_escalation_records: 'Epilepsy Escalation',
  fluid_intake_entries: 'Fluid Intake',
  fluid_output_entries: 'Fluid Output',
  hydration_symptom_checks: 'Hydration Symptom Check',
  vital_sign_entries: 'Vital Signs',
  vital_sign_action_logs: 'Vital Sign Action',
  oral_health_assessments: 'Oral Health Assessment',
  oral_health_task_logs: 'Oral Health Task',
  pressure_relief_events: 'Pressure Relief',
  pressure_area_escalation_records: 'Pressure Escalation',
  skin_check_sessions: 'Skin Check',
  skin_finding_markers: 'Skin Finding',
  positioning_checks: 'Positioning Check',
  sleep_entries: 'Sleep Entry',
  weight_entries: 'Weight Entry',
  mealtime_observations: 'Mealtime Observation',
  annual_health_assessment_records: 'Health Assessment',
  cancer_screening_records: 'Cancer Screening',
  vaccination_records: 'Vaccination',
};

export function getModuleLabel(tableName: string): string {
  return MODULE_LABELS[tableName] || tableName.replace(/_/g, ' ');
}

/**
 * Summarise an entry snapshot into a short human-readable string.
 */
export function summariseEntry(tableName: string, snapshot: Record<string, any>): string {
  const parts: string[] = [];

  // Common value extractors
  if (snapshot.bristol_type) parts.push(`Bristol Type ${snapshot.bristol_type}`);
  if (snapshot.total_score !== undefined) parts.push(`Score: ${snapshot.total_score}`);
  if (snapshot.severity) parts.push(`Severity: ${snapshot.severity}`);
  if (snapshot.temperature) parts.push(`Temp: ${snapshot.temperature}°C`);
  if (snapshot.heart_rate) parts.push(`HR: ${snapshot.heart_rate}`);
  if (snapshot.systolic_bp && snapshot.diastolic_bp) parts.push(`BP: ${snapshot.systolic_bp}/${snapshot.diastolic_bp}`);
  if (snapshot.spo2) parts.push(`SpO2: ${snapshot.spo2}%`);
  if (snapshot.respiratory_rate) parts.push(`RR: ${snapshot.respiratory_rate}`);
  if (snapshot.feed_volume_ml) parts.push(`Feed: ${snapshot.feed_volume_ml}ml`);
  if (snapshot.flush_volume_ml) parts.push(`Flush: ${snapshot.flush_volume_ml}ml`);
  if (snapshot.pad_condition) parts.push(`Pad: ${snapshot.pad_condition}`);
  if (snapshot.skin_condition) parts.push(`Skin: ${snapshot.skin_condition}`);
  if (snapshot.weight_kg) parts.push(`Weight: ${snapshot.weight_kg}kg`);
  if (snapshot.sleep_quality) parts.push(`Quality: ${snapshot.sleep_quality}`);
  if (snapshot.seizure_type) parts.push(`Type: ${snapshot.seizure_type}`);
  if (snapshot.medication_name) parts.push(snapshot.medication_name);
  if (snapshot.dose_given) parts.push(`Dose: ${snapshot.dose_given}`);
  if (snapshot.intake_ml) parts.push(`Intake: ${snapshot.intake_ml}ml`);
  if (snapshot.output_ml) parts.push(`Output: ${snapshot.output_ml}ml`);
  if (snapshot.test_result) parts.push(`Result: ${snapshot.test_result}`);

  return parts.length > 0 ? parts.join(', ') : 'Entry recorded';
}

export function useUndoStack() {
  const { profile } = useProfile();
  const queryClient = useQueryClient();

  const clientId = profile?.id && profile.id !== '1' ? profile.id : null;

  // Fetch recent undoable entries (not yet undone)
  const { data: undoStack = [], isLoading } = useQuery({
    queryKey: ['undo-stack', clientId],
    queryFn: async () => {
      let query = supabase
        .from('undo_action_records')
        .select('*')
        .eq('is_undone', false)
        .order('created_at', { ascending: false })
        .limit(20);

      if (clientId) {
        query = query.eq('client_id', clientId);
      } else {
        query = query.is('client_id', null);
      }

      const { data, error } = await query;
      if (error) {
        console.error('Error fetching undo stack:', error);
        return [];
      }
      return (data || []) as UndoableEntry[];
    },
    enabled: true,
    refetchInterval: 10000,
  });

  // Perform undo mutation
  const undoMutation = useMutation({
    mutationFn: async (entry: UndoableEntry) => {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || null;

      // 1) Mark the original entry as undone in the source table
      const { error: sourceError } = await supabase
        .from(entry.table_name as any)
        .update({
          is_undone: true,
          undone_at: new Date().toISOString(),
          undone_by: userId,
        } as any)
        .eq('id', entry.entry_id);

      if (sourceError) throw sourceError;

      // 2) Mark undo_action_records entry as undone
      const { error: undoError } = await supabase
        .from('undo_action_records')
        .update({
          is_undone: true,
          undone_at: new Date().toISOString(),
          undone_by: userId,
        })
        .eq('id', entry.id);

      if (undoError) throw undoError;

      // 3) Audit log
      await auditService.logEvent(
        'UNDO_ENTRY' as any,
        entry.client_id || undefined,
        {
          moduleName: entry.module_name,
          tableName: entry.table_name,
          entryId: entry.entry_id,
          entryType: entry.entry_type,
          entrySnapshot: entry.entry_snapshot,
        }
      );

      return entry;
    },
    onSuccess: () => {
      // Invalidate everything to recalculate statuses
      queryClient.invalidateQueries();
      toast.success('Last entry undone.', {
        description: 'All changes have been audit logged.',
      });
    },
    onError: (error) => {
      console.error('Undo failed:', error);
      toast.error('Failed to undo entry. Please try again.');
    },
  });

  const nextUndoEntry = undoStack.length > 0 ? undoStack[0] : null;
  const canUndo = undoStack.length > 0;

  return {
    undoStack,
    nextUndoEntry,
    canUndo,
    isLoading,
    performUndo: undoMutation.mutateAsync,
    isUndoing: undoMutation.isPending,
  };
}
