/**
 * Bowel Care Indicators Form - Optional health indicators
 */

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertTriangle } from 'lucide-react';
import type { BowelIndicators } from '@/types/bowelCare';

interface IndicatorsFormProps {
  value: BowelIndicators;
  onChange: (indicators: BowelIndicators) => void;
  disabled?: boolean;
}

export function IndicatorsForm({ value, onChange, disabled }: IndicatorsFormProps) {
  const updateIndicator = <K extends keyof BowelIndicators>(
    key: K,
    val: BowelIndicators[K]
  ) => {
    onChange({ ...value, [key]: val });
  };

  const hasRedFlags =
    value.blood === 'bright_red' ||
    value.blood === 'dark_tarry' ||
    value.pain === 'severe' ||
    value.abdominal_pain === 'severe' ||
    value.vomiting;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Note any concerning symptoms (optional but important for monitoring)
      </p>

      {hasRedFlags && (
        <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm">
          <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-destructive">Concerning symptoms detected</p>
            <p className="text-muted-foreground text-xs mt-1">
              These indicators may require immediate escalation. Please follow the person's health plan.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Pain during bowel movement */}
        <div className="space-y-2">
          <Label className="text-sm">Pain during bowel movement</Label>
          <Select
            value={value.pain || 'none'}
            onValueChange={(v) => updateIndicator('pain', v as BowelIndicators['pain'])}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="mild">Mild</SelectItem>
              <SelectItem value="moderate">Moderate</SelectItem>
              <SelectItem value="severe">Severe ⚠️</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Blood */}
        <div className="space-y-2">
          <Label className="text-sm">Blood present</Label>
          <Select
            value={value.blood || 'none'}
            onValueChange={(v) => updateIndicator('blood', v as BowelIndicators['blood'])}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="bright_red">Bright red ⚠️</SelectItem>
              <SelectItem value="dark_tarry">Dark / tarry ⚠️</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Abdominal pain */}
        <div className="space-y-2">
          <Label className="text-sm">Abdominal pain</Label>
          <Select
            value={value.abdominal_pain || 'none'}
            onValueChange={(v) => updateIndicator('abdominal_pain', v as BowelIndicators['abdominal_pain'])}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="mild">Mild</SelectItem>
              <SelectItem value="moderate">Moderate</SelectItem>
              <SelectItem value="severe">Severe ⚠️</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stool colour */}
        <div className="space-y-2">
          <Label className="text-sm">Stool colour</Label>
          <Select
            value={value.stool_colour || 'normal'}
            onValueChange={(v) => updateIndicator('stool_colour', v as BowelIndicators['stool_colour'])}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="black">Black ⚠️</SelectItem>
              <SelectItem value="pale">Pale / clay-coloured</SelectItem>
              <SelectItem value="greasy">Greasy / oily</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Toggle indicators */}
        <div className="flex items-center justify-between gap-2 p-3 border rounded-lg">
          <Label className="text-sm cursor-pointer">Straining</Label>
          <Switch
            checked={value.straining || false}
            onCheckedChange={(checked) => updateIndicator('straining', checked)}
            disabled={disabled}
          />
        </div>

        <div className="flex items-center justify-between gap-2 p-3 border rounded-lg">
          <Label className="text-sm cursor-pointer">Mucus</Label>
          <Switch
            checked={value.mucus || false}
            onCheckedChange={(checked) => updateIndicator('mucus', checked)}
            disabled={disabled}
          />
        </div>

        <div className="flex items-center justify-between gap-2 p-3 border rounded-lg">
          <Label className="text-sm cursor-pointer">Bloating</Label>
          <Switch
            checked={value.bloating || false}
            onCheckedChange={(checked) => updateIndicator('bloating', checked)}
            disabled={disabled}
          />
        </div>

        <div className="flex items-center justify-between gap-2 p-3 border rounded-lg">
          <div className="flex items-center gap-1">
            <Label className="text-sm cursor-pointer">Vomiting</Label>
            {value.vomiting && <span className="text-destructive">⚠️</span>}
          </div>
          <Switch
            checked={value.vomiting || false}
            onCheckedChange={(checked) => updateIndicator('vomiting', checked)}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
}
