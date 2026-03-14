/**
 * Enteral Feed Log Form
 */

import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { useLogEnteralFeed } from '@/hooks/useEnteral';
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
  const logFeed = useLogEnteralFeed(clientId);

  const [scheduledTime, setScheduledTime] = useState('');
  const [feedVolume, setFeedVolume] = useState('');
  const [rate, setRate] = useState('');
  const [notes, setNotes] = useState('');
  const [positionConfirmed, setPositionConfirmed] = useState(false);

  // Method comes from config - not user-selectable
  const configMethod = config?.feeding_type || null;
  const methodLabel = FEED_METHODS.find(m => m.value === configMethod)?.label || configMethod;

  // Derive all unique times from the feeding schedule configured in settings
  const scheduleTimes = useMemo(() => {
    const times = new Set<string>();
    if (Array.isArray(config?.feeding_schedule)) {
      for (const entry of config.feeding_schedule) {
        if ((entry as any).time) times.add((entry as any).time);
      }
    }
    if (times.size === 0 && Array.isArray(config?.feed_schedule_times)) {
      for (const t of config.feed_schedule_times) {
        times.add(t);
      }
    }
    return Array.from(times).sort();
  }, [config?.feeding_schedule, config?.feed_schedule_times]);

  // Get recommended feed amount from feeding schedule
  const recommendedAmount = useMemo(() => {
    if (!config?.feeding_schedule || !Array.isArray(config.feeding_schedule)) return null;
    const formulaFeeds = config.feeding_schedule.filter(
      (e: any) => e.activity === 'formula_feed'
    );
    if (formulaFeeds.length === 0) return null;
    if (scheduledTime) {
      const match = formulaFeeds.find((e: any) => e.time === scheduledTime);
      if (match) return (match as any).amount_ml;
    }
    const amounts = formulaFeeds.map((e: any) => (e as any).amount_ml);
    return amounts[0] || null;
  }, [config?.feeding_schedule, scheduledTime]);

  const resetForm = () => {
    setScheduledTime('');
    setFeedVolume('');
    setRate('');
    setNotes('');
    setPositionConfirmed(false);
  };

  const handleSubmit = () => {
    if (!feedVolume || !positionConfirmed) return;

    logFeed.mutate({
      scheduled_time: scheduledTime || null,
      feed_volume_ml: parseInt(feedVolume),
      rate_ml_per_hour: rate ? parseInt(rate) : null,
      flush_given_ml: 0,
      method: (configMethod || null) as any,
      position_confirmed: positionConfirmed,
      position_angle: null,
      position_override_reason: null,
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

          {/* Feed Volume */}
          <div className="space-y-2">
            <Label>Feed Volume (mL) *</Label>
            <Input
              type="number"
              min={0}
              value={feedVolume}
              onChange={e => setFeedVolume(e.target.value)}
              placeholder={recommendedAmount ? `e.g. ${recommendedAmount}` : 'e.g. 250'}
            />
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
            disabled={!feedVolume || !positionConfirmed || logFeed.isPending}
            className="w-full"
          >
            {logFeed.isPending ? 'Saving...' : 'Log Feed'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
