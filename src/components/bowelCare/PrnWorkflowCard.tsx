/**
 * PRN Workflow Card - Shows PRN recommendations and administration workflow
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useBowelCareConfig,
  usePrnMedications,
  usePrnAdministrations,
  useBowelCareStatus,
} from '@/hooks/useBowelCare';
import { Pill, Clock, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { formatDistanceToNow, addHours, isAfter } from 'date-fns';
import { BristolSelector } from './BristolSelector';

interface PrnWorkflowCardProps {
  clientId: string;
}

export function PrnWorkflowCard({ clientId }: PrnWorkflowCardProps) {
  const { config } = useBowelCareConfig(clientId);
  const { medications } = usePrnMedications(clientId);
  const { administrations, recordAdministration, recordOutcome, isRecording } = usePrnAdministrations(clientId);
  const statusInfo = useBowelCareStatus(clientId);

  const [showAdminDialog, setShowAdminDialog] = useState(false);
  const [showOutcomeDialog, setShowOutcomeDialog] = useState(false);
  const [selectedMed, setSelectedMed] = useState<string>('');
  const [priorBristolType, setPriorBristolType] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [selectedAdminId, setSelectedAdminId] = useState<string | null>(null);
  const [outcomeOccurred, setOutcomeOccurred] = useState<boolean | null>(null);
  const [outcomeBristolType, setOutcomeBristolType] = useState<number | null>(null);

  // Check PRN limits
  const now = new Date();
  const last24hAdmins = administrations.filter(a => {
    const adminTime = new Date(a.administration_time);
    return isAfter(adminTime, addHours(now, -24));
  });

  const lookbackAdmins = administrations.filter(a => {
    const adminTime = new Date(a.administration_time);
    return isAfter(adminTime, addHours(now, -config.prn_dose_lookback_window_hours));
  });

  const prnLimitReached = last24hAdmins.length >= config.max_prn_doses_per_24h;
  const windowLimitReached = lookbackAdmins.length >= config.max_prn_doses_in_window;

  // Find active monitoring (PRN given, no outcome recorded yet)
  const activeMonitoring = administrations.find(a => 
    a.bowel_motion_occurred === null &&
    a.monitoring_end_time &&
    isAfter(new Date(a.monitoring_end_time), now)
  );

  const prnRecommended = statusInfo.status === 'action' && !prnLimitReached && !windowLimitReached;

  const handleRecordPrn = () => {
    const med = medications.find(m => m.id === selectedMed);
    if (!med) return;

    const monitoringEndTime = addHours(new Date(), config.monitor_hours_after_prn);

    recordAdministration(
      {
        medication_id: med.id,
        medication_name: med.medication_name,
        dose_given: med.dose_instructions,
        prior_bristol_type: priorBristolType,
        monitoring_end_time: monitoringEndTime.toISOString(),
        notes: notes.trim() || null,
      },
      {
        onSuccess: () => {
          setShowAdminDialog(false);
          setSelectedMed('');
          setPriorBristolType(null);
          setNotes('');
        },
      }
    );
  };

  const handleRecordOutcome = () => {
    if (!selectedAdminId || outcomeOccurred === null) return;

    recordOutcome(
      {
        id: selectedAdminId,
        bowel_motion_occurred: outcomeOccurred,
        outcome_bristol_type: outcomeOccurred ? outcomeBristolType ?? undefined : undefined,
      },
      {
        onSuccess: () => {
          setShowOutcomeDialog(false);
          setSelectedAdminId(null);
          setOutcomeOccurred(null);
          setOutcomeBristolType(null);
        },
      }
    );
  };

  return (
    <>
      <Card className={prnRecommended ? 'border-amber-400 bg-amber-50' : ''}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Pill className="h-5 w-5 text-primary" />
              <CardTitle>PRN Laxative</CardTitle>
            </div>
            {prnLimitReached && (
              <Badge variant="destructive">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Limit Reached
              </Badge>
            )}
          </div>
          <CardDescription>
            Manage PRN laxative recommendations and monitoring
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* PRN Recommendation */}
          {prnRecommended && !activeMonitoring && (
            <div className="p-4 bg-amber-100 border border-amber-300 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-amber-800">PRN Laxative Recommended</h4>
                  <p className="text-sm text-amber-700 mt-1">
                    Based on current thresholds, a PRN laxative may be beneficial.
                  </p>
                  <Button
                    size="sm"
                    className="mt-3"
                    onClick={() => setShowAdminDialog(true)}
                    disabled={medications.length === 0}
                  >
                    Record PRN Given
                  </Button>
                  {medications.length === 0 && (
                    <p className="text-xs text-amber-600 mt-2">
                      No PRN medications configured. Ask an admin to add them.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Active Monitoring */}
          {activeMonitoring && (
            <div className="p-4 bg-blue-100 border border-blue-300 rounded-lg">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-blue-800">Monitoring Active</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    {activeMonitoring.medication_name} given{' '}
                    {formatDistanceToNow(new Date(activeMonitoring.administration_time), { addSuffix: true })}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Monitor for bowel motion until{' '}
                    {new Date(activeMonitoring.monitoring_end_time!).toLocaleTimeString()}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3"
                    onClick={() => {
                      setSelectedAdminId(activeMonitoring.id);
                      setShowOutcomeDialog(true);
                    }}
                  >
                    Record Outcome
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Limit Warning */}
          {(prnLimitReached || windowLimitReached) && (
            <div className="p-4 bg-red-100 border border-red-300 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-800">Do NOT Give PRN</h4>
                  <p className="text-sm text-red-700 mt-1">
                    {prnLimitReached
                      ? `Maximum ${config.max_prn_doses_per_24h} doses in 24 hours reached.`
                      : `Maximum ${config.max_prn_doses_in_window} doses in ${config.prn_dose_lookback_window_hours} hours reached.`}
                  </p>
                  <p className="text-sm text-red-700 mt-1">
                    Escalate to health practitioner for further guidance.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Recent administrations */}
          {last24hAdmins.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Recent PRN ({last24hAdmins.length} in last 24h)</h4>
              <div className="space-y-2">
                {last24hAdmins.slice(0, 3).map((admin) => (
                  <div key={admin.id} className="flex items-center justify-between text-sm p-2 bg-muted rounded">
                    <div>
                      <span className="font-medium">{admin.medication_name}</span>
                      <span className="text-muted-foreground ml-2">
                        {formatDistanceToNow(new Date(admin.administration_time), { addSuffix: true })}
                      </span>
                    </div>
                    {admin.bowel_motion_occurred !== null && (
                      <Badge variant={admin.bowel_motion_occurred ? 'default' : 'secondary'}>
                        {admin.bowel_motion_occurred ? 'BM occurred' : 'No BM'}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Idle state */}
          {!prnRecommended && !activeMonitoring && !prnLimitReached && !windowLimitReached && (
            <div className="text-center py-4 text-muted-foreground">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p className="text-sm">No PRN required at this time</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* PRN Administration Dialog */}
      <Dialog open={showAdminDialog} onOpenChange={setShowAdminDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Record PRN Laxative</DialogTitle>
            <DialogDescription>
              Log the PRN medication given and start monitoring
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Medication</Label>
              <Select value={selectedMed} onValueChange={setSelectedMed}>
                <SelectTrigger>
                  <SelectValue placeholder="Select medication" />
                </SelectTrigger>
                <SelectContent>
                  {medications.map((med) => (
                    <SelectItem key={med.id} value={med.id}>
                      {med.medication_name} – {med.dose_instructions}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Stool type prior to PRN (optional)</Label>
              <BristolSelector
                value={priorBristolType}
                onChange={setPriorBristolType}
              />
            </div>

            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional notes..."
                rows={2}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowAdminDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRecordPrn} disabled={!selectedMed || isRecording}>
              {isRecording && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Record PRN Given
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Outcome Recording Dialog */}
      <Dialog open={showOutcomeDialog} onOpenChange={setShowOutcomeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Monitoring Outcome</DialogTitle>
            <DialogDescription>
              Did a bowel motion occur after the PRN?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant={outcomeOccurred === true ? 'default' : 'outline'}
                className="h-20"
                onClick={() => setOutcomeOccurred(true)}
              >
                <div className="text-center">
                  <CheckCircle className="h-6 w-6 mx-auto mb-1" />
                  <span>Yes, BM occurred</span>
                </div>
              </Button>
              <Button
                type="button"
                variant={outcomeOccurred === false ? 'default' : 'outline'}
                className="h-20"
                onClick={() => setOutcomeOccurred(false)}
              >
                <div className="text-center">
                  <AlertTriangle className="h-6 w-6 mx-auto mb-1" />
                  <span>No BM occurred</span>
                </div>
              </Button>
            </div>

            {outcomeOccurred === true && (
              <div className="space-y-2">
                <Label>What type? (optional)</Label>
                <BristolSelector
                  value={outcomeBristolType}
                  onChange={setOutcomeBristolType}
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowOutcomeDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRecordOutcome} disabled={outcomeOccurred === null}>
              Save Outcome
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
