/**
 * Continence Trends - Charts and analytics
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePadChanges, useSkinChecks } from '@/hooks/useContinence';
import { format, subDays, startOfDay, eachDayOfInterval } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { PAD_CONDITIONS, SKIN_CONDITIONS } from '@/types/continence';

interface ContinenceTrendsProps {
  clientId?: string;
}

const CHART_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function ContinenceTrends({ clientId }: ContinenceTrendsProps) {
  const { changes } = usePadChanges(clientId);
  const { checks: skinChecks } = useSkinChecks(clientId);

  // Calculate daily pad change counts for last 14 days
  const today = startOfDay(new Date());
  const twoWeeksAgo = subDays(today, 13);
  const dateRange = eachDayOfInterval({ start: twoWeeksAgo, end: today });

  const dailyChanges = dateRange.map((date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const count = changes.filter((c) => {
      const changeDate = format(new Date(c.event_occurred_at), 'yyyy-MM-dd');
      return changeDate === dateStr;
    }).length;
    return {
      date: format(date, 'EEE'),
      fullDate: format(date, 'MMM d'),
      count,
    };
  });

  // Calculate pad condition distribution
  const conditionCounts = PAD_CONDITIONS.reduce((acc, condition) => {
    acc[condition.value] = changes.filter((c) => c.pad_condition === condition.value).length;
    return acc;
  }, {} as Record<string, number>);

  const conditionData = PAD_CONDITIONS.filter((c) => conditionCounts[c.value] > 0).map((c, i) => ({
    name: c.label,
    value: conditionCounts[c.value],
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  // Calculate skin condition distribution
  const skinConditionCounts = SKIN_CONDITIONS.reduce((acc, condition) => {
    acc[condition.value] = skinChecks.filter((c) => c.skin_condition === condition.value).length;
    return acc;
  }, {} as Record<string, number>);

  const skinConditionData = SKIN_CONDITIONS.filter((c) => skinConditionCounts[c.value] > 0).map((c, i) => ({
    name: c.label,
    value: skinConditionCounts[c.value],
    color: c.value === 'clear' ? '#22c55e' : c.value === 'broken_skin' || c.value === 'fungal_signs' ? '#ef4444' : '#f59e0b',
  }));

  // Calculate change reason distribution
  const reasonCounts = changes.reduce((acc, c) => {
    acc[c.change_reason] = (acc[c.change_reason] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const reasonData = Object.entries(reasonCounts).map(([reason, count], i) => ({
    name: reason.replace('_', ' ').replace(/^\w/, (c) => c.toUpperCase()),
    value: count,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  const chartConfig = {
    count: {
      label: 'Pad Changes',
      color: 'hsl(var(--primary))',
    },
  };

  return (
    <div className="space-y-6">
      {/* Daily Pad Changes Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Pad Changes</CardTitle>
          <CardDescription>Number of pad changes per day (last 14 days)</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyChanges}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  className="text-xs"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  className="text-xs"
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="count"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Distribution Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Pad Condition Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Pad Condition Distribution</CardTitle>
            <CardDescription>Breakdown of pad conditions when changed</CardDescription>
          </CardHeader>
          <CardContent>
            {conditionData.length > 0 ? (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={conditionData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      labelLine={false}
                    >
                      {conditionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No data available</p>
            )}
          </CardContent>
        </Card>

        {/* Skin Condition Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Skin Condition Distribution</CardTitle>
            <CardDescription>Breakdown of skin check results</CardDescription>
          </CardHeader>
          <CardContent>
            {skinConditionData.length > 0 ? (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={skinConditionData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      labelLine={false}
                    >
                      {skinConditionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Change Reasons */}
      <Card>
        <CardHeader>
          <CardTitle>Change Reasons</CardTitle>
          <CardDescription>Why pad changes were performed</CardDescription>
        </CardHeader>
        <CardContent>
          {reasonData.length > 0 ? (
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={reasonData}
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {reasonData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No data available</p>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Pad Changes</CardDescription>
            <CardTitle className="text-3xl">{changes.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Skin Checks</CardDescription>
            <CardTitle className="text-3xl">{skinChecks.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg Changes/Day</CardDescription>
            <CardTitle className="text-3xl">
              {dailyChanges.length > 0
                ? (dailyChanges.reduce((sum, d) => sum + d.count, 0) / dailyChanges.length).toFixed(1)
                : '0'}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Clear Skin Checks</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {skinConditionCounts['clear'] || 0}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
