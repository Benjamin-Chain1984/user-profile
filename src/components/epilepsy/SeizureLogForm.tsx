/**
 * Seizure Log Form - Rapid entry mode for stressful environments
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useSeizureEvents } from '@/hooks/useEpilepsy';
import { SEIZURE_TYPES, SEIZURE_TRIGGERS, RECOVERY_OPTIONS } from '@/types/epilepsy';
import { Info, ChevronDown, ChevronUp } from 'lucide-react';
import { OnBehalfSelector, type OnBehalfData, isOnBehalfActive } from '@/components/shared/OnBehalfSelector';

interface SeizureLogFormProps {
  clientId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SeizureLogForm({ clientId, open, onOpenChange }: SeizureLogFormProps) {
  const { addEvent, isAdding } = useSeizureEvents(clientId);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5));
  const [durationMin, setDurationMin] = useState(0);
  const [durationSec, setDurationSec] = useState(0);
  const [seizureCategory, setSeizureCategory] = useState('');
  const [seizureType, setSeizureType] = useState('');
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  const [triggerOther, setTriggerOther] = useState('');
  const [selectedRecovery, setSelectedRecovery] = useState<string[]>([]);
  const [recoveryNotes, setRecoveryNotes] = useState('');
  const [observationType, setObservationType] = useState('observed');
  const [notes, setNotes] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const toggleTrigger = (t: string) => {
    setSelectedTriggers(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  };

  const toggleRecovery = (r: string) => {
    setSelectedRecovery(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);
  };

  const handleSubmit = () => {
    const eventOccurredAt = new Date(`${date}T${time}`).toISOString();
    addEvent({
      event_occurred_at: eventOccurredAt,
      duration_minutes: durationMin,
      duration_seconds: durationSec,
      seizure_category: seizureCategory,
      seizure_type: seizureType,
      triggers: selectedTriggers,
      trigger_other: selectedTriggers.includes('Other') ? triggerOther : null,
      recovery: selectedRecovery,
      recovery_notes: recoveryNotes || null,
      observation_type: observationType,
      notes: notes || null,
    });
    onOpenChange(false);
    // Reset
    setDurationMin(0);
    setDurationSec(0);
    setSeizureCategory('');
    setSeizureType('');
    setSelectedTriggers([]);
    setTriggerOther('');
    setSelectedRecovery([]);
    setRecoveryNotes('');
    setNotes('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log Seizure Event</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Date</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div>
              <Label>Time</Label>
              <Input type="time" value={time} onChange={e => setTime(e.target.value)} />
            </div>
          </div>

          {/* Duration */}
          <div>
            <Label>Duration</Label>
            <div className="grid grid-cols-2 gap-3 mt-1">
              <div className="flex items-center gap-2">
                <Input type="number" min={0} value={durationMin} onChange={e => setDurationMin(parseInt(e.target.value) || 0)} className="w-20" />
                <span className="text-sm text-muted-foreground">min</span>
              </div>
              <div className="flex items-center gap-2">
                <Input type="number" min={0} max={59} value={durationSec} onChange={e => setDurationSec(parseInt(e.target.value) || 0)} className="w-20" />
                <span className="text-sm text-muted-foreground">sec</span>
              </div>
            </div>
          </div>

          {/* Seizure Type Picker */}
          <div>
            <Label className="mb-2 block">Seizure Type</Label>
            <div className="space-y-2">
              {Object.entries(SEIZURE_TYPES).map(([catKey, category]) => (
                <Collapsible key={catKey} open={expandedCategory === catKey} onOpenChange={() => setExpandedCategory(expandedCategory === catKey ? null : catKey)}>
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" className="w-full justify-between text-left">
                      <span className="font-medium">{category.label}</span>
                      {expandedCategory === catKey ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-1 space-y-1">
                    {category.types.map(type => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => { setSeizureCategory(catKey); setSeizureType(type.value); }}
                        className={`w-full text-left p-3 rounded-lg border transition-all ${
                          seizureType === type.value
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/30'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{type.label}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Info className="h-3 w-3" />
                              {type.info}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </div>

          {/* Triggers */}
          <div>
            <Label className="mb-2 block">Possible Triggers</Label>
            <div className="flex flex-wrap gap-2">
              {SEIZURE_TRIGGERS.map(t => (
                <Badge
                  key={t}
                  variant={selectedTriggers.includes(t) ? 'default' : 'outline'}
                  className="cursor-pointer select-none text-sm py-1.5 px-3"
                  onClick={() => toggleTrigger(t)}
                >
                  {t}
                </Badge>
              ))}
            </div>
            {selectedTriggers.includes('Other') && (
              <Input
                className="mt-2"
                placeholder="Describe other trigger..."
                value={triggerOther}
                onChange={e => setTriggerOther(e.target.value)}
              />
            )}
          </div>

          {/* Recovery */}
          <div>
            <Label className="mb-2 block">Recovery & Post-Ictal Phase</Label>
            <div className="flex flex-wrap gap-2">
              {RECOVERY_OPTIONS.map(r => (
                <Badge
                  key={r}
                  variant={selectedRecovery.includes(r) ? 'default' : 'outline'}
                  className={`cursor-pointer select-none text-sm py-1.5 px-3 ${
                    r === 'Emergency support required' && selectedRecovery.includes(r) ? 'bg-destructive text-destructive-foreground' :
                    r === 'Injured (notes required)' && selectedRecovery.includes(r) ? 'bg-destructive text-destructive-foreground' : ''
                  }`}
                  onClick={() => toggleRecovery(r)}
                >
                  {r}
                </Badge>
              ))}
            </div>
            {(selectedRecovery.includes('Injured (notes required)') || selectedRecovery.includes('Other')) && (
              <Textarea
                className="mt-2"
                placeholder="Describe recovery details..."
                value={recoveryNotes}
                onChange={e => setRecoveryNotes(e.target.value)}
              />
            )}
          </div>

          {/* Observation Type */}
          <div>
            <Label className="mb-2 block">Observation</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={observationType === 'observed' ? 'default' : 'outline'}
                onClick={() => setObservationType('observed')}
                size="sm"
              >
                Observed Directly
              </Button>
              <Button
                type="button"
                variant={observationType === 'reported' ? 'default' : 'outline'}
                onClick={() => setObservationType('reported')}
                size="sm"
              >
                Reported After Event
              </Button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label>Notes (optional)</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Additional observations..." />
          </div>

          {/* Emergency Warning */}
          {selectedRecovery.includes('Emergency support required') && (
            <Card className="border-destructive bg-destructive/5">
              <CardContent className="py-3">
                <p className="text-sm text-destructive font-medium">⚠️ Emergency support was required — a Red Alert will be generated and escalation documentation will be needed.</p>
              </CardContent>
            </Card>
          )}

          <Button onClick={handleSubmit} disabled={isAdding || !seizureType} className="w-full" size="lg">
            {isAdding ? 'Saving...' : 'Log Seizure Event'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
