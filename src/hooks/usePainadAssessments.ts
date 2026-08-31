import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PainadAssessment, calculatePainadSeverity } from '@/types/painad';
import { PainType } from '@/types/painAssessment';
import { useToast } from '@/hooks/use-toast';
import { useClientIdOrActive } from '@/contexts/ActiveClientContext';

interface NewPainadAssessment {
  client_id?: string;
  q1_breathing: number;
  q2_negative_vocalization: number;
  q3_facial_expression: number;
  q4_body_language: number;
  q5_consolability: number;
  pain_type: PainType;
  trigger_reason?: string;
  notes?: string;
}

export function usePainadAssessments(clientId?: string) {
  clientId = useClientIdOrActive(clientId);
  const [assessments, setAssessments] = useState<PainadAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('painad_assessments')
        .select('*')
        .eq('is_undone', false)
        .order('created_at', { ascending: false });

      if (clientId) {
        query = query.eq('client_id', clientId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setAssessments((data as PainadAssessment[]) || []);
    } catch (err) {
      console.error('Error fetching PAINAD assessments:', err);
    } finally {
      setLoading(false);
    }
  };

  const createAssessment = async (assessment: NewPainadAssessment): Promise<PainadAssessment | null> => {
    try {
      if (!assessment.pain_type) {
        toast({ title: 'Validation Error', description: 'Pain type is required', variant: 'destructive' });
        return null;
      }

      const totalScore =
        assessment.q1_breathing +
        assessment.q2_negative_vocalization +
        assessment.q3_facial_expression +
        assessment.q4_body_language +
        assessment.q5_consolability;

      const severity = calculatePainadSeverity(totalScore);

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        toast({ title: 'Authentication Error', description: 'You must be logged in', variant: 'destructive' });
        return null;
      }

      const { data, error } = await supabase
        .from('painad_assessments')
        .insert({
          client_id: assessment.client_id || null,
          q1_breathing: assessment.q1_breathing,
          q2_negative_vocalization: assessment.q2_negative_vocalization,
          q3_facial_expression: assessment.q3_facial_expression,
          q4_body_language: assessment.q4_body_language,
          q5_consolability: assessment.q5_consolability,
          pain_type: assessment.pain_type,
          trigger_reason: assessment.trigger_reason || null,
          notes: assessment.notes || null,
          total_score: totalScore,
          severity,
          created_by: userData.user.id,
        })
        .select()
        .single();

      if (error) throw error;

      const newAssessment = data as PainadAssessment;
      setAssessments(prev => [newAssessment, ...prev]);
      toast({ title: 'Assessment Saved', description: `PAINAD score: ${totalScore}/10 (${severity.replace('_', ' ')})` });
      return newAssessment;
    } catch (err) {
      console.error('Error creating PAINAD assessment:', err);
      toast({ title: 'Error', description: 'Failed to save assessment', variant: 'destructive' });
      return null;
    }
  };

  const getLatestAssessment = (): PainadAssessment | null => {
    return assessments.length > 0 ? assessments[0] : null;
  };

  const getTrendDirection = (): 'improving' | 'worsening' | 'stable' => {
    if (assessments.length < 2) return 'stable';
    const recent = assessments.slice(0, 3);
    const older = assessments.slice(3, 6);
    if (older.length === 0) return 'stable';
    const avgRecent = recent.reduce((sum, a) => sum + a.total_score, 0) / recent.length;
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
    createAssessment,
    getLatestAssessment,
    getTrendDirection,
    refresh: fetchAssessments,
  };
}
