/**
 * HealthPreventionDashboard - Main dashboard for Health Prevention module
 * Follows IDEAL module patterns with Tracking, Trends, and Settings tabs
 */

import { ModuleHeader, ModuleDisclaimer, ModuleTabs } from '@/components/module';
import { useHealthPrevention } from '@/hooks/useHealthPrevention';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { useProfile } from '@/contexts/ProfileContext';
import { MonitoringPausedBanner } from '@/components/monitoring';
import { HealthPreventionStatusCard } from './HealthPreventionStatusCard';
import { ScreeningSection } from './ScreeningSection';
import { VaccinationSection } from './VaccinationSection';
import { HealthAssessmentSection } from './HealthAssessmentSection';
import { HealthPreventionConfigSettings } from './HealthPreventionConfigSettings';
import { HealthPreventionHistory } from './HealthPreventionHistory';
import { HealthPreventionExportReports } from './HealthPreventionExportReports';
import { HEALTH_PREVENTION_DISCLAIMER } from '@/types/healthPrevention';
import { Loader2, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function HealthPreventionDashboard() {
  const { isAdmin } = useRoleAccess();
  const { isMonitoringPaused, monitoringStatus } = useProfile();
  const {
    config,
    isLoading,
    age,
    sex,
    getModuleStatus,
    getDueCount,
    getEligibleScreenings,
    getVaccinationsWithStatus,
    getAssessmentStatus,
    getLatestAssessment,
    logAssessment,
  } = useHealthPrevention();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const moduleStatus = getModuleStatus();
  const dueCount = getDueCount();

  const trackingContent = (
    <div className="space-y-6">
      {/* Monitoring Paused Banner */}
      {isMonitoringPaused && monitoringStatus && (
        <MonitoringPausedBanner
          pauseReason={monitoringStatus.pauseReason}
          pauseStartDatetime={monitoringStatus.pauseStartDatetime}
          pauseEndDatetime={monitoringStatus.pauseEndDatetime}
        />
      )}

      {/* Status Card */}
      <HealthPreventionStatusCard
        status={moduleStatus}
        dueCount={dueCount}
        reminderText={config?.reminderText || 'Discuss at next GP visit'}
      />

      {/* Disclaimer - moved to top, under status */}
      <ModuleDisclaimer message={HEALTH_PREVENTION_DISCLAIMER} />

      {/* Cancer Screening Section */}
      {config?.enableCancerScreening && (
        <ScreeningSection
          screenings={getEligibleScreenings()}
          age={age}
          sex={sex}
          gpReminderText={config?.reminderText || 'Discuss at next GP visit'}
          lungSmokingHistory={config?.lungScreeningSmokingHistory}
        />
      )}

      {/* Vaccination Section */}
      {config?.enableVaccinationReminders && (
        <VaccinationSection
          vaccinations={getVaccinationsWithStatus()}
          age={age}
        />
      )}

      {/* Annual Comprehensive Health Assessment Section */}
      <HealthAssessmentSection
        latestRecord={getLatestAssessment()}
        displayStatus={getAssessmentStatus()}
        gpReminderText={config?.reminderText || 'Discuss at next GP visit'}
        onLogAssessment={logAssessment}
      />

      {/* References & Guidelines */}
      <Card className="bg-muted/30">
        <CardContent className="pt-4 pb-4 space-y-3">
          <h4 className="text-sm font-medium">References & Guidelines</h4>
          <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
            <li>National Bowel Cancer Screening Program (ages 50–74, biennial)</li>
            <li>National Cervical Screening Program (ages 25–74, every 5 years)</li>
            <li>BreastScreen Australia (women 50–74, biennial)</li>
            <li>Australian Government National Immunisation Program Schedule</li>
          </ul>
          <p className="text-xs text-muted-foreground italic">
            Source: Department of Health and Aged Care
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <a
              href="https://immunisationhandbook.health.gov.au/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline inline-flex items-center gap-1"
            >
              Immunisation Handbook
              <ExternalLink className="h-3 w-3" />
            </a>
            <a
              href="https://www.health.gov.au/topics/cancer/screening"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline inline-flex items-center gap-1"
            >
              Cancer Screening Programs
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const trendsContent = (
    <HealthPreventionHistory />
  );

  const settingsContent = (
    <HealthPreventionConfigSettings />
  );

  const exportContent = (
    <HealthPreventionExportReports />
  );

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Health Prevention"
        subtitle="Screening & Immunisation"
      />

      <ModuleTabs
        trackingContent={trackingContent}
        trendsContent={trendsContent}
        settingsContent={settingsContent}
        exportContent={exportContent}
      />

    </div>
  );
}
