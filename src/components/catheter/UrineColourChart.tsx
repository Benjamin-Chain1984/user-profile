/**
 * Standalone Urine Colour Chart for Catheter Module
 * Matches the Fluid Balance SignsAndSymptomsPanel design.
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Droplets, Info } from 'lucide-react';
import { URINE_COLOUR_SCALE } from '@/types/fluidBalance';
import { cn } from '@/lib/utils';

const getUrineColourFeedback = (value: number): { message: string; variant: 'success' | 'info' | 'warning' | 'danger' } => {
  if (value <= 2) {
    return { message: 'Usually indicates good hydration.', variant: 'success' };
  } else if (value <= 4) {
    return { message: 'Generally normal. Continue regular fluid intake.', variant: 'info' };
  } else if (value <= 6) {
    return { message: 'May indicate dehydration. Encourage fluids as per the care plan.', variant: 'warning' };
  } else {
    return { message: 'Often associated with dehydration. Monitor closely and consider escalation if symptoms are present.', variant: 'danger' };
  }
};

export const UrineColourChart: React.FC = () => {
  const [selectedColour, setSelectedColour] = useState<number | null>(null);
  const feedback = selectedColour ? getUrineColourFeedback(selectedColour) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Droplets className="h-5 w-5 text-blue-500" />
          Urine Colour Check
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Tap a colour to see what it may indicate. This is for awareness only.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {URINE_COLOUR_SCALE.slice(0, 8).map(colour => (
            <button
              key={colour.value}
              type="button"
              onClick={() => setSelectedColour(
                selectedColour === colour.value ? null : colour.value
              )}
              className={cn(
                'p-2 rounded-lg border-2 transition-all',
                selectedColour === colour.value
                  ? 'border-primary ring-2 ring-primary/20 scale-105'
                  : 'border-transparent hover:border-muted-foreground/30'
              )}
            >
              <div
                className="w-full aspect-square rounded"
                style={{ backgroundColor: colour.color }}
              />
              <p className="text-xs text-center mt-1 text-muted-foreground">{colour.value}</p>
            </button>
          ))}
        </div>

        {feedback && (
          <div className={cn(
            'p-3 rounded-lg border text-sm',
            feedback.variant === 'success' && 'bg-green-50 border-green-200 text-green-800',
            feedback.variant === 'info' && 'bg-blue-50 border-blue-200 text-blue-800',
            feedback.variant === 'warning' && 'bg-amber-50 border-amber-200 text-amber-800',
            feedback.variant === 'danger' && 'bg-red-50 border-red-200 text-red-800'
          )}>
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium mb-1">
                  {URINE_COLOUR_SCALE.find(c => c.value === selectedColour)?.label}
                </p>
                <p>{feedback.message}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
