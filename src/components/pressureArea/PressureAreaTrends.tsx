/**
 * Pressure Area Prevention Trends
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePressureReliefEvents, useSkinChecks, usePressureAreaConfig } from '@/hooks/usePressureArea';
import { usePressureReliefPlan } from '@/hooks/usePressureReliefPlan';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { subDays, format, startOfDay, isSameDay, differenceInDays } from 'date-fns';
import { TrendingUp, Info, Eye } from 'lucide-react';

interface Props {
  clientId?: string;
}

export function PressureAreaTrends({ clientId }: Props) {
  const { events } = usePressureReliefEvents(clientId);
  const { sessions } = useSkinChecks(clientId);
  const { plan } = usePressureReliefPlan(clientId);
  const { config } = usePressureAreaConfig(clientId);

  // Calculate expected skin checks per day from plan
  const totalSkinChecksPerDay = useMemo(() => {
    const schedule = plan?.skin_check_schedule || {};
    let total = 0;
    Object.values(schedule).forEach((s: any) => {
      if (s?.enabled) {
        switch (s.frequency) {
          case 'twice_daily': total += 2; break;
          case 'three_times_daily': total += 3; break;
          case 'custom': total += (s.custom_times_per_day || 1); break;
          default: total += 1; break;
        }
      }
    });
    return total;
  }, [plan]);

  // Daily compliance over last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dayStart = startOfDay(date);
    const dayEvents = events.filter(e => isSameDay(new Date(e.event_occurred_at), dayStart));
    const daySkinChecks = sessions.filter(s => isSameDay(new Date(s.event_occurred_at), dayStart));
    
    const expectedCount = plan?.interval_minutes && plan.schedule_type !== 'as_required'
      ? Math.floor((16 * 60) / plan.interval_minutes)
      : 0;
    const compliance = expectedCount > 0 ? Math.min(100, Math.round((dayEvents.length / expectedCount) * 100)) : (dayEvents.length > 0 ? 100 : 0);

    const skinCheckCompliance = totalSkinChecksPerDay > 0
      ? Math.min(100, Math.round((daySkinChecks.length / totalSkinChecksPerDay) * 100))
      : (daySkinChecks.length > 0 ? 100 : 0);

    return {
      date: format(date, 'EEE'),
      completed: dayEvents.length,
      expected: expectedCount,
      compliance,
      skinChecks: daySkinChecks.length,
      skinCheckExpected: totalSkinChecksPerDay,
      skinCheckCompliance,
    };
  });

  const avgCompliance = last7Days.length > 0
    ? Math.round(last7Days.reduce((sum, d) => sum + d.compliance, 0) / last7Days.length)
    : 0;

  const avgSkinCheckCompliance = last7Days.length > 0 && totalSkinChecksPerDay > 0
    ? Math.round(last7Days.reduce((sum, d) => sum + d.skinCheckCompliance, 0) / last7Days.length)
    : null;


  return (
    <div className="space-y-4">

      {/* Weekly Repositioning Compliance */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">7-Day Repositioning Compliance</CardTitle>
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
              <Bar dataKey="compliance" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Repositioning" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Weekly Skin Check Compliance */}
      {totalSkinChecksPerDay > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Eye className="h-4 w-4" />
                7-Day Skin Check Compliance
              </CardTitle>
              {avgSkinCheckCompliance !== null && (
                <Badge variant={avgSkinCheckCompliance >= 90 ? 'default' : avgSkinCheckCompliance >= 70 ? 'outline' : 'destructive'}>
                  {avgSkinCheckCompliance}% avg
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={last7Days}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} />
                <Tooltip formatter={(value: number) => `${value}%`} />
                <Bar dataKey="skinCheckCompliance" fill="hsl(var(--chart-2, 220 70% 50%))" radius={[4, 4, 0, 0]} name="Skin Check" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      <div className="grid sm:grid-cols-4 gap-4">
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
        {totalSkinChecksPerDay > 0 && (
          <Card>
            <CardContent className="py-4 text-center">
              <p className="text-2xl font-bold">{avgSkinCheckCompliance ?? 0}%</p>
              <p className="text-sm text-muted-foreground">Skin Check Compliance</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
