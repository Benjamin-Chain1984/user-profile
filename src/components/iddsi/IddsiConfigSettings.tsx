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
  const [minSafeAngle, setMinSafeAngle] = useState(80);
  const [targetSafeAngle, setTargetSafeAngle] = useState(100);

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
                    <img src={info.image} alt={info.name} className="h-24 w-24 object-contain flex-shrink-0" />
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
                    <img src={info.image} alt={info.name} className="h-24 w-24 object-contain flex-shrink-0" />
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
            {/* Visual range bar */}
            <div className="relative h-10 rounded-lg overflow-hidden flex">
              {/* Left danger zone */}
              <div
                className="bg-destructive/20 flex items-center justify-center text-xs font-medium text-destructive"
                style={{ width: `${((minSafeAngle - 60) / 60) * 100}%` }}
              >
                {minSafeAngle > 70 && '🔴'}
              </div>
              {/* Safe zone */}
              <div
                className="bg-success/20 flex items-center justify-center text-xs font-semibold text-success border-x-2 border-success/40"
                style={{ width: `${((targetSafeAngle - minSafeAngle) / 60) * 100}%` }}
              >
                🟢 Safe
              </div>
              {/* Right danger zone */}
              <div
                className="bg-destructive/20 flex items-center justify-center text-xs font-medium text-destructive flex-1"
              >
                {targetSafeAngle < 110 && '🔴'}
              </div>
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground px-1">
              <span>60°</span>
              <span>90° (upright)</span>
              <span>120°</span>
            </div>

            {/* Editable bounds */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 p-4 rounded-lg border border-destructive/20 bg-destructive/5">
                <Label className="text-xs text-destructive font-semibold uppercase tracking-wide">Lower Bound</Label>
                <div className="flex items-baseline gap-1">
                  <Input
                    type="number"
                    min={60}
                    max={targetSafeAngle - 5}
                    step={5}
                    value={minSafeAngle}
                    onChange={e => {
                      const v = Number(e.target.value);
                      if (v >= 60 && v < targetSafeAngle) setMinSafeAngle(v);
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
                    max={120}
                    step={5}
                    value={targetSafeAngle}
                    onChange={e => {
                      const v = Number(e.target.value);
                      if (v <= 120 && v > minSafeAngle) setTargetSafeAngle(v);
                    }}
                    className="text-2xl font-bold h-12 w-20 text-center border-success/30"
                  />
                  <span className="text-lg text-muted-foreground">°</span>
                </div>
                <p className="text-[11px] text-muted-foreground">Above → too far forward</p>
              </div>
            </div>

            {/* Summary */}
            <div className="p-3 rounded-lg bg-muted/40 text-center">
              <p className="text-sm font-medium">
                Safe zone: <span className="text-success font-bold">{minSafeAngle}°</span> – <span className="text-success font-bold">{targetSafeAngle}°</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Target: 90° upright · Accommodates natural movement during meals
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
