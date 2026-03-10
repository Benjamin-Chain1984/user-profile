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

// --- Insight Generation ---

interface Insight {
  text: string;
  type: 'success' | 'warning' | 'info';
}

function generateInsights(
  entries: WeightEntry[],
  config: WeightBmiConfig | null,
  alerts: WeightBmiAlert[]
): Insight[] {
  const insights: Insight[] = [];
  if (!entries.length) return insights;

  const sorted = [...entries].sort((a, b) => 
    new Date(b.event_occurred_at).getTime() - new Date(a.event_occurred_at).getTime()
  );
  const latest = sorted[0];
  const now = new Date();

  // 1. Measurement recency
  const daysSinceLast = differenceInDays(now, parseISO(latest.event_occurred_at));
  if (daysSinceLast <= 7) {
    insights.push({ text: `Weight recorded ${daysSinceLast === 0 ? 'today' : `${daysSinceLast} day${daysSinceLast > 1 ? 's' : ''} ago`}. Monitoring is up to date.`, type: 'success' });
  } else if (daysSinceLast > 30) {
    insights.push({ text: `Last weight entry was ${daysSinceLast} days ago. Consider scheduling a measurement.`, type: 'warning' });
  } else if (daysSinceLast > 14) {
    insights.push({ text: `Last weight entry was ${daysSinceLast} days ago.`, type: 'info' });
  }

  // 2. Weight trend (last 4+ entries)
  if (sorted.length >= 4) {
    const recent4 = sorted.slice(0, 4);
    const diffs = recent4.slice(0, -1).map((e, i) => e.weight_kg - recent4[i + 1].weight_kg);
    const allGaining = diffs.every(d => d > 0);
    const allLosing = diffs.every(d => d < 0);
    const totalChange = recent4[0].weight_kg - recent4[recent4.length - 1].weight_kg;

    if (allGaining) {
      insights.push({ text: `Consistent weight gain detected over the last ${recent4.length} entries (+${totalChange.toFixed(1)} kg).`, type: Math.abs(totalChange) > 3 ? 'warning' : 'info' });
    } else if (allLosing) {
      insights.push({ text: `Consistent weight loss detected over the last ${recent4.length} entries (${totalChange.toFixed(1)} kg).`, type: Math.abs(totalChange) > 3 ? 'warning' : 'info' });
    }
  }

  // 3. Rapid change detection
  if (sorted.length >= 2) {
    const windowDays = config?.rapid_change_window_days ?? 7;
    const threshold = config?.rapid_change_threshold_kg ?? 2.0;
    const cutoff = subDays(now, windowDays);
    const recentEntries = sorted.filter(e => isAfter(parseISO(e.event_occurred_at), cutoff));
    if (recentEntries.length >= 2) {
      const weights = recentEntries.map(e => e.weight_kg);
      const range = Math.max(...weights) - Math.min(...weights);
      if (range >= threshold) {
        insights.push({ text: `Weight fluctuation of ${range.toFixed(1)} kg detected within ${windowDays} days (threshold: ${threshold} kg).`, type: 'warning' });
      }
    }
  }

  // 4. Target range
  if (config?.min_target_weight_kg && latest.weight_kg < config.min_target_weight_kg) {
    insights.push({ text: `Current weight (${latest.weight_kg} kg) is below the target minimum of ${config.min_target_weight_kg} kg.`, type: 'warning' });
  } else if (config?.max_target_weight_kg && latest.weight_kg > config.max_target_weight_kg) {
    insights.push({ text: `Current weight (${latest.weight_kg} kg) is above the target maximum of ${config.max_target_weight_kg} kg.`, type: 'warning' });
  } else if (config?.min_target_weight_kg && config?.max_target_weight_kg) {
    insights.push({ text: `Weight is within the target range (${config.min_target_weight_kg}–${config.max_target_weight_kg} kg).`, type: 'success' });
  }

  // 5. BMI insight
  if (latest.bmi_value && latest.bmi_category) {
    if (latest.bmi_category === 'normal') {
      insights.push({ text: `BMI is ${latest.bmi_value} (Normal range). No clinical concern.`, type: 'success' });
    } else if (latest.bmi_category === 'underweight') {
      insights.push({ text: `BMI is ${latest.bmi_value} (Underweight). Consider nutritional review.`, type: 'warning' });
    } else if (latest.bmi_category === 'obese') {
      insights.push({ text: `BMI is ${latest.bmi_value} (Obese). Consider health plan review.`, type: 'warning' });
    } else if (latest.bmi_category === 'overweight') {
      insights.push({ text: `BMI is ${latest.bmi_value} (Overweight). Monitor at next review.`, type: 'info' });
    }
  } else if (!config?.height_cm) {
    insights.push({ text: 'Height has not been configured. Set height in Settings to enable BMI tracking.', type: 'info' });
  }

  // 6. Stability check
  if (sorted.length >= 3) {
    const recent3 = sorted.slice(0, 3).map(e => e.weight_kg);
    const avg = recent3.reduce((a, b) => a + b, 0) / 3;
    const allStable = recent3.every(w => Math.abs(w - avg) < 0.5);
    if (allStable) {
      insights.push({ text: 'Weight has been stable across the last 3 recordings.', type: 'success' });
    }
  }

  // 7. Unresolved alerts
  const unresolved = alerts.filter(a => !a.resolved_at);
  if (unresolved.length > 0) {
    insights.push({ text: `${unresolved.length} active alert${unresolved.length > 1 ? 's' : ''} requiring attention.`, type: 'warning' });
  }

  return insights;
}
