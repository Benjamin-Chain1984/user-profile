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

// Generate bowel care alert message
function getBowelAlertMessage(data: BowelAlertData): string {
  if (data.status === 'action') {
    if (data.daysSinceLastBm !== null && data.daysSinceLastBm >= 3) {
      return `No bowel movement for ${data.daysSinceLastBm} days – constipation risk, action required`;
    }
    return 'Bowel care concern – immediate attention required';
  }
  if (data.status === 'monitor') {
    if (data.daysSinceLastBm !== null && data.daysSinceLastBm >= 2) {
      return `No bowel movement for ${data.daysSinceLastBm} days – monitor closely`;
    }
    return 'Bowel pattern irregular – monitoring advised';
  }
  return 'Regular bowel pattern';
}

// Generate alerts dynamically from module statuses
function generateAlertsFromModules(
  modules: HealthModule[], 
  painData?: { severity: PainSeverity; score: number; timestamp: string },
  bowelData?: BowelAlertData
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

  // Fetch data on mount and set up realtime subscriptions
  useEffect(() => {
    fetchLatestPainAssessment();
    fetchBowelCareStatus();

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

    return () => {
      supabase.removeChannel(painChannel);
      supabase.removeChannel(bowelChannel);
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
    latestBowelData || undefined
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
