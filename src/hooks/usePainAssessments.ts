import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AbbeyPainAssessment, PainActionRecord, PainType, calculateSeverity } from '@/types/painAssessment';
import { useToast } from '@/hooks/use-toast';

interface NewAssessment {
  client_id?: string;
  q1_vocalization: number;
  q2_facial_expression: number;
  q3_body_language: number;
  q4_behavioral_change: number;
  q5_physiological_change: number;
  q6_physical_change: number;
  pain_type: PainType;
  trigger_reason?: string;
  notes?: string;
}

interface NewActionRecord {
  assessment_id: string;
  action_taken: string;
  outcome?: string;
}

export function usePainAssessments(clientId?: string) {
  const [assessments, setAssessments] = useState<AbbeyPainAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('abbey_pain_assessments')
        .select('*')
        .eq('is_undone', false)
        .order('created_at', { ascending: false });

      if (clientId) {
        query = query.eq('client_id', clientId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setAssessments((data as AbbeyPainAssessment[]) || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching pain assessments:', err);
      setError('Failed to load pain assessments');
    } finally {
      setLoading(false);
    }
  };

  const createAssessment = async (assessment: NewAssessment): Promise<AbbeyPainAssessment | null> => {
    try {
      // Validate required fields before submission
      if (!assessment.pain_type) {
        toast({
          title: 'Validation Error',
          description: 'Pain type is required',
          variant: 'destructive',
        });
        return null;
      }

      const totalScore = 
        assessment.q1_vocalization +
        assessment.q2_facial_expression +
        assessment.q3_body_language +
        assessment.q4_behavioral_change +
        assessment.q5_physiological_change +
        assessment.q6_physical_change;

      const severity = calculateSeverity(totalScore);

      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError || !userData.user) {
        console.error('Auth error:', userError);
        toast({
          title: 'Authentication Error',
          description: 'You must be logged in to save assessments',
          variant: 'destructive',
        });
        return null;
      }

      const insertData = {
        client_id: assessment.client_id || null,
        q1_vocalization: assessment.q1_vocalization,
        q2_facial_expression: assessment.q2_facial_expression,
        q3_body_language: assessment.q3_body_language,
        q4_behavioral_change: assessment.q4_behavioral_change,
        q5_physiological_change: assessment.q5_physiological_change,
        q6_physical_change: assessment.q6_physical_change,
        pain_type: assessment.pain_type,
        trigger_reason: assessment.trigger_reason || null,
        notes: assessment.notes || null,
        total_score: totalScore,
        severity,
        created_by: userData.user.id,
      };

      console.log('Inserting assessment:', insertData);

      const { data, error: insertError } = await supabase
        .from('abbey_pain_assessments')
        .insert(insertData)
        .select()
        .single();

      if (insertError) {
        console.error('Insert error details:', insertError);
        throw insertError;
      }

      const newAssessment = data as AbbeyPainAssessment;
      setAssessments(prev => [newAssessment, ...prev]);
      
      toast({
        title: 'Assessment Saved',
        description: `Pain score: ${totalScore} (${severity.replace('_', ' ')})`,
      });

      return newAssessment;
    } catch (err: unknown) {
      console.error('Error creating assessment:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to save assessment';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    }
  };

  const addActionRecord = async (action: NewActionRecord): Promise<PainActionRecord | null> => {
    try {
      const { data: userData } = await supabase.auth.getUser();

      const { data, error: insertError } = await supabase
        .from('pain_action_records')
        .insert({
          ...action,
          created_by: userData.user?.id,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      toast({
        title: 'Action Recorded',
        description: 'The action has been saved successfully',
      });

      return data as PainActionRecord;
    } catch (err) {
      console.error('Error adding action record:', err);
      toast({
        title: 'Error',
        description: 'Failed to save action record',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateActionOutcome = async (actionId: string, outcome: string): Promise<boolean> => {
    try {
      const { data: userData } = await supabase.auth.getUser();

      const { error: updateError } = await supabase
        .from('pain_action_records')
        .update({
          outcome,
          outcome_recorded_at: new Date().toISOString(),
          edited_by: userData.user?.id,
          edited_at: new Date().toISOString(),
        })
        .eq('id', actionId);

      if (updateError) throw updateError;

      toast({
        title: 'Outcome Recorded',
        description: 'The outcome has been saved successfully',
      });

      return true;
    } catch (err) {
      console.error('Error updating action outcome:', err);
      toast({
        title: 'Error',
        description: 'Failed to save outcome',
        variant: 'destructive',
      });
      return false;
    }
  };

  const getActionsForAssessment = async (assessmentId: string): Promise<PainActionRecord[]> => {
    try {
      const { data, error } = await supabase
        .from('pain_action_records')
        .select('*')
        .eq('is_undone', false)
        .eq('assessment_id', assessmentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as PainActionRecord[]) || [];
    } catch (err) {
      console.error('Error fetching action records:', err);
      return [];
    }
  };

  const getLatestAssessment = (): AbbeyPainAssessment | null => {
    return assessments.length > 0 ? assessments[0] : null;
  };

  const getAlertStatus = (): 'stable' | 'monitor' | 'action' => {
    const latest = getLatestAssessment();
    if (!latest) return 'stable';
    
    switch (latest.severity) {
      case 'no_pain': return 'stable';
      case 'mild': return 'monitor';
      case 'moderate': return 'monitor';
      case 'severe': return 'action';
    }
  };

  const getTrendDirection = (): 'improving' | 'worsening' | 'stable' => {
    if (assessments.length < 2) return 'stable';
    
    const recent = assessments.slice(0, 3);
    const avgRecent = recent.reduce((sum, a) => sum + a.total_score, 0) / recent.length;
    
    const older = assessments.slice(3, 6);
    if (older.length === 0) return 'stable';
    
    const avgOlder = older.reduce((sum, a) => sum + a.total_score, 0) / older.length;
    
    const diff = avgRecent - avgOlder;
    if (diff < -1) return 'improving';
    if (diff > 1) return 'worsening';
    return 'stable';
  };

  useEffect(() => {
    fetchAssessments();
  }, [clientId]);

  return {
    assessments,
    loading,
    error,
    createAssessment,
    addActionRecord,
    updateActionOutcome,
    getActionsForAssessment,
    getLatestAssessment,
    getAlertStatus,
    getTrendDirection,
    refresh: fetchAssessments,
  };
}
