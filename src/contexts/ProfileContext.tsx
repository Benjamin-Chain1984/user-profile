import React, { createContext, useContext, useState, ReactNode } from 'react';
import { 
  IndividualProfile, 
  HealthModule, 
  HealthMonitoringConfig, 
  GlobalAlertState, 
  Alert,
  HEALTH_MODULES 
} from '@/types/ideal';

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
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

// Generate alerts dynamically from module statuses
// Only Amber (monitor) and Red (action) alerts are included - never IDEAL (stable)
function generateAlertsFromModules(modules: HealthModule[]): Alert[] {
  return modules
    .filter((m) => m.enabled && (m.status === 'monitor' || m.status === 'action'))
    .map((m) => ({
      id: m.id,
      moduleId: m.id,
      moduleName: m.name,
      message: m.status === 'action' 
        ? 'Immediate action required' 
        : 'Requires follow-up',
      status: m.status === 'action' ? 'red' as const : 'amber' as const,
      timestamp: new Date().toISOString(),
    }));
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
  const activeAlerts = generateAlertsFromModules(activeEnabledModules);
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
