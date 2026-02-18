/**
 * IDDSI Config Settings - Admin configuration for food/drink levels
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useIddsiConfig } from '@/hooks/useIddsi';
import { FOOD_LEVELS, DRINK_LEVELS, getFoodLevelKey } from '@/types/iddsi';
import { format, addYears } from 'date-fns';
import { CheckCircle2 } from 'lucide-react';
import { RestrictedSection } from '@/components/ui/restricted-section';

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

export function IddsiConfigSettings({ clientId }: Props) {
  const { config, saveConfig, loading } = useIddsiConfig(clientId);

  const [selectedFood, setSelectedFood] = useState<string | null>(null);
  const [selectedDrink, setSelectedDrink] = useState<number | null>(null);
  const [reviewDate, setReviewDate] = useState('');
  const [instructions, setInstructions] = useState('');

  useEffect(() => {
    if (config) {
      if (config.foodLevel !== null) {
        setSelectedFood(getFoodLevelKey(config.foodLevel, config.foodLevelVariant));
      }
      setSelectedDrink(config.drinkLevel);
      setReviewDate(config.lastReviewDate || '');
      setInstructions(config.additionalInstructions || '');
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
                    <img src={info.image} alt={info.name} className="h-10 w-10 object-contain flex-shrink-0" />
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
                    <img src={info.image} alt={info.name} className="h-10 w-10 object-contain flex-shrink-0" />
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

        <Button onClick={handleSave} className="w-full" size="lg">
          Save IDDSI Configuration
        </Button>
      </div>
    </RestrictedSection>
  );
}
