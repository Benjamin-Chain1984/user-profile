/**
 * Pressure Relief Plan Editor - Admin-only editing + versioning
 * Mirrors OralHealthPlanEditor pattern
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { usePressureReliefPlan } from '@/hooks/usePressureReliefPlan';
import {
  SCHEDULE_TYPE_LABELS, DEFAULT_POSITIONS, HIGH_RISK_AREAS,
  type ScheduleType, type RotationPosition,
} from '@/types/pressureArea';
import { Save, ArrowLeft, Send, Loader2, Plus, Trash2, Clock } from 'lucide-react';

interface Props {
  clientId?: string;
  onClose: () => void;
}

export function PressureReliefPlanEditor({ clientId, onClose }: Props) {
  const { plan, savePlan, publishPlan, isSaving, isPublishing } = usePressureReliefPlan(clientId);

  const [planAuthor, setPlanAuthor] = useState('');
  const [planAuthorEmail, setPlanAuthorEmail] = useState('');
  const [planAuthorPhone, setPlanAuthorPhone] = useState('');
  const [dateDeveloped, setDateDeveloped] = useState('');
  const [scheduleType, setScheduleType] = useState<ScheduleType>('interval');
  const [dayStart, setDayStart] = useState('06:00');
  const [dayEnd, setDayEnd] = useState('22:00');
  const [nightStart, setNightStart] = useState('');
  const [nightEnd, setNightEnd] = useState('');
  const [intervalMinutes, setIntervalMinutes] = useState(120);
  const [rotationSequence, setRotationSequence] = useState<RotationPosition[]>([]);
  const [highRiskAreas, setHighRiskAreas] = useState<string[]>(['sacrum_coccyx', 'heels', 'hips']);
  const [overdueAmber, setOverdueAmber] = useState(30);
  const [overdueRed, setOverdueRed] = useState(60);
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  const [customPositionName, setCustomPositionName] = useState('');

  const [showPublish, setShowPublish] = useState(false);
  const [changeReason, setChangeReason] = useState('');
  const [changeSummary, setChangeSummary] = useState('');

  useEffect(() => {
    if (plan) {
      setPlanAuthor(plan.plan_author || '');
      setPlanAuthorEmail(plan.plan_author_email || '');
      setPlanAuthorPhone(plan.plan_author_phone || '');
      setDateDeveloped(plan.date_developed || '');
      setScheduleType(plan.schedule_type || 'interval');
      setDayStart(plan.day_schedule_start || '06:00');
      setDayEnd(plan.day_schedule_end || '22:00');
      setNightStart(plan.night_schedule_start || '');
      setNightEnd(plan.night_schedule_end || '');
      setIntervalMinutes(plan.interval_minutes || 120);
      setRotationSequence(plan.rotation_sequence || []);
      setHighRiskAreas(plan.high_risk_areas || ['sacrum_coccyx', 'heels', 'hips']);
      setOverdueAmber(plan.overdue_amber_minutes || 30);
      setOverdueRed(plan.overdue_red_minutes || 60);
      setAdditionalInstructions(plan.additional_instructions || '');
    }
  }, [plan]);

  const addPosition = (name: string, isCustom = false) => {
    setRotationSequence(prev => [...prev, {
      id: crypto.randomUUID(),
      name,
      target_duration_minutes: intervalMinutes,
      notes: null,
      is_custom: isCustom,
    }]);
  };

  const removePosition = (id: string) => {
    setRotationSequence(prev => prev.filter(p => p.id !== id));
  };

  const updatePosition = (id: string, field: string, value: any) => {
    setRotationSequence(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const toggleHighRisk = (area: string) => {
    setHighRiskAreas(prev => prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]);
  };

  const handleSave = () => {
    savePlan({
      plan_author: planAuthor || null,
      plan_author_email: planAuthorEmail || null,
      plan_author_phone: planAuthorPhone || null,
      date_developed: dateDeveloped || null,
      schedule_type: scheduleType,
      day_schedule_start: dayStart,
      day_schedule_end: dayEnd,
      night_schedule_start: nightStart || null,
      night_schedule_end: nightEnd || null,
      interval_minutes: intervalMinutes,
      rotation_sequence: rotationSequence,
      high_risk_areas: highRiskAreas,
      overdue_amber_minutes: overdueAmber,
      overdue_red_minutes: overdueRed,
      additional_instructions: additionalInstructions || null,
      changeReason,
      changeSummary: changeSummary || 'Plan updated',
    });
  };

  const handlePublish = () => {
    handleSave();
    setTimeout(() => {
      publishPlan();
      setShowPublish(false);
      onClose();
    }, 500);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Edit Digital Pressure Relief Plan</h2>
          <p className="text-sm text-muted-foreground">
            {plan ? `Editing v${plan.version} — ${plan.status}` : 'Creating new plan'}
          </p>
        </div>
        <Button variant="outline" onClick={onClose}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
      </div>

      {/* Plan Details */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Plan Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Plan Author</Label>
              <Input value={planAuthor} onChange={e => setPlanAuthor(e.target.value)} placeholder="e.g. Nurse Smith" />
            </div>
            <div>
              <Label>Date Developed</Label>
              <Input type="date" value={dateDeveloped} onChange={e => setDateDeveloped(e.target.value)} />
            </div>
            <div>
              <Label>Author Phone</Label>
              <Input value={planAuthorPhone} onChange={e => setPlanAuthorPhone(e.target.value)} placeholder="Contact phone" />
            </div>
            <div>
              <Label>Author Email</Label>
              <Input value={planAuthorEmail} onChange={e => setPlanAuthorEmail(e.target.value)} placeholder="Contact email" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schedule Configuration */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Schedule Configuration</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Schedule Type</Label>
            <Select value={scheduleType} onValueChange={v => setScheduleType(v as ScheduleType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(SCHEDULE_TYPE_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {scheduleType !== 'as_required' && (
            <>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Interval (minutes)</Label>
                  <Input type="number" value={intervalMinutes} onChange={e => setIntervalMinutes(Number(e.target.value))} min={15} step={15} />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Day Schedule Start</Label>
                  <Input type="time" value={dayStart} onChange={e => setDayStart(e.target.value)} />
                </div>
                <div>
                  <Label>Day Schedule End</Label>
                  <Input type="time" value={dayEnd} onChange={e => setDayEnd(e.target.value)} />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Night Schedule Start (optional)</Label>
                  <Input type="time" value={nightStart} onChange={e => setNightStart(e.target.value)} />
                </div>
                <div>
                  <Label>Night Schedule End (optional)</Label>
                  <Input type="time" value={nightEnd} onChange={e => setNightEnd(e.target.value)} />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Rotation Sequence */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Rotation Sequence</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {scheduleType !== 'as_required' && rotationSequence.length > 0 && (
            <div className="p-3 rounded-lg bg-muted/50 border text-sm text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Times are auto-calculated from day start ({dayStart}) using each position's duration.
            </div>
          )}
          {rotationSequence.map((pos, idx) => {
            // Calculate scheduled time for this position
            let scheduledTime = '';
            if (scheduleType !== 'as_required' && dayStart) {
              const [startH, startM] = dayStart.split(':').map(Number);
              let cumulativeMinutes = 0;
              for (let i = 0; i < idx; i++) {
                cumulativeMinutes += rotationSequence[i].target_duration_minutes || intervalMinutes;
              }
              const totalMinutes = startH * 60 + startM + cumulativeMinutes;
              const h = Math.floor(totalMinutes / 60) % 24;
              const m = totalMinutes % 60;
              scheduledTime = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
            }

            return (
              <div key={pos.id} className="flex gap-2 items-start border rounded-lg p-3">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{idx + 1}</Badge>
                    <span className="font-medium text-sm">{pos.name}</span>
                    {scheduledTime && (
                      <Badge className="text-xs bg-primary/10 text-primary border-primary/20">
                        <Clock className="h-3 w-3 mr-1" />
                        {scheduledTime}
                      </Badge>
                    )}
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Duration (min)</Label>
                      <Input type="number" value={pos.target_duration_minutes} onChange={e => updatePosition(pos.id, 'target_duration_minutes', Number(e.target.value))} min={15} className="h-8" />
                    </div>
                    <div>
                      <Label className="text-xs">Notes/Restrictions</Label>
                      <Input value={pos.notes || ''} onChange={e => updatePosition(pos.id, 'notes', e.target.value || null)} placeholder="e.g. Avoid if pain" className="h-8" />
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => removePosition(pos.id)} className="text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          })}

          <div className="flex flex-wrap gap-2">
            {DEFAULT_POSITIONS.map(name => (
              <Button key={name} variant="outline" size="sm" onClick={() => addPosition(name)}>
                <Plus className="h-3 w-3 mr-1" />{name}
              </Button>
            ))}
          </div>

          <div className="flex gap-2">
            <Input value={customPositionName} onChange={e => setCustomPositionName(e.target.value)} placeholder="Custom position name" className="flex-1" />
            <Button variant="outline" size="sm" disabled={!customPositionName.trim()} onClick={() => { addPosition(customPositionName.trim(), true); setCustomPositionName(''); }}>
              <Plus className="h-4 w-4 mr-1" /> Add Custom
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* High Risk Areas */}
      <Card>
        <CardHeader><CardTitle className="text-lg">High-Risk Areas (Bony Prominences)</CardTitle></CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {HIGH_RISK_AREAS.map(area => (
              <div key={area.id} className="flex items-center gap-2">
                <Checkbox checked={highRiskAreas.includes(area.id)} onCheckedChange={() => toggleHighRisk(area.id)} />
                <Label className="text-sm">{area.label}</Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Escalation Thresholds */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Escalation Thresholds</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Overdue → Amber (minutes past interval)</Label>
              <Input type="number" value={overdueAmber} onChange={e => setOverdueAmber(Number(e.target.value))} min={0} />
            </div>
            <div>
              <Label>Overdue → Red (minutes past interval)</Label>
              <Input type="number" value={overdueRed} onChange={e => setOverdueRed(Number(e.target.value))} min={0} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Instructions */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Additional Instructions</CardTitle></CardHeader>
        <CardContent>
          <Textarea value={additionalInstructions} onChange={e => setAdditionalInstructions(e.target.value)} rows={3} placeholder="Any additional care instructions..." />
        </CardContent>
      </Card>

      {/* Change Reason */}
      {plan && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Change Reason</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Why is this plan being updated? <span className="text-destructive">*</span></Label>
              <Input value={changeReason} onChange={e => setChangeReason(e.target.value)} placeholder="e.g. Updated after clinical review" />
            </div>
            <div>
              <Label>Change Summary</Label>
              <Input value={changeSummary} onChange={e => setChangeSummary(e.target.value)} placeholder="Brief description of what changed" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={isSaving || (!!plan && !changeReason)}>
          {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save Draft
        </Button>
        <Button variant="default" onClick={() => setShowPublish(true)} disabled={isSaving || (!!plan && !changeReason)}>
          <Send className="h-4 w-4 mr-2" /> Publish Plan
        </Button>
      </div>

      {/* Publish Dialog */}
      <Dialog open={showPublish} onOpenChange={setShowPublish}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publish Digital Pressure Relief Plan</DialogTitle>
            <DialogDescription>
              Publishing this plan will require all staff to re-acknowledge it. Previous acknowledgements will become outdated.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPublish(false)}>Cancel</Button>
            <Button onClick={handlePublish} disabled={isPublishing}>
              {isPublishing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              Confirm & Publish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
