/**
 * Continence Management Dashboard - Main module view
 */

import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, FileDown, Plus, Package, TestTube, Shield } from 'lucide-react';
import { ContinenceStatusCard } from './ContinenceStatusCard';
import { ContinenceHistory } from './ContinenceHistory';
import { ContinenceTrends } from './ContinenceTrends';
import { ContinenceConfigSettings } from './ContinenceConfigSettings';
import { ContinenceExportReports } from './ContinenceExportReports';
import { PadChangeForm } from './PadChangeForm';
import { SkinCheckForm } from './SkinCheckForm';
import { ConsumablesCheckForm } from './ConsumablesCheckForm';
import { UTITestForm } from './UTITestForm';
import { useContinenceConfig } from '@/hooks/useContinence';

interface ContinenceDashboardProps {
  clientId?: string;
}

export function ContinenceDashboard({ clientId }: ContinenceDashboardProps) {
  const { config } = useContinenceConfig(clientId);
  
  const [showPadChangeForm, setShowPadChangeForm] = useState(false);
  const [showSkinCheckForm, setShowSkinCheckForm] = useState(false);
  const [showConsumablesForm, setShowConsumablesForm] = useState(false);
  const [showUTIForm, setShowUTIForm] = useState(false);
  const [showExport, setShowExport] = useState(false);

  const handlePadChangeComplete = () => {
    // Prompt skin check after pad change
    setShowSkinCheckForm(true);
  };

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Continence Management</h1>
          <p className="text-muted-foreground">Monitor pad changes, skin integrity, and supplies</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowExport(true)} className="gap-2">
            <FileDown className="h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => setShowPadChangeForm(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Log Pad Change
          </Button>
        </div>
      </div>

      {/* Clinical Disclaimer */}
      <Alert className="border-amber-200 bg-amber-50">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-800">Clinical Guidance Required</AlertTitle>
        <AlertDescription className="text-amber-700">
          Continence care schedules, skin treatment protocols, and escalation pathways should be 
          determined by a qualified health professional.
        </AlertDescription>
      </Alert>

      {/* Status Card */}
      <ContinenceStatusCard 
        clientId={clientId} 
        onLogPadChange={() => setShowPadChangeForm(true)} 
      />

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => setShowSkinCheckForm(true)} className="gap-2">
          <Shield className="h-4 w-4" />
          Skin Check
        </Button>
        {config?.enable_consumables_monitoring && (
          <Button variant="outline" onClick={() => setShowConsumablesForm(true)} className="gap-2">
            <Package className="h-4 w-4" />
            Stock Check
          </Button>
        )}
        {config?.enable_uti_testing && (
          <Button variant="outline" onClick={() => setShowUTIForm(true)} className="gap-2">
            <TestTube className="h-4 w-4" />
            UTI Test
          </Button>
        )}
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="tracking" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tracking">Tracking</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="tracking">
          <ContinenceHistory clientId={clientId} />
        </TabsContent>

        <TabsContent value="trends">
          <ContinenceTrends clientId={clientId} />
        </TabsContent>

        <TabsContent value="settings">
          <ContinenceConfigSettings clientId={clientId} />
        </TabsContent>
      </Tabs>

      {/* Forms */}
      <PadChangeForm
        clientId={clientId}
        open={showPadChangeForm}
        onOpenChange={setShowPadChangeForm}
        onComplete={handlePadChangeComplete}
        promptSkinCheck={() => setShowSkinCheckForm(true)}
      />

      <SkinCheckForm
        clientId={clientId}
        open={showSkinCheckForm}
        onOpenChange={setShowSkinCheckForm}
      />

      <ConsumablesCheckForm
        clientId={clientId}
        open={showConsumablesForm}
        onOpenChange={setShowConsumablesForm}
      />

      <UTITestForm
        clientId={clientId}
        open={showUTIForm}
        onOpenChange={setShowUTIForm}
      />

      <ContinenceExportReports
        clientId={clientId}
        open={showExport}
        onOpenChange={setShowExport}
      />
    </div>
  );
}
