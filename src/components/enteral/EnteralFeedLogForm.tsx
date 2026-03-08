/**
 * Enteral Feed Log Form
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
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
  const [flushGiven, setFlushGiven] = useState(
    String((config?.flush_before_feed_ml || 0) + (config?.flush_after_feed_ml || 0))
  );
  const [notes, setNotes] = useState('');
  const [positionConfirmed, setPositionConfirmed] = useState(false);

  // Method comes from config - not user-selectable
  const configMethod = config?.feeding_type || null;
  const methodLabel = FEED_METHODS.find(m => m.value === configMethod)?.label || configMethod;

  const resetForm = () => {
    setScheduledTime('');
    setFeedVolume('');
    setRate('');
    setFlushGiven(String((config?.flush_before_feed_ml || 0) + (config?.flush_after_feed_ml || 0)));
    setNotes('');
    setPositionConfirmed(false);
  };

  const handleSubmit = () => {
    if (!feedVolume || !positionConfirmed) return;

    logFeed.mutate({
      scheduled_time: scheduledTime || null,
      feed_volume_ml: parseInt(feedVolume),
      rate_ml_per_hour: rate ? parseInt(rate) : null,
      flush_given_ml: parseInt(flushGiven) || 0,
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
          {config?.feed_schedule_times && config.feed_schedule_times.length > 0 && (
            <div className="space-y-2">
              <Label>Scheduled Time</Label>
              <Select value={scheduledTime} onValueChange={setScheduledTime}>
                <SelectTrigger><SelectValue placeholder="Select scheduled time" /></SelectTrigger>
                <SelectContent>
                  {config.feed_schedule_times.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Feed Volume */}
          <div className="space-y-2">
            <Label>Feed Volume (mL) *</Label>
            <Input type="number" min={0} value={feedVolume} onChange={e => setFeedVolume(e.target.value)} placeholder="e.g. 250" />
          </div>

          {/* Rate - only for continuous/pump */}
          {configMethod === 'continuous' && (
            <div className="space-y-2">
              <Label>Rate (mL/hr)</Label>
              <Input type="number" min={0} value={rate} onChange={e => setRate(e.target.value)} placeholder="e.g. 100" />
            </div>
          )}

          {/* Flush */}
          <div className="space-y-2">
            <Label>Flush Given (mL)</Label>
            <Input type="number" min={0} value={flushGiven} onChange={e => setFlushGiven(e.target.value)} />
            {config && (
              <p className="text-xs text-muted-foreground">
                Prescribed: {config.flush_before_feed_ml}ml before + {config.flush_after_feed_ml}ml after
              </p>
            )}
          </div>

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
