import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  IndividualProfile, 
  HealthModule, 
  HealthMonitoringConfig, 
  GlobalAlertState, 
  Alert,
  HEALTH_MODULES 
} from '@/types/ideal';
import { supabase } from '@/integrations/supabase/client';
import { calculateSeverity, getSeverityLabel, PainSeverity } from '@/types/painAssessment';
import { formatDistanceToNow } from 'date-fns';
import { BRISTOL_TYPES } from '@/types/bowelCare';
import { calculateBowelCareStatus, type CalculatedBowelStatus } from '@/utils/bowelCareStatusCalculator';
import { calculateWeightBmiStatus } from '@/utils/weightBmiCalculator';
import { calculateFluidStatus } from '@/utils/fluidBalanceCalculator';
import type { WeightEntry, WeightBmiConfig, WeightBmiAlert, WeightStatusInfo } from '@/types/weightBmi';
import type { FluidConfig, FluidIntakeEntry, FluidOutputEntry, FluidStatus } from '@/types/fluidBalance';

interface ProfileContextType {
  profile: IndividualProfile | null;
  setProfile: (profile: IndividualProfile) => void;
  enabledModules: HealthModule[];
  toggleModule: (moduleId: string) => void;
  healthMonitoringConfig: HealthMonitoringConfig;
  toggleVital: (vital: keyof HealthMonitoringConfig) => void;
  globalAlertState: GlobalAlertState;
  isProfileComplete: boolean;
  getModuleStatus: (moduleId: string) => HealthModule | undefined;
  refreshPainStatus: () => void;
  refreshBowelStatus: () => void;
  refreshWeightStatus: () => void;
  refreshFluidStatus: () => void;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

// Map pain severity to module status
function painSeverityToStatus(severity: PainSeverity): 'stable' | 'monitor' | 'action' {
  switch (severity) {
    case 'no_pain': return 'stable';
    case 'mild': return 'monitor';
    case 'moderate': return 'monitor';
    case 'severe': return 'action';
  }
}

// Generate alert message from pain data
function getPainAlertMessage(severity: PainSeverity, score: number): string {
  switch (severity) {
    case 'mild': return `Mild pain detected (score: ${score}/18) – monitor closely`;
    case 'moderate': return `Moderate pain (score: ${score}/18) – review and consider intervention`;
    case 'severe': return `Severe pain (score: ${score}/18) – immediate action required`;
    default: return 'No pain detected';
  }
}

// Bowel care status types
type BowelAlertData = {
  status: 'stable' | 'monitor' | 'action';
  message: string;
  timestamp: string;
  daysSinceLastBm: number | null;
};

// Bowel care alert message MUST come from the centralized bowel status calculator.
// Do not re-derive messaging here (avoids drift between dashboard and module).
function getBowelAlertMessage(data: BowelAlertData): string {
  return data.message;
}

// Weight alert data type
type WeightAlertData = {
  status: 'stable' | 'monitor' | 'action';
  message: string;
  timestamp: string;
};

// Fluid alert data type
type FluidAlertData = {
  status: 'stable' | 'monitor' | 'action';
  message: string;
  timestamp: string;
};
// Generate alerts dynamically from module statuses
function generateAlertsFromModules(
  modules: HealthModule[], 
  painData?: { severity: PainSeverity; score: number; timestamp: string },
  bowelData?: BowelAlertData,
  weightData?: WeightAlertData,
  fluidData?: FluidAlertData
): Alert[] {
  return modules
    .filter((m) => m.enabled && (m.status === 'monitor' || m.status === 'action'))
    .map((m) => {
      // Special handling for pain-check module with real data
      if (m.id === 'pain-check' && painData) {
        return {
          id: m.id,
          moduleId: m.id,
          moduleName: m.name,
          message: getPainAlertMessage(painData.severity, painData.score),
          status: m.status === 'action' ? 'red' as const : 'amber' as const,
          timestamp: painData.timestamp,
        };
      }
      
      // Special handling for constipation/bowel care module with real data
      if (m.id === 'constipation' && bowelData) {
        return {
          id: m.id,
          moduleId: m.id,
          moduleName: 'Bowel Care',
          message: getBowelAlertMessage(bowelData),
          status: m.status === 'action' ? 'red' as const : 'amber' as const,
          timestamp: bowelData.timestamp,
        };
      }
      
      // Special handling for weight module with real data
      if (m.id === 'weight' && weightData) {
        return {
          id: m.id,
          moduleId: m.id,
          moduleName: 'Weight & BMI',
          message: weightData.message,
          status: m.status === 'action' ? 'red' as const : 'amber' as const,
          timestamp: weightData.timestamp,
        };
      }
      
      // Special handling for fluid balance module with real data
      if (m.id === 'fluid-balance' && fluidData) {
        return {
          id: m.id,
          moduleId: m.id,
          moduleName: 'Fluid Balance',
          message: fluidData.message,
          status: m.status === 'action' ? 'red' as const : 'amber' as const,
          timestamp: fluidData.timestamp,
        };
      }
      
      return {
        id: m.id,
        moduleId: m.id,
        moduleName: m.name,
        message: m.status === 'action' 
          ? 'Immediate action required' 
          : 'Requires follow-up',
        status: m.status === 'action' ? 'red' as const : 'amber' as const,
        timestamp: new Date().toISOString(),
      };
    });
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<IndividualProfile | null>({
    id: '1',
    fullName: 'Sarah Mitchell',
    dateOfBirth: '1985-03-15',
    personResponsibleName: 'James Mitchell',
    relationshipToIndividual: 'Spouse',
    primaryContactNumber: '+44 7700 900123',
    email: 'james.mitchell@email.com',
    createdAt: new Date().toISOString(),
    createdBy: 'System Admin',
  });

  // Pain assessment state
  const [latestPainData, setLatestPainData] = useState<{ severity: PainSeverity; score: number; timestamp: string } | null>(null);
  
  // Bowel care state
  const [latestBowelData, setLatestBowelData] = useState<BowelAlertData | null>(null);
  
  // Weight state
  const [latestWeightData, setLatestWeightData] = useState<WeightAlertData | null>(null);
  
  // Fluid state
  const [latestFluidData, setLatestFluidData] = useState<FluidAlertData | null>(null);

  // Enable ALL modules by default for master project development
  const [enabledModules, setEnabledModules] = useState<HealthModule[]>(
    HEALTH_MODULES.map((m) => ({
      ...m,
      enabled: true, // All modules ON by default
      status: m.id === 'health-monitoring' ? 'action' : 
              m.id === 'fluid-balance' ? 'monitor' : 'stable',
      lastEntry: m.id === 'weight' ? 'Logged 2 days ago' : 
                 m.id === 'oral-health' ? 'Up to date' :
                 m.id === 'fluid-balance' ? '1,200ml today' :
                 m.id === 'health-monitoring' ? 'Review required' : 
                 'Not yet logged',
    }))
  );

  // Fetch latest pain assessment and update module status
  const fetchLatestPainAssessment = async () => {
    try {
      const { data, error } = await supabase
        .from('abbey_pain_assessments')
        .select('total_score, severity, created_at')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching pain assessment:', error);
        return;
      }

      if (data) {
        const severity = data.severity as PainSeverity;
        const status = painSeverityToStatus(severity);
        const timeAgo = formatDistanceToNow(new Date(data.created_at), { addSuffix: true });
        
        setLatestPainData({
          severity,
          score: data.total_score,
          timestamp: data.created_at,
        });

        // Update pain-check module with real status
        setEnabledModules(prev => prev.map(m => 
          m.id === 'pain-check' 
            ? { 
                ...m, 
                status, 
                lastEntry: `Score ${data.total_score}/18 • ${getSeverityLabel(severity)} • ${timeAgo}`
              }
            : m
        ));
      }
    } catch (err) {
      console.error('Error in fetchLatestPainAssessment:', err);
    }
  };

  // Fetch bowel care data and compute status using centralized calculator
  const fetchBowelCareStatus = async () => {
    try {
      // Fetch config
      const { data: configData } = await supabase
        .from('bowel_care_config')
        .select('*')
        .limit(1)
        .maybeSingle();

      // Fetch recent bowel logs - order by event_occurred_at for clinical accuracy
      const { data: logs, error } = await supabase
        .from('bowel_log_entries')
        .select('*')
        .order('event_occurred_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching bowel logs:', error);
        return;
      }

      // Use the centralized status calculator - single source of truth
      const calculated = calculateBowelCareStatus(
        (logs || []).map(l => ({
          id: l.id,
          bristol_type: l.bristol_type,
          entry_time: l.entry_time,
          event_occurred_at: l.event_occurred_at,
          indicators: l.indicators as Record<string, unknown> | undefined,
        })),
        configData ? {
          no_bm_days_threshold: configData.no_bm_days_threshold,
          type1_consecutive_days_threshold: configData.type1_consecutive_days_threshold,
          diarrhoea_type67_count_threshold: configData.diarrhoea_type67_count_threshold,
          diarrhoea_hours_window: configData.diarrhoea_hours_window,
        } : undefined,
        []
      );

      const bowelData: BowelAlertData = {
        status: calculated.status === 'ideal' ? 'stable' : calculated.status,
        message: calculated.message,
        timestamp: calculated.lastEventTimestamp || new Date().toISOString(),
        daysSinceLastBm: calculated.daysSinceLastBm,
      };

      setLatestBowelData(bowelData);

      // Update constipation module with real status
      const lastLog = logs?.[0];
      const timeAgo = lastLog 
        ? formatDistanceToNow(new Date(lastLog.event_occurred_at || lastLog.entry_time), { addSuffix: true })
        : 'Never';
      const bristolInfo = calculated.lastBristolType !== null
        ? BRISTOL_TYPES.find(b => b.type === calculated.lastBristolType)
        : null;
      const bristolLabel = bristolInfo?.name || '';

      // Map status for module (ideal -> stable for HealthModule type)
      const moduleStatus = calculated.status === 'ideal' ? 'stable' : calculated.status;

      setEnabledModules(prev => prev.map(m => 
        m.id === 'constipation' 
          ? { 
              ...m, 
              status: moduleStatus, 
              lastEntry: bristolLabel 
                ? `${bristolLabel} • ${timeAgo}` 
                : `Last logged ${timeAgo}`
            }
          : m
      ));
    } catch (err) {
      console.error('Error in fetchBowelCareStatus:', err);
    }
  };

  // Fetch weight status and update module
  const fetchWeightStatus = async () => {
    try {
      // Fetch config
      const { data: configData } = await supabase
        .from('weight_bmi_config')
        .select('*')
        .maybeSingle();

      // Fetch recent weight entries
      const { data: entries, error } = await supabase
        .from('weight_entries')
        .select('*')
        .order('event_occurred_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching weight entries:', error);
        return;
      }

      // Fetch alerts
      const { data: alertsData } = await supabase
        .from('weight_bmi_alerts')
        .select('*')
        .order('created_at', { ascending: false });

      // Calculate status using centralized calculator
      const typedEntries = (entries || []) as unknown as WeightEntry[];
      const typedConfig = configData as unknown as WeightBmiConfig | null;
      const typedAlerts = (alertsData || []) as unknown as WeightBmiAlert[];

      const statusInfo = calculateWeightBmiStatus(typedEntries, typedConfig, typedAlerts);

      const weightData: WeightAlertData = {
        status: statusInfo.status,
        message: statusInfo.message,
        timestamp: statusInfo.lastRecordedDate || new Date().toISOString(),
      };

      setLatestWeightData(weightData);

      // Update weight module with real status
      const latestEntry = typedEntries[0];
      const timeAgo = latestEntry 
        ? formatDistanceToNow(new Date(latestEntry.event_occurred_at), { addSuffix: true })
        : 'Never';
      const bmiInfo = latestEntry?.bmi_value 
        ? `BMI ${latestEntry.bmi_value.toFixed(1)}`
        : '';

      setEnabledModules(prev => prev.map(m => 
        m.id === 'weight' 
          ? { 
              ...m, 
              status: statusInfo.status, 
              lastEntry: latestEntry 
                ? `${latestEntry.weight_kg}kg ${bmiInfo ? `• ${bmiInfo}` : ''} • ${timeAgo}` 
                : 'Not yet logged'
            }
          : m
      ));
    } catch (err) {
      console.error('Error in fetchWeightStatus:', err);
    }
  };

  // Fetch fluid balance status
  const fetchFluidStatus = async () => {
    try {
      // Fetch config
      const { data: configData } = await supabase
        .from('fluid_config')
        .select('*')
        .maybeSingle();

      // Fetch today's intake entries
      const today = new Date().toISOString().split('T')[0];
      const { data: intakeData, error } = await supabase
        .from('fluid_intake_entries')
        .select('*')
        .gte('event_occurred_at', today)
        .order('event_occurred_at', { ascending: false });

      if (error) {
        console.error('Error fetching fluid intake:', error);
        return;
      }

      // Fetch output if enabled
      let outputData: FluidOutputEntry[] = [];
      if (configData?.enable_output_logging) {
        const { data: outputs } = await supabase
          .from('fluid_output_entries')
          .select('*')
          .gte('event_occurred_at', today);
        outputData = (outputs || []) as unknown as FluidOutputEntry[];
      }

      const typedConfig = configData as unknown as FluidConfig | null;
      const typedIntake = (intakeData || []) as unknown as FluidIntakeEntry[];

      const { status, message, percentOfTarget } = calculateFluidStatus(
        typedIntake,
        outputData,
        typedConfig
      );

      // Map fluid status to module status
      const moduleStatus = status === 'ideal' ? 'stable' : status === 'amber' ? 'monitor' : 'action';

      const fluidData: FluidAlertData = {
        status: moduleStatus,
        message,
        timestamp: new Date().toISOString(),
      };

      setLatestFluidData(fluidData);

      // Calculate today's total
      const todayTotal = typedIntake.reduce((sum, e) => sum + e.amount_ml, 0);

      setEnabledModules(prev => prev.map(m => 
        m.id === 'fluid-balance' 
          ? { 
              ...m, 
              status: moduleStatus, 
              lastEntry: `${todayTotal}ml today (${percentOfTarget}%)`
            }
          : m
      ));
    } catch (err) {
      console.error('Error in fetchFluidStatus:', err);
    }
  };

  // Fetch data on mount and set up realtime subscriptions
  useEffect(() => {
    fetchLatestPainAssessment();
    fetchBowelCareStatus();
    fetchWeightStatus();
    fetchFluidStatus();

    // Subscribe to realtime updates for pain assessments
    const painChannel = supabase
      .channel('pain-alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'abbey_pain_assessments',
        },
        () => {
          fetchLatestPainAssessment();
        }
      )
      .subscribe();

    // Subscribe to realtime updates for bowel logs
    const bowelChannel = supabase
      .channel('bowel-alerts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bowel_log_entries',
        },
        () => {
          fetchBowelCareStatus();
        }
      )
      .subscribe();

    // Subscribe to realtime updates for weight entries
    const weightChannel = supabase
      .channel('weight-alerts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'weight_entries',
        },
        () => {
          fetchWeightStatus();
        }
      )
      .subscribe();

    // Subscribe to realtime updates for fluid intake
    const fluidChannel = supabase
      .channel('fluid-alerts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'fluid_intake_entries',
        },
        () => {
          fetchFluidStatus();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(painChannel);
      supabase.removeChannel(bowelChannel);
      supabase.removeChannel(weightChannel);
      supabase.removeChannel(fluidChannel);
    };
  }, []);

  // Enable ALL vitals by default
  const [healthMonitoringConfig, setHealthMonitoringConfig] = useState<HealthMonitoringConfig>({
    bloodPressureEnabled: true,
    heartRateEnabled: true,
    oxygenLevelsEnabled: true,
    temperatureEnabled: true,
  });

  const toggleModule = (moduleId: string) => {
    setEnabledModules((prev) =>
      prev.map((m) =>
        m.id === moduleId ? { ...m, enabled: !m.enabled } : m
      )
    );
  };

  const toggleVital = (vital: keyof HealthMonitoringConfig) => {
    setHealthMonitoringConfig((prev) => ({
      ...prev,
      [vital]: !prev[vital],
    }));
  };

  const isHealthMonitoringValid = 
    healthMonitoringConfig.bloodPressureEnabled ||
    healthMonitoringConfig.heartRateEnabled ||
    healthMonitoringConfig.oxygenLevelsEnabled ||
    healthMonitoringConfig.temperatureEnabled;

  const activeEnabledModules = enabledModules.filter((m) => {
    if (m.id === 'health-monitoring') {
      return m.enabled && isHealthMonitoringValid;
    }
    return m.enabled;
  });

  // Calculate global alert state dynamically from module statuses
  const activeAlerts = generateAlertsFromModules(
    activeEnabledModules, 
    latestPainData || undefined,
    latestBowelData || undefined,
    latestWeightData || undefined,
    latestFluidData || undefined
  );
  const hasRedAlert = activeEnabledModules.some((m) => m.status === 'action');
  const hasAmberAlert = activeEnabledModules.some((m) => m.status === 'monitor');
  
  const globalAlertState: GlobalAlertState = {
    currentStatus: hasRedAlert ? 'action' : hasAmberAlert ? 'monitor' : 'stable',
    activeAlertsCount: activeAlerts.length,
    alerts: activeAlerts,
  };

  const isProfileComplete = Boolean(
    profile?.fullName &&
    profile?.dateOfBirth &&
    profile?.personResponsibleName &&
    profile?.primaryContactNumber &&
    activeEnabledModules.length > 0
  );

  const getModuleStatus = (moduleId: string) => 
    enabledModules.find((m) => m.id === moduleId);

  return (
    <ProfileContext.Provider
      value={{
        profile,
        setProfile,
        enabledModules,
        toggleModule,
        healthMonitoringConfig,
        toggleVital,
        globalAlertState,
        isProfileComplete,
        getModuleStatus,
        refreshPainStatus: fetchLatestPainAssessment,
        refreshBowelStatus: fetchBowelCareStatus,
        refreshWeightStatus: fetchWeightStatus,
        refreshFluidStatus: fetchFluidStatus,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}
