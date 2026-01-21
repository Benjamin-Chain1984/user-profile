/**
 * Bowel Care Dashboard - Main tracking and monitoring view
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BowelCareStatusCard } from './BowelCareStatusCard';
import { BowelLogForm } from './BowelLogForm';
import { BowelCareHistory } from './BowelCareHistory';
import { BowelCareTrends } from './BowelCareTrends';
import { PrnWorkflowCard } from './PrnWorkflowCard';
import { BowelCareConfigSettings } from './BowelCareConfigSettings';
import { EscalationDialog } from './EscalationDialog';
import { useBowelCareStatus } from '@/hooks/useBowelCare';
import { Plus, AlertTriangle, Settings, BarChart3, Clock, FileText } from 'lucide-react';

interface BowelCareDashboardProps {
  clientId?: string;
}

export function BowelCareDashboard({ clientId }: BowelCareDashboardProps) {
  const [showLogForm, setShowLogForm] = useState(false);
  const [showEscalation, setShowEscalation] = useState(false);
  const statusInfo = useBowelCareStatus(clientId);

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Bowel Care</h2>
          <p className="text-muted-foreground">
            Track bowel movements and manage PRN laxatives
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowEscalation(true)}>
            <AlertTriangle className="h-4 w-4 mr-2" />
            I'm Concerned
          </Button>
          <Button onClick={() => setShowLogForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Log Bowel Entry
          </Button>
        </div>
      </div>

      {/* Status Card */}
      <BowelCareStatusCard clientId={clientId} />

      {/* Tabs */}
      <Tabs defaultValue="tracking" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
          <TabsTrigger value="tracking" className="gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Tracking</span>
          </TabsTrigger>
          <TabsTrigger value="prn" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">PRN</span>
          </TabsTrigger>
          <TabsTrigger value="trends" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Trends</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Settings</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tracking" className="space-y-4">
          <div className="grid lg:grid-cols-2 gap-4">
            <BowelCareHistory clientId={clientId} />
            <PrnWorkflowCard clientId={clientId} />
          </div>
        </TabsContent>

        <TabsContent value="prn">
          <PrnWorkflowCard clientId={clientId} />
        </TabsContent>

        <TabsContent value="trends">
          <BowelCareTrends clientId={clientId} />
        </TabsContent>

        <TabsContent value="settings">
          <BowelCareConfigSettings clientId={clientId} />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <BowelLogForm
        clientId={clientId}
        open={showLogForm}
        onOpenChange={setShowLogForm}
      />

      <EscalationDialog
        clientId={clientId}
        reason="Staff member concerned about bowel health"
        open={showEscalation}
        onOpenChange={setShowEscalation}
      />
    </div>
  );
}
