/**
 * Safe Swallowing Strategies - Reference panel
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ShieldCheck, Utensils, Clock, Users } from 'lucide-react';

interface Props {
  onClose: () => void;
}

const STRATEGIES = [
  {
    icon: Utensils,
    title: 'During Meals',
    items: [
      'Ensure correct food and fluid textures as prescribed',
      'Offer small amounts – teaspoon-sized bites',
      'Wait for person to swallow before offering more',
      'Allow ample time – do not rush',
      'Encourage sips of fluid between bites if safe to do so',
    ],
  },
  {
    icon: ShieldCheck,
    title: 'Positioning',
    items: [
      'Person must be upright at ≥80° during meals',
      'Remain upright for at least 30 minutes after eating',
      'Feet flat on floor or supported',
      'Head midline, chin slightly tucked if instructed',
      'Hips pushed to back of chair',
    ],
  },
  {
    icon: Clock,
    title: 'Timing & Environment',
    items: [
      'Minimise distractions during meals',
      'Ensure person is alert before offering food or drink',
      'Do not offer food or fluids if person is drowsy',
      'Allow adequate time – at least 30 minutes per meal',
    ],
  },
  {
    icon: Users,
    title: 'Staff Responsibilities',
    items: [
      'Review prescribed IDDSI levels before every meal',
      'Check food and fluid textures match prescribed level',
      'Monitor for signs of aspiration (coughing, wet voice, choking)',
      'Report any concerns immediately to the Team Leader',
      'Document all observations',
    ],
  },
];

export function SafeSwallowingStrategies({ onClose }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-xl font-bold">Safe Swallowing Strategies</h2>
      </div>

      {STRATEGIES.map((section, i) => (
        <Card key={i}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <section.icon className="h-5 w-5 text-primary" />
              {section.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {section.items.map((item, j) => (
                <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="text-primary mt-0.5">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
