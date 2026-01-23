/**
 * Urinary Catheter Management Dashboard - Main module view
 */

import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, FileDown, Plus, Droplets, Activity, Package } from 'lucide-react';
import { CatheterStatusCard } from './CatheterStatusCard';
import { CatheterHistory } from './CatheterHistory';
import { CatheterTrends } from './CatheterTrends';
import { CatheterConfigSettings } from './CatheterConfigSettings';
import { CatheterExportReports } from './CatheterExportReports';
import { CatheterChangeForm } from './CatheterChangeForm';
import { FlushLogForm } from './FlushLogForm';
import { StomaCheckForm } from './StomaCheckForm';
import { BagChangeForm } from './BagChangeForm';
import { AutonomicDysreflexiaPanel } from './AutonomicDysreflexiaPanel';
import { useCatheterConfig } from '@/hooks/useCatheter';
import { CATHETER_TYPE_CONFIG } from '@/types/catheter';

interface CatheterDashboardProps {
  clientId?: string;
}

export function CatheterDashboard({ clientId }: CatheterDashboardProps) {
  const { config } = useCatheterConfig(clientId);

  const [showChangeForm, setShowChangeForm] = useState(false);
  const [showFlushForm, setShowFlushForm] = useState(false);
  const [showStomaForm, setShowStomaForm] = useState(false);
  const [showBagForm, setShowBagForm] = useState(false);
  const [showExport, setShowExport] = useState(false);

  const typeConfig = config?.catheter_type ? CATHETER_TYPE_CONFIG[config.catheter_type] : null;

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Urinary Catheter Management</h1>
          <p className="text-muted-foreground">Track catheter care, flushes, and bag changes</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => setShowExport(true)} className="gap-2">
            <FileDown className="h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => setShowChangeForm(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Log Catheter Change
          </Button>
        </div>
      </div>

      {/* Clinical Disclaimer */}
      <Alert className="border-amber-200 bg-amber-50">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-800">Clinical Guidance Required</AlertTitle>
        <AlertDescription className="text-amber-700">
          Catheter type selection, change schedules, and flush protocols should be determined 
          by a qualified health professional. Always follow prescribed care plans.
        </AlertDescription>
      </Alert>

      {/* Status Card */}
      <CatheterStatusCard
        clientId={clientId}
        onLogChange={() => setShowChangeForm(true)}
      />

      {/* Quick Actions - Dynamic based on catheter type */}
      <div className="flex flex-wrap gap-2">
        {config?.enable_flush_tracking && typeConfig?.enableFlushTracking && (
          <Button variant="outline" onClick={() => setShowFlushForm(true)} className="gap-2">
            <Droplets className="h-4 w-4" />
            Log Flush
          </Button>
        )}
        {config?.enable_stoma_checks && typeConfig?.enableStomaChecks && (
          <Button variant="outline" onClick={() => setShowStomaForm(true)} className="gap-2">
            <Activity className="h-4 w-4" />
            Stoma Check
          </Button>
        )}
        {config?.bag_types && config.bag_types.length > 0 && (
          <Button variant="outline" onClick={() => setShowBagForm(true)} className="gap-2">
            <Package className="h-4 w-4" />
            Log Bag Change
          </Button>
        )}
      </div>

      {/* Autonomic Dysreflexia Action Plan */}
      {config?.enable_autonomic_dysreflexia_risk && (
        <AutonomicDysreflexiaPanel clientId={clientId} />
      )}

      {/* Main Tabs */}
      <Tabs defaultValue="tracking" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tracking">Tracking</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="tracking">
          <CatheterHistory clientId={clientId} />
        </TabsContent>

        <TabsContent value="trends">
          <CatheterTrends clientId={clientId} />
        </TabsContent>

        <TabsContent value="settings">
          <CatheterConfigSettings clientId={clientId} />
        </TabsContent>
      </Tabs>

      {/* Forms */}
      <CatheterChangeForm
        clientId={clientId}
        open={showChangeForm}
        onOpenChange={setShowChangeForm}
      />

      <FlushLogForm
        clientId={clientId}
        open={showFlushForm}
        onOpenChange={setShowFlushForm}
      />

      <StomaCheckForm
        clientId={clientId}
        open={showStomaForm}
        onOpenChange={setShowStomaForm}
      />

      <BagChangeForm
        clientId={clientId}
        open={showBagForm}
        onOpenChange={setShowBagForm}
      />

      <CatheterExportReports
        clientId={clientId}
        open={showExport}
        onOpenChange={setShowExport}
      />

      {/* Clinical Citation */}
      <p className="text-xs text-muted-foreground text-center pt-4">
        Catheter care protocols based on NHS England Best Practice Guidelines and ANZUNS recommendations.
      </p>
    </div>
  );
}
