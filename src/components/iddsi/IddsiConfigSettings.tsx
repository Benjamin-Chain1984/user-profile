/**
 * IDDSI Config Settings - Admin configuration for food/drink levels,
 * observation scheduling, and notification recipients.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useIddsiConfig } from '@/hooks/useIddsi';
import { FOOD_LEVELS, DRINK_LEVELS, getFoodLevelKey } from '@/types/iddsi';
import { format, addYears } from 'date-fns';
import { CheckCircle2, ClipboardList, Bell, Smartphone } from 'lucide-react';
import { RestrictedSection } from '@/components/ui/restricted-section';
import { ModuleNotificationsCard } from '@/components/module/ModuleNotificationsCard';
import type { ModuleNotificationSettings } from '@/components/module/ModuleNotificationsCard';

interface Props {
  clientId?: string;
}

const FOOD_OPTIONS = [
  { level: 7, variant: 'regular', key: '7_regular' },
  { level: 7, variant: 'easy_to_chew', key: '7_easy_to_chew' },
  { level: 6, variant: null, key: '6' },
  { level: 5, variant: null, key: '5' },
  { level: 4, variant: null, key: '4' },
  { level: 3, variant: null, key: '3_food' },
];

const DRINK_OPTIONS = [4, 3, 2, 1, 0];

const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Daily', description: 'Observation expected every day' },
  { value: 'weekly', label: 'Weekly', description: 'Observation expected once per week' },
  { value: 'monthly', label: 'Monthly', description: 'Observation expected once per month' },
];

export function IddsiConfigSettings({ clientId }: Props) {
  const { config, saveConfig, loading } = useIddsiConfig(clientId);

  const [selectedFood, setSelectedFood] = useState<string | null>(null);
  const [selectedDrink, setSelectedDrink] = useState<number | null>(null);
  const [reviewDate, setReviewDate] = useState('');
  const [instructions, setInstructions] = useState('');
  const [enableObservations, setEnableObservations] = useState(false);
  const [observationFrequency, setObservationFrequency] = useState<string>('daily');
  const [notificationSettings, setNotificationSettings] = useState<ModuleNotificationSettings>({
    enableNotifications: false,
    amberRecipientIds: [],
    redRecipientIds: [],
  });
  const [minSafeAngle, setMinSafeAngle] = useState(70);
  const [targetSafeAngle, setTargetSafeAngle] = useState(90);

  useEffect(() => {
    if (config) {
      if (config.foodLevel !== null) {
        setSelectedFood(getFoodLevelKey(config.foodLevel, config.foodLevelVariant));
      }
      setSelectedDrink(config.drinkLevel);
      setReviewDate(config.lastReviewDate || '');
      setInstructions(config.additionalInstructions || '');
      setEnableObservations(config.enableObservations);
      setObservationFrequency(config.observationFrequency);
      setNotificationSettings({
        enableNotifications: config.enableNotifications,
        amberRecipientIds: config.amberRecipientIds,
        redRecipientIds: config.redRecipientIds,
      });
      setMinSafeAngle(config.minSafeAngle);
      setTargetSafeAngle(config.targetSafeAngle);
    }
  }, [config]);

  const handleSave = () => {
    const foodOption = FOOD_OPTIONS.find(o => o.key === selectedFood);
    const reviewDateStr = reviewDate || null;
    const nextReview = reviewDateStr ? format(addYears(new Date(reviewDateStr), 1), 'yyyy-MM-dd') : null;

    saveConfig({
      food_level: foodOption?.level ?? null,
      food_level_variant: foodOption?.variant ?? null,
      drink_level: selectedDrink,
      last_review_date: reviewDateStr,
      next_review_due: nextReview,
      additional_instructions: instructions || null,
      enable_observations: enableObservations,
      observation_frequency: observationFrequency,
      enable_notifications: notificationSettings.enableNotifications,
      amber_recipient_ids: notificationSettings.amberRecipientIds,
      red_recipient_ids: notificationSettings.redRecipientIds,
      min_safe_angle: minSafeAngle,
      target_safe_angle: targetSafeAngle,
    });
  };

  return (
    <RestrictedSection requiredRole="admin">
      <div className="space-y-6">
        {/* Food Level */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Prescribed Food Level</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Select the prescribed IDDSI food level. Only one may be active.</p>
            <div className="grid gap-2">
              {FOOD_OPTIONS.map(opt => {
                const info = FOOD_LEVELS[opt.key];
                if (!info) return null;
                const isSelected = selectedFood === opt.key;
                return (
                  <button
                    key={opt.key}
                    onClick={() => setSelectedFood(isSelected ? null : opt.key)}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                      isSelected
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                        : 'border-border hover:border-primary/30'
                    }`}
                  >
                    <div className="h-16 w-16 flex items-center justify-center flex-shrink-0 bg-muted/30 rounded-lg">
                      <img src={info.image} alt={info.name} className="max-h-14 max-w-14 object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{info.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{info.description}</p>
                    </div>
                    {isSelected && <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Drink Level */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Prescribed Drink Level</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Select the prescribed IDDSI drink level. Only one may be active.</p>
            <div className="grid gap-2">
              {DRINK_OPTIONS.map(lvl => {
                const info = DRINK_LEVELS[lvl];
                if (!info) return null;
                const isSelected = selectedDrink === lvl;
                return (
                  <button
                    key={lvl}
                    onClick={() => setSelectedDrink(isSelected ? null : lvl)}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                      isSelected
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                        : 'border-border hover:border-primary/30'
                    }`}
                  >
                    <div className="h-16 w-16 flex items-center justify-center flex-shrink-0 bg-muted/30 rounded-lg">
                      <img src={info.image} alt={info.name} className="max-h-14 max-w-14 object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{info.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{info.description}</p>
                    </div>
                    {isSelected && <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Review Date */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Review Date</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="review-date">Last Review Date</Label>
              <Input
                id="review-date"
                type="date"
                value={reviewDate}
                onChange={e => setReviewDate(e.target.value)}
                className="mt-1"
              />
              {reviewDate && (
                <p className="text-xs text-muted-foreground mt-1">
                  Next review due: {format(addYears(new Date(reviewDate), 1), 'dd MMM yyyy')}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="instructions">Additional Instructions</Label>
              <Textarea
                id="instructions"
                value={instructions}
                onChange={e => setInstructions(e.target.value)}
                placeholder="Any additional instructions from the Speech Pathologist..."
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Mealtime Observation Scheduling */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Mealtime Observations
            </CardTitle>
            <CardDescription>
              Enable scheduled mealtime observations and set the expected frequency.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label className="text-base">Enable Mealtime Observations</Label>
                <p className="text-sm text-muted-foreground">
                  Track mealtime observations on a schedule
                </p>
              </div>
              <Switch
                checked={enableObservations}
                onCheckedChange={setEnableObservations}
              />
            </div>

            {enableObservations && (
              <div className="space-y-3">
                <Label>Observation Frequency</Label>
                <div className="grid gap-2">
                  {FREQUENCY_OPTIONS.map(opt => {
                    const isSelected = observationFrequency === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setObservationFrequency(opt.value)}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-all text-left ${
                          isSelected
                            ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                            : 'border-border hover:border-primary/30'
                        }`}
                      >
                        <div>
                          <p className="font-medium text-sm">{opt.label}</p>
                          <p className="text-xs text-muted-foreground">{opt.description}</p>
                        </div>
                        {isSelected && <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  If an observation is late or missed, the module will escalate to Amber. If signs are noted during an observation, the module escalates to Red.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Positioning Check – Safe Zone */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Positioning Safe Zone
            </CardTitle>
            <CardDescription>
              Define the safe upright angle range. Angles outside this zone flag as unsafe.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Protractor SVG */}
            {(() => {
              const cx = 150, cy = 160, r = 120;
              const rangeMin = 0, rangeMax = 90;
              // Map angle value to position on a semicircle arc
              // 0° (lying flat) → left, 90° (upright) → right
              const angleToPos = (deg: number) => {
                const t = (deg - rangeMin) / (rangeMax - rangeMin);
                const svgAngle = Math.PI - t * Math.PI;
                return { x: cx + r * Math.cos(svgAngle), y: cy - r * Math.sin(svgAngle) };
              };
              const arcPath = (startDeg: number, endDeg: number) => {
                const s = angleToPos(startDeg);
                const e = angleToPos(endDeg);
                const angleSweep = ((endDeg - startDeg) / (rangeMax - rangeMin)) * 180;
                const largeArc = angleSweep > 180 ? 1 : 0;
                return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y}`;
              };
              // Tick marks every 10°
              const ticks = [];
              for (let d = rangeMin; d <= rangeMax; d += 10) {
                const isMajor = d % 30 === 0 || d === 0 || d === 90;
                const inner = isMajor ? r - 14 : r - 8;
                const outer = r + 2;
                const t = (d - rangeMin) / (rangeMax - rangeMin);
                const svgAngle = Math.PI - t * Math.PI;
                ticks.push({
                  x1: cx + inner * Math.cos(svgAngle), y1: cy - inner * Math.sin(svgAngle),
                  x2: cx + outer * Math.cos(svgAngle), y2: cy - outer * Math.sin(svgAngle),
                  label: d, isMajor,
                  lx: cx + (r + 16) * Math.cos(svgAngle), ly: cy - (r + 16) * Math.sin(svgAngle),
                });
              }
              const lo = Math.max(rangeMin, Math.min(rangeMax, minSafeAngle));
              const hi = Math.max(rangeMin, Math.min(rangeMax, targetSafeAngle));

              return (
                <div className="flex justify-center">
                  <svg viewBox="0 0 300 185" className="w-full max-w-sm">
                    {/* Background arc (thin) */}
                    <path d={arcPath(rangeMin, rangeMax)} fill="none" stroke="hsl(var(--muted))" strokeWidth="6" opacity="0.4" />

                    {/* Danger arc – left (too forward) */}
                    <path d={arcPath(rangeMin, lo)} fill="none" stroke="hsl(var(--destructive))" strokeWidth="20" strokeLinecap="butt" opacity="0.25" />
                    {/* Safe arc */}
                    <path d={arcPath(lo, hi)} fill="none" stroke="hsl(var(--success))" strokeWidth="20" strokeLinecap="butt" opacity="0.35" />
                    {/* Danger arc – right (too reclined) */}
                    <path d={arcPath(hi, rangeMax)} fill="none" stroke="hsl(var(--destructive))" strokeWidth="20" strokeLinecap="butt" opacity="0.25" />

                    {/* Tick marks */}
                    {ticks.map(t => (
                      <g key={t.label}>
                        <line x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
                          stroke="hsl(var(--foreground))"
                          strokeWidth={t.isMajor ? 1.2 : 0.6}
                          opacity={t.isMajor ? 0.5 : 0.25}
                        />
                        {t.isMajor && (
                          <text x={t.lx} y={t.ly} textAnchor="middle" dominantBaseline="middle" fontSize="8" fill="hsl(var(--muted-foreground))" fontWeight="500">
                            {t.label}°
                          </text>
                        )}
                      </g>
                    ))}

                    {/* 90° upright label */}
                    <text x={angleToPos(90).x} y={cy - r - 22} textAnchor="middle" fontSize="9" fill="hsl(var(--foreground))" fontWeight="600">
                      90° Upright
                    </text>
                    <line x1={angleToPos(90).x} y1={cy - r - 4} x2={angleToPos(90).x} y2={cy - r + 12} stroke="hsl(var(--foreground))" strokeWidth="1.5" opacity="0.6" />

                    {/* Lower bound dot */}
                    {(() => {
                      const p = angleToPos(lo);
                      return <circle cx={p.x} cy={p.y} r="6" fill="hsl(var(--destructive))" stroke="white" strokeWidth="2" />;
                    })()}
                    {/* Upper bound dot */}
                    {(() => {
                      const p = angleToPos(hi);
                      return <circle cx={p.x} cy={p.y} r="6" fill="hsl(var(--success))" stroke="white" strokeWidth="2" />;
                    })()}

                    {/* Center info */}
                    <text x={cx} y={cy - 30} textAnchor="middle" fontSize="18" fontWeight="700" fill="hsl(var(--success))">
                      {lo}°–{hi}°
                    </text>
                    <text x={cx} y={cy - 14} textAnchor="middle" fontSize="9" fill="hsl(var(--muted-foreground))">
                      Safe Zone
                    </text>

                    {/* Left label */}
                    <text x={30} y={cy + 10} textAnchor="middle" fontSize="7" fill="hsl(var(--destructive))" fontWeight="600">
                      0° Lying Flat
                    </text>
                    {/* Right label */}
                    <text x={270} y={cy + 10} textAnchor="middle" fontSize="7" fill="hsl(var(--foreground))" fontWeight="600">
                      90° Upright
                    </text>

                    {/* Base line */}
                    <line x1={cx - r - 5} y1={cy} x2={cx + r + 5} y2={cy} stroke="hsl(var(--border))" strokeWidth="1" />
                  </svg>
                </div>
              );
            })()}

            {/* Editable bounds */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 p-4 rounded-lg border border-destructive/20 bg-destructive/5">
                <Label className="text-xs text-destructive font-semibold uppercase tracking-wide">Lower Bound</Label>
                <div className="flex items-baseline gap-1">
                  <Input
                    type="number"
                    min={0}
                    max={targetSafeAngle - 5}
                    step={5}
                    value={minSafeAngle}
                    onChange={e => {
                      const v = Number(e.target.value);
                      if (v >= 0 && v < targetSafeAngle) setMinSafeAngle(v);
                    }}
                    className="text-2xl font-bold h-12 w-20 text-center border-destructive/30"
                  />
                  <span className="text-lg text-muted-foreground">°</span>
                </div>
                <p className="text-[11px] text-muted-foreground">Below → too reclined</p>
              </div>

              <div className="space-y-2 p-4 rounded-lg border border-success/20 bg-success/5">
                <Label className="text-xs text-success font-semibold uppercase tracking-wide">Upper Bound</Label>
                <div className="flex items-baseline gap-1">
                  <Input
                    type="number"
                    min={minSafeAngle + 5}
                    max={90}
                    step={5}
                    value={targetSafeAngle}
                    onChange={e => {
                      const v = Number(e.target.value);
                      if (v <= 90 && v > minSafeAngle) setTargetSafeAngle(v);
                    }}
                    className="text-2xl font-bold h-12 w-20 text-center border-success/30"
                  />
                  <span className="text-lg text-muted-foreground">°</span>
                </div>
                <p className="text-[11px] text-muted-foreground">Target upright position</p>
              </div>
            </div>

            {/* Summary */}
            <div className="p-3 rounded-lg bg-muted/40 text-center">
              <p className="text-sm font-medium">
                Safe zone: <span className="text-success font-bold">{minSafeAngle}°</span> – <span className="text-success font-bold">{targetSafeAngle}°</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                0° = lying flat · 90° = fully upright
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Notification Recipients */}
        <ModuleNotificationsCard
          moduleName="iddsi"
          moduleDisplayName="IDDSI & Safe Swallowing"
          settings={notificationSettings}
          onSettingsChange={setNotificationSettings}
          clientId={clientId}
        />

        <Button onClick={handleSave} className="w-full" size="lg">
          Save IDDSI Configuration
        </Button>
      </div>
    </RestrictedSection>
  );
}
