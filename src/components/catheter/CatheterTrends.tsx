/**
 * Catheter Trends - Placeholder for trends visualization
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CatheterTrendsProps {
  clientId?: string;
}

export function CatheterTrends({ clientId }: CatheterTrendsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Trends & Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-center py-8">
          Trend analysis coming soon. This will show catheter change patterns, flush compliance, and consumables usage over time.
        </p>
      </CardContent>
    </Card>
  );
}
