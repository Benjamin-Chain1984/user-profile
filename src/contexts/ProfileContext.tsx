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

// Generate alerts dynamically from module statuses
// Only Amber (monitor) and Red (action) alerts are included - never IDEAL (stable)
function generateAlertsFromModules(modules: HealthModule[], painData?: { severity: PainSeverity; score: number; timestamp: string }): Alert[] {
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

  // Fetch pain data on mount and set up realtime subscription
  useEffect(() => {
    fetchLatestPainAssessment();

    // Subscribe to realtime updates for pain assessments
    const channel = supabase
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

    return () => {
      supabase.removeChannel(channel);
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
  // Only Amber and Red alerts propagate to dashboard - IDEAL (stable) does not
  const activeAlerts = generateAlertsFromModules(activeEnabledModules, latestPainData || undefined);
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
