/**
 * Health Monitoring Dashboard - Main tracking and monitoring view
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HealthMonitoringStatusCard } from './HealthMonitoringStatusCard';
import { VitalEntryForm } from './VitalEntryForm';
import { HealthMonitoringHistory } from './HealthMonitoringHistory';
import { HealthMonitoringTrends } from './HealthMonitoringTrends';
import { HealthMonitoringConfigSettings } from './HealthMonitoringConfigSettings';
import { EmergencyAlertDialog } from './EmergencyAlertDialog';
import { useHealthMonitoringStatus, useVitalSignAlerts } from '@/hooks/useHealthMonitoring';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { RoleTabsTrigger } from '@/components/ui/role-tabs-trigger';
import {
  Plus,
  Settings,
  BarChart3,
  Clock,
  AlertCircle,
  Activity,
  Heart,
  Thermometer,
  FileDown,
} from 'lucide-react';
import type { VitalSignAlert } from '@/types/healthMonitoring';

interface HealthMonitoringDashboardProps {
  clientId?: string;
}

const CLINICAL_WARNINGS = [
  'Vital signs outside normal ranges',
  'Changes in usual patterns',
  'Signs of pain or distress',
  'Difficulty breathing',
  'Sudden changes in consciousness',
  'You have concerns about the person\'s wellbeing',
];

const MONITORING_TIPS = [
  'Take readings at consistent times each day',
  'Ensure the person is rested before taking measurements',
  'Record symptoms alongside vital signs',
  'Compare trends over time, not just single readings',
  'Report any concerns to the healthcare team',
];

export function HealthMonitoringDashboard({ clientId }: HealthMonitoringDashboardProps) {
  const [showLogForm, setShowLogForm] = useState(false);
  const [activeEmergencyAlert, setActiveEmergencyAlert] = useState<VitalSignAlert | null>(null);
  const statusInfo = useHealthMonitoringStatus(clientId);
  const { alerts } = useVitalSignAlerts(clientId);
  const { isAdmin } = useRoleAccess();

  // Check for red alerts and show emergency dialog
  useEffect(() => {
    const redAlert = alerts.find(a => a.severity === 'red' && !a.acknowledged_at);
    if (redAlert && !activeEmergencyAlert) {
      setActiveEmergencyAlert(redAlert);
    }
  }, [alerts, activeEmergencyAlert]);

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            Health Monitoring
          </h2>
          <p className="text-muted-foreground">
            Track and monitor vital signs
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowLogForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Record Vital Signs
          </Button>
        </div>
      </div>

      {/* Mandatory Disclaimer */}
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="py-4">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              <strong>Important:</strong> This tool supports monitoring only. It does not replace 
              clinical assessment. Follow the person's health plan and seek medical advice if concerned.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Status Card */}
      <HealthMonitoringStatusCard clientId={clientId} />

      {/* Tabs */}
      <Tabs defaultValue="tracking" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-flex">
          <TabsTrigger value="tracking" className="gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Tracking</span>
          </TabsTrigger>
          <TabsTrigger value="trends" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Trends</span>
          </TabsTrigger>
          <RoleTabsTrigger
            value="settings"
            requiresAdmin
            icon={<Settings className="h-4 w-4" />}
            label="Settings"
          />
        </TabsList>

        <TabsContent value="tracking" className="space-y-4">
          <HealthMonitoringHistory clientId={clientId} />
        </TabsContent>

        <TabsContent value="trends">
          <HealthMonitoringTrends clientId={clientId} />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="settings">
            <HealthMonitoringConfigSettings clientId={clientId} />
          </TabsContent>
        )}
      </Tabs>

      {/* Symptoms to Be Aware Of */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            When to Seek Medical Advice
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid sm:grid-cols-2 gap-2">
            {CLINICAL_WARNINGS.map((warning, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-red-500 mt-1">•</span>
                <span className="text-sm text-muted-foreground">{warning}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Monitoring Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Heart className="h-5 w-5 text-green-500" />
            Good Monitoring Practice
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {MONITORING_TIPS.map((tip, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span className="text-sm text-muted-foreground">{tip}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Citation */}
      <div className="text-xs text-muted-foreground border-t pt-4 space-y-1">
        <p className="font-medium">Clinical Thresholds</p>
        <p>Standard clinical observation thresholds based on medical guidelines.</p>
        <p className="italic">
          Individual thresholds may be adjusted based on medical professional advice (Altered Criteria).
        </p>
      </div>

      {/* Dialogs */}
      <VitalEntryForm
        clientId={clientId}
        open={showLogForm}
        onOpenChange={setShowLogForm}
      />

      <EmergencyAlertDialog
        alert={activeEmergencyAlert}
        open={!!activeEmergencyAlert}
        onOpenChange={(open) => {
          if (!open) setActiveEmergencyAlert(null);
        }}
        clientId={clientId}
      />
    </div>
  );
}
