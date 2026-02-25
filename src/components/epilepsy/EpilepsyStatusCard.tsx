/**
 * Epilepsy Status Card - Current status with threshold summary, safety banners, PRN prompt
 */

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useEpilepsyStatus, useEpilepsyConfig, useSeizureActions } from '@/hooks/useEpilepsy';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle, AlertTriangle, AlertCircle, Pill, Phone, Shield } from 'lucide-react';
import type { EpilepsyStatus } from '@/types/epilepsy';

interface EpilepsyStatusCardProps {
  clientId?: string;
}

const statusConfig: Record<EpilepsyStatus, {label: string; icon: React.ElementType; className: string;}> = {
  ideal: {
    label: 'IDEAL',
    icon: CheckCircle,
    className: 'bg-success/10 text-success border-success/30'
  },
  monitor: {
    label: 'Amber – Attention Required',
    icon: AlertTriangle,
    className: 'bg-warning/10 text-warning border-warning/30'
  },
  action: {
    label: 'Red – Action Needed',
    icon: AlertCircle,
    className: 'bg-destructive/10 text-destructive border-destructive/30'
  }
};

export function EpilepsyStatusCard({ clientId }: EpilepsyStatusCardProps) {
  const statusInfo = useEpilepsyStatus(clientId);
  const { config } = useEpilepsyConfig(clientId);
  const { addAction, isAdding } = useSeizureActions(clientId);
  const cfg = statusConfig[statusInfo.status];
  const Icon = cfg.icon;

  const [showPrnDialog, setShowPrnDialog] = useState(false);
  const [prnChoice, setPrnChoice] = useState<'yes' | 'no' | 'not_prescribed' | null>(null);
  const [prnTime, setPrnTime] = useState('');
  const [ambulanceCalled, setAmbulanceCalled] = useState(false);
  const [contactedPerson, setContactedPerson] = useState('');
  const [actionTime, setActionTime] = useState('');

  const handleSavePrn = () => {
    if (prnChoice === 'yes') {
      addAction({
        action_type: 'rescue_medication',
        medication_name: config?.rescue_medication_name || null,
        medication_dose: config?.rescue_medication_dose || null,
        medication_route: config?.rescue_medication_route || null,
        time_administered: prnTime ? new Date(prnTime).toISOString() : null,
        ambulance_called: ambulanceCalled,
        ambulance_time_called: ambulanceCalled && actionTime ? new Date(actionTime).toISOString() : null,
        escalation_completed: !!contactedPerson,
        post_event_notes: contactedPerson ? `Contacted: ${contactedPerson}` : null,
      });
    } else {
      addAction({
        action_type: prnChoice === 'not_prescribed' ? 'no_prn_not_prescribed' : 'prn_declined',
        ambulance_called: ambulanceCalled,
        ambulance_time_called: ambulanceCalled && actionTime ? new Date(actionTime).toISOString() : null,
        escalation_completed: !!contactedPerson,
        post_event_notes: contactedPerson ? `Contacted: ${contactedPerson}` : null,
      });
    }
    setShowPrnDialog(false);
    setPrnChoice(null);
  };

  // Colour for progress bar
  const progressPct = statusInfo.redThreshold > 0
    ? Math.min(100, (statusInfo.seizuresInWindow / statusInfo.redThreshold) * 100)
    : 0;
  const progressColor = statusInfo.status === 'action'
    ? 'bg-destructive'
    : statusInfo.status === 'monitor'
    ? 'bg-warning'
    : 'bg-success';

  return (
    <>
      <div className={cn('rounded-xl border-2 p-6 transition-all', cfg.className)}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              'p-3 rounded-full',
              statusInfo.status === 'ideal' && 'bg-success/20',
              statusInfo.status === 'monitor' && 'bg-warning/20',
              statusInfo.status === 'action' && 'bg-destructive/20'
            )}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">{cfg.label}</h3>
                {statusInfo.status === 'ideal' && <span className="text-2xl">🟢</span>}
                {statusInfo.status === 'monitor' && <span className="text-2xl">🟠</span>}
                {statusInfo.status === 'action' && <span className="text-2xl">🔴</span>}
              </div>
              <p className="text-sm opacity-80">{statusInfo.message}</p>
            </div>
          </div>
          <div className="text-right">
            {statusInfo.daysSinceLastSeizure !== null && (
              <div>
                <span className="text-3xl font-bold">{statusInfo.daysSinceLastSeizure}</span>
                <p className="text-xs opacity-70">
                  {statusInfo.daysSinceLastSeizure === 1 ? 'day' : 'days'} since last seizure
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Threshold Summary Bar */}
        <div className="mt-4 pt-4 border-t border-current/20">
          <div className="flex justify-between text-xs mb-1">
            <span>Seizures in last {statusInfo.windowLabel}: <strong>{statusInfo.seizuresInWindow}</strong></span>
            <span>Amber &gt;{statusInfo.amberThreshold} · Red &gt;{statusInfo.redThreshold}</span>
          </div>
          <div className="w-full h-3 bg-current/10 rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all', progressColor)}
              style={{ width: `${progressPct}%` }}
            />
          </div>
          {statusInfo.longestDurationInWindow > 0 && (
            <p className="text-xs mt-1 opacity-70">
              Longest duration in window: {statusInfo.longestDurationInWindow.toFixed(1)} min (threshold: {statusInfo.durationThreshold} min)
            </p>
          )}
        </div>

        {/* Active Alerts */}
        {statusInfo.activeAlerts.length > 0 && (
          <div className="mt-4 pt-4 border-t border-current/20">
            <div className="text-sm font-medium mb-2">Active Alerts ({statusInfo.activeAlerts.length})</div>
            <ul className="space-y-1">
              {statusInfo.activeAlerts.slice(0, 3).map((alert) => (
                <li key={alert.id} className="text-sm opacity-80">• {alert.message}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Safety Banners */}
        {statusInfo.status === 'monitor' && (
          <div className="mt-4 p-4 bg-warning/10 border border-warning/30 rounded-lg">
            <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4" /> Cluster threshold reached
            </h4>
            <ul className="text-sm space-y-1 ml-6 list-disc opacity-80">
              <li>Monitor closely.</li>
              <li>Review medication compliance.</li>
              <li>Review triggers (sleep, illness, stress).</li>
              <li>Consider GP review if persists.</li>
            </ul>
          </div>
        )}

        {statusInfo.status === 'action' && (
          <div className="mt-4 p-4 bg-destructive/10 border border-destructive/30 rounded-lg space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" /> Seizure escalation threshold reached
            </h4>
            <ul className="text-sm space-y-1 ml-6 list-disc">
              <li>Follow Epilepsy Management Plan.</li>
              <li>Administer PRN rescue medication if prescribed.</li>
              <li>Call 000 if seizure continues or per plan.</li>
              <li>Stay with the person and monitor breathing.</li>
            </ul>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowPrnDialog(true)}
              className="mt-2"
            >
              <Pill className="h-4 w-4 mr-2" />
              Document Escalation Response
            </Button>
          </div>
        )}

        {/* What to do */}
        <div className="mt-4 pt-4 border-t border-current/20">
          <h4 className="text-sm font-medium mb-1">What to do:</h4>
          <p className="text-sm opacity-80">
            {statusInfo.status === 'ideal' && 'Continue regular monitoring. Ensure medication compliance.'}
            {statusInfo.status === 'monitor' && 'Increase monitoring frequency. Review triggers and medication compliance. Consider GP/neurologist review.'}
            {statusInfo.status === 'action' && 'Follow Epilepsy Management Plan. Administer rescue medication if prescribed. Call 000 if indicated.'}
          </p>
        </div>
      </div>

      {/* PRN Documentation Dialog */}
      <Dialog open={showPrnDialog} onOpenChange={setShowPrnDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Shield className="h-5 w-5" />
              Escalation Response Documentation
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <div>
              <Label className="text-sm font-semibold">Is PRN emergency seizure medication required?</Label>
              <div className="space-y-2 mt-2">
                {(['yes', 'no', 'not_prescribed'] as const).map(opt => (
                  <label key={opt} className={cn(
                    'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                    prnChoice === opt ? 'border-primary bg-primary/5' : 'border-border'
                  )}>
                    <Checkbox checked={prnChoice === opt} onCheckedChange={() => setPrnChoice(opt)} />
                    <span className="text-sm">
                      {opt === 'yes' ? 'Yes' : opt === 'no' ? 'No' : 'Not prescribed'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {prnChoice === 'yes' && config?.rescue_medication_prescribed && (
              <div className="p-3 bg-muted/50 rounded-lg text-sm space-y-1">
                <p><strong>Medication:</strong> {config.rescue_medication_name || 'Not specified'}</p>
                <p><strong>Dose:</strong> {config.rescue_medication_dose || 'Not specified'}</p>
                <p><strong>Route:</strong> {config.rescue_medication_route || 'Not specified'}</p>
                <div className="mt-2">
                  <Label className="text-xs">Time Administered</Label>
                  <Input type="datetime-local" value={prnTime} onChange={e => setPrnTime(e.target.value)} className="h-8 mt-1" />
                </div>
              </div>
            )}

            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <Checkbox checked={ambulanceCalled} onCheckedChange={(v) => setAmbulanceCalled(v as boolean)} />
                <span className="text-sm font-medium flex items-center gap-1">
                  <Phone className="h-3 w-3" /> Ambulance called?
                </span>
              </label>
              {ambulanceCalled && (
                <div>
                  <Label className="text-xs">Time Called</Label>
                  <Input type="datetime-local" value={actionTime} onChange={e => setActionTime(e.target.value)} className="h-8 mt-1" />
                </div>
              )}
            </div>

            <div>
              <Label className="text-sm">Who was contacted?</Label>
              <Input value={contactedPerson} onChange={e => setContactedPerson(e.target.value)} placeholder="Name and role" className="mt-1" />
            </div>

            <Button
              onClick={handleSavePrn}
              disabled={!prnChoice || isAdding}
              className="w-full"
            >
              {isAdding ? 'Saving...' : 'Save Documentation'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
