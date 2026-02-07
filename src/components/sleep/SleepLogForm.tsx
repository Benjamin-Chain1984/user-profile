/**
 * Sleep Log Form - Daily sleep data entry
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
import { AWAKE_PERIOD_OPTIONS, ASSISTANCE_TYPES } from '@/types/sleep';
import type { AwakePeriodLength } from '@/types/sleep';
import { differenceInMinutes, parseISO } from 'date-fns';
import { Loader2, Moon, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SleepLogFormProps {
  clientId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SleepLogForm({ clientId, open, onOpenChange }: SleepLogFormProps) {
  const { addEntry, isAdding } = useSleepEntries(clientId);
  const { toast } = useToast();

  const [bedtime, setBedtime] = useState('22:00');
  const [wakeTime, setWakeTime] = useState('06:00');
  const [awakenings, setAwakenings] = useState(0);
  const [awakePeriod, setAwakePeriod] = useState<AwakePeriodLength | ''>('');
  const [restlessness, setRestlessness] = useState(false);
  const [dayNap, setDayNap] = useState(false);
  const [dayNapDuration, setDayNapDuration] = useState('');
  const [assistanceTypes, setAssistanceTypes] = useState<string[]>([]);
  const [assistanceOther, setAssistanceOther] = useState('');
  const [notes, setNotes] = useState('');
  const [showSeizurePrompt, setShowSeizurePrompt] = useState(false);
  const [showPainPrompt, setShowPainPrompt] = useState(false);

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

    addEntry({
      bedtime: bedDatetime,
      wake_time: wakeDatetime.toISOString(),
      estimated_hours_slept: estimatedHours,
      number_of_awakenings: awakenings,
      awake_period_length: (awakePeriod as AwakePeriodLength) || null,
      restlessness,
      day_nap: dayNap,
      day_nap_duration_minutes: dayNap && dayNapDuration ? parseInt(dayNapDuration) : null,
      assistance_types: assistanceTypes,
      assistance_other_text: assistanceTypes.includes('other') ? assistanceOther : null,
      notes: notes || null,
      event_occurred_at: new Date().toISOString(),
    });

    // Reset form
    setBedtime('22:00');
    setWakeTime('06:00');
    setAwakenings(0);
    setAwakePeriod('');
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

          {/* Awakenings */}
          <div className="space-y-2">
            <Label>Number of awakenings</Label>
            <div className="flex items-center gap-3">
              <Button type="button" variant="outline" size="sm" onClick={() => setAwakenings(Math.max(0, awakenings - 1))}>−</Button>
              <span className="text-lg font-medium w-8 text-center">{awakenings}</span>
              <Button type="button" variant="outline" size="sm" onClick={() => setAwakenings(awakenings + 1)}>+</Button>
            </div>
          </div>

          {/* Awake period length */}
          {awakenings > 0 && (
            <div className="space-y-2">
              <Label>Awake period length</Label>
              <Select value={awakePeriod} onValueChange={v => setAwakePeriod(v as AwakePeriodLength)}>
                <SelectTrigger><SelectValue placeholder="Select duration" /></SelectTrigger>
                <SelectContent>
                  {AWAKE_PERIOD_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

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
