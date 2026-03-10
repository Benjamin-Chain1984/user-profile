/**
 * Pressure Area Prevention Trends
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePressureReliefEvents, useSkinChecks, usePressureAreaConfig } from '@/hooks/usePressureArea';
import { usePressureReliefPlan } from '@/hooks/usePressureReliefPlan';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { subDays, format, startOfDay, isSameDay } from 'date-fns';
import { Eye } from 'lucide-react';

const PERIOD_OPTIONS = [
  { value: '7', label: 'Weekly (7 days)' },
  { value: '14', label: 'Fortnightly (14 days)' },
  { value: '30', label: 'Monthly (30 days)' },
];

interface Props {
  clientId?: string;
}

export function PressureAreaTrends({ clientId }: Props) {
  const { events } = usePressureReliefEvents(clientId);
  const { sessions } = useSkinChecks(clientId);
  const { plan } = usePressureReliefPlan(clientId);
  const { config } = usePressureAreaConfig(clientId);
  const [period, setPeriod] = useState('7');

  const days = parseInt(period);

  // Calculate expected skin checks per day from config
  const totalSkinChecksPerDay = config?.skin_checks_per_day || 0;

  // Daily data over selected period
  const periodData = useMemo(() => {
    return Array.from({ length: days }, (_, i) => {
      const date = subDays(new Date(), days - 1 - i);
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
        date: days <= 14 ? format(date, 'EEE dd') : format(date, 'dd/MM'),
        completed: dayEvents.length,
        expected: expectedCount,
        compliance,
        skinChecks: daySkinChecks.length,
        skinCheckExpected: totalSkinChecksPerDay,
        skinCheckCompliance,
      };
    });
  }, [days, events, sessions, plan, totalSkinChecksPerDay]);

  const avgCompliance = periodData.length > 0
    ? Math.round(periodData.reduce((sum, d) => sum + d.compliance, 0) / periodData.length)
    : 0;

  const avgSkinCheckCompliance = periodData.length > 0 && totalSkinChecksPerDay > 0
    ? Math.round(periodData.reduce((sum, d) => sum + d.skinCheckCompliance, 0) / periodData.length)
    : null;

  const periodLabel = PERIOD_OPTIONS.find(o => o.value === period)?.label || '';

  return (
    <div className="space-y-4">
      {/* Period Selector */}
      <div className="flex items-center justify-end">
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIOD_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Repositioning Compliance */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Repositioning Compliance</CardTitle>
            <Badge variant={avgCompliance >= 90 ? 'default' : avgCompliance >= 70 ? 'outline' : 'destructive'}>
              {avgCompliance}% avg
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={periodData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: days > 14 ? 10 : 12 }} />
              <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} />
              <Tooltip formatter={(value: number) => `${value}%`} />
              <Bar dataKey="compliance" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Repositioning" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Skin Check Compliance */}
      {totalSkinChecksPerDay > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Skin Check Compliance
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
              <BarChart data={periodData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: days > 14 ? 10 : 12 }} />
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
