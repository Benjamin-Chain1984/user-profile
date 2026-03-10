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


  const chartConfig = {
    count: { label: 'Bowel Movements', color: 'hsl(var(--chart-1))' },
    noMovement: { label: 'No Movement Logged', color: 'hsl(var(--muted))' },
  };

  return (
    <div className="space-y-4">

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
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <Pie
                      data={bristolDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={55}
                      paddingAngle={2}
                      dataKey="count"
                      label={({ type }) => type}
                      labelLine={true}
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
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <Pie
                      data={sizeDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={55}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name }) => name}
                      labelLine={true}
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
