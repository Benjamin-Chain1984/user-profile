/**
 * Good Enteral Nutrition Tips - Clinical guidance cards
 * Uses same design pattern as Bowel Care module tips
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, AlertCircle, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';

const POSITIONING_TIPS = [
  'Person must be sitting upright at least 30–45° during feeding.',
  'Stay upright 30–60 minutes after feeding.',
];

const BEFORE_FEEDING_TIPS = [
  'Check tube position as per plan.',
  'Wash hands and wear gloves.',
  'Check formula expiry date.',
];

const DURING_FEEDING_TIPS = [
  'Administer slowly (usually 10–20 minutes per bolus).',
  'Watch for coughing, gagging, discomfort, or vomiting.',
];

const AFTER_FEEDING_TIPS = [
  'Flush tube with water to prevent blockages.',
];

const STOP_FEED_SIGNS = [
  'Vomiting',
  'Severe coughing or choking',
  'Abdominal bloating or pain',
  'Diarrhoea',
  'Breathing difficulty',
];

const OTHER_SCHEDULES = [
  { label: 'Continuous feeding (pump)', example: 'Example: 60 mL/hour over 20 hours' },
  { label: 'Intermittent feeding', example: 'Example: 300 mL over 30–60 minutes, 4–5 times per day' },
];

export function EnteralNutritionTips() {
  return (
    <div className="space-y-4">
      {/* Good Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-500" />
            Good Enteral Nutrition Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Positioning */}
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Positioning
            </h4>
            <ul className="space-y-1.5">
              {POSITIONING_TIPS.map((tip, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span className="text-sm text-muted-foreground">{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Before Feeding */}
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-blue-500" />
              Before Feeding
            </h4>
            <ul className="space-y-1.5">
              {BEFORE_FEEDING_TIPS.map((tip, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span className="text-sm text-muted-foreground">{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* During Feeding */}
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-amber-500" />
              During Feeding
            </h4>
            <ul className="space-y-1.5">
              {DURING_FEEDING_TIPS.map((tip, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span className="text-sm text-muted-foreground">{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* After Feeding */}
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              After Feeding
            </h4>
            <ul className="space-y-1.5">
              {AFTER_FEEDING_TIPS.map((tip, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span className="text-sm text-muted-foreground">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Signs to Stop */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Signs to Stop the Feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Stop feeding and seek advice if the person has:
          </p>
          <ul className="grid sm:grid-cols-2 gap-2">
            {STOP_FEED_SIGNS.map((sign, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-red-500 mt-1">•</span>
                <span className="text-sm text-muted-foreground">{sign}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Other Feeding Schedules (Reference) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Other Feeding Schedules (For Reference)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {OTHER_SCHEDULES.map((item, i) => (
              <li key={i}>
                <p className="text-sm font-medium">{item.label}:</p>
                <p className="text-sm text-muted-foreground">{item.example}</p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
