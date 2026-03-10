/**
 * Skin Check Form with Interactive Body Map
 */

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { useSkinChecks, usePressureAreaConfig } from '@/hooks/usePressureArea';
import { HIGH_RISK_AREAS } from '@/types/pressureArea';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { InteractiveBodyMap, type AreaCheckResult } from './InteractiveBodyMap';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
  clientId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SkinCheckForm({ clientId, open, onOpenChange }: Props) {
  const { logSkinCheck, isLogging } = useSkinChecks(clientId);
  const { config } = usePressureAreaConfig(clientId);
  const [areaResults, setAreaResults] = useState<Record<string, AreaCheckResult>>({});
  const [notes, setNotes] = useState('');
  const [selectedScheduledTime, setSelectedScheduledTime] = useState<string>('');

  // Determine next uncompleted scheduled time as default
  const scheduledTimes = config?.skin_check_times || [];

  const handleResultChange = (areaId: string, result: AreaCheckResult) => {
    setAreaResults(prev => ({ ...prev, [areaId]: result }));
  };

  const hasRedFinding = Object.values(areaResults).some(r => r.status === 'finding' && r.severity === 'red');
  const hasAmberFinding = Object.values(areaResults).some(r => r.status === 'finding' && r.severity === 'amber');
  const overallStatus = hasRedFinding ? 'red' : hasAmberFinding ? 'amber' : 'healthy';

  const checkedCount = Object.values(areaResults).filter(r => r.status !== 'unchecked').length;

  const handleSubmit = () => {
    // Save ALL checked areas — ok, unable, and findings — for full transparency
    const markers = Object.values(areaResults)
      .filter(r => r.status !== 'unchecked')
      .map(r => ({
        location: r.areaId,
        finding_type: r.status === 'finding' ? r.findingType! : r.status, // 'ok' | 'unable' | finding type
        severity: r.status === 'finding' ? (r.severity as string) : r.status, // 'ok' | 'unable' | 'amber' | 'red'
        notes: r.notes || null,
      }));

    logSkinCheck({
      session: {
        overall_status: overallStatus as 'healthy' | 'amber' | 'red',
        notes: notes || null,
        event_occurred_at: new Date().toISOString(),
        scheduled_time: selectedScheduledTime || null,
      },
      markers,
    });

    setAreaResults({});
    setNotes('');
    setSelectedScheduledTime('');
    setNotes('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Skin Check – Bony Prominences</DialogTitle>
          <DialogDescription>Tap each area on the body map or use the checklist below. Mark as OK, record a finding, or mark as unable to check.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Scheduled Time Selector */}
          {scheduledTimes.length > 0 && (
            <div>
              <Label>Which scheduled skin check is this for?</Label>
              <Select value={selectedScheduledTime} onValueChange={setSelectedScheduledTime}>
                <SelectTrigger className="w-48 mt-1">
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  {scheduledTimes.map(time => (
                    <SelectItem key={time} value={time}>{time} Skin Check</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Active Pressure Area Warning */}
          {hasRedFinding && (
            <Card className="border-destructive/40 bg-destructive/5">
              <CardContent className="py-3">
                <div className="flex gap-2">
                  <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-destructive">Active Pressure Area</p>
                    <p>Avoid pressure on affected area where safe. Seek medical/health advice.</p>
                    <p className="text-xs mt-1 text-muted-foreground">Do not compromise swallow safety; consider safe positioning when eating if sacrum affected.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Interactive Body Map */}
          <InteractiveBodyMap results={areaResults} onResultChange={handleResultChange} />

          {/* General Notes */}
          <div>
            <Label>General Notes (optional)</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Overall observations" />
          </div>
        </div>

        <DialogFooter>
          <p className="text-xs text-muted-foreground">{checkedCount} of {HIGH_RISK_AREAS.length} areas assessed</p>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isLogging || checkedCount === 0}>
            {isLogging ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
            Record Skin Check
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
