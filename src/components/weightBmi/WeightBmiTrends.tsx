/**
 * Weight & BMI Trends - Chart visualization of weight over time
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, CheckCircle, AlertTriangle, Clock, TrendingUp, TrendingDown, Info } from 'lucide-react';
import { useWeightBmi } from '@/hooks/useWeightBmi';
import { useMemo, useState } from 'react';
import { subDays, subMonths, parseISO, isAfter, differenceInDays, format } from 'date-fns';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  Legend
} from 'recharts';
import type { WeightEntry, WeightBmiConfig, WeightBmiAlert } from '@/types/weightBmi';

interface WeightBmiTrendsProps {
  clientId?: string;
}

type TimeRange = '1m' | '3m' | '6m' | '1y' | 'all';

export function WeightBmiTrends({ clientId }: WeightBmiTrendsProps) {
  const { entries, config, alerts, loading } = useWeightBmi(clientId);
  const [timeRange, setTimeRange] = useState<TimeRange>('3m');


  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading trends...
        </CardContent>
      </Card>
    );
  }

  if (!config?.enable_trend_graph) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Trend graph is disabled. Enable it in Settings.
        </CardContent>
      </Card>
    );
  }

  // Filter entries by time range
  const getFilteredEntries = () => {
    const now = new Date();
    let cutoffDate: Date;

    switch (timeRange) {
      case '1m':
        cutoffDate = subMonths(now, 1);
        break;
      case '3m':
        cutoffDate = subMonths(now, 3);
        break;
      case '6m':
        cutoffDate = subMonths(now, 6);
        break;
      case '1y':
        cutoffDate = subMonths(now, 12);
        break;
      case 'all':
      default:
        return entries;
    }

    return entries.filter(e => isAfter(parseISO(e.event_occurred_at), cutoffDate));
  };

  const filteredEntries = getFilteredEntries();

  // Prepare chart data (reverse to show oldest first)
  const chartData = [...filteredEntries]
    .reverse()
    .map(entry => ({
      date: format(parseISO(entry.event_occurred_at), 'dd MMM'),
      weight: entry.weight_kg,
      bmi: entry.bmi_value,
      fullDate: entry.event_occurred_at
    }));

  const hasBmiData = chartData.some(d => d.bmi != null);

  return (
    <div className="space-y-4">
      {/* Weight Chart */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Weight Trends
            </CardTitle>
            <div className="flex gap-1">
              {(['1m', '3m', '6m', '1y', 'all'] as TimeRange[]).map(range => (
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
          </div>
        </CardHeader>
        <CardContent>
          {chartData.length < 2 ? (
            <div className="py-12 text-center text-muted-foreground">
              Not enough data to display trends. Log at least 2 weight entries.
            </div>
          ) : (
            <>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} />
                    <YAxis
                      domain={['auto', 'auto']}
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      label={{ value: 'kg', angle: -90, position: 'insideLeft', fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => [`${value} kg`, 'Weight']}
                    />
                    {config?.min_target_weight_kg && (
                      <ReferenceLine
                        y={config.min_target_weight_kg}
                        stroke="hsl(var(--destructive))"
                        strokeDasharray="5 5"
                        label={{ value: 'Min Target', position: 'left', fontSize: 10 }}
                      />
                    )}
                    {config?.max_target_weight_kg && (
                      <ReferenceLine
                        y={config.max_target_weight_kg}
                        stroke="hsl(var(--destructive))"
                        strokeDasharray="5 5"
                        label={{ value: 'Max Target', position: 'left', fontSize: 10 }}
                      />
                    )}
                    <Line
                      type="monotone"
                      dataKey="weight"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 3 }}
                      activeDot={{ r: 5 }}
                      name="Weight"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Lowest</p>
                  <p className="font-bold">
                    {Math.min(...filteredEntries.map(e => e.weight_kg)).toFixed(1)} kg
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Highest</p>
                  <p className="font-bold">
                    {Math.max(...filteredEntries.map(e => e.weight_kg)).toFixed(1)} kg
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Change</p>
                  <p className="font-bold">
                    {(filteredEntries[0].weight_kg - filteredEntries[filteredEntries.length - 1].weight_kg).toFixed(1)} kg
                  </p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* BMI Chart - separate card */}
      {hasBmiData && chartData.length >= 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">BMI Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <ReferenceArea y1={15} y2={18.5} fill="#f59e0b" fillOpacity={0.1} label={{ value: 'Underweight', position: 'insideLeft', fontSize: 10, fill: '#b45309' }} />
                  <ReferenceArea y1={18.5} y2={25} fill="#22c55e" fillOpacity={0.1} label={{ value: 'Normal', position: 'insideLeft', fontSize: 10, fill: '#15803d' }} />
                  <ReferenceArea y1={25} y2={30} fill="#f59e0b" fillOpacity={0.1} label={{ value: 'Overweight', position: 'insideLeft', fontSize: 10, fill: '#b45309' }} />
                  <ReferenceArea y1={30} y2={40} fill="#ef4444" fillOpacity={0.1} label={{ value: 'Obese', position: 'insideLeft', fontSize: 10, fill: '#b91c1c' }} />
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} />
                  <YAxis domain={[15, 40]} tick={{ fontSize: 12 }} tickLine={false} label={{ value: 'BMI', angle: -90, position: 'insideLeft', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [value?.toFixed(1), 'BMI']}
                  />
                  <Line
                    type="monotone"
                    dataKey="bmi"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 3 }}
                    activeDot={{ r: 5 }}
                    name="BMI"
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}

