import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { FluidConfig, FluidIntakeEntry, FluidOutputEntry, HydrationSymptomCheck, FluidBalanceAlert, FluidStatus } from '@/types/fluidBalance';
import { calculateDailyTotals, calculateFluidStatus } from '@/utils/fluidBalanceCalculator';
import { useToast } from '@/hooks/use-toast';

interface UseFluidBalanceReturn {
  config: FluidConfig | null;
  intakeEntries: FluidIntakeEntry[];
  outputEntries: FluidOutputEntry[];
  symptomChecks: HydrationSymptomCheck[];
  alerts: FluidBalanceAlert[];
  currentStatus: FluidStatus;
  statusMessage: string;
  statusLabel: string;
  percentOfTarget: number;
  todayIntake: number;
  todayOutput: number;
  todayBalance: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  saveConfig: (config: Partial<FluidConfig>) => Promise<void>;
  logIntake: (entry: Omit<FluidIntakeEntry, 'id' | 'created_at' | 'created_by'>) => Promise<void>;
  logOutput: (entry: Omit<FluidOutputEntry, 'id' | 'created_at' | 'created_by'>) => Promise<void>;
  logSymptomCheck: (check: Omit<HydrationSymptomCheck, 'id' | 'created_at' | 'created_by'>) => Promise<void>;
}

export function useFluidBalance(clientId?: string): UseFluidBalanceReturn {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [config, setConfig] = useState<FluidConfig | null>(null);
  const [intakeEntries, setIntakeEntries] = useState<FluidIntakeEntry[]>([]);
  const [outputEntries, setOutputEntries] = useState<FluidOutputEntry[]>([]);
  const [symptomChecks, setSymptomChecks] = useState<HydrationSymptomCheck[]>([]);
  const [alerts, setAlerts] = useState<FluidBalanceAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchData = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch config
      let configQuery = supabase.from('fluid_config').select('*');
      if (clientId) {
        configQuery = configQuery.eq('client_id', clientId);
      }
      const { data: configData, error: configError } = await configQuery.maybeSingle();
      
      if (configError) throw configError;
      setConfig(configData as FluidConfig | null);
      
      // Fetch intake entries (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      let intakeQuery = supabase
        .from('fluid_intake_entries')
        .select('*')
        .eq('is_undone', false)
        .gte('event_occurred_at', thirtyDaysAgo.toISOString())
        .order('event_occurred_at', { ascending: false });
      
      if (clientId) {
        intakeQuery = intakeQuery.eq('client_id', clientId);
      }
      
      const { data: intakeData, error: intakeError } = await intakeQuery;
      if (intakeError) throw intakeError;
      setIntakeEntries((intakeData || []) as FluidIntakeEntry[]);
      
      // Fetch output entries (last 30 days)
      let outputQuery = supabase
        .from('fluid_output_entries')
        .select('*')
        .eq('is_undone', false)
        .gte('event_occurred_at', thirtyDaysAgo.toISOString())
        .order('event_occurred_at', { ascending: false });
      
      if (clientId) {
        outputQuery = outputQuery.eq('client_id', clientId);
      }
      
      const { data: outputData, error: outputError } = await outputQuery;
      if (outputError) throw outputError;
      setOutputEntries((outputData || []) as FluidOutputEntry[]);
      
      // Fetch symptom checks (last 30 days)
      let symptomQuery = supabase
        .from('hydration_symptom_checks')
        .select('*')
        .eq('is_undone', false)
        .gte('check_date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('check_date', { ascending: false });
      
      if (clientId) {
        symptomQuery = symptomQuery.eq('client_id', clientId);
      }
      
      const { data: symptomData, error: symptomError } = await symptomQuery;
      if (symptomError) throw symptomError;
      setSymptomChecks((symptomData || []) as HydrationSymptomCheck[]);
      
      // Fetch active alerts
      let alertQuery = supabase
        .from('fluid_balance_alerts')
        .select('*')
        .is('resolved_at', null)
        .order('created_at', { ascending: false });
      
      if (clientId) {
        alertQuery = alertQuery.eq('client_id', clientId);
      }
      
      const { data: alertData, error: alertError } = await alertQuery;
      if (alertError) throw alertError;
      setAlerts((alertData || []) as FluidBalanceAlert[]);
      
    } catch (err) {
      console.error('Error fetching fluid balance data:', err);
      setError('Failed to load fluid balance data');
    } finally {
      setIsLoading(false);
    }
  }, [user, clientId]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  // Set up realtime subscriptions
  useEffect(() => {
    if (!user) return;
    
    const intakeChannel = supabase
      .channel('fluid_intake_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fluid_intake_entries' }, () => {
        fetchData();
      })
      .subscribe();
    
    const outputChannel = supabase
      .channel('fluid_output_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fluid_output_entries' }, () => {
        fetchData();
      })
      .subscribe();
    
    const alertChannel = supabase
      .channel('fluid_alert_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fluid_balance_alerts' }, () => {
        fetchData();
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(intakeChannel);
      supabase.removeChannel(outputChannel);
      supabase.removeChannel(alertChannel);
    };
  }, [user, fetchData]);
  
  const saveConfig = async (newConfig: Partial<FluidConfig>) => {
    if (!user) return;
    
    try {
      const configPayload = {
        ...newConfig,
        client_id: clientId || null,
        updated_by: user.id,
        updated_at: new Date().toISOString()
      };
      
      if (config?.id) {
        const { error } = await supabase
          .from('fluid_config')
          .update(configPayload)
          .eq('id', config.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('fluid_config')
          .insert({
            ...configPayload,
            created_by: user.id
          });
        
        if (error) throw error;
      }
      
      toast({
        title: 'Settings Saved',
        description: 'Fluid balance configuration has been updated.'
      });
      
      await fetchData();
    } catch (err) {
      console.error('Error saving config:', err);
      toast({
        title: 'Error',
        description: 'Failed to save configuration.',
        variant: 'destructive'
      });
    }
  };
  
  const logIntake = async (entry: Omit<FluidIntakeEntry, 'id' | 'created_at' | 'created_by'>) => {
    if (!user) return;
    
    try {
      // Warn (but allow) when fluid restriction is exceeded
      if (config?.fluid_restriction_enabled && config?.max_fluid_allowance_ml) {
        const todayTotal = intakeEntries
          .filter(e => new Date(e.event_occurred_at).toDateString() === new Date().toDateString())
          .reduce((sum, e) => sum + e.amount_ml, 0);
        
        if (todayTotal + entry.amount_ml > config.max_fluid_allowance_ml) {
          toast({
            title: '⚠️ Fluid Restriction Exceeded',
            description: `Daily limit of ${config.max_fluid_allowance_ml}ml has been exceeded. Current total: ${todayTotal + entry.amount_ml}ml. Please follow the care plan.`,
            variant: 'destructive'
          });
        }
      }
      
      const { error } = await supabase
        .from('fluid_intake_entries')
        .insert({
          ...entry,
          client_id: clientId || null,
          created_by: user.id
        });
      
      if (error) throw error;
      
      toast({
        title: 'Intake Logged',
        description: `${entry.amount_ml}ml ${entry.fluid_type} recorded.`
      });
      
      await fetchData();
    } catch (err) {
      console.error('Error logging intake:', err);
      toast({
        title: 'Error',
        description: 'Failed to log intake.',
        variant: 'destructive'
      });
    }
  };
  
  const logOutput = async (entry: Omit<FluidOutputEntry, 'id' | 'created_at' | 'created_by'>) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('fluid_output_entries')
        .insert({
          ...entry,
          client_id: clientId || null,
          created_by: user.id
        });
      
      if (error) throw error;
      
      toast({
        title: 'Output Logged',
        description: entry.is_unmeasured 
          ? `${entry.output_type} (unmeasured) recorded.`
          : `${entry.amount_ml}ml ${entry.output_type} recorded.`
      });
      
      await fetchData();
    } catch (err) {
      console.error('Error logging output:', err);
      toast({
        title: 'Error',
        description: 'Failed to log output.',
        variant: 'destructive'
      });
    }
  };
  
  const logSymptomCheck = async (check: Omit<HydrationSymptomCheck, 'id' | 'created_at' | 'created_by'>) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('hydration_symptom_checks')
        .insert({
          ...check,
          client_id: clientId || null,
          created_by: user.id
        });
      
      if (error) throw error;
      
      toast({
        title: 'Symptoms Recorded',
        description: 'Hydration wellbeing check has been saved.'
      });
      
      await fetchData();
    } catch (err) {
      console.error('Error logging symptom check:', err);
      toast({
        title: 'Error',
        description: 'Failed to record symptoms.',
        variant: 'destructive'
      });
    }
  };
  
  // Calculate today's totals using the same day-boundary logic as the status calculator
  // (prevents timezone / boundary mismatches between cards, % calc and the graphic)
  const now = new Date();
  const { intake: todayIntake, output: todayOutput, balance: todayBalance } = config
    ? calculateDailyTotals(intakeEntries, outputEntries, now, config)
    : { intake: 0, output: 0, balance: 0 };
  
  // Calculate current status (single source of truth for all UI elements)
  const { status: currentStatus, message: statusMessage, percentOfTarget, statusLabel } = calculateFluidStatus(
    intakeEntries,
    outputEntries,
    config,
    now
  );
  
  return {
    config,
    intakeEntries,
    outputEntries,
    symptomChecks,
    alerts,
    currentStatus,
    statusMessage,
    statusLabel,
    percentOfTarget,
    todayIntake,
    todayOutput,
    todayBalance,
    isLoading,
    error,
    refetch: fetchData,
    saveConfig,
    logIntake,
    logOutput,
    logSymptomCheck
  };
}
