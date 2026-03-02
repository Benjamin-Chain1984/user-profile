import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Activity, Info, Droplets } from 'lucide-react';
import { URINE_COLOUR_SCALE } from '@/types/fluidBalance';
import { cn } from '@/lib/utils';

const SYMPTOMS_LIST = [
  'Thirst or dry mouth',
  'Fatigue or dizziness',
  'Confusion or drowsiness',
  'Swelling (hands, ankles, face)',
  'Nausea or vomiting',
  'Headache',
  'Reduced urine output',
  'Dark or strong-smelling urine'
];

const HYDRATION_TIPS = [
  'Encourage regular fluid intake throughout the day',
  'Offer fluids with meals and snacks',
  'Monitor urine colour as a hydration indicator',
  'Be aware of increased needs in hot weather or illness',
  'Consult a dietitian or health professional if concerns persist'
];

// Urine colour feedback messages
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

export const SignsAndSymptomsPanel: React.FC = () => {
  const [selectedUrineColour, setSelectedUrineColour] = useState<number | null>(null);
  const feedback = selectedUrineColour ? getUrineColourFeedback(selectedUrineColour) : null;

  return (
    <div className="space-y-4">
      {/* Symptoms to Be Aware Of */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Symptoms to Be Aware Of and Seek Advice
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid sm:grid-cols-2 gap-2">
            {SYMPTOMS_LIST.map((symptom, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-destructive mt-1">•</span>
                <span className="text-sm text-muted-foreground">{symptom}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Good Hydration Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-500" />
            Good Hydration Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {HYDRATION_TIPS.map((tip, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span className="text-sm text-muted-foreground">{tip}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Urine Colour Check */}
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
                onClick={() => setSelectedUrineColour(
                  selectedUrineColour === colour.value ? null : colour.value
                )}
                className={cn(
                  'p-2 rounded-lg border-2 transition-all',
                  selectedUrineColour === colour.value
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
                    {URINE_COLOUR_SCALE.find(c => c.value === selectedUrineColour)?.label}
                  </p>
                  <p>{feedback.message}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
