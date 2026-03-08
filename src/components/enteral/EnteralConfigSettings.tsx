/**
 * Enteral Nutrition Configuration Settings (Admin Only)
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Save } from 'lucide-react';
import { RestrictedSection } from '@/components/ui/restricted-section';
import { ModuleDisclaimer } from '@/components/module/ModuleDisclaimer';
import { useEnteralConfig, useSaveEnteralConfig, useEnteralMedications, useSaveEnteralMedication } from '@/hooks/useEnteral';
import { TUBE_TYPES, FORMULA_OPTIONS, FEEDING_TYPES, type TubeType, type FeedingType, type FeedingScheduleEntry } from '@/types/enteral';
import { EnteralFeedingSchedule, DEFAULT_SCHEDULE } from './EnteralFeedingSchedule';

interface EnteralConfigSettingsProps {
  clientId?: string;
}

export function EnteralConfigSettings({ clientId }: EnteralConfigSettingsProps) {
  const { data: config } = useEnteralConfig(clientId);
  const saveConfig = useSaveEnteralConfig(clientId);
  const { data: medications = [] } = useEnteralMedications(clientId);
  const saveMed = useSaveEnteralMedication();

  // Local state
  const [nilByMouth, setNilByMouth] = useState(false);
  const [tubeType, setTubeType] = useState('');
  const [tubeSizeFr, setTubeSizeFr] = useState('');
  const [tubeInsertedDate, setTubeInsertedDate] = useState('');
  const [nextTubeChangeDue, setNextTubeChangeDue] = useState('');
  const [tubeChangeInterval, setTubeChangeInterval] = useState('');
  const [alertLeadDays, setAlertLeadDays] = useState('7');
  const [overdueDays, setOverdueDays] = useState('1');
  const [formulaName, setFormulaName] = useState('');
  const [formulaCustom, setFormulaCustom] = useState('');
  const [feedingType, setFeedingType] = useState('');
  const [prescribedVolume, setPrescribedVolume] = useState('');
  const [flushBeforeFeed, setFlushBeforeFeed] = useState('30');
  const [flushAfterFeed, setFlushAfterFeed] = useState('30');
  const [flushBeforeMed, setFlushBeforeMed] = useState('15');
  const [flushAfterMed, setFlushAfterMed] = useState('15');
  const [positionAngle, setPositionAngle] = useState('30');
  const [positionMaintain, setPositionMaintain] = useState('30');
  const [applyPositionToMed, setApplyPositionToMed] = useState(false);
  const [scheduleTimesStr, setScheduleTimesStr] = useState('06:00,10:00,14:00,18:00,22:00,02:00');
  const [feedingSchedule, setFeedingSchedule] = useState<FeedingScheduleEntry[]>([]);
  const [graceWindow, setGraceWindow] = useState('60');
  const [missedFeedThreshold, setMissedFeedThreshold] = useState('2');
  const [enableMedication, setEnableMedication] = useState(false);
  const [enableStoma, setEnableStoma] = useState(true);

  // New medication form
  const [newMedName, setNewMedName] = useState('');
  const [newMedDose, setNewMedDose] = useState('');
  const [newMedFlushBefore, setNewMedFlushBefore] = useState('15');
  const [newMedFlushAfter, setNewMedFlushAfter] = useState('15');
  const [newMedTimes, setNewMedTimes] = useState('');
  const [newMedInstructions, setNewMedInstructions] = useState('');

  useEffect(() => {
    if (config) {
      setNilByMouth(config.nil_by_mouth);
      setTubeType(config.tube_type || '');
      setTubeSizeFr(config.tube_size_fr || '');
      setTubeInsertedDate(config.tube_inserted_date || '');
      setNextTubeChangeDue(config.next_tube_change_due || '');
      setTubeChangeInterval(String(config.tube_change_interval_days || ''));
      setAlertLeadDays(String(config.tube_change_alert_lead_days));
      setOverdueDays(String(config.tube_change_overdue_days));
      setFormulaName(config.formula_name || '');
      setFormulaCustom(config.formula_custom_name || '');
      setFeedingType(config.feeding_type || '');
      setPrescribedVolume(String(config.prescribed_volume_ml || ''));
      setFlushBeforeFeed(String(config.flush_before_feed_ml));
      setFlushAfterFeed(String(config.flush_after_feed_ml));
      setFlushBeforeMed(String(config.flush_before_med_ml));
      setFlushAfterMed(String(config.flush_after_med_ml));
      setPositionAngle(String(config.position_angle_min));
      setPositionMaintain(String(config.position_maintain_mins));
      setApplyPositionToMed(config.apply_position_to_medication);
      setScheduleTimesStr(config.feed_schedule_times?.join(',') || '');
      setFeedingSchedule(
        Array.isArray(config.feeding_schedule) && config.feeding_schedule.length > 0
          ? config.feeding_schedule
          : []
      );
      setGraceWindow(String(config.grace_window_mins));
      setMissedFeedThreshold(String(config.missed_feed_red_threshold));
      setEnableMedication(config.enable_medication_logging);
      setEnableStoma(config.enable_stoma_checks);
    }
  }, [config]);

  const handleSave = () => {
    saveConfig.mutate({
      nil_by_mouth: nilByMouth,
      tube_type: tubeType || null,
      tube_size_fr: tubeSizeFr || null,
      tube_inserted_date: tubeInsertedDate || null,
      next_tube_change_due: nextTubeChangeDue || null,
      tube_change_interval_days: tubeChangeInterval ? parseInt(tubeChangeInterval) : null,
      tube_change_alert_lead_days: parseInt(alertLeadDays) || 7,
      tube_change_overdue_days: parseInt(overdueDays) || 1,
      formula_name: formulaName || null,
      formula_custom_name: formulaCustom || null,
      feeding_type: feedingType || null,
      prescribed_volume_ml: prescribedVolume ? parseInt(prescribedVolume) : null,
      flush_before_feed_ml: parseInt(flushBeforeFeed) || 0,
      flush_after_feed_ml: parseInt(flushAfterFeed) || 0,
      flush_before_med_ml: parseInt(flushBeforeMed) || 0,
      flush_after_med_ml: parseInt(flushAfterMed) || 0,
      position_angle_min: parseInt(positionAngle) || 30,
      position_maintain_mins: parseInt(positionMaintain) || 30,
      apply_position_to_medication: applyPositionToMed,
      feed_schedule_times: feedingSchedule
        .filter(e => e.activity === 'formula_feed')
        .map(e => e.time),
      feeding_schedule: feedingSchedule,
      grace_window_mins: parseInt(graceWindow) || 60,
      missed_feed_red_threshold: parseInt(missedFeedThreshold) || 2,
      enable_medication_logging: enableMedication,
      enable_stoma_checks: enableStoma,
    } as any);
  };

  const handleAddMedication = () => {
    if (!newMedName || !newMedDose) return;
    saveMed.mutate({
      client_id: clientId,
      medication_name: newMedName,
      dose: newMedDose,
      route: tubeType || null,
      flush_before_ml: parseInt(newMedFlushBefore) || 0,
      flush_after_ml: parseInt(newMedFlushAfter) || 0,
      scheduled_times: newMedTimes.split(',').map(s => s.trim()).filter(Boolean),
      special_instructions: newMedInstructions || null,
    } as any, {
      onSuccess: () => {
        setNewMedName('');
        setNewMedDose('');
        setNewMedFlushBefore('15');
        setNewMedFlushAfter('15');
        setNewMedTimes('');
        setNewMedInstructions('');
      },
    });
  };

  return (
    <RestrictedSection requiredRole="admin">
      <div className="space-y-6">
        <ModuleDisclaimer message="Always consult a healthcare professional to ensure modules are clinically valid and set according to individual need." />

        {/* Nil-by-Mouth */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Nil-by-Mouth</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Switch checked={nilByMouth} onCheckedChange={setNilByMouth} />
              <Label>Person is Nil-by-Mouth</Label>
            </div>
          </CardContent>
        </Card>

        {/* Tube Details */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Tube Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tube Type</Label>
              <Select value={tubeType} onValueChange={setTubeType}>
                <SelectTrigger><SelectValue placeholder="Select tube type..." /></SelectTrigger>
                <SelectContent>
                  {TUBE_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tube Size (Fr)</Label>
                <Input value={tubeSizeFr} onChange={e => setTubeSizeFr(e.target.value)} placeholder="e.g. 14" />
              </div>
              <div className="space-y-2">
                <Label>Date Inserted/Changed</Label>
                <Input type="date" value={tubeInsertedDate} onChange={e => setTubeInsertedDate(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Next Change Due</Label>
                <Input type="date" value={nextTubeChangeDue} onChange={e => setNextTubeChangeDue(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Change Interval (days)</Label>
                <Input type="number" value={tubeChangeInterval} onChange={e => setTubeChangeInterval(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Alert Lead Time (days)</Label>
                <Input type="number" value={alertLeadDays} onChange={e => setAlertLeadDays(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Overdue Threshold (days)</Label>
                <Input type="number" value={overdueDays} onChange={e => setOverdueDays(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Formula & Feeding */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Formula & Feeding Prescription</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Formula</Label>
              <Select value={formulaName} onValueChange={setFormulaName}>
                <SelectTrigger><SelectValue placeholder="Select formula..." /></SelectTrigger>
                <SelectContent>
                  {FORMULA_OPTIONS.map(f => (
                    <SelectItem key={f} value={f}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formulaName === 'Other' && (
                <Input value={formulaCustom} onChange={e => setFormulaCustom(e.target.value)} placeholder="Enter formula name" />
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Feeding Type</Label>
                <Select value={feedingType} onValueChange={setFeedingType}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {FEEDING_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Prescribed Volume (mL/day)</Label>
                <Input type="number" value={prescribedVolume} onChange={e => setPrescribedVolume(e.target.value)} />
              </div>
            </div>

            {/* Flush */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Flush Before Feed (mL)</Label>
                <Input type="number" value={flushBeforeFeed} onChange={e => setFlushBeforeFeed(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Flush After Feed (mL)</Label>
                <Input type="number" value={flushAfterFeed} onChange={e => setFlushAfterFeed(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Flush Before Med (mL)</Label>
                <Input type="number" value={flushBeforeMed} onChange={e => setFlushBeforeMed(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Flush After Med (mL)</Label>
                <Input type="number" value={flushAfterMed} onChange={e => setFlushAfterMed(e.target.value)} />
              </div>
            </div>

            {/* Position */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Min Position Angle (°)</Label>
                <Input type="number" value={positionAngle} onChange={e => setPositionAngle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Maintain Position (mins)</Label>
                <Input type="number" value={positionMaintain} onChange={e => setPositionMaintain(e.target.value)} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={applyPositionToMed} onCheckedChange={setApplyPositionToMed} />
              <Label>Apply positioning requirement during medication administration</Label>
            </div>

            {/* Schedule */}
            <div className="space-y-2">
              <Label>Feed Schedule Times (comma-separated)</Label>
              <Input value={scheduleTimesStr} onChange={e => setScheduleTimesStr(e.target.value)} placeholder="06:00,10:00,14:00,18:00,22:00,02:00" />
              <p className="text-xs text-muted-foreground">Editable list of 24-hour times</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Grace Window (mins)</Label>
                <Input type="number" value={graceWindow} onChange={e => setGraceWindow(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Missed Feeds for Red Alert</Label>
                <Input type="number" value={missedFeedThreshold} onChange={e => setMissedFeedThreshold(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Toggles */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Module Options</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Switch checked={enableMedication} onCheckedChange={setEnableMedication} />
              <Label>Enable Medication Logging via Tube</Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={enableStoma} onCheckedChange={setEnableStoma} />
              <Label>Enable Stoma Checks</Label>
            </div>
          </CardContent>
        </Card>

        {/* Medication Configuration */}
        {enableMedication && (
          <Card>
            <CardHeader><CardTitle className="text-lg">Medications via Tube</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {medications.map(med => (
                <div key={med.id} className="p-3 bg-muted/50 rounded-lg">
                  <div className="font-medium">{med.medication_name} — {med.dose}</div>
                  <div className="text-xs text-muted-foreground">
                    Flush: {med.flush_before_ml}ml / {med.flush_after_ml}ml
                    {med.scheduled_times?.length > 0 && ` • Times: ${med.scheduled_times.join(', ')}`}
                  </div>
                </div>
              ))}

              {/* Add new */}
              <div className="border-t pt-4 space-y-3">
                <p className="text-sm font-medium">Add Medication</p>
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="Medication name" value={newMedName} onChange={e => setNewMedName(e.target.value)} />
                  <Input placeholder="Dose" value={newMedDose} onChange={e => setNewMedDose(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input type="number" placeholder="Flush before (mL)" value={newMedFlushBefore} onChange={e => setNewMedFlushBefore(e.target.value)} />
                  <Input type="number" placeholder="Flush after (mL)" value={newMedFlushAfter} onChange={e => setNewMedFlushAfter(e.target.value)} />
                </div>
                <Input placeholder="Scheduled times (e.g. 08:00,20:00)" value={newMedTimes} onChange={e => setNewMedTimes(e.target.value)} />
                <Textarea placeholder="Special instructions" value={newMedInstructions} onChange={e => setNewMedInstructions(e.target.value)} />
                <Button onClick={handleAddMedication} disabled={!newMedName || !newMedDose} variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" /> Add Medication
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Button onClick={handleSave} disabled={saveConfig.isPending} className="w-full gap-2">
          <Save className="h-4 w-4" />
          {saveConfig.isPending ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </RestrictedSection>
  );
}
