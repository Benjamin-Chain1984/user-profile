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
import { formatDistanceToNow, differenceInHours, differenceInDays, parseISO, addDays, addHours } from 'date-fns';
import { BRISTOL_TYPES } from '@/types/bowelCare';
import { calculateStomaStatusLevel } from '@/hooks/useCatheter';
import type { StomaFinding, StomaPainLevel } from '@/types/catheter';
import { calculateBowelCareStatus, type CalculatedBowelStatus } from '@/utils/bowelCareStatusCalculator';
import { calculateWeightBmiStatus } from '@/utils/weightBmiCalculator';
import { calculateFluidStatus } from '@/utils/fluidBalanceCalculator';
import type { WeightEntry, WeightBmiConfig, WeightBmiAlert, WeightStatusInfo } from '@/types/weightBmi';
import type { FluidConfig, FluidIntakeEntry, FluidOutputEntry, FluidStatus } from '@/types/fluidBalance';
import type { CancerScreeningRecord, VaccinationRecord } from '@/types/healthPrevention';
import type { HealthAssessmentRecord } from '@/components/healthPrevention/HealthAssessmentSection';
import { calculateHealthPreventionSummary } from '@/utils/healthPreventionStatusCalculator';
import { calculateSleepStatus } from '@/utils/sleepStatusCalculator';
import type { SleepEntry, SleepConfig } from '@/types/sleep';
import { calculateOralHealthStatus } from '@/utils/oralHealthStatusCalculator';
import type { OralHealthAssessment, OralHealthTaskLog, OralHealthConfig } from '@/types/oralHealth';
import { calculateEntryStatuses } from '@/utils/vitalSignStatusCalculator';
import { computeHealthMonitoringStatus } from '@/utils/computeHealthMonitoringStatus';
import type { VitalSignEntry, VitalSignAlert, VitalType, AlteredCriteria, VitalSignConfig } from '@/types/healthMonitoring';
import { calculateEpilepsyStatus } from '@/utils/epilepsyStatusCalculator';
import type { SeizureEvent, EpilepsyConfig, EpilepsyAlert } from '@/types/epilepsy';
import { calculatePressureAreaStatus } from '@/utils/pressureAreaStatusCalculator';
import type { PressureReliefEvent, SkinCheckSession, PressureReliefPlan, SkinFindingMarker } from '@/types/pressureArea';
import { calculateEnteralStatus } from '@/utils/enteralStatusCalculator';

// ── Generic alert data type ────────────────────────────────────
type ModuleAlertData = {
  status: 'stable' | 'monitor' | 'action';
  message: string;
  timestamp: string;
};

// Health Prevention extends with dueCount
type HealthPreventionAlertData = ModuleAlertData & { dueCount: number };

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
  refreshHealthMonitoringStatus: () => void;
  refreshEpilepsyStatus: () => void;
  refreshContinenceStatus: () => void;
  refreshCatheterStatus: () => void;
  refreshPressureAreaStatus: () => void;
  refreshIddsiStatus: () => void;
  refreshEnteralStatus: () => void;
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

// ── Module ID → alert data map ────────────────────────────────
type ModuleAlertMap = Record<string, ModuleAlertData | undefined>;

// Generate alerts dynamically from module statuses
function generateAlertsFromModules(
  modules: HealthModule[], 
  painData: { severity: PainSeverity; score: number; timestamp: string } | undefined,
  alertMap: ModuleAlertMap,
): Alert[] {
  const moduleNameOverrides: Record<string, string> = {
    'constipation': 'Bowel Care',
    'weight': 'Weight & BMI',
    'fluid-balance': 'Fluid Balance',
    'health-prevention': 'Health Prevention',
    'sleep': 'Sleep Chart',
    'oral-health': 'Oral Health',
    'health-monitoring': 'Health Monitoring',
    'epilepsy': 'Epilepsy & Seizures',
    'continence': 'Continence Management',
    'catheter': 'Urinary Catheter',
    'pressure-area': 'Pressure Area Prevention',
    'iddsi': 'IDDSI & Safe Swallowing',
    'enteral': 'Enteral Nutrition',
  };

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
      
      // Use alert map for all other modules
      const data = alertMap[m.id];
      if (data) {
        return {
          id: m.id,
          moduleId: m.id,
          moduleName: moduleNameOverrides[m.id] || m.name,
          message: data.message,
          status: m.status === 'action' ? 'red' as const : 'amber' as const,
          timestamp: data.timestamp,
        };
      }
      
      return {
        id: m.id,
        moduleId: m.id,
        moduleName: moduleNameOverrides[m.id] || m.name,
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

  // Monitoring status hook
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

  // ── Module alert data state ──────────────────────────────────
  const [latestPainData, setLatestPainData] = useState<{ severity: PainSeverity; score: number; timestamp: string } | null>(null);
  const [latestBowelData, setLatestBowelData] = useState<ModuleAlertData | null>(null);
  const [latestWeightData, setLatestWeightData] = useState<ModuleAlertData | null>(null);
  const [latestFluidData, setLatestFluidData] = useState<ModuleAlertData | null>(null);
  const [latestHealthPreventionData, setLatestHealthPreventionData] = useState<HealthPreventionAlertData | null>(null);
  const [latestSleepData, setLatestSleepData] = useState<ModuleAlertData | null>(null);
  const [latestOralHealthData, setLatestOralHealthData] = useState<ModuleAlertData | null>(null);
  const [latestHealthMonitoringData, setLatestHealthMonitoringData] = useState<ModuleAlertData | null>(null);
  const [latestEpilepsyData, setLatestEpilepsyData] = useState<ModuleAlertData | null>(null);
  const [latestContinenceData, setLatestContinenceData] = useState<ModuleAlertData | null>(null);
  const [latestCatheterData, setLatestCatheterData] = useState<ModuleAlertData | null>(null);
  const [latestPressureAreaData, setLatestPressureAreaData] = useState<ModuleAlertData | null>(null);
  const [latestIddsiData, setLatestIddsiData] = useState<ModuleAlertData | null>(null);
  const [latestEnteralData, setLatestEnteralData] = useState<ModuleAlertData | null>(null);

  // Enable ALL modules by default for master project development
  const [enabledModules, setEnabledModules] = useState<HealthModule[]>(
    HEALTH_MODULES.map((m) => ({
      ...m,
      enabled: true,
      status: 'stable',
      lastEntry: 'Not yet logged',
    }))
  );

  // ── Helper to update a single module's status ────────────────
  const updateModuleStatus = (moduleId: string, status: 'stable' | 'monitor' | 'action', lastEntry: string) => {
    setEnabledModules(prev => prev.map(m =>
      m.id === moduleId ? { ...m, status, lastEntry } : m
    ));
  };

  // ══════════════════════════════════════════════════════════════
  // FETCH FUNCTIONS - Each module fetches data & calculates status
  // using centralized calculators. The Home Page reads results only.
  // ══════════════════════════════════════════════════════════════

  // ── Pain Assessment ──────────────────────────────────────────
  const fetchLatestPainAssessment = async () => {
    try {
      // Fetch latest from both Abbey and PAINAD tables + config for overdue
      const [abbeyResult, painadResult, configResult] = await Promise.all([
        supabase
          .from('abbey_pain_assessments')
          .select('total_score, severity, created_at')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('painad_assessments')
          .select('total_score, severity, created_at')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('abbey_pain_config')
          .select('overdue_alert_enabled, overdue_threshold_days, assessment_triggers')
          .is('client_id', null)
          .maybeSingle(),
      ]);

      const SEVERITY_RANK: Record<string, number> = { severe: 3, moderate: 2, mild: 1, no_pain: 0 };

      // Pick the most severe; if tied, pick the most recent
      const candidates = [
        abbeyResult.data ? { ...abbeyResult.data, tool: 'abbey' as const } : null,
        painadResult.data ? { ...painadResult.data, tool: 'painad' as const } : null,
      ].filter(Boolean) as Array<{ total_score: number; severity: string; created_at: string; tool: 'abbey' | 'painad' }>;

      if (candidates.length === 0) return;

      const best = candidates.sort((a, b) => {
        const rankDiff = (SEVERITY_RANK[b.severity] ?? 0) - (SEVERITY_RANK[a.severity] ?? 0);
        return rankDiff !== 0 ? rankDiff : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      })[0];

      const severity = best.severity as PainSeverity;
      let status = painSeverityToStatus(severity);
      const timeAgo = formatDistanceToNow(new Date(best.created_at), { addSuffix: true });
      const toolLabel = best.tool === 'painad' ? 'PAINAD' : 'Abbey';

      // Check overdue based on config threshold
      const overdueEnabled = configResult.data?.overdue_alert_enabled ?? true;
      const thresholdDays = configResult.data?.overdue_threshold_days ?? 1;
      const lastAssessmentDate = new Date(best.created_at);
      const daysSinceLastAssessment = (Date.now() - lastAssessmentDate.getTime()) / (1000 * 60 * 60 * 24);
      const isOverdue = daysSinceLastAssessment > thresholdDays;

      let statusMessage = `${toolLabel} • ${getSeverityLabel(severity)} • ${timeAgo}`;

      if (overdueEnabled && isOverdue && status === 'stable') {
        // Escalate to amber when overdue
        status = 'monitor';
        const overdueDays = Math.floor(daysSinceLastAssessment);
        statusMessage = `Assessment overdue by ${overdueDays} day${overdueDays !== 1 ? 's' : ''} • Last: ${timeAgo}`;
      }

      setLatestPainData({ severity, score: best.total_score, timestamp: best.created_at });
      updateModuleStatus('pain-check', status, statusMessage);
    } catch (err) { console.error('Error in fetchLatestPainAssessment:', err); }
  };

  // ── Bowel Care ───────────────────────────────────────────────
  const fetchBowelCareStatus = async () => {
    try {
      const { data: configData } = await supabase.from('bowel_care_config').select('*').limit(1).maybeSingle();
      const { data: logs, error } = await supabase
        .from('bowel_log_entries')
        .select('*')
        .order('event_occurred_at', { ascending: false })
        .limit(50);

      if (error) { console.error('Error fetching bowel logs:', error); return; }

      const calculated = calculateBowelCareStatus(
        (logs || []).map(l => ({
          id: l.id, bristol_type: l.bristol_type, entry_time: l.entry_time,
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

      const moduleStatus = calculated.status === 'ideal' ? 'stable' : calculated.status;
      setLatestBowelData({ status: moduleStatus, message: calculated.message, timestamp: calculated.lastEventTimestamp || new Date().toISOString() });

      const lastLog = logs?.[0];
      const timeAgo = lastLog ? formatDistanceToNow(new Date(lastLog.event_occurred_at || lastLog.entry_time), { addSuffix: true }) : 'Never';
      const bristolInfo = calculated.lastBristolType !== null ? BRISTOL_TYPES.find(b => b.type === calculated.lastBristolType) : null;
      updateModuleStatus('constipation', moduleStatus, bristolInfo?.name ? `${bristolInfo.name} • ${timeAgo}` : `Last logged ${timeAgo}`);
    } catch (err) { console.error('Error in fetchBowelCareStatus:', err); }
  };

  // ── Weight & BMI ─────────────────────────────────────────────
  const fetchWeightStatus = async () => {
    try {
      const { data: configData } = await supabase.from('weight_bmi_config').select('*').maybeSingle();
      const { data: entries, error } = await supabase.from('weight_entries').select('*').order('event_occurred_at', { ascending: false }).limit(50);
      if (error) { console.error('Error fetching weight entries:', error); return; }

      const { data: alertsData } = await supabase.from('weight_bmi_alerts').select('*').order('created_at', { ascending: false });

      const typedEntries = (entries || []) as unknown as WeightEntry[];
      const typedConfig = configData as unknown as WeightBmiConfig | null;
      const typedAlerts = (alertsData || []) as unknown as WeightBmiAlert[];
      const statusInfo = calculateWeightBmiStatus(typedEntries, typedConfig, typedAlerts);

      setLatestWeightData({ status: statusInfo.status, message: statusInfo.message, timestamp: statusInfo.lastRecordedDate || new Date().toISOString() });

      const latestEntry = typedEntries[0];
      const timeAgo = latestEntry ? formatDistanceToNow(new Date(latestEntry.event_occurred_at), { addSuffix: true }) : 'Never';
      const bmiInfo = latestEntry?.bmi_value ? `BMI ${latestEntry.bmi_value.toFixed(1)}` : '';
      updateModuleStatus('weight', statusInfo.status, latestEntry ? `${latestEntry.weight_kg}kg ${bmiInfo ? `• ${bmiInfo}` : ''} • ${timeAgo}` : 'Not yet logged');
    } catch (err) { console.error('Error in fetchWeightStatus:', err); }
  };

  // ── Fluid Balance ────────────────────────────────────────────
  const fetchFluidStatus = async () => {
    try {
      const { data: configData } = await supabase.from('fluid_config').select('*').maybeSingle();
      const today = new Date().toISOString().split('T')[0];
      const { data: intakeData, error } = await supabase.from('fluid_intake_entries').select('*').gte('event_occurred_at', today).order('event_occurred_at', { ascending: false });
      if (error) { console.error('Error fetching fluid intake:', error); return; }

      let outputData: FluidOutputEntry[] = [];
      if (configData?.enable_output_logging) {
        const { data: outputs } = await supabase.from('fluid_output_entries').select('*').gte('event_occurred_at', today);
        outputData = (outputs || []) as unknown as FluidOutputEntry[];
      }

      const typedConfig = configData as unknown as FluidConfig | null;
      const typedIntake = (intakeData || []) as unknown as FluidIntakeEntry[];
      const { status, message, percentOfTarget } = calculateFluidStatus(typedIntake, outputData, typedConfig);
      const moduleStatus = status === 'ideal' ? 'stable' : status === 'amber' ? 'monitor' : 'action';

      setLatestFluidData({ status: moduleStatus, message, timestamp: new Date().toISOString() });
      const todayTotal = typedIntake.reduce((sum, e) => sum + e.amount_ml, 0);
      updateModuleStatus('fluid-balance', moduleStatus, `${todayTotal}ml today (${percentOfTarget}%)`);
    } catch (err) { console.error('Error in fetchFluidStatus:', err); }
  };

  // ── Health Prevention ────────────────────────────────────────
  const fetchHealthPreventionStatus = async () => {
    try {
      if (!profile?.id || !profile?.dateOfBirth) return;
      const sex = (profile as { sex?: string })?.sex;

      const { data: configData } = await supabase.from('health_prevention_config').select('*').eq('client_id', profile.id).maybeSingle();
      if (configData && !configData.enable_cancer_screening && !configData.enable_vaccination_reminders) {
        setLatestHealthPreventionData({ status: 'stable', message: 'Health prevention features disabled', timestamp: new Date().toISOString(), dueCount: 0 });
        updateModuleStatus('health-prevention', 'stable', 'Features disabled');
        return;
      }

      const { data: screenings } = await supabase.from('cancer_screening_records').select('*').eq('client_id', profile.id).order('created_at', { ascending: false });
      const { data: vaccinations } = await supabase.from('vaccination_records').select('*').eq('client_id', profile.id).order('created_at', { ascending: false });
      const { data: assessments } = await supabase.from('annual_health_assessment_records').select('*').eq('client_id', profile.id).order('date_completed', { ascending: false });

      const typedScreenings: CancerScreeningRecord[] = (screenings || []).map((r: any) => ({
        id: r.id, clientId: r.client_id, screeningType: r.screening_type, status: r.status,
        dateCompleted: r.date_completed, location: r.location, outcomeKnown: r.outcome_known,
        deferredReason: r.deferred_reason, notes: r.notes, nextDueDate: r.next_due_date,
        createdAt: r.created_at, createdBy: r.created_by, editedAt: r.edited_at, editedBy: r.edited_by, editReason: r.edit_reason,
      })) as CancerScreeningRecord[];

      const typedVaccinations: VaccinationRecord[] = (vaccinations || []).map((r: any) => ({
        id: r.id, clientId: r.client_id, vaccinationType: r.vaccination_type, status: r.status,
        dateGiven: r.date_given, givenBy: r.given_by, vaccineBrand: r.vaccine_brand, notes: r.notes,
        nextDueDate: r.next_due_date, createdAt: r.created_at, createdBy: r.created_by,
        editedAt: r.edited_at, editedBy: r.edited_by, editReason: r.edit_reason,
      })) as VaccinationRecord[];

      const typedAssessments: HealthAssessmentRecord[] = (assessments || []).map((r: any) => ({
        id: r.id, clientId: r.client_id, dateCompleted: r.date_completed, completedBy: r.completed_by,
        location: r.location, notes: r.notes, nextDueDate: r.next_due_date, createdAt: r.created_at, createdBy: r.created_by,
      })) as HealthAssessmentRecord[];

      const summary = calculateHealthPreventionSummary({
        profile: { dateOfBirth: profile.dateOfBirth, sex },
        config: { enableCancerScreening: configData?.enable_cancer_screening ?? true, enableVaccinationReminders: configData?.enable_vaccination_reminders ?? true },
        screeningRecords: typedScreenings, vaccinationRecords: typedVaccinations, assessmentRecords: typedAssessments,
      });

      setLatestHealthPreventionData({ status: summary.status, message: summary.message, timestamp: summary.timestamp, dueCount: summary.dueCount });
      updateModuleStatus('health-prevention', summary.status, summary.lastEntry);
    } catch (err) { console.error('Error in fetchHealthPreventionStatus:', err); }
  };

  // ── Sleep ────────────────────────────────────────────────────
  const fetchSleepStatus = async () => {
    try {
      const { data: configData } = await supabase.from('sleep_config').select('*').maybeSingle();
      const { data: entries, error } = await supabase.from('sleep_entries').select('*').order('event_occurred_at', { ascending: false }).limit(50);
      if (error) { console.error('Error fetching sleep entries:', error); return; }

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
      setLatestSleepData({ status: moduleStatus, message: sleepStatusResult.message, timestamp: typedEntries[0]?.event_occurred_at || new Date().toISOString() });
      updateModuleStatus('sleep', moduleStatus, sleepStatusResult.lastEntry);
    } catch (err) { console.error('Error in fetchSleepStatus:', err); }
  };

  // ── Oral Health ──────────────────────────────────────────────
  const fetchOralHealthStatus = async () => {
    try {
      const { data: configData } = await supabase.from('oral_health_config').select('*').maybeSingle();
      const { data: assessmentData } = await supabase.from('oral_health_assessments').select('*').order('created_at', { ascending: false }).limit(10);
      const { data: taskLogData } = await supabase.from('oral_health_task_logs').select('*').order('log_date', { ascending: false }).limit(50);

      const typedAssessments = (assessmentData || []).map((d: any) => ({ ...d, mouth_annotations: (d.mouth_annotations || []) })) as OralHealthAssessment[];
      const typedLogs = (taskLogData || []) as OralHealthTaskLog[];

      const statusResult = calculateOralHealthStatus({
        assessments: typedAssessments, taskLogs: typedLogs,
        config: { assessment_frequency: configData?.assessment_frequency ?? 'weekly', enable_compliance_monitoring: configData?.enable_compliance_monitoring ?? false } as Partial<OralHealthConfig>,
      });

      const moduleStatus = statusResult.status === 'ideal' ? 'stable' : statusResult.status;
      setLatestOralHealthData({ status: moduleStatus, message: statusResult.message, timestamp: typedAssessments[0]?.created_at || new Date().toISOString() });
      updateModuleStatus('oral-health', moduleStatus, statusResult.lastEntry);
    } catch (err) { console.error('Error in fetchOralHealthStatus:', err); }
  };

  // ── Health Monitoring (with altered criteria) ────────────────
  const fetchHealthMonitoringStatus = async () => {
    try {
      const { data: entries, error } = await supabase
        .from('vital_sign_entries')
        .select('*')
        .order('event_occurred_at', { ascending: false })
        .limit(50);

      if (error) { console.error('Error fetching vital sign entries:', error); return; }

      const { data: alertsData } = await supabase
        .from('vital_sign_alerts')
        .select('*')
        .is('resolved_at', null)
        .order('created_at', { ascending: false });

      // Fetch altered criteria for recalculation
      const { data: alteredCriteriaData } = await supabase
        .from('vital_sign_altered_criteria')
        .select('*')
        .eq('is_active', true)
        .eq('confirmed_by_medical_professional', true);

      // Fetch config for schedule/frequency overdue checks
      const { data: configData } = await supabase
        .from('vital_sign_config')
        .select('*')
        .is('client_id', null)
        .maybeSingle();

      const typedEntries = (entries || []) as unknown as VitalSignEntry[];
      const typedAlerts = (alertsData || []) as unknown as VitalSignAlert[];

      // Build criteria map from altered criteria
      const criteriaMap: Record<VitalType, AlteredCriteria | null> = {
        temperature: null, bp_systolic: null, bp_diastolic: null,
        oxygen: null, heart_rate: null, respiratory: null,
      };
      if (alteredCriteriaData) {
        for (const ac of alteredCriteriaData) {
          const vt = ac.vital_type as VitalType;
          if (vt in criteriaMap) {
            criteriaMap[vt] = ac as unknown as AlteredCriteria;
          }
        }
      }

      // ── Guard: if config missing, warn and surface Amber ──────────────────
      if (!configData) {
        console.error('[ProfileContext] vital_sign_config not found — health monitoring overdue check skipped. Config must be configured via Settings.');
        updateModuleStatus('health-monitoring', 'monitor', 'Health monitoring config missing — schedule cannot be evaluated');
        setLatestHealthMonitoringData({ status: 'monitor', message: 'Health monitoring config missing — schedule cannot be evaluated', timestamp: new Date().toISOString() });
        return;
      }

      // Recalculate ALL entry statuses using altered criteria
      const recalculatedEntries = typedEntries.map(entry => {
        const recalculated = calculateEntryStatuses(entry, criteriaMap);
        return { ...entry, ...recalculated };
      });

      // Use the single authoritative function — config is always required
      const computed = computeHealthMonitoringStatus({
        config: configData as VitalSignConfig,
        entries: recalculatedEntries,
        alerts: typedAlerts,
        alteredCriteriaMap: criteriaMap,
      });

      const moduleStatus = computed.moduleStatus === 'ideal' ? 'stable'
        : computed.moduleStatus === 'amber' ? 'monitor' : 'action';

      const timeAgo = typedEntries[0]
        ? formatDistanceToNow(new Date(typedEntries[0].event_occurred_at), { addSuffix: true })
        : null;
      const displayMessage = timeAgo
        ? `${computed.message} • ${timeAgo}`
        : computed.message;

      setLatestHealthMonitoringData({
        status: moduleStatus,
        message: computed.message,
        timestamp: typedEntries[0]?.event_occurred_at || new Date().toISOString(),
      });
      updateModuleStatus('health-monitoring', moduleStatus, displayMessage);
    } catch (err) { console.error('Error in fetchHealthMonitoringStatus:', err); }
  };


  // ── Epilepsy & Seizures ──────────────────────────────────────
  const fetchEpilepsyStatus = async () => {
    try {
      const { data: configData } = await supabase.from('epilepsy_config').select('*').limit(1).maybeSingle();
      const { data: events, error } = await supabase
        .from('seizure_events')
        .select('*')
        .order('event_occurred_at', { ascending: false })
        .limit(100);
      if (error) { console.error('Error fetching seizure events:', error); return; }

      const { data: alertsData } = await supabase
        .from('epilepsy_alerts')
        .select('*')
        .is('resolved_at', null)
        .order('created_at', { ascending: false });

      const typedEvents = (events || []) as unknown as SeizureEvent[];
      const typedAlerts = (alertsData || []) as unknown as EpilepsyAlert[];

      const statusResult = calculateEpilepsyStatus({
        events: typedEvents,
        config: (configData as unknown as Partial<EpilepsyConfig>) || null,
        alerts: typedAlerts,
      });

      const moduleStatus = statusResult.status === 'ideal' ? 'stable' : statusResult.status;
      setLatestEpilepsyData({ status: moduleStatus, message: statusResult.message, timestamp: statusResult.lastSeizureDate || new Date().toISOString() });

      const timeAgo = typedEvents[0] ? formatDistanceToNow(new Date(typedEvents[0].event_occurred_at), { addSuffix: true }) : 'Never';
      updateModuleStatus('epilepsy', moduleStatus, typedEvents.length > 0 ? `${statusResult.message} • ${timeAgo}` : 'No seizures recorded');
    } catch (err) { console.error('Error in fetchEpilepsyStatus:', err); }
  };

  // ── Continence Management ────────────────────────────────────
  const fetchContinenceStatus = async () => {
    try {
      const { data: configData } = await supabase.from('continence_config').select('*').limit(1).maybeSingle();
      
      // Latest pad change
      const { data: padChanges } = await supabase
        .from('continence_pad_changes')
        .select('*')
        .order('event_occurred_at', { ascending: false })
        .limit(10);

      // Recent skin checks
      const { data: skinChecks } = await supabase
        .from('continence_skin_checks')
        .select('*')
        .order('event_occurred_at', { ascending: false })
        .limit(10);

      // Latest UTI test
      const { data: utiTests } = await supabase
        .from('continence_uti_tests')
        .select('*')
        .order('test_date', { ascending: false })
        .limit(1);

      // Latest consumables check
      const { data: consumables } = await supabase
        .from('continence_consumables_checks')
        .select('*')
        .order('check_date', { ascending: false })
        .limit(1);

      const now = new Date();
      const lastPad = padChanges?.[0];
      const lastSkin = skinChecks?.[0];
      const lastUti = utiTests?.[0];
      const lastConsumable = consumables?.[0];

      // Determine status using same logic as useContinenceStatus
      let status: 'stable' | 'monitor' | 'action' = 'stable';
      let message = 'All continence indicators within normal range.';

      // Red conditions
      const hasPositiveUTI = lastUti?.test_result === 'positive';
      const hasSkinIssue = lastSkin && ['broken_skin', 'fungal_signs'].includes(lastSkin.skin_condition) &&
        differenceInHours(now, parseISO(lastSkin.event_occurred_at)) <= 48;

      // Overdue check
      let isOverdue = false;
      let overdueMinutes = 0;
      if (configData && lastPad) {
        const lastChangeTime = parseISO(lastPad.event_occurred_at);
        if (configData.schedule_type === 'hourly' && configData.interval_hours) {
          const nextChange = new Date(lastChangeTime.getTime() + configData.interval_hours * 60 * 60 * 1000);
          const diffMs = nextChange.getTime() - now.getTime();
          const mins = Math.round(diffMs / 60000);
          isOverdue = mins < 0;
          overdueMinutes = isOverdue ? Math.abs(mins) : 0;
        }
      }

      const hasLowStock = lastConsumable ? [
        lastConsumable.continence_pads_level,
        lastConsumable.barrier_creams_level,
        lastConsumable.gloves_wipes_level,
        lastConsumable.cleansing_products_level,
        lastConsumable.disposable_sheets_level,
      ].includes('low') : false;

      const skinCheckOverdue = lastSkin ? differenceInHours(now, parseISO(lastSkin.event_occurred_at)) > 48 : false;

      if (hasPositiveUTI || hasSkinIssue || overdueMinutes > 120) {
        status = 'action';
        if (hasPositiveUTI) message = 'Positive UTI test – escalation required.';
        else if (hasSkinIssue) message = 'Skin integrity concern – immediate review needed.';
        else message = `Pad change critically overdue (${Math.round(overdueMinutes / 60)}h).`;
      } else if (skinCheckOverdue || hasLowStock || isOverdue) {
        status = 'monitor';
        if (skinCheckOverdue) message = 'Skin check overdue – review required.';
        else if (hasLowStock) message = 'Continence supplies running low.';
        else message = 'Pad change overdue – attend when possible.';
      }

      setLatestContinenceData({ status, message, timestamp: lastPad?.event_occurred_at || new Date().toISOString() });
      const timeAgo = lastPad ? formatDistanceToNow(new Date(lastPad.event_occurred_at), { addSuffix: true }) : 'Never';
      updateModuleStatus('continence', status, lastPad ? `Last change ${timeAgo}` : 'Not yet logged');
    } catch (err) { console.error('Error in fetchContinenceStatus:', err); }
  };

  // ── Urinary Catheter ─────────────────────────────────────────
  const fetchCatheterStatus = async () => {
    try {
      const { data: configData } = await supabase.from('catheter_config').select('*').limit(1).maybeSingle();

      // Fetch care plan as source of truth
      const { data: planData } = await supabase
        .from('catheter_care_plans')
        .select('change_interval, flush_prescribed, flush_frequency, flush_custom_interval')
        .eq('status', 'published')
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle();

      const { data: changes } = await supabase
        .from('catheter_change_logs')
        .select('*')
        .order('event_occurred_at', { ascending: false })
        .limit(10);

      const { data: flushLogs } = await supabase
        .from('catheter_flush_logs')
        .select('*')
        .order('event_occurred_at', { ascending: false })
        .limit(5);

      const { data: stomaChecks } = await supabase
        .from('catheter_stoma_checks')
        .select('*')
        .order('event_occurred_at', { ascending: false })
        .limit(5);

      const { data: alerts } = await supabase
        .from('catheter_alerts')
        .select('*')
        .is('resolved_at', null);

      const now = new Date();
      const lastChange = changes?.[0];
      const lastFlush = flushLogs?.[0];
      const lastStoma = stomaChecks?.[0];

      // Parse change interval from care plan
      let changeFrequencyDays = configData?.change_frequency_days || 0;
      if (planData?.change_interval) {
        const match = planData.change_interval.toLowerCase().match(/(\d+)\s*(week|wk|day|month)/i);
        if (match) {
          const num = parseInt(match[1], 10);
          const unit = match[2].toLowerCase();
          if (unit.startsWith('week') || unit === 'wk') changeFrequencyDays = num * 7;
          else if (unit.startsWith('day')) changeFrequencyDays = num;
          else if (unit.startsWith('month')) changeFrequencyDays = num * 30;
        }
      }

      let isChangeOverdue = false;
      let daysUntilChange: number | null = null;
      if (lastChange && changeFrequencyDays > 0) {
        const nextChange = addDays(parseISO(lastChange.event_occurred_at), changeFrequencyDays);
        daysUntilChange = differenceInDays(nextChange, now);
        isChangeOverdue = daysUntilChange < 0;
      }

      // Parse flush frequency — must match module logic (parseFlushFrequencyToHours)
      let flushFrequencyHours: number | null = null;
      if (planData?.flush_prescribed && planData.flush_frequency) {
        const freq = planData.flush_frequency.toLowerCase();
        if (freq === 'daily') {
          flushFrequencyHours = 24;
        } else if (freq === 'twice_daily') {
          flushFrequencyHours = 12;
        } else if (freq.includes('custom') && planData.flush_custom_interval) {
          const ci = planData.flush_custom_interval.toLowerCase().trim();
          if (ci === 'weekly') flushFrequencyHours = 7 * 24;
          else if (ci === 'daily') flushFrequencyHours = 24;
          else if (ci === 'fortnightly') flushFrequencyHours = 14 * 24;
          else {
            const match = ci.match(/(\d+)\s*(day|hour|hr|week|wk)/i);
            if (match) {
              const num = parseInt(match[1], 10);
              const unit = match[2].toLowerCase();
              if (unit.startsWith('day')) flushFrequencyHours = num * 24;
              else if (unit.startsWith('hour') || unit === 'hr') flushFrequencyHours = num;
              else if (unit.startsWith('week') || unit === 'wk') flushFrequencyHours = num * 7 * 24;
            }
          }
        }
        // 'prn' or 'as_needed' alone → no scheduled frequency, leave null
      }
      if (!flushFrequencyHours && configData?.flush_frequency_hours) {
        flushFrequencyHours = configData.flush_frequency_hours;
      }

      let isFlushOverdue = false;
      if (flushFrequencyHours && lastFlush) {
        const nextFlush = addHours(parseISO(lastFlush.event_occurred_at), flushFrequencyHours);
        isFlushOverdue = differenceInDays(nextFlush, now) < 0;
      }

      // Stoma concern — use dynamic calculation (same as tile) to account for overdue
      const hoursSinceStoma = lastStoma
        ? differenceInHours(now, parseISO(lastStoma.event_occurred_at))
        : null;
      const stomaFindings: StomaFinding[] = (lastStoma?.findings as StomaFinding[]) || [];
      const stomaPainLevel: StomaPainLevel = (lastStoma?.pain_level as StomaPainLevel) || 'none';
      const dynamicStomaStatus = lastStoma
        ? calculateStomaStatusLevel(stomaFindings, stomaPainLevel, hoursSinceStoma)
        : 'green';

      let status: 'stable' | 'monitor' | 'action' = 'stable';
      let message = 'Catheter management on track.';

      // RED hierarchy first
      if (isChangeOverdue || isFlushOverdue || dynamicStomaStatus === 'red') {
        status = 'action';
        if (isChangeOverdue) message = `Catheter change overdue by ${Math.abs(daysUntilChange!)} days.`;
        else if (isFlushOverdue) message = 'Catheter flush overdue – action required.';
        else message = 'Stoma site concern – escalate to clinician.';
      // AMBER hierarchy second
      } else if ((daysUntilChange !== null && daysUntilChange <= 3) || dynamicStomaStatus === 'amber') {
        status = 'monitor';
        if (dynamicStomaStatus === 'amber') message = 'Stoma site requires monitoring – recheck within 24 hours.';
        else if (daysUntilChange !== null && daysUntilChange <= 3) message = `Catheter change due in ${daysUntilChange} day(s).`;
      }

      setLatestCatheterData({ status, message, timestamp: lastChange?.event_occurred_at || new Date().toISOString() });
      const timeAgo = lastChange ? formatDistanceToNow(new Date(lastChange.event_occurred_at), { addSuffix: true }) : 'Never';
      updateModuleStatus('catheter', status, lastChange ? `Last change ${timeAgo}` : 'Not yet logged');
    } catch (err) { console.error('Error in fetchCatheterStatus:', err); }
  };

  // ── Pressure Area Prevention ─────────────────────────────────
  const fetchPressureAreaStatus = async () => {
    try {
      const { data: configData } = await supabase.from('pressure_area_config').select('*').limit(1).maybeSingle();
      const { data: events } = await supabase.from('pressure_relief_events').select('*').order('event_occurred_at', { ascending: false }).limit(50);
      const { data: skinChecks } = await supabase
        .from('skin_check_sessions')
        .select('*, skin_finding_markers(*)')
        .order('event_occurred_at', { ascending: false })
        .limit(200);

      // Fetch published plan
      const { data: planData } = await supabase
        .from('pressure_relief_plans')
        .select('*')
        .eq('status', 'published')
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle();

      const typedEvents = (events || []) as unknown as PressureReliefEvent[];
      const typedSkinChecks = (skinChecks || []) as unknown as (SkinCheckSession & { skin_finding_markers?: SkinFindingMarker[] })[];

      const statusResult = calculatePressureAreaStatus({
        plan: planData as unknown as PressureReliefPlan | null,
        events: typedEvents,
        skinChecks: typedSkinChecks,
        config: configData ? {
          skin_check_frequency_days: configData.skin_check_frequency_days ?? 7,
          enable_compliance_scoring: configData.enable_compliance_scoring ?? false,
          skin_checks_per_day: (configData as any).skin_checks_per_day ?? 0,
          skin_check_times: (configData as any).skin_check_times ?? [],
        } : null,
        planAcknowledged: true,
      });

      const moduleStatus = statusResult.status === 'ideal' ? 'stable' : statusResult.status;
      setLatestPressureAreaData({ status: moduleStatus, message: statusResult.message, timestamp: typedEvents[0]?.event_occurred_at || new Date().toISOString() });
      updateModuleStatus('pressure-area', moduleStatus, statusResult.lastEntry || 'Not yet logged');
    } catch (err) { console.error('Error in fetchPressureAreaStatus:', err); }
  };

  // ── IDDSI & Safe Swallowing ──────────────────────────────────
  const fetchIddsiStatus = async () => {
    try {
      if (!profile?.id || profile.id === '1') return;

      // Fetch config for observation scheduling
      const { data: iddsiConfig } = await supabase
        .from('iddsi_config')
        .select('enable_observations, observation_frequency')
        .eq('client_id', profile.id)
        .maybeSingle();

      const { data: observations } = await supabase
        .from('mealtime_observations')
        .select('severity, event_occurred_at')
        .eq('client_id', profile.id)
        .order('event_occurred_at', { ascending: false })
        .limit(10);

      const latestObs = observations?.[0];

      // Check for late/missed observations when scheduling is enabled
      const observationsEnabled = (iddsiConfig as any)?.enable_observations ?? false;
      const frequency = (iddsiConfig as any)?.observation_frequency ?? 'daily';

      if (observationsEnabled && latestObs) {
        const lastObsTime = new Date(latestObs.event_occurred_at);
        const now = new Date();
        const hoursSinceObs = differenceInHours(now, lastObsTime);
        const daysSinceObs = differenceInDays(now, lastObsTime);

        // Check if observation is late based on frequency
        let isLate = false;
        if (frequency === 'daily' && hoursSinceObs >= 24) isLate = true;
        else if (frequency === 'weekly' && daysSinceObs >= 7) isLate = true;
        else if (frequency === 'monthly' && daysSinceObs >= 30) isLate = true;

        if (isLate) {
          const timeAgo = formatDistanceToNow(lastObsTime, { addSuffix: true });
          setLatestIddsiData({ status: 'monitor', message: `Mealtime observation overdue – last observed ${timeAgo}.`, timestamp: latestObs.event_occurred_at });
          updateModuleStatus('iddsi', 'monitor', `Observation overdue – last ${timeAgo}`);
          return;
        }
      } else if (observationsEnabled && !latestObs) {
        updateModuleStatus('iddsi', 'monitor', 'Observation overdue – not yet logged');
        setLatestIddsiData({ status: 'monitor', message: 'Mealtime observation overdue – not yet logged.', timestamp: new Date().toISOString() });
        return;
      }

      if (!latestObs) {
        updateModuleStatus('iddsi', 'stable', 'Not yet logged');
        return;
      }

      // Severity from observation: green / amber / red
      const severity = latestObs.severity?.toLowerCase();
      let status: 'stable' | 'monitor' | 'action' = 'stable';
      let message = 'Safe swallowing within normal range.';

      if (severity === 'red') {
        status = 'action';
        message = 'Swallowing concern detected – escalate to Speech Pathologist.';
      } else if (severity === 'amber') {
        status = 'monitor';
        message = 'Mild swallowing signs observed – monitor closely.';
      }

      // Multi-observation escalation: 2+ consecutive amber → red
      if (status === 'monitor' && observations && observations.length >= 2) {
        const recentTwo = observations.slice(0, 2);
        if (recentTwo.every(o => o.severity?.toLowerCase() === 'amber')) {
          status = 'action';
          message = 'Consecutive amber observations – escalate to Speech Pathologist.';
        }
      }

      setLatestIddsiData({ status, message, timestamp: latestObs.event_occurred_at });
      const timeAgo = formatDistanceToNow(new Date(latestObs.event_occurred_at), { addSuffix: true });
      updateModuleStatus('iddsi', status, `Last observation ${timeAgo}`);
    } catch (err) { console.error('Error in fetchIddsiStatus:', err); }
  };

  // ── Enteral Nutrition ────────────────────────────────────────
  const fetchEnteralStatus = async () => {
    try {
      const { data: configData } = await supabase.from('enteral_config').select('*').limit(1).maybeSingle();
      const { data: feedLogs } = await supabase.from('enteral_feed_logs').select('*').order('event_occurred_at', { ascending: false }).limit(100);
      const { data: flushLogs } = await supabase.from('enteral_flush_logs').select('*').order('event_occurred_at', { ascending: false }).limit(100);
      const { data: stomaChecks } = await supabase.from('enteral_stoma_checks').select('*').order('event_occurred_at', { ascending: false }).limit(10);
      const { data: medLogs } = await supabase.from('enteral_medication_logs').select('*').order('event_occurred_at', { ascending: false }).limit(50);

      const result = calculateEnteralStatus({
        config: configData as any,
        feedLogs: (feedLogs || []) as any,
        flushLogs: (flushLogs || []) as any,
        stomaChecks: (stomaChecks || []) as any,
        medLogs: (medLogs || []) as any,
      });

      setLatestEnteralData({ status: result.status, message: result.message, timestamp: feedLogs?.[0]?.event_occurred_at || new Date().toISOString() });
      updateModuleStatus('enteral', result.status, result.lastEntry);
    } catch (err) { console.error('Error in fetchEnteralStatus:', err); }
  };

  // ══════════════════════════════════════════════════════════════
  // LIFECYCLE: Fetch on mount + realtime subscriptions
  // ══════════════════════════════════════════════════════════════

  useEffect(() => {
    fetchProfileFromDb();
    fetchLatestPainAssessment();
    fetchBowelCareStatus();
    fetchWeightStatus();
    fetchFluidStatus();
    fetchHealthPreventionStatus();
    fetchSleepStatus();
    fetchOralHealthStatus();
    fetchHealthMonitoringStatus();
    fetchEpilepsyStatus();
    fetchContinenceStatus();
    fetchCatheterStatus();
    fetchPressureAreaStatus();
    fetchIddsiStatus();
    fetchEnteralStatus();

    // ── Realtime Subscriptions ────────────────────────────────
    const painChannel = supabase.channel('pain-alerts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'abbey_pain_assessments' }, () => fetchLatestPainAssessment())
      .subscribe();

    const bowelChannel = supabase.channel('bowel-alerts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bowel_log_entries' }, () => fetchBowelCareStatus())
      .subscribe();

    const weightChannel = supabase.channel('weight-alerts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'weight_entries' }, () => fetchWeightStatus())
      .subscribe();

    const fluidChannel = supabase.channel('fluid-alerts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fluid_intake_entries' }, () => fetchFluidStatus())
      .subscribe();

    const profileChannel = supabase.channel('profile-updates')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'clients' }, () => fetchProfileFromDb())
      .subscribe();

    const screeningChannel = supabase.channel('screening-alerts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cancer_screening_records' }, () => fetchHealthPreventionStatus())
      .subscribe();

    const vaccinationChannel = supabase.channel('vaccination-alerts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vaccination_records' }, () => fetchHealthPreventionStatus())
      .subscribe();

    const sleepChannel = supabase.channel('sleep-alerts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sleep_entries' }, () => fetchSleepStatus())
      .subscribe();

    const oralHealthChannel = supabase.channel('oral-health-alerts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'oral_health_assessments' }, () => fetchOralHealthStatus())
      .subscribe();

    const vitalSignChannel = supabase.channel('vital-sign-alerts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vital_sign_entries' }, () => fetchHealthMonitoringStatus())
      .subscribe();

    // New module subscriptions
    const seizureChannel = supabase.channel('seizure-alerts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'seizure_events' }, () => fetchEpilepsyStatus())
      .subscribe();

    const padChannel = supabase.channel('pad-alerts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'continence_pad_changes' }, () => fetchContinenceStatus())
      .subscribe();

    const catheterChangeChannel = supabase.channel('catheter-change-alerts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'catheter_change_logs' }, () => fetchCatheterStatus())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'catheter_stoma_checks' }, () => fetchCatheterStatus())
      .subscribe();

    const pressureChannel = supabase.channel('pressure-alerts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pressure_relief_events' }, () => fetchPressureAreaStatus())
      .subscribe();

    const skinCheckChannel = supabase.channel('skin-check-alerts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'skin_check_sessions' }, () => fetchPressureAreaStatus())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'skin_finding_markers' }, () => fetchPressureAreaStatus())
      .subscribe();

    const mealtimeChannel = supabase.channel('mealtime-alerts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mealtime_observations' }, () => fetchIddsiStatus())
      .subscribe();

    const enteralChannel = supabase.channel('enteral-alerts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'enteral_feed_logs' }, () => fetchEnteralStatus())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'enteral_stoma_checks' }, () => fetchEnteralStatus())
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
      supabase.removeChannel(vitalSignChannel);
      supabase.removeChannel(seizureChannel);
      supabase.removeChannel(padChannel);
      supabase.removeChannel(catheterChangeChannel);
      supabase.removeChannel(pressureChannel);
      supabase.removeChannel(skinCheckChannel);
      supabase.removeChannel(mealtimeChannel);
      supabase.removeChannel(enteralChannel);
    };
  }, []);

  // Re-fetch profile-dependent statuses when profile loads from DB
  useEffect(() => {
    if (profile?.id && profile.id !== '1') {
      fetchHealthPreventionStatus();
      fetchBowelCareStatus();
      fetchLatestPainAssessment();
      fetchWeightStatus();
      fetchFluidStatus();
      fetchSleepStatus();
      fetchOralHealthStatus();
      fetchHealthMonitoringStatus();
      fetchEpilepsyStatus();
      fetchContinenceStatus();
      fetchCatheterStatus();
      fetchPressureAreaStatus();
      fetchIddsiStatus();
      fetchEnteralStatus();
    }
  }, [profile?.id, profile?.dateOfBirth]);

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

  // ── Build alert map from all module data ────────────────────
  const alertMap: ModuleAlertMap = {
    'constipation': latestBowelData || undefined,
    'weight': latestWeightData || undefined,
    'fluid-balance': latestFluidData || undefined,
    'health-prevention': latestHealthPreventionData || undefined,
    'sleep': latestSleepData || undefined,
    'oral-health': latestOralHealthData || undefined,
    'health-monitoring': latestHealthMonitoringData || undefined,
    'epilepsy': latestEpilepsyData || undefined,
    'continence': latestContinenceData || undefined,
    'catheter': latestCatheterData || undefined,
    'pressure-area': latestPressureAreaData || undefined,
    'iddsi': latestIddsiData || undefined,
    'enteral': latestEnteralData || undefined,
  };

  // Calculate global alert state dynamically from module statuses
  // When monitoring is paused, suppress all alerts
  const activeAlerts = isMonitoringPaused ? [] : generateAlertsFromModules(
    activeEnabledModules, 
    latestPainData || undefined,
    alertMap,
  );

  // Sort alerts: RED first, then AMBER, within same severity by most recent timestamp
  activeAlerts.sort((a, b) => {
    if (a.status !== b.status) return a.status === 'red' ? -1 : 1;
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

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
        refreshHealthMonitoringStatus: fetchHealthMonitoringStatus,
        refreshEpilepsyStatus: fetchEpilepsyStatus,
        refreshContinenceStatus: fetchContinenceStatus,
        refreshCatheterStatus: fetchCatheterStatus,
        refreshPressureAreaStatus: fetchPressureAreaStatus,
        refreshIddsiStatus: fetchIddsiStatus,
        refreshEnteralStatus: fetchEnteralStatus,
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
