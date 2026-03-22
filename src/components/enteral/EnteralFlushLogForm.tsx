/**
 * Enteral Flush Log Form - Separate form for logging flushes
 */

import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLogEnteralFlush } from '@/hooks/useEnteral';
import { useCurrentStaff } from '@/hooks/useCurrentStaff';
import type { EnteralConfig } from '@/types/enteral';

const FLUSH_REASONS = [
  { value: 'flush_before_feed', label: 'Flush Before Feed' },
  { value: 'flush_after_feed', label: 'Flush After Feed' },
  { value: 'flush_before_medication', label: 'Flush Before Medication' },
  { value: 'flush_after_medication', label: 'Flush After Medication' },
  { value: 'routine_flush', label: 'Routine Flush' },
  { value: 'extra_hydration', label: 'Extra Hydration' },
  { value: 'tube_blocked', label: 'Tube Blocked' },
] as const;

interface EnteralFlushLogFormProps {
  clientId?: string;
  config?: EnteralConfig;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EnteralFlushLogForm({ clientId, config, open, onOpenChange }: EnteralFlushLogFormProps) {
  const { staffName } = useCurrentStaff();
  const logFlush = useLogEnteralFlush(clientId);

  const [scheduledTime, setScheduledTime] = useState('');
  const [flushReason, setFlushReason] = useState('');
  const [flushVolume, setFlushVolume] = useState('');
  const [notes, setNotes] = useState('');

  // Derive scheduled standalone flush times from the feeding schedule
  const scheduleTimes = useMemo(() => {
    const items: { value: string; label: string }[] = [];
    if (Array.isArray(config?.feeding_schedule)) {
      for (const entry of config.feeding_schedule) {
        const e = entry as any;
        if (e.type === 'flush' && e.time) {
          items.push({ value: e.time, label: `Scheduled Flush — ${e.time}` });
        }
      }
    }
    // Fallback to legacy feed_schedule_times if feeding_schedule is empty
    if (items.length === 0 && Array.isArray(config?.feed_schedule_times)) {
      for (const t of config.feed_schedule_times) {
        items.push({ value: t, label: `Scheduled Flush — ${t}` });
      }
    }
    items.sort((a, b) => a.value.localeCompare(b.value));
    // Always add Extra Water option
    items.push({ value: 'extra_water', label: 'Extra Water (unscheduled)' });
    return items;
  }, [config?.feeding_schedule, config?.feed_schedule_times]);

  // Set default volume based on reason and config
  const handleReasonChange = (reason: string) => {
    setFlushReason(reason);
    if (reason === 'flush_before_feed' && config?.flush_before_feed_ml) {
      setFlushVolume(String(config.flush_before_feed_ml));
    } else if (reason === 'flush_after_feed' && config?.flush_after_feed_ml) {
      setFlushVolume(String(config.flush_after_feed_ml));
    } else if (reason === 'flush_before_medication' && config?.flush_before_med_ml) {
      setFlushVolume(String(config.flush_before_med_ml));
    } else if (reason === 'flush_after_medication' && config?.flush_after_med_ml) {
      setFlushVolume(String(config.flush_after_med_ml));
    } else if (!flushVolume) {
      setFlushVolume('50');
    }
  };

  const resetForm = () => {
    setScheduledTime('');
    setFlushReason('');
    setFlushVolume('');
    setNotes('');
  };

  const handleSubmit = () => {
    if (!flushReason || !flushVolume) return;

    logFlush.mutate({
      flush_reason: flushReason,
      flush_volume_ml: parseInt(flushVolume),
      notes: notes || null,
    }, {
      onSuccess: () => {
        resetForm();
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log Flush</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Logged by */}
          <div className="text-sm text-muted-foreground">
            Logged by: <strong>{staffName}</strong>
          </div>

          {/* Scheduled Time */}
          {scheduleTimes.length > 0 && (
            <div className="space-y-2">
              <Label>Scheduled Time</Label>
              <Select value={scheduledTime} onValueChange={setScheduledTime}>
                <SelectTrigger><SelectValue placeholder="Select scheduled time" /></SelectTrigger>
                <SelectContent>
                  {scheduleTimes.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Flush Reason */}
          <div className="space-y-2">
            <Label>Flush Reason *</Label>
            <Select value={flushReason} onValueChange={handleReasonChange}>
              <SelectTrigger><SelectValue placeholder="Select reason for flush" /></SelectTrigger>
              <SelectContent>
                {FLUSH_REASONS.map(r => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Flush Volume */}
          <div className="space-y-2">
            <Label>Flush Volume (mL) *</Label>
            <Input type="number" min={0} value={flushVolume} onChange={e => setFlushVolume(e.target.value)} placeholder="e.g. 50" />
            {flushReason === 'flush_before_feed' && config?.flush_before_feed_ml && (
              <p className="text-xs text-muted-foreground">Prescribed: {config.flush_before_feed_ml}mL before feed</p>
            )}
            {flushReason === 'flush_after_feed' && config?.flush_after_feed_ml && (
              <p className="text-xs text-muted-foreground">Prescribed: {config.flush_after_feed_ml}mL after feed</p>
            )}
            {flushReason === 'flush_before_medication' && config?.flush_before_med_ml && (
              <p className="text-xs text-muted-foreground">Prescribed: {config.flush_before_med_ml}mL before medication</p>
            )}
            {flushReason === 'flush_after_medication' && config?.flush_after_med_ml && (
              <p className="text-xs text-muted-foreground">Prescribed: {config.flush_after_med_ml}mL after medication</p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes..." />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!flushReason || !flushVolume || logFlush.isPending}
            className="w-full"
          >
            {logFlush.isPending ? 'Saving...' : 'Log Flush'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
