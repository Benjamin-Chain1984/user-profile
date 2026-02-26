/**
 * Interactive Body Map for Skin Checks
 * Displays a body chart with clickable hotspot areas.
 * Each area can be marked as: OK (green), finding (amber/red), or unable to check.
 */

import { useState } from 'react';
import { CheckCircle2, AlertCircle, MinusCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { HIGH_RISK_AREAS, SKIN_FINDING_TYPES } from '@/types/pressureArea';
import { cn } from '@/lib/utils';

export type AreaStatus = 'unchecked' | 'ok' | 'unable' | 'finding';

export interface AreaCheckResult {
  areaId: string;
  status: AreaStatus;
  findingType?: string;
  severity?: 'amber' | 'red';
  notes?: string;
}

interface Props {
  results: Record<string, AreaCheckResult>;
  onResultChange: (areaId: string, result: AreaCheckResult) => void;
}

/**
 * Hotspot positions mapped to body chart image (percentages).
 * These approximate bony prominence locations on a front/back body outline.
 */
const HOTSPOT_POSITIONS: Record<string, { x: number; y: number }> = {
  head_ears:          { x: 28, y: 5 },
  shoulder_blades:    { x: 72, y: 20 },
  elbows:             { x: 15, y: 38 },
  spine:              { x: 72, y: 35 },
  hips:               { x: 14, y: 48 },
  sacrum_coccyx:      { x: 72, y: 48 },
  ischials:           { x: 72, y: 55 },
  knees_contractures: { x: 28, y: 68 },
  ankles:             { x: 28, y: 88 },
  heels:              { x: 72, y: 90 },
  skin_folds:         { x: 45, y: 42 },
};

function getStatusColor(status: AreaStatus, severity?: 'amber' | 'red') {
  if (status === 'ok') return 'bg-green-500 border-green-600';
  if (status === 'unable') return 'bg-muted border-muted-foreground/40';
  if (status === 'finding' && severity === 'red') return 'bg-destructive border-destructive';
  if (status === 'finding' && severity === 'amber') return 'bg-amber-500 border-amber-600';
  return 'bg-background border-border';
}

function getStatusIcon(status: AreaStatus, severity?: 'amber' | 'red') {
  if (status === 'ok') return <CheckCircle2 className="h-3.5 w-3.5 text-white" />;
  if (status === 'unable') return <MinusCircle className="h-3.5 w-3.5 text-muted-foreground" />;
  if (status === 'finding') return <AlertCircle className="h-3.5 w-3.5 text-white" />;
  return <span className="h-3.5 w-3.5 rounded-full border-2 border-dashed border-muted-foreground/50 block" />;
}

export function InteractiveBodyMap({ results, onResultChange }: Props) {
  const [expandedArea, setExpandedArea] = useState<string | null>(null);

  const handleMarkOk = (areaId: string) => {
    onResultChange(areaId, { areaId, status: 'ok' });
  };

  const handleMarkUnable = (areaId: string) => {
    onResultChange(areaId, { areaId, status: 'unable' });
  };

  const handleAddFinding = (areaId: string, findingTypeId: string) => {
    const findingDef = SKIN_FINDING_TYPES.find(t => t.id === findingTypeId);
    onResultChange(areaId, {
      areaId,
      status: 'finding',
      findingType: findingTypeId,
      severity: findingDef?.severity || 'amber',
      notes: results[areaId]?.notes || '',
    });
  };

  const handleNotesChange = (areaId: string, notes: string) => {
    const existing = results[areaId] || { areaId, status: 'unchecked' };
    onResultChange(areaId, { ...existing, notes });
  };

  const handleReset = (areaId: string) => {
    onResultChange(areaId, { areaId, status: 'unchecked' });
  };

  const checkedCount = Object.values(results).filter(r => r.status !== 'unchecked').length;

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Areas checked: {checkedCount} / {HIGH_RISK_AREAS.length}</span>
        <div className="flex gap-2">
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-green-500 inline-block" /> OK</span>
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-amber-500 inline-block" /> Amber</span>
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-destructive inline-block" /> Red</span>
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-muted inline-block" /> Unable</span>
        </div>
      </div>

      {/* Body Map with Hotspots */}
      <div className="relative w-full max-w-md mx-auto select-none">
        <img
          src="/body-chart.png"
          alt="Body chart showing bony prominences for skin check"
          className="w-full h-auto"
          draggable={false}
        />
        {HIGH_RISK_AREAS.map(area => {
          const pos = HOTSPOT_POSITIONS[area.id];
          if (!pos) return null;
          const result = results[area.id];
          const status = result?.status || 'unchecked';
          const severity = result?.severity;
          return (
            <button
              key={area.id}
              type="button"
              onClick={() => setExpandedArea(expandedArea === area.id ? null : area.id)}
              className={cn(
                'absolute flex items-center justify-center rounded-full w-7 h-7 border-2 shadow-md transition-all hover:scale-125 focus:outline-none focus:ring-2 focus:ring-ring',
                getStatusColor(status, severity),
                expandedArea === area.id && 'ring-2 ring-primary scale-125',
              )}
              style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)' }}
              title={area.label}
            >
              {getStatusIcon(status, severity)}
            </button>
          );
        })}
      </div>

      {/* Area Checklist */}
      <div className="space-y-1">
        {HIGH_RISK_AREAS.map(area => {
          const result = results[area.id];
          const status = result?.status || 'unchecked';
          const isExpanded = expandedArea === area.id;

          return (
            <Collapsible key={area.id} open={isExpanded} onOpenChange={open => setExpandedArea(open ? area.id : null)}>
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    status === 'ok' && 'bg-green-50 dark:bg-green-950/20 text-green-800 dark:text-green-300',
                    status === 'finding' && result?.severity === 'red' && 'bg-destructive/10 text-destructive',
                    status === 'finding' && result?.severity === 'amber' && 'bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300',
                    status === 'unable' && 'bg-muted text-muted-foreground',
                    status === 'unchecked' && 'bg-background hover:bg-muted/50',
                  )}
                >
                  <div className="flex items-center gap-2">
                    {getStatusIcon(status, result?.severity)}
                    <span>{area.label}</span>
                    {status === 'ok' && <Badge variant="outline" className="text-[10px] border-green-300 text-green-700 dark:text-green-400">OK</Badge>}
                    {status === 'unable' && <Badge variant="outline" className="text-[10px]">Unable</Badge>}
                    {status === 'finding' && (
                      <Badge variant={result?.severity === 'red' ? 'destructive' : 'outline'} className="text-[10px]">
                        {SKIN_FINDING_TYPES.find(t => t.id === result?.findingType)?.label || 'Finding'}
                      </Badge>
                    )}
                  </div>
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-3 py-3 space-y-3 border-x border-b rounded-b-lg mb-1">
                  {/* Quick actions */}
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      type="button"
                      size="sm"
                      variant={status === 'ok' ? 'default' : 'outline'}
                      className={cn(status === 'ok' && 'bg-green-600 hover:bg-green-700')}
                      onClick={() => handleMarkOk(area.id)}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> OK
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={status === 'unable' ? 'default' : 'outline'}
                      className={cn(status === 'unable' && 'bg-muted-foreground hover:bg-muted-foreground/80')}
                      onClick={() => handleMarkUnable(area.id)}
                    >
                      <MinusCircle className="h-3.5 w-3.5 mr-1" /> Unable to Check
                    </Button>
                    {status !== 'unchecked' && (
                      <Button type="button" size="sm" variant="ghost" onClick={() => handleReset(area.id)} className="text-xs">
                        Reset
                      </Button>
                    )}
                  </div>

                  {/* Finding selector */}
                  <div>
                    <Label className="text-xs mb-1 block">Or record a finding:</Label>
                    <Select
                      value={status === 'finding' ? result?.findingType : ''}
                      onValueChange={v => handleAddFinding(area.id, v)}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Select finding type…" />
                      </SelectTrigger>
                      <SelectContent>
                        {SKIN_FINDING_TYPES.map(t => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.severity === 'red' ? '🔴' : '🟠'} {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Notes */}
                  {(status === 'finding' || status === 'unable') && (
                    <Textarea
                      value={result?.notes || ''}
                      onChange={e => handleNotesChange(area.id, e.target.value)}
                      rows={1}
                      placeholder="Notes (optional)"
                      className="text-sm"
                    />
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
}
