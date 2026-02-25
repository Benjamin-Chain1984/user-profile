/**
 * Emergency Seizure Action Panel
 * Step-by-step calm guidance for seizure emergency response
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useEpilepsyConfig, useSeizureActions } from '@/hooks/useEpilepsy';
import { AlertCircle, Shield, Pill, Clock, Phone, FileText, ChevronDown, ChevronUp } from 'lucide-react';

interface EmergencySeizurePanelProps {
  clientId?: string;
  seizureEventId?: string;
  onComplete?: () => void;
}

export function EmergencySeizurePanel({ clientId, seizureEventId, onComplete }: EmergencySeizurePanelProps) {
  const { config } = useEpilepsyConfig(clientId);
  const { addAction, isAdding } = useSeizureActions(clientId);
  const [expanded, setExpanded] = useState(true);

  // State for each step
  const [planConfirmed, setPlanConfirmed] = useState(false);
  const [timeAdministered, setTimeAdministered] = useState('');
  const [doseGiven, setDoseGiven] = useState(config?.rescue_medication_dose || '');
  const [route, setRoute] = useState(config?.rescue_medication_route || '');
  const [witness, setWitness] = useState('');
  const [doseMatchesPlan, setDoseMatchesPlan] = useState(true);
  const [doseChangeReason, setDoseChangeReason] = useState('');
  const [ambulanceCalled, setAmbulanceCalled] = useState(false);
  const [ambulanceTime, setAmbulanceTime] = useState('');
  const [ambulanceOutcome, setAmbulanceOutcome] = useState('');
  const [totalSeizureDuration, setTotalSeizureDuration] = useState('');
  const [totalRecoveryTime, setTotalRecoveryTime] = useState('');
  const [injuries, setInjuries] = useState('');
  const [escalationDone, setEscalationDone] = useState(false);
  const [postNotes, setPostNotes] = useState('');

  const handleSave = () => {
    addAction({
      seizure_event_id: seizureEventId || null,
      action_type: 'rescue_medication',
      medication_name: config?.rescue_medication_name || null,
      medication_dose: doseGiven || null,
      medication_route: route || null,
      time_administered: timeAdministered ? new Date(timeAdministered).toISOString() : null,
      witness_name: witness || null,
      dose_matches_plan: doseMatchesPlan,
      dose_change_reason: !doseMatchesPlan ? doseChangeReason : null,
      ambulance_called: ambulanceCalled,
      ambulance_time_called: ambulanceCalled && ambulanceTime ? new Date(ambulanceTime).toISOString() : null,
      ambulance_outcome: ambulanceCalled ? ambulanceOutcome : null,
      total_seizure_duration_minutes: totalSeizureDuration ? parseFloat(totalSeizureDuration) : null,
      total_recovery_time_minutes: totalRecoveryTime ? parseFloat(totalRecoveryTime) : null,
      injuries_noted: injuries || null,
      escalation_completed: escalationDone,
      post_event_notes: postNotes || null
    });
    onComplete?.();
  };

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <Card className="border-destructive/50 bg-destructive/5">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer">
            <CardTitle className="text-lg flex items-center justify-between text-destructive">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Emergency Seizure Action
              </div>
              {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-6">
            {/* Step 1 */}
            <div className="p-4 bg-card rounded-lg border space-y-2">
              <h4 className="font-semibold flex items-center gap-2"><Badge>1</Badge> <Shield className="h-4 w-4" /> Stay Calm & Ensure Safety</h4>
              <ul className="text-sm text-muted-foreground space-y-1 ml-8 list-disc">
                <li>Stay with the person.</li>
                <li>Time the seizure.</li>
                <li>Protect from injury (move objects away).</li>
                <li>Do NOT restrain.</li>
                <li>Do NOT put anything in the mouth (other than prescribed PRN seizure medication).</li>
                <li>Place in recovery position when safe.</li>
              </ul>
            </div>

            {/* Step 2 - Rescue Med Plan */}
            {config?.rescue_medication_prescribed &&
            <div className="p-4 bg-card rounded-lg border space-y-3">
                <h4 className="font-semibold flex items-center gap-2"><Badge>2</Badge> <Pill className="h-4 w-4" /> Check Rescue Medication Plan</h4>
                <div className="p-3 bg-muted/50 rounded-lg text-sm space-y-1">
                  <p><strong>Medication:</strong> {config.rescue_medication_name || 'Not specified'}</p>
                  <p><strong>Dose:</strong> {config.rescue_medication_dose || 'Not specified'}</p>
                  <p><strong>Route:</strong> {config.rescue_medication_route || 'Not specified'}</p>
                  <p><strong>When:</strong> {config.rescue_medication_when || 'As prescribed'}</p>
                </div>
                



              </div>
            }

            {/* Step 3 - Administer */}
            {config?.rescue_medication_prescribed



























            }

            {/* Step 5 - Call 000 */}
            <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/30 space-y-3">
              <h4 className="font-semibold flex items-center gap-2 text-destructive">
                <Phone className="h-4 w-4" /> Call 000 Immediately If:
              </h4>
              <ul className="text-sm space-y-1 ml-4 list-disc text-destructive">
                <li>Seizure lasts longer than {config?.call_000_after_minutes ?? 5} minutes</li>
                <li>Second seizure starts without recovery</li>
                <li>Breathing difficulties</li>
                <li>Blue or grey lips</li>
                <li>Injury occurred</li>
                <li>Rescue medication does not stop seizure</li>
                <li>Staff concern</li>
              </ul>
              



              {ambulanceCalled &&
              <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <Label>Time Called</Label>
                    <Input type="datetime-local" value={ambulanceTime} onChange={(e) => setAmbulanceTime(e.target.value)} />
                  </div>
                  <div>
                    <Label>Outcome / Instructions</Label>
                    <Input value={ambulanceOutcome} onChange={(e) => setAmbulanceOutcome(e.target.value)} />
                  </div>
                </div>
              }
            </div>

            {/* Step 6 - Post-Event */}
            

























          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>);

}