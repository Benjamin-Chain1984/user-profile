/**
 * Catheter Trends - Charts and insights for catheter management
 */

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  LineChart,
  Line,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import { format, subDays, subMonths, eachDayOfInterval, startOfDay, parseISO, isAfter, differenceInDays, differenceInHours } from 'date-fns';
import { BarChart3, TrendingUp, PieChart as PieChartIcon, Info, CheckCircle, AlertTriangle, Clock, Droplets, Activity } from 'lucide-react';
import { useCatheterChanges, useFlushLogs, useStomaChecks, useBagChanges } from '@/hooks/useCatheter';
import { useCatheterCarePlan } from '@/hooks/useCatheterCarePlan';
import { normalizeCatheterType, CATHETER_TYPE_CONFIG } from '@/types/catheter';
import type { CatheterChangeLog, FlushLog, StomaCheck, BagChangeLog, StomaStatusLevel } from '@/types/catheter';

interface CatheterTrendsProps {
  clientId?: string;
}

type TimeRange = '1w' | '1m' | '3m' | 'all';

interface Insight {
  text: string;
  type: 'success' | 'warning' | 'info';
}

export function CatheterTrends({ clientId }: CatheterTrendsProps) {
  const { changes } = useCatheterChanges(clientId);
  const { logs: flushLogs } = useFlushLogs(clientId);
  const { checks: stomaChecks } = useStomaChecks(clientId);
  const { changes: bagChanges } = useBagChanges(clientId);
  const { plan } = useCatheterCarePlan(clientId);
  const [timeRange, setTimeRange] = useState<TimeRange>('1m');

  const planCatheterType = normalizeCatheterType(plan?.catheter_type);
  const typeConfig = planCatheterType ? CATHETER_TYPE_CONFIG[planCatheterType] : null;
  const showFlush = plan?.flush_prescribed;
  const showStoma = typeConfig?.enableStomaChecks;

  // Filter data by time range
  const getCutoff = () => {
    const now = new Date();
    switch (timeRange) {
      case '1w': return subDays(now, 7);
      case '1m': return subMonths(now, 1);
      case '3m': return subMonths(now, 3);
      case 'all': return new Date(0);
    }
  };

  const cutoff = getCutoff();
  const filteredChanges = changes.filter(c => isAfter(parseISO(c.event_occurred_at), cutoff));
  const filteredFlushes = flushLogs.filter(f => isAfter(parseISO(f.event_occurred_at), cutoff));
  const filteredStoma = stomaChecks.filter(s => isAfter(parseISO(s.event_occurred_at), cutoff));
  const filteredBags = bagChanges.filter(b => isAfter(parseISO(b.event_occurred_at), cutoff));

  // Weekly activity chart
  const activityData = useMemo(() => {
    const days = eachDayOfInterval({
      start: timeRange === '1w' ? subDays(new Date(), 6) : subDays(new Date(), 13),
      end: new Date(),
    });

    return days.map((day) => {
      const dayStart = startOfDay(day);
      const isInDay = (dateStr: string) => startOfDay(parseISO(dateStr)).getTime() === dayStart.getTime();

      return {
        day: format(day, 'dd MMM'),
        changes: changes.filter(c => isInDay(c.event_occurred_at)).length,
        flushes: flushLogs.filter(f => isInDay(f.event_occurred_at)).length,
        bags: bagChanges.filter(b => isInDay(b.event_occurred_at)).length,
        stoma: stomaChecks.filter(s => isInDay(s.event_occurred_at)).length,
      };
    });
  }, [changes, flushLogs, bagChanges, stomaChecks, timeRange]);

  // Change reason distribution
  const changeReasonDist = useMemo(() => {
    const dist: Record<string, number> = {};
    filteredChanges.forEach(c => {
      const label = c.change_reason.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      dist[label] = (dist[label] || 0) + 1;
    });
    return Object.entries(dist).map(([name, value]) => ({ name, value }));
  }, [filteredChanges]);

  // Flush urine appearance distribution
  const urineAppearanceDist = useMemo(() => {
    const dist: Record<string, number> = {};
    filteredFlushes.forEach(f => {
      if (f.urine_appearance) {
        const label = f.urine_appearance.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        dist[label] = (dist[label] || 0) + 1;
      }
    });
    return Object.entries(dist).map(([name, value]) => ({ name, value }));
  }, [filteredFlushes]);

  // Stoma status distribution
  const stomaStatusDist = useMemo(() => {
    if (!showStoma) return [];
    const dist: Record<string, number> = { Green: 0, Amber: 0, Red: 0 };
    filteredStoma.forEach(s => {
      const level = (s.status_level as StomaStatusLevel) || 'green';
      if (level === 'green') dist['Green']++;
      else if (level === 'amber') dist['Amber']++;
      else if (level === 'red') dist['Red']++;
    });
    return Object.entries(dist).filter(([_, v]) => v > 0).map(([name, value]) => ({ name, value }));
  }, [filteredStoma, showStoma]);

  // Flush compliance over time (line chart)
  const flushComplianceData = useMemo(() => {
    if (!showFlush || filteredFlushes.length < 2) return [];
    const days = eachDayOfInterval({
      start: timeRange === '1w' ? subDays(new Date(), 6) : subDays(new Date(), 29),
      end: new Date(),
    });
    return days.map(day => {
      const dayStart = startOfDay(day);
      const count = filteredFlushes.filter(f =>
        startOfDay(parseISO(f.event_occurred_at)).getTime() === dayStart.getTime()
      ).length;
      return { day: format(day, 'dd MMM'), count };
    });
  }, [filteredFlushes, showFlush, timeRange]);


  const PIE_COLORS = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
    'hsl(var(--muted))',
  ];

  const STOMA_PIE_COLORS: Record<string, string> = {
    Green: 'hsl(142, 71%, 45%)',
    Amber: 'hsl(38, 92%, 50%)',
    Red: 'hsl(0, 84%, 60%)',
  };

  const chartConfig = {
    changes: { label: 'Catheter Changes', color: 'hsl(var(--chart-1))' },
    flushes: { label: 'Flushes', color: 'hsl(var(--chart-2))' },
    bags: { label: 'Bag Changes', color: 'hsl(var(--chart-3))' },
    stoma: { label: 'Stoma Checks', color: 'hsl(var(--chart-4))' },
    count: { label: 'Flushes', color: 'hsl(var(--chart-2))' },
  };

  const hasAnyData = changes.length > 0 || flushLogs.length > 0 || stomaChecks.length > 0 || bagChanges.length > 0;

  if (!hasAnyData) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No catheter data recorded yet. Start logging to see trends and insights.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">

      {/* Time Range Selector */}
      <div className="flex gap-1 justify-end">
        {(['1w', '1m', '3m', 'all'] as TimeRange[]).map(range => (
          <Button
            key={range}
            size="sm"
            variant={timeRange === range ? 'default' : 'outline'}
            onClick={() => setTimeRange(range)}
            className="text-xs"
          >
            {range === 'all' ? 'All' : range.toUpperCase()}
          </Button>
        ))}
      </div>

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Activity Timeline
          </CardTitle>
          <CardDescription>Daily catheter care activities</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[220px] w-full">
            <BarChart data={activityData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <XAxis dataKey="day" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} fontSize={11} tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="changes" stackId="a" fill="hsl(var(--chart-1))" radius={[0, 0, 0, 0]} />
              {showFlush && <Bar dataKey="flushes" stackId="a" fill="hsl(var(--chart-2))" radius={[0, 0, 0, 0]} />}
              <Bar dataKey="bags" stackId="a" fill="hsl(var(--chart-3))" radius={[0, 0, 0, 0]} />
              {showStoma && <Bar dataKey="stoma" stackId="a" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} />}
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Flush Compliance Line Chart */}
      {showFlush && flushComplianceData.length >= 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Droplets className="h-5 w-5" />
              Flush Frequency
            </CardTitle>
            <CardDescription>Daily flush count over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={flushComplianceData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`${value}`, 'Flushes']}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--chart-2))', strokeWidth: 2, r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Distribution Charts */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Change Reason Distribution */}
        {changeReasonDist.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <PieChartIcon className="h-4 w-4" />
                Change Reasons
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <Pie
                      data={changeReasonDist}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={55}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name }) => name}
                      labelLine={true}
                    >
                      {changeReasonDist.map((_, idx) => (
                        <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Urine Appearance */}
        {showFlush && urineAppearanceDist.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <PieChartIcon className="h-4 w-4" />
                Urine Appearance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <Pie
                      data={urineAppearanceDist}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={55}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name }) => name}
                      labelLine={true}
                    >
                      {urineAppearanceDist.map((_, idx) => (
                        <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stoma Status Distribution */}
        {showStoma && stomaStatusDist.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-4 w-4" />
                Stoma Check Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <Pie
                      data={stomaStatusDist}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={55}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name }) => name}
                      labelLine={true}
                    >
                      {stomaStatusDist.map((entry) => (
                        <Cell key={entry.name} fill={STOMA_PIE_COLORS[entry.name] || 'hsl(var(--muted))'} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Catheter Changes</p>
              <p className="text-2xl font-bold">{filteredChanges.length}</p>
            </div>
            {showFlush && (
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Flushes</p>
                <p className="text-2xl font-bold">{filteredFlushes.length}</p>
              </div>
            )}
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Bag Changes</p>
              <p className="text-2xl font-bold">{filteredBags.length}</p>
            </div>
            {showStoma && (
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Stoma Checks</p>
                <p className="text-2xl font-bold">{filteredStoma.length}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

