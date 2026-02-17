/**
 * Pressure Area Prevention Trends
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePressureReliefEvents, useSkinChecks, usePressureAreaConfig } from '@/hooks/usePressureArea';
import { usePressureReliefPlan } from '@/hooks/usePressureReliefPlan';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { subDays, format, startOfDay, isSameDay } from 'date-fns';

interface Props {
  clientId?: string;
}

export function PressureAreaTrends({ clientId }: Props) {
  const { events } = usePressureReliefEvents(clientId);
  const { sessions } = useSkinChecks(clientId);
  const { plan } = usePressureReliefPlan(clientId);
  const { config } = usePressureAreaConfig(clientId);

  // Daily compliance over last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dayStart = startOfDay(date);
    const dayEvents = events.filter(e => isSameDay(new Date(e.event_occurred_at), dayStart));
    
    const expectedCount = plan?.interval_minutes && plan.schedule_type !== 'as_required'
      ? Math.floor((16 * 60) / plan.interval_minutes)
      : 0;
    const compliance = expectedCount > 0 ? Math.min(100, Math.round((dayEvents.length / expectedCount) * 100)) : (dayEvents.length > 0 ? 100 : 0);

    return {
      date: format(date, 'EEE'),
      completed: dayEvents.length,
      expected: expectedCount,
      compliance,
    };
  });

  const avgCompliance = last7Days.length > 0
    ? Math.round(last7Days.reduce((sum, d) => sum + d.compliance, 0) / last7Days.length)
    : 0;

  return (
    <div className="space-y-4">
      {/* Weekly Compliance */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">7-Day Compliance</CardTitle>
            <Badge variant={avgCompliance >= 90 ? 'default' : avgCompliance >= 70 ? 'outline' : 'destructive'}>
              {avgCompliance}% avg
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={last7Days}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} />
              <Tooltip formatter={(value: number) => `${value}%`} />
              <Bar dataKey="compliance" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold">{events.length}</p>
            <p className="text-sm text-muted-foreground">Total Relief Events</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold">{sessions.length}</p>
            <p className="text-sm text-muted-foreground">Skin Checks</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold">{sessions.filter(s => s.overall_status === 'red').length}</p>
            <p className="text-sm text-muted-foreground">Red Findings</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
