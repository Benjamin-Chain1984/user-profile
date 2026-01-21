/**
 * Bowel Care Trends - Charts and summaries
 */

import { useMemo } from 'react';
import { useBowelLogs } from '@/hooks/useBowelCare';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { format, subDays, eachDayOfInterval, startOfDay } from 'date-fns';
import { TrendingUp, BarChart3, PieChartIcon, Info } from 'lucide-react';

interface BowelCareTrendsProps {
  clientId: string;
}

const BRISTOL_COLORS: Record<number, string> = {
  0: 'hsl(var(--muted))',
  1: 'hsl(35, 80%, 50%)',
  2: 'hsl(40, 70%, 55%)',
  3: 'hsl(120, 50%, 45%)',
  4: 'hsl(120, 60%, 40%)',
  5: 'hsl(120, 40%, 50%)',
  6: 'hsl(25, 80%, 55%)',
  7: 'hsl(20, 90%, 50%)',
};

export function BowelCareTrends({ clientId }: BowelCareTrendsProps) {
  const { logs } = useBowelLogs(clientId, 100);

  // Weekly frequency data
  const weeklyData = useMemo(() => {
    const days = eachDayOfInterval({
      start: subDays(new Date(), 6),
      end: new Date(),
    });

    return days.map((day) => {
      const dayStart = startOfDay(day);
      const dayLogs = logs.filter((log) => {
        const logDate = startOfDay(new Date(log.entry_time));
        return logDate.getTime() === dayStart.getTime();
      });

      const actualBms = dayLogs.filter(l => l.bristol_type > 0);

      return {
        day: format(day, 'EEE'),
        fullDate: format(day, 'MMM d'),
        count: actualBms.length,
        noMovement: dayLogs.filter(l => l.bristol_type === 0).length,
      };
    });
  }, [logs]);

  // Bristol type distribution
  const bristolDistribution = useMemo(() => {
    const distribution: Record<number, number> = {};
    logs.forEach((log) => {
      if (log.bristol_type > 0) {
        distribution[log.bristol_type] = (distribution[log.bristol_type] || 0) + 1;
      }
    });

    return Object.entries(distribution).map(([type, count]) => ({
      type: `Type ${type}`,
      typeNum: Number(type),
      count,
    }));
  }, [logs]);

  // Stool size distribution
  const sizeDistribution = useMemo(() => {
    const distribution: Record<string, number> = {
      small: 0,
      normal: 0,
      large: 0,
      unknown: 0,
    };

    logs.forEach((log) => {
      if (log.bristol_type > 0 && log.stool_size) {
        distribution[log.stool_size] = (distribution[log.stool_size] || 0) + 1;
      }
    });

    return [
      { name: 'Small', value: distribution.small, color: 'hsl(var(--chart-1))' },
      { name: 'Normal', value: distribution.normal, color: 'hsl(var(--chart-2))' },
      { name: 'Large', value: distribution.large, color: 'hsl(var(--chart-3))' },
      { name: 'Unknown', value: distribution.unknown, color: 'hsl(var(--muted))' },
    ].filter((d) => d.value > 0);
  }, [logs]);

  // AI Insights
  const insights = useMemo(() => {
    const recentLogs = logs.slice(0, 14);
    const messages: string[] = [];

    // Days since last BM
    const lastBm = recentLogs.find(l => l.bristol_type > 0);
    if (lastBm) {
      const daysSince = Math.floor(
        (Date.now() - new Date(lastBm.entry_time).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSince >= 3) {
        messages.push(`No bowel motion for ${daysSince} days – constipation risk.`);
      }
    } else if (logs.length > 0) {
      messages.push('No bowel movements recorded in recent logs.');
    }

    // Check for hard stools trend
    const hardStools = recentLogs.filter(l => l.bristol_type === 1 || l.bristol_type === 2);
    if (hardStools.length >= 3) {
      messages.push('More hard stools lately. Consider hydration and fibre.');
    }

    // Check for loose stools trend
    const looseStools = recentLogs.filter(l => l.bristol_type === 6 || l.bristol_type === 7);
    if (looseStools.length >= 3) {
      messages.push('Frequent loose stools. Monitor for diarrhoea and ensure hydration.');
    }

    // Regularity
    const totalBms = weeklyData.reduce((sum, d) => sum + d.count, 0);
    if (totalBms >= 5) {
      messages.push('Good bowel regularity this week.');
    }

    if (messages.length === 0) {
      messages.push('Bowel pattern appears regular. Continue monitoring.');
    }

    return messages;
  }, [logs, weeklyData]);

  const chartConfig = {
    count: { label: 'Bowel Movements', color: 'hsl(var(--chart-1))' },
    noMovement: { label: 'No Movement Logged', color: 'hsl(var(--muted))' },
  };

  return (
    <div className="space-y-4">
      {/* AI Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {insights.map((insight, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span>{insight}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted-foreground italic">
            This is not medical advice. Follow the person's health plan and seek medical advice if concerned.
          </p>
        </CardContent>
      </Card>

      {/* Weekly Frequency */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Weekly Frequency
          </CardTitle>
          <CardDescription>Bowel movements over the past 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[200px] w-full">
            <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <XAxis dataKey="day" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} fontSize={12} tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Bristol Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <PieChartIcon className="h-4 w-4" />
              Bristol Type Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bristolDistribution.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No data yet
              </p>
            ) : (
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={bristolDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="count"
                      label={({ type }) => type}
                    >
                      {bristolDistribution.map((entry) => (
                        <Cell key={entry.type} fill={BRISTOL_COLORS[entry.typeNum]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Size Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <PieChartIcon className="h-4 w-4" />
              Size Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sizeDistribution.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No data yet
              </p>
            ) : (
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sizeDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name }) => name}
                    >
                      {sizeDistribution.map((entry, index) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
