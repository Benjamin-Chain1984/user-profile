/**
 * Weight & BMI Dashboard - Main tracking and monitoring view
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WeightBmiStatusCard } from './WeightBmiStatusCard';
import { WeightLogForm } from './WeightLogForm';
import { WeightHistory } from './WeightHistory';
import { WeightBmiTrends } from './WeightBmiTrends';
import { WeightBmiConfigSettings } from './WeightBmiConfigSettings';
import { WeightBmiExportReports } from './WeightBmiExportReports';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { useProfile } from '@/contexts/ProfileContext';
import { MonitoringPausedBanner } from '@/components/monitoring';
import { RoleTabsTrigger } from '@/components/ui/role-tabs-trigger';
import { 
  Plus, 
  Settings, 
  BarChart3, 
  Clock, 
  AlertCircle,
  FileDown,
  Scale,
  HeartPulse
} from 'lucide-react';

interface WeightBmiDashboardProps {
  clientId?: string;
}

const SYMPTOMS_TO_WATCH = [
  'Unexplained weight loss or gain',
  'Changes in appetite or eating patterns',
  'Swelling (edema) in legs, ankles, or feet',
  'Breathlessness or difficulty breathing',
  'Persistent nausea or vomiting',
  'Signs of dehydration or malnutrition',
  'Changes in clothing fit or appearance'
];

const HEALTHY_WEIGHT_TIPS = [
  'Maintain consistent meal times and balanced nutrition',
  'Stay hydrated with regular fluid intake',
  'Encourage regular physical activity where appropriate',
  'Monitor weight at the same time of day for consistency',
  'Consult a dietitian for personalized nutrition advice'
];

export function WeightBmiDashboard({ clientId }: WeightBmiDashboardProps) {
  const [showLogForm, setShowLogForm] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const { isAdmin } = useRoleAccess();
  const { isMonitoringPaused, monitoringStatus } = useProfile();

  // Show export view
  if (showExport) {
    return <WeightBmiExportReports clientId={clientId} onClose={() => setShowExport(false)} />;
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Scale className="h-6 w-6" />
            Weight & BMI Monitoring
          </h2>
          <p className="text-muted-foreground">
            Track weight measurements and calculate BMI
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowExport(true)}>
            <FileDown className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setShowLogForm(true)} disabled={isMonitoringPaused}>
            <Plus className="h-4 w-4 mr-2" />
            Log Weight
          </Button>
        </div>
      </div>

      {/* Monitoring Paused Banner */}
      {isMonitoringPaused && monitoringStatus && (
        <MonitoringPausedBanner
          pauseReason={monitoringStatus.pauseReason}
          pauseStartDatetime={monitoringStatus.pauseStartDatetime}
          pauseEndDatetime={monitoringStatus.pauseEndDatetime}
        />
      )}

      {/* Mandatory Safety Disclaimer */}
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="py-4">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              <strong>Important:</strong> This information supports monitoring only. 
              Follow the person's health plan and seek advice from a health professional if concerned.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Status Card */}
      <WeightBmiStatusCard clientId={clientId} />

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

        <TabsContent value="tracking">
          <div className="space-y-6">
            <WeightHistory clientId={clientId} />

            {/* Symptoms to Be Aware Of */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  Symptoms to Be Aware Of and Seek Advice
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="grid sm:grid-cols-2 gap-2">
                  {SYMPTOMS_TO_WATCH.map((symptom, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-red-500 mt-1">•</span>
                      <span className="text-sm text-muted-foreground">{symptom}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Healthy Weight Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <HeartPulse className="h-5 w-5 text-green-500" />
                  Healthy Weight Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {HEALTHY_WEIGHT_TIPS.map((tip, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">✓</span>
                      <span className="text-sm text-muted-foreground">{tip}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends">
          <WeightBmiTrends clientId={clientId} />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="settings">
            <WeightBmiConfigSettings clientId={clientId} />
          </TabsContent>
        )}
      </Tabs>

      {/* Symptoms to Be Aware Of */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Symptoms to Be Aware Of and Seek Advice
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid sm:grid-cols-2 gap-2">
            {SYMPTOMS_TO_WATCH.map((symptom, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-red-500 mt-1">•</span>
                <span className="text-sm text-muted-foreground">{symptom}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Healthy Weight Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <HeartPulse className="h-5 w-5 text-green-500" />
            Healthy Weight Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {HEALTHY_WEIGHT_TIPS.map((tip, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span className="text-sm text-muted-foreground">{tip}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* BMI Classification Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">BMI Classification Reference</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-amber-50 rounded-md text-center">
              <p className="text-xs text-muted-foreground">Underweight</p>
              <p className="font-bold text-amber-600">&lt; 18.5</p>
            </div>
            <div className="p-3 bg-green-50 rounded-md text-center">
              <p className="text-xs text-muted-foreground">Normal</p>
              <p className="font-bold text-green-600">18.5 - 24.9</p>
            </div>
            <div className="p-3 bg-amber-50 rounded-md text-center">
              <p className="text-xs text-muted-foreground">Overweight</p>
              <p className="font-bold text-amber-600">25 - 29.9</p>
            </div>
            <div className="p-3 bg-red-50 rounded-md text-center">
              <p className="text-xs text-muted-foreground">Obese</p>
              <p className="font-bold text-red-600">≥ 30</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            BMI should be interpreted with caution, especially when height is estimated or for individuals with high muscle mass, amputations, or mobility limitations.
          </p>
        </CardContent>
      </Card>

      {/* Citation */}
      <div className="text-xs text-muted-foreground border-t pt-4 space-y-1">
        <p className="font-medium">BMI Classification</p>
        <p>World Health Organization (WHO) BMI Classification for Adults.</p>
        <p className="italic">
          WHO Expert Committee. Physical Status: The Use and Interpretation of Anthropometry. 
          WHO Technical Report Series 854. Geneva: WHO, 1995.
        </p>
      </div>

      {/* Log Weight Dialog */}
      <WeightLogForm
        clientId={clientId}
        open={showLogForm}
        onOpenChange={setShowLogForm}
      />
    </div>
  );
}
