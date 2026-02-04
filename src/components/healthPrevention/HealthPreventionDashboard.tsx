/**
 * HealthPreventionDashboard - Main dashboard for Health Prevention module
 * Follows IDEAL module patterns with Tracking, Trends, and Settings tabs
 */

import { ModuleHeader, ModuleDisclaimer, ModuleTabs, ModuleCitation } from '@/components/module';
import { useHealthPrevention } from '@/hooks/useHealthPrevention';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { HealthPreventionStatusCard } from './HealthPreventionStatusCard';
import { ScreeningSection } from './ScreeningSection';
import { VaccinationSection } from './VaccinationSection';
import { HealthPreventionConfigSettings } from './HealthPreventionConfigSettings';
import { HealthPreventionHistory } from './HealthPreventionHistory';
import { HealthPreventionExportReports } from './HealthPreventionExportReports';
import { HEALTH_PREVENTION_DISCLAIMER } from '@/types/healthPrevention';
import { Loader2, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function HealthPreventionDashboard() {
  const { isAdmin } = useRoleAccess();
  const {
    config,
    isLoading,
    age,
    sex,
    getModuleStatus,
    getDueCount,
    getEligibleScreenings,
    getVaccinationsWithStatus,
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
      {/* Status Card */}
      <HealthPreventionStatusCard
        status={moduleStatus}
        dueCount={dueCount}
        reminderText={config?.reminderText || 'Discuss at next GP visit'}
      />

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

      {/* Disclaimer */}
      <ModuleDisclaimer message={HEALTH_PREVENTION_DISCLAIMER} />

      {/* References */}
      <Card className="bg-muted/30">
        <CardContent className="pt-4 pb-4">
          <h4 className="text-sm font-medium mb-2">References</h4>
          <p className="text-xs text-muted-foreground mb-2">
            Screening recommendations based on Australian national programs: National Bowel Cancer 
            Screening Program (ages 45–74, biennial), National Cervical Screening Program 
            (ages 25–74, every 5 years), and BreastScreen Australia (women 50–74, biennial).
          </p>
          <p className="text-xs text-muted-foreground mb-3">
            Vaccination guidance based on the Australian Government National Immunisation Program 
            Schedule and the Australian Immunisation Handbook.
          </p>
          <a
            href="https://immunisationhandbook.health.gov.au/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline inline-flex items-center gap-1"
          >
            health.gov.au Immunisation Handbook
            <ExternalLink className="h-3 w-3" />
          </a>
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

      <ModuleCitation
        title="Australian Health Guidelines"
        source="Department of Health and Aged Care"
        citation="Based on National Immunisation Program Schedule and cancer screening guidelines"
      />
    </div>
  );
}
