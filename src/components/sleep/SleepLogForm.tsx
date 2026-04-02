/**
 * Sleep Log Form - Daily sleep data entry with structured awakening events
 */

import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSleepEntries } from '@/hooks/useSleep';
import { AWAKE_PERIOD_OPTIONS, ASSISTANCE_TYPES, AWAKENING_REASONS, estimateAwakeMinutes } from '@/types/sleep';
import type { AwakePeriodLength, AwakeningEvent, AwakeningReason } from '@/types/sleep';
import { differenceInMinutes } from 'date-fns';
import { Loader2, Moon, AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { OnBehalfSelector, type OnBehalfData, isOnBehalfActive } from '@/components/shared/OnBehalfSelector';

interface SleepLogFormProps {
  clientId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function generateId() {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
}

export function SleepLogForm({ clientId, open, onOpenChange }: SleepLogFormProps) {
  const { addEntry, isAdding } = useSleepEntries(clientId);

  const [bedtime, setBedtime] = useState('22:00');
  const [wakeTime, setWakeTime] = useState('06:00');
  const [awakeningEvents, setAwakeningEvents] = useState<AwakeningEvent[]>([]);
  const [restlessness, setRestlessness] = useState(false);
  const [dayNap, setDayNap] = useState(false);
  const [dayNapDuration, setDayNapDuration] = useState('');
  const [assistanceTypes, setAssistanceTypes] = useState<string[]>([]);
  const [assistanceOther, setAssistanceOther] = useState('');
  const [notes, setNotes] = useState('');
  const [showSeizurePrompt, setShowSeizurePrompt] = useState(false);
  const [showPainPrompt, setShowPainPrompt] = useState(false);
  const [onBehalfData, setOnBehalfData] = useState<OnBehalfData>({ onBehalfUserId: null, onBehalfName: null, onBehalfRole: null, onBehalfReason: null });

  // Auto-calculate hours
  const estimatedHours = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const bedDate = new Date(`${today}T${bedtime}:00`);
    let wakeDate = new Date(`${today}T${wakeTime}:00`);
    if (wakeDate <= bedDate) {
      wakeDate.setDate(wakeDate.getDate() + 1);
    }
    const mins = differenceInMinutes(wakeDate, bedDate);
    return Math.round((mins / 60) * 100) / 100;
  }, [bedtime, wakeTime]);

  const totalAwakeMinutes = useMemo(() => estimateAwakeMinutes(awakeningEvents), [awakeningEvents]);

  const addAwakening = () => {
    setAwakeningEvents(prev => [...prev, {
      id: generateId(),
      duration_category: '10_to_30',
    }]);
  };

  const updateAwakening = (id: string, updates: Partial<AwakeningEvent>) => {
    setAwakeningEvents(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
    // Cross-module prompts
    if (updates.reason === 'seizure') setShowSeizurePrompt(true);
    if (updates.reason === 'pain') setShowPainPrompt(true);
  };

  const removeAwakening = (id: string) => {
    setAwakeningEvents(prev => prev.filter(e => e.id !== id));
  };

  const toggleAssistance = (type: string) => {
    setAssistanceTypes(prev => {
      const next = prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type];
      if (type === 'seizure' && !prev.includes('seizure')) setShowSeizurePrompt(true);
      if (type === 'pain' && !prev.includes('pain')) setShowPainPrompt(true);
      return next;
    });
  };

  const handleSubmit = () => {
    const today = new Date().toISOString().split('T')[0];
    const bedDatetime = new Date(`${today}T${bedtime}:00`).toISOString();
    let wakeDatetime = new Date(`${today}T${wakeTime}:00`);
    if (new Date(bedDatetime) >= wakeDatetime) {
      wakeDatetime.setDate(wakeDatetime.getDate() + 1);
    }

    const active = isOnBehalfActive(onBehalfData);
    addEntry({
      bedtime: bedDatetime,
      wake_time: wakeDatetime.toISOString(),
      estimated_hours_slept: estimatedHours,
      number_of_awakenings: awakeningEvents.length,
      awake_period_length: null,
      awakening_events: awakeningEvents,
      restlessness,
      day_nap: dayNap,
      day_nap_duration_minutes: dayNap && dayNapDuration ? parseInt(dayNapDuration) : null,
      assistance_types: assistanceTypes,
      assistance_other_text: assistanceTypes.includes('other') ? assistanceOther : null,
      notes: notes || null,
      event_occurred_at: new Date().toISOString(),
      recorded_on_behalf_of_name: active ? onBehalfData.onBehalfName : null,
      recorded_on_behalf_of_role: active ? onBehalfData.onBehalfRole : null,
      recorded_on_behalf_of_reason: active ? onBehalfData.onBehalfReason : null,
    });

    // Reset form
    setBedtime('22:00');
    setWakeTime('06:00');
    setAwakeningEvents([]);
    setRestlessness(false);
    setDayNap(false);
    setDayNapDuration('');
    setAssistanceTypes([]);
    setAssistanceOther('');
    setNotes('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Moon className="h-5 w-5" />
            Log Sleep
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Bedtime & Wake time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Bedtime</Label>
              <Input type="time" value={bedtime} onChange={e => setBedtime(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Wake-up time</Label>
              <Input type="time" value={wakeTime} onChange={e => setWakeTime(e.target.value)} />
            </div>
          </div>

          {/* Auto-calculated hours */}
          <div className="p-3 bg-muted rounded-lg text-center">
            <p className="text-sm text-muted-foreground">Estimated sleep</p>
            <p className="text-2xl font-bold">{estimatedHours.toFixed(1)} hours</p>
          </div>

          {/* Structured Awakening Events */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Night Awakenings</Label>
              <Button type="button" variant="outline" size="sm" onClick={addAwakening} className="gap-1">
                <Plus className="h-3.5 w-3.5" />
                Add Awakening
              </Button>
            </div>

            {awakeningEvents.length > 0 && (
              <div className="space-y-2">
                {awakeningEvents.map((event, idx) => (
                  <div key={event.id} className="p-3 border rounded-lg bg-card space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Awakening {idx + 1}</span>
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeAwakening(event.id)} className="h-7 w-7 p-0">
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Duration</Label>
                        <Select value={event.duration_category} onValueChange={v => updateAwakening(event.id, { duration_category: v as AwakePeriodLength })}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {AWAKE_PERIOD_OPTIONS.map(o => (
                              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Time (optional)</Label>
                        <Input type="time" className="h-8 text-xs" value={event.time || ''} onChange={e => updateAwakening(event.id, { time: e.target.value || undefined })} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Reason (optional)</Label>
                      <Select value={event.reason || ''} onValueChange={v => updateAwakening(event.id, { reason: (v || undefined) as AwakeningReason })}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select reason" /></SelectTrigger>
                        <SelectContent>
                          {AWAKENING_REASONS.map(r => (
                            <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {event.reason === 'other' && (
                      <Input placeholder="Describe reason" className="h-8 text-xs" value={event.reason_other_text || ''} onChange={e => updateAwakening(event.id, { reason_other_text: e.target.value })} />
                    )}
                  </div>
                ))}

                {/* Summary */}
                <div className="p-2 bg-muted rounded text-xs text-muted-foreground text-center">
                  {awakeningEvents.length} awakening{awakeningEvents.length !== 1 ? 's' : ''} • ~{totalAwakeMinutes} min awake
                </div>
              </div>
            )}
          </div>

          {/* Restlessness */}
          <div className="flex items-center justify-between">
            <Label>Restlessness / agitation</Label>
            <Switch checked={restlessness} onCheckedChange={setRestlessness} />
          </div>

          {/* Night assistance */}
          <div className="space-y-3">
            <Label>Assistance required during night</Label>
            <div className="grid grid-cols-2 gap-2">
              {ASSISTANCE_TYPES.map(t => (
                <label key={t.value} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={assistanceTypes.includes(t.value)}
                    onCheckedChange={() => toggleAssistance(t.value)}
                  />
                  <span className="text-sm">{t.label}</span>
                </label>
              ))}
            </div>
            {assistanceTypes.includes('other') && (
              <Input placeholder="Describe assistance" value={assistanceOther} onChange={e => setAssistanceOther(e.target.value)} />
            )}
          </div>

          {/* Cross-module prompts */}
          {showSeizurePrompt && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <div className="text-sm text-amber-800">
                <strong>Seizure noted.</strong> Consider completing the Seizure Chart module after saving.
                <Button variant="ghost" size="sm" className="ml-2 h-6 text-xs" onClick={() => setShowSeizurePrompt(false)}>Dismiss</Button>
              </div>
            </div>
          )}
          {showPainPrompt && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <div className="text-sm text-amber-800">
                <strong>Pain noted.</strong> Consider completing a Pain Assessment after saving.
                <Button variant="ghost" size="sm" className="ml-2 h-6 text-xs" onClick={() => setShowPainPrompt(false)}>Dismiss</Button>
              </div>
            </div>
          )}

          {/* Day nap */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Day nap</Label>
              <Switch checked={dayNap} onCheckedChange={setDayNap} />
            </div>
            {dayNap && (
              <div className="space-y-2 pl-4 border-l-2 border-muted">
                <div className="space-y-1">
                  <Label className="text-xs">Duration (minutes)</Label>
                  <Input type="number" placeholder="30" value={dayNapDuration} onChange={e => setDayNapDuration(e.target.value)} />
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea placeholder="Additional observations..." value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isAdding}>
            {isAdding && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Sleep Log
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
