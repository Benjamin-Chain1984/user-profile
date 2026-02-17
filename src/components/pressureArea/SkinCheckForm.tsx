/**
 * Skin Check Form with Body Map
 */

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { useSkinChecks } from '@/hooks/usePressureArea';
import { HIGH_RISK_AREAS, SKIN_FINDING_TYPES, type SkinFindingMarker } from '@/types/pressureArea';
import { Loader2, CheckCircle2, AlertCircle, Plus, Trash2 } from 'lucide-react';

interface Props {
  clientId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FindingEntry {
  id: string;
  location: string;
  finding_type: string;
  severity: 'amber' | 'red';
  notes: string;
}

export function SkinCheckForm({ clientId, open, onOpenChange }: Props) {
  const { logSkinCheck, isLogging } = useSkinChecks(clientId);
  const [findings, setFindings] = useState<FindingEntry[]>([]);
  const [notes, setNotes] = useState('');

  const addFinding = () => {
    setFindings(prev => [...prev, {
      id: crypto.randomUUID(),
      location: '',
      finding_type: '',
      severity: 'amber',
      notes: '',
    }]);
  };

  const removeFinding = (id: string) => {
    setFindings(prev => prev.filter(f => f.id !== id));
  };

  const updateFinding = (id: string, field: string, value: string) => {
    setFindings(prev => prev.map(f => {
      if (f.id !== id) return f;
      const updated = { ...f, [field]: value };
      if (field === 'finding_type') {
        const findingDef = SKIN_FINDING_TYPES.find(t => t.id === value);
        if (findingDef) updated.severity = findingDef.severity;
      }
      return updated;
    }));
  };

  const hasRedFinding = findings.some(f => f.severity === 'red');
  const hasAmberFinding = findings.some(f => f.severity === 'amber');
  const overallStatus = hasRedFinding ? 'red' : hasAmberFinding ? 'amber' : 'healthy';

  const handleSubmit = () => {
    const markers = findings
      .filter(f => f.location && f.finding_type)
      .map(f => ({
        location: f.location,
        finding_type: f.finding_type,
        severity: f.severity as string,
        notes: f.notes || null,
      }));

    logSkinCheck({
      session: {
        overall_status: overallStatus as 'healthy' | 'amber' | 'red',
        notes: notes || null,
        event_occurred_at: new Date().toISOString(),
      },
      markers,
    });

    setFindings([]);
    setNotes('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Skin Check – Bony Prominences</DialogTitle>
          <DialogDescription>Check each high-risk area. Add findings for any concerns.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
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

          {/* Findings */}
          {findings.map(finding => (
            <Card key={finding.id} className="p-3">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Badge variant={finding.severity === 'red' ? 'destructive' : 'outline'} className="text-xs">
                    {finding.severity === 'red' ? '🔴 Red' : '🟠 Amber'}
                  </Badge>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeFinding(finding.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                <div>
                  <Label className="text-xs">Location</Label>
                  <Select value={finding.location} onValueChange={v => updateFinding(finding.id, 'location', v)}>
                    <SelectTrigger className="h-8"><SelectValue placeholder="Select area" /></SelectTrigger>
                    <SelectContent>
                      {HIGH_RISK_AREAS.map(area => (
                        <SelectItem key={area.id} value={area.id}>{area.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Finding Type</Label>
                  <Select value={finding.finding_type} onValueChange={v => updateFinding(finding.id, 'finding_type', v)}>
                    <SelectTrigger className="h-8"><SelectValue placeholder="Select finding" /></SelectTrigger>
                    <SelectContent>
                      {SKIN_FINDING_TYPES.map(t => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.severity === 'red' ? '🔴' : '🟠'} {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Textarea value={finding.notes} onChange={e => updateFinding(finding.id, 'notes', e.target.value)} rows={1} placeholder="Notes (optional)" className="text-sm" />
              </div>
            </Card>
          ))}

          <Button variant="outline" onClick={addFinding} className="w-full">
            <Plus className="h-4 w-4 mr-2" /> Add Finding
          </Button>

          {findings.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-2">No findings = healthy skin check ✓</p>
          )}

          {/* General Notes */}
          <div>
            <Label>General Notes (optional)</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Overall observations" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isLogging}>
            {isLogging ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
            Record Skin Check
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
