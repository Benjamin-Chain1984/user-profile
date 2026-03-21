/**
 * Enteral Feed Log Form
 * Combines flush-before → feed → flush-after into a single workflow.
 */

import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Info, CheckCircle2, Droplets } from 'lucide-react';
import { useLogEnteralFeedWithFlushes } from '@/hooks/useEnteral';
import { useCurrentStaff } from '@/hooks/useCurrentStaff';
import { FEED_METHODS, type EnteralConfig } from '@/types/enteral';

interface EnteralFeedLogFormProps {
  clientId?: string;
  config?: EnteralConfig;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EnteralFeedLogForm({ clientId, config, open, onOpenChange }: EnteralFeedLogFormProps) {
  const { staffName } = useCurrentStaff();
  const logFeedWithFlushes = useLogEnteralFeedWithFlushes(clientId);

  const [scheduledTime, setScheduledTime] = useState('');
  const [flushBefore, setFlushBefore] = useState('');
  const [feedVolume, setFeedVolume] = useState('');
  const [flushAfter, setFlushAfter] = useState('');
  const [rate, setRate] = useState('');
  const [notes, setNotes] = useState('');
  const [positionConfirmed, setPositionConfirmed] = useState(false);

  const configMethod = config?.feeding_type || null;
  const methodLabel = FEED_METHODS.find(m => m.value === configMethod)?.label || configMethod;

  // Derive feed schedule entries (only type === 'feed')
  const feedScheduleEntries = useMemo(() => {
    if (!Array.isArray(config?.feeding_schedule)) return [];
    return config.feeding_schedule
      .filter((entry: any) => entry.type === 'feed')
      .sort((a: any, b: any) => (a.time || '').localeCompare(b.time || ''))
      .map((entry: any, idx: number) => ({
        id: entry.id,
        time: entry.time || '',
        label: `Feed ${idx + 1} — ${entry.time || 'No time'}`,
        feed_ml: entry.feed_ml || 0,
        flush_before_ml: entry.flush_before_ml || 0,
        flush_after_ml: entry.flush_after_ml || 0,
      }));
  }, [config?.feeding_schedule]);

  // Get recommended amounts based on selected scheduled time
  const selectedEntry = useMemo(() => {
    if (!scheduledTime) return null;
    return feedScheduleEntries.find(e => e.time === scheduledTime) || null;
  }, [feedScheduleEntries, scheduledTime]);

  const recommendedAmount = selectedEntry?.feed_ml || null;

  // Pre-fill flush defaults from config when form opens or config changes
  const defaultFlushBefore = config?.flush_before_feed_ml || 30;
  const defaultFlushAfter = config?.flush_after_feed_ml || 30;

  // Set defaults when dialog opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setFlushBefore(String(defaultFlushBefore));
      setFlushAfter(String(defaultFlushAfter));
    }
    onOpenChange(isOpen);
  };

  const resetForm = () => {
    setScheduledTime('');
    setFlushBefore('');
    setFeedVolume('');
    setFlushAfter('');
    setRate('');
    setNotes('');
    setPositionConfirmed(false);
  };

  const flushBeforeVal = parseInt(flushBefore) || 0;
  const feedVal = parseInt(feedVolume) || 0;
  const flushAfterVal = parseInt(flushAfter) || 0;
  const totalVolume = flushBeforeVal + feedVal + flushAfterVal;

  const handleSubmit = () => {
    if (!feedVolume || !positionConfirmed) return;

    logFeedWithFlushes.mutate({
      feed: {
        scheduled_time: scheduledTime || null,
        feed_volume_ml: feedVal,
        rate_ml_per_hour: rate ? parseInt(rate) : null,
        flush_given_ml: flushBeforeVal + flushAfterVal,
        method: (configMethod || null) as any,
        position_confirmed: positionConfirmed,
        position_angle: null,
        position_override_reason: null,
        notes: notes || null,
      },
      flushBeforeMl: flushBeforeVal,
      flushAfterMl: flushAfterVal,
    }, {
      onSuccess: () => {
        resetForm();
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log Feed</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Logged by */}
          <div className="text-sm text-muted-foreground">
            Logged by: <strong>{staffName}</strong>
          </div>

          {/* Position Confirmation */}
          <div className="space-y-2">
            <div className="flex items-start gap-3 rounded-lg border p-3">
              <Checkbox
                id="position-confirm"
                checked={positionConfirmed}
                onCheckedChange={(checked) => setPositionConfirmed(checked === true)}
                className="mt-0.5"
              />
              <label htmlFor="position-confirm" className="text-sm cursor-pointer">
                <span className="font-medium">Confirm safe positioning</span>
                <p className="text-muted-foreground text-xs mt-0.5">
                  Person is sitting upright at least 30–45° during feeding
                </p>
              </label>
            </div>
            {positionConfirmed && (
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <CheckCircle2 className="h-4 w-4" /> Safe positioning confirmed
              </div>
            )}
          </div>

          {/* Scheduled Time */}
          {feedScheduleEntries.length > 0 && (
            <div className="space-y-2">
              <Label>Scheduled Feed</Label>
              <Select value={scheduledTime} onValueChange={setScheduledTime}>
                <SelectTrigger><SelectValue placeholder="Select scheduled feed" /></SelectTrigger>
                <SelectContent>
                  {feedScheduleEntries.map(entry => (
                    <SelectItem key={entry.id} value={entry.time}>{entry.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Recommended Feed Amount */}
          {recommendedAmount && (
            <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
              <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div className="text-sm">
                <span className="font-medium text-primary">Recommended: {recommendedAmount} mL</span>
                <p className="text-xs text-muted-foreground mt-0.5">Based on feeding schedule</p>
              </div>
            </div>
          )}

          {/* Step 1: Flush Before Feed */}
          <div className="space-y-2 rounded-lg border border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/30 p-3">
            <div className="flex items-center gap-2">
              <Droplets className="h-4 w-4 text-blue-500" />
              <Label className="text-sm font-semibold">Step 1 — Water Flush Before Feed (mL)</Label>
            </div>
            <Input
              type="number"
              min={0}
              value={flushBefore}
              onChange={e => setFlushBefore(e.target.value)}
              placeholder={`e.g. ${defaultFlushBefore}`}
            />
            <p className="text-xs text-muted-foreground">Prescribed: {defaultFlushBefore}mL before feed</p>
          </div>

          {/* Step 2: Feed Volume */}
          <div className="space-y-2 rounded-lg border border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/30 p-3">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-semibold">Step 2 — Feed Volume (mL) *</Label>
            </div>
            <Input
              type="number"
              min={0}
              value={feedVolume}
              onChange={e => setFeedVolume(e.target.value)}
              placeholder={recommendedAmount ? `e.g. ${recommendedAmount}` : 'e.g. 250'}
            />
          </div>

          {/* Step 3: Flush After Feed */}
          <div className="space-y-2 rounded-lg border border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/30 p-3">
            <div className="flex items-center gap-2">
              <Droplets className="h-4 w-4 text-blue-500" />
              <Label className="text-sm font-semibold">Step 3 — Water Flush After Feed (mL)</Label>
            </div>
            <Input
              type="number"
              min={0}
              value={flushAfter}
              onChange={e => setFlushAfter(e.target.value)}
              placeholder={`e.g. ${defaultFlushAfter}`}
            />
            <p className="text-xs text-muted-foreground">Prescribed: {defaultFlushAfter}mL after feed</p>
          </div>

          {/* Total Summary */}
          <div className="rounded-lg border bg-muted/40 p-3 text-sm space-y-1">
            <p className="font-semibold">Total Volume Summary</p>
            <div className="flex justify-between"><span className="text-muted-foreground">Flush before</span><span>{flushBeforeVal} mL</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Feed</span><span>{feedVal} mL</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Flush after</span><span>{flushAfterVal} mL</span></div>
            <div className="flex justify-between font-semibold border-t pt-1 mt-1"><span>Total</span><span>{totalVolume} mL</span></div>
          </div>

          {/* Rate - only for continuous/pump */}
          {configMethod === 'continuous' && (
            <div className="space-y-2">
              <Label>Rate (mL/hr)</Label>
              <Input type="number" min={0} value={rate} onChange={e => setRate(e.target.value)} placeholder="e.g. 100" />
            </div>
          )}

          {/* Method - read-only from config */}
          {configMethod && (
            <div className="space-y-1">
              <Label className="text-muted-foreground">Method</Label>
              <p className="text-sm font-medium">{methodLabel}</p>
              <p className="text-xs text-muted-foreground">Set in module settings</p>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes..." />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!feedVolume || !positionConfirmed || logFeedWithFlushes.isPending}
            className="w-full"
          >
            {logFeedWithFlushes.isPending ? 'Saving...' : 'Log Feed'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
