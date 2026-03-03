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
  const [method, setMethod] = useState(config?.feeding_type || '');
  const [notes, setNotes] = useState('');
  const [positionAngle, setPositionAngle] = useState('');
  const [positionConfirmed, setPositionConfirmed] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');

  const minAngle = config?.position_angle_min ?? 30;
  const angleNum = positionAngle ? parseInt(positionAngle) : null;
  const isBelowThreshold = angleNum !== null && angleNum < minAngle;
  const canProceed = positionConfirmed || (isBelowThreshold && overrideReason.trim());

  const resetForm = () => {
    setScheduledTime('');
    setFeedVolume('');
    setRate('');
    setFlushGiven(String((config?.flush_before_feed_ml || 0) + (config?.flush_after_feed_ml || 0)));
    setMethod(config?.feeding_type || '');
    setNotes('');
    setPositionAngle('');
    setPositionConfirmed(false);
    setOverrideReason('');
  };

  const handleSubmit = () => {
    if (!feedVolume) return;

    logFeed.mutate({
      scheduled_time: scheduledTime || null,
      feed_volume_ml: parseInt(feedVolume),
      rate_ml_per_hour: rate ? parseInt(rate) : null,
      flush_given_ml: parseInt(flushGiven) || 0,
      method: (method || null) as any,
      position_confirmed: positionConfirmed,
      position_angle: angleNum,
      position_override_reason: isBelowThreshold ? overrideReason : null,
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

          {/* Position Check */}
          <div className="space-y-2">
            <Label>Position Angle (°)</Label>
            <Input
              type="number"
              min={0}
              max={90}
              placeholder={`Minimum ${minAngle}°`}
              value={positionAngle}
              onChange={e => {
                setPositionAngle(e.target.value);
                const v = parseInt(e.target.value);
                if (!isNaN(v) && v >= minAngle) {
                  setPositionConfirmed(true);
                  setOverrideReason('');
                } else {
                  setPositionConfirmed(false);
                }
              }}
            />
            {positionConfirmed && !isBelowThreshold && (
              <div className="flex items-center gap-2 text-success text-sm">
                <CheckCircle2 className="h-4 w-4" /> Safe positioning confirmed
              </div>
            )}
            {isBelowThreshold && (
              <>
                <Alert className="border-destructive bg-destructive/10">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <AlertDescription className="text-destructive text-sm">
                    Position below safe threshold ({minAngle}°). Risk of aspiration. Reposition before proceeding.
                  </AlertDescription>
                </Alert>
                <Label>Override Reason (required)</Label>
                <Textarea
                  placeholder="Explain why proceeding at this angle..."
                  value={overrideReason}
                  onChange={e => setOverrideReason(e.target.value)}
                />
              </>
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

          {/* Rate */}
          {(config?.feeding_type === 'continuous' || method === 'pump') && (
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

          {/* Method */}
          <div className="space-y-2">
            <Label>Method</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
              <SelectContent>
                {FEED_METHODS.map(m => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes..." />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!feedVolume || (!canProceed && positionAngle !== '') || logFeed.isPending}
            className="w-full"
          >
            {logFeed.isPending ? 'Saving...' : 'Log Feed'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
