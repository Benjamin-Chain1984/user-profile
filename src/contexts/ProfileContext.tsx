import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useMonitoringStatus } from '@/hooks/useMonitoringStatus';
import type { MonitoringStatus, PauseReason, PauseEndType } from '@/types/monitoringStatus';
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
import type { CancerScreeningRecord, VaccinationRecord } from '@/types/healthPrevention';
import { calculateHealthPreventionSummary } from '@/utils/healthPreventionStatusCalculator';
import { calculateSleepStatus } from '@/utils/sleepStatusCalculator';
import type { SleepEntry, SleepConfig } from '@/types/sleep';
import { calculateOralHealthStatus } from '@/utils/oralHealthStatusCalculator';
import type { OralHealthAssessment, OralHealthTaskLog, OralHealthConfig } from '@/types/oralHealth';

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
  refreshHealthPreventionStatus: () => void;
  refreshSleepStatus: () => void;
  refreshOralHealthStatus: () => void;
   // Monitoring pause state
   monitoringStatus: MonitoringStatus | null;
   isMonitoringPaused: boolean;
   pauseMonitoring: (data: {
     reason: PauseReason;
     notes?: string;
     pauseStartDatetime: string;
     pauseEndType: PauseEndType;
     pauseEndDatetime?: string;
   }) => Promise<boolean>;
   resumeMonitoring: () => Promise<boolean>;
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

// Health Prevention alert data type
type HealthPreventionAlertData = {
  status: 'stable' | 'monitor' | 'action';
  message: string;
  timestamp: string;
  dueCount: number;
};

// Sleep alert data type
type SleepAlertData = {
  status: 'stable' | 'monitor' | 'action';
  message: string;
  timestamp: string;
};

// Oral Health alert data type
type OralHealthAlertData = {
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
  fluidData?: FluidAlertData,
  healthPreventionData?: HealthPreventionAlertData,
  sleepData?: SleepAlertData,
  oralHealthData?: OralHealthAlertData
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
      
      // Special handling for health prevention module with real data
      if (m.id === 'health-prevention' && healthPreventionData) {
        return {
          id: m.id,
          moduleId: m.id,
          moduleName: 'Health Prevention',
          message: healthPreventionData.message,
          status: m.status === 'action' ? 'red' as const : 'amber' as const,
          timestamp: healthPreventionData.timestamp,
        };
      }

      // Special handling for sleep module with real data
      if (m.id === 'sleep' && sleepData) {
        return {
          id: m.id,
          moduleId: m.id,
          moduleName: 'Sleep Chart',
          message: sleepData.message,
          status: m.status === 'action' ? 'red' as const : 'amber' as const,
          timestamp: sleepData.timestamp,
        };
      }

      // Special handling for oral health module with real data
      if (m.id === 'oral-health' && oralHealthData) {
        return {
          id: m.id,
          moduleId: m.id,
          moduleName: 'Oral Health',
          message: oralHealthData.message,
          status: m.status === 'action' ? 'red' as const : 'amber' as const,
          timestamp: oralHealthData.timestamp,
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
  // Default fallback profile - will be replaced by database data
  const [profile, setProfile] = useState<IndividualProfile | null>({
    id: '1',
    fullName: 'Loading...',
    dateOfBirth: '1990-01-01',
    personResponsibleName: '',
    relationshipToIndividual: '',
    primaryContactNumber: '',
    email: '',
    createdAt: new Date().toISOString(),
    createdBy: 'System',
  });

   // Monitoring status hook - use profile.id when available
   const {
     status: monitoringStatus,
     isPaused: isMonitoringPaused,
     pauseMonitoring,
     resumeMonitoring,
   } = useMonitoringStatus(profile?.id ?? null);

  // Fetch profile from database
  const fetchProfileFromDb = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      if (data) {
        // Map database fields to frontend format
        setProfile({
          id: data.id,
          fullName: (data as any).full_name || data.preferred_name || '',
          dateOfBirth: (data as any).date_of_birth || '1990-01-01',
          avatarUrl: data.photo_url || undefined,
          personResponsibleName: (data as any).person_responsible_name || '',
          relationshipToIndividual: (data as any).relationship_to_individual || '',
          primaryContactNumber: (data as any).primary_contact_number || '',
          secondaryContact: (data as any).secondary_contact || undefined,
          email: (data as any).email || undefined,
          createdAt: data.created_at,
          createdBy: (data as any).created_by || 'System',
          editedAt: (data as any).edited_at || undefined,
          editedBy: (data as any).edited_by || undefined,
        });
      }
    } catch (err) {
      console.error('Error in fetchProfileFromDb:', err);
    }
  };

  // Pain assessment state
  const [latestPainData, setLatestPainData] = useState<{ severity: PainSeverity; score: number; timestamp: string } | null>(null);
  
  // Bowel care state
  const [latestBowelData, setLatestBowelData] = useState<BowelAlertData | null>(null);
  
  // Weight state
  const [latestWeightData, setLatestWeightData] = useState<WeightAlertData | null>(null);
  
  // Fluid state
  const [latestFluidData, setLatestFluidData] = useState<FluidAlertData | null>(null);
  
  // Health Prevention state
  const [latestHealthPreventionData, setLatestHealthPreventionData] = useState<HealthPreventionAlertData | null>(null);

  // Sleep state
  const [latestSleepData, setLatestSleepData] = useState<SleepAlertData | null>(null);

  // Oral Health state
  const [latestOralHealthData, setLatestOralHealthData] = useState<OralHealthAlertData | null>(null);

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

  // Fetch health prevention status
  const fetchHealthPreventionStatus = async () => {
    try {
      if (!profile?.id || !profile?.dateOfBirth) return;

      const sex = (profile as { sex?: string })?.sex;

      // Fetch config
      const { data: configData } = await supabase
        .from('health_prevention_config')
        .select('*')
        .eq('client_id', profile.id)
        .maybeSingle();

      // If disabled, set to stable
      if (configData && !configData.enable_cancer_screening && !configData.enable_vaccination_reminders) {
        setLatestHealthPreventionData({
          status: 'stable',
          message: 'Health prevention features disabled',
          timestamp: new Date().toISOString(),
          dueCount: 0,
        });
        setEnabledModules(prev => prev.map(m => 
          m.id === 'health-prevention' 
            ? { ...m, status: 'stable', lastEntry: 'Features disabled' }
            : m
        ));
        return;
      }

      // Fetch screening records
      const { data: screenings } = await supabase
        .from('cancer_screening_records')
        .select('*')
        .eq('client_id', profile.id)
        .order('created_at', { ascending: false });

      // Fetch vaccination records
      const { data: vaccinations } = await supabase
        .from('vaccination_records')
        .select('*')
        .eq('client_id', profile.id)
        .order('created_at', { ascending: false });

      // Map DB rows to typed records
      const typedScreenings: CancerScreeningRecord[] = (screenings || []).map((r: any) => ({
        id: r.id,
        clientId: r.client_id,
        screeningType: r.screening_type,
        status: r.status,
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

      const typedVaccinations: VaccinationRecord[] = (vaccinations || []).map((r: any) => ({
        id: r.id,
        clientId: r.client_id,
        vaccinationType: r.vaccination_type,
        status: r.status,
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

      const summary = calculateHealthPreventionSummary({
        profile: { dateOfBirth: profile.dateOfBirth, sex },
        config: {
          enableCancerScreening: configData?.enable_cancer_screening ?? true,
          enableVaccinationReminders: configData?.enable_vaccination_reminders ?? true,
        },
        screeningRecords: typedScreenings,
        vaccinationRecords: typedVaccinations,
      });

      setLatestHealthPreventionData({
        status: summary.status,
        message: summary.message,
        timestamp: summary.timestamp,
        dueCount: summary.dueCount,
      });

      setEnabledModules(prev => prev.map(m => 
        m.id === 'health-prevention' 
          ? { 
              ...m, 
              status: summary.status,
              lastEntry: summary.lastEntry,
            }
          : m
      ));
    } catch (err) {
      console.error('Error in fetchHealthPreventionStatus:', err);
    }
  };

  // Fetch sleep status
  const fetchSleepStatus = async () => {
    try {
      const { data: configData } = await supabase
        .from('sleep_config')
        .select('*')
        .maybeSingle();

      const { data: entries, error } = await supabase
        .from('sleep_entries')
        .select('*')
        .order('event_occurred_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching sleep entries:', error);
        return;
      }

      const typedEntries = (entries || []) as unknown as SleepEntry[];
      const sleepStatusResult = calculateSleepStatus({
        entries: typedEntries,
        config: {
          min_expected_sleep_hours: configData?.min_expected_sleep_hours ?? 7,
          disruption_threshold: configData?.disruption_threshold ?? 3,
          poor_sleep_threshold_hours: configData?.poor_sleep_threshold_hours ?? 5,
          consecutive_disruption_alert_days: configData?.consecutive_disruption_alert_days ?? 3,
          max_sleep_threshold_hours: configData?.max_sleep_threshold_hours ?? 12,
          consecutive_excessive_sleep_trigger: configData?.consecutive_excessive_sleep_trigger ?? 2,
        },
      });

      const moduleStatus = sleepStatusResult.status === 'ideal' ? 'stable' : sleepStatusResult.status;
      const sleepData: SleepAlertData = {
        status: moduleStatus,
        message: sleepStatusResult.message,
        timestamp: typedEntries[0]?.event_occurred_at || new Date().toISOString(),
      };

      setLatestSleepData(sleepData);

      setEnabledModules(prev => prev.map(m =>
        m.id === 'sleep'
          ? { ...m, status: moduleStatus, lastEntry: sleepStatusResult.lastEntry }
          : m
      ));
    } catch (err) {
      console.error('Error in fetchSleepStatus:', err);
    }
  };

  // Fetch oral health status
  const fetchOralHealthStatus = async () => {
    try {
      const { data: configData } = await supabase
        .from('oral_health_config')
        .select('*')
        .maybeSingle();

      const { data: assessmentData } = await supabase
        .from('oral_health_assessments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      const { data: taskLogData } = await supabase
        .from('oral_health_task_logs')
        .select('*')
        .order('log_date', { ascending: false })
        .limit(50);

      const typedAssessments = (assessmentData || []).map((d: any) => ({
        ...d,
        mouth_annotations: (d.mouth_annotations || []),
      })) as OralHealthAssessment[];
      const typedLogs = (taskLogData || []) as OralHealthTaskLog[];

      const statusResult = calculateOralHealthStatus({
        assessments: typedAssessments,
        taskLogs: typedLogs,
        config: {
          assessment_frequency: configData?.assessment_frequency ?? 'weekly',
          enable_compliance_monitoring: configData?.enable_compliance_monitoring ?? false,
        } as Partial<OralHealthConfig>,
      });

      const moduleStatus = statusResult.status === 'ideal' ? 'stable' : statusResult.status;
      const ohData: OralHealthAlertData = {
        status: moduleStatus,
        message: statusResult.message,
        timestamp: typedAssessments[0]?.created_at || new Date().toISOString(),
      };

      setLatestOralHealthData(ohData);

      setEnabledModules(prev => prev.map(m =>
        m.id === 'oral-health'
          ? { ...m, status: moduleStatus, lastEntry: statusResult.lastEntry }
          : m
      ));
    } catch (err) {
      console.error('Error in fetchOralHealthStatus:', err);
    }
  };

  // Fetch data on mount and set up realtime subscriptions
  useEffect(() => {
    fetchProfileFromDb();
    fetchLatestPainAssessment();
    fetchBowelCareStatus();
    fetchWeightStatus();
    fetchFluidStatus();
    fetchHealthPreventionStatus();
    fetchSleepStatus();
    fetchOralHealthStatus();

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

    // Subscribe to realtime updates for profile/client changes
    const profileChannel = supabase
      .channel('profile-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'clients',
        },
        () => {
          fetchProfileFromDb();
        }
      )
      .subscribe();

    // Subscribe to realtime updates for health prevention tables
    const screeningChannel = supabase
      .channel('screening-alerts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cancer_screening_records',
        },
        () => {
          fetchHealthPreventionStatus();
        }
      )
      .subscribe();

    const vaccinationChannel = supabase
      .channel('vaccination-alerts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vaccination_records',
        },
        () => {
          fetchHealthPreventionStatus();
        }
      )
      .subscribe();

    // Subscribe to realtime updates for sleep entries
    const sleepChannel = supabase
      .channel('sleep-alerts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sleep_entries',
        },
        () => {
          fetchSleepStatus();
        }
      )
      .subscribe();

    // Subscribe to realtime updates for oral health assessments
    const oralHealthChannel = supabase
      .channel('oral-health-alerts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'oral_health_assessments',
        },
        () => {
          fetchOralHealthStatus();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(painChannel);
      supabase.removeChannel(bowelChannel);
      supabase.removeChannel(weightChannel);
      supabase.removeChannel(fluidChannel);
      supabase.removeChannel(profileChannel);
      supabase.removeChannel(screeningChannel);
      supabase.removeChannel(vaccinationChannel);
      supabase.removeChannel(sleepChannel);
      supabase.removeChannel(oralHealthChannel);
    };
  }, []);

  // Enable ALL vitals by default
  const [healthMonitoringConfig, setHealthMonitoringConfig] = useState<HealthMonitoringConfig>({
    bloodPressureEnabled: true,
    heartRateEnabled: true,
    oxygenLevelsEnabled: true,
    temperatureEnabled: true,
    respiratoryRateEnabled: true,
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
    healthMonitoringConfig.temperatureEnabled ||
    healthMonitoringConfig.respiratoryRateEnabled;

  const activeEnabledModules = enabledModules.filter((m) => {
    if (m.id === 'health-monitoring') {
      return m.enabled && isHealthMonitoringValid;
    }
    return m.enabled;
  });

  // Calculate global alert state dynamically from module statuses
  // When monitoring is paused, suppress all alerts
  const activeAlerts = isMonitoringPaused ? [] : generateAlertsFromModules(
    activeEnabledModules, 
    latestPainData || undefined,
    latestBowelData || undefined,
    latestWeightData || undefined,
    latestFluidData || undefined,
    latestHealthPreventionData || undefined,
    latestSleepData || undefined,
    latestOralHealthData || undefined
  );
  const hasRedAlert = !isMonitoringPaused && activeEnabledModules.some((m) => m.status === 'action');
  const hasAmberAlert = !isMonitoringPaused && activeEnabledModules.some((m) => m.status === 'monitor');
  
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
        refreshHealthPreventionStatus: fetchHealthPreventionStatus,
        refreshSleepStatus: fetchSleepStatus,
        refreshOralHealthStatus: fetchOralHealthStatus,
         monitoringStatus,
         isMonitoringPaused,
         pauseMonitoring,
         resumeMonitoring,
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
