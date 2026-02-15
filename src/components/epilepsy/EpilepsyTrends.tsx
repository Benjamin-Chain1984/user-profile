/**
 * Epilepsy Trends - Charts and insights
 */

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSeizureEvents, useEpilepsyConfig } from '@/hooks/useEpilepsy';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format, subDays, differenceInDays, startOfDay, eachDayOfInterval } from 'date-fns';
import { BarChart3, TrendingUp, AlertTriangle, CheckCircle, Info, Lightbulb } from 'lucide-react';

interface EpilepsyTrendsProps {
  clientId?: string;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--warning))', 'hsl(var(--destructive))', 'hsl(var(--success))', '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c'];

const seizureTypeLabels: Record<string, string> = {
  focal_aware: 'Focal Aware',
  focal_impaired_awareness: 'Focal Impaired',
  focal_to_bilateral: 'Focal→Bilateral',
  absence: 'Absence',
  tonic: 'Tonic',
  atonic: 'Atonic',
  myoclonic: 'Myoclonic',
  tonic_clonic: 'Tonic-Clonic',
  unknown: 'Unknown',
};

export function EpilepsyTrends({ clientId }: EpilepsyTrendsProps) {
  const { events } = useSeizureEvents(clientId, 200);
  const { config } = useEpilepsyConfig(clientId);
  const [dateRange, setDateRange] = useState('30');

  const rangeStart = subDays(new Date(), parseInt(dateRange));
  const filteredEvents = events.filter(e => new Date(e.event_occurred_at) >= rangeStart);

  // Frequency over time
  const frequencyData = useMemo(() => {
    if (filteredEvents.length === 0) return [];
    const days = eachDayOfInterval({ start: rangeStart, end: new Date() });
    return days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const count = filteredEvents.filter(e => format(new Date(e.event_occurred_at), 'yyyy-MM-dd') === dayStr).length;
      return { date: format(day, 'dd MMM'), count };
    });
  }, [filteredEvents, dateRange]);

  // Seizure type distribution
  const typeDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredEvents.forEach(e => {
      const label = seizureTypeLabels[e.seizure_type] || e.seizure_type;
      counts[label] = (counts[label] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredEvents]);

  // Trigger frequency
  const triggerData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredEvents.forEach(e => {
      e.triggers.forEach(t => { counts[t] = (counts[t] || 0) + 1; });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }));
  }, [filteredEvents]);

  // Duration trends
  const durationData = useMemo(() => {
    return filteredEvents
      .slice(0, 30)
      .reverse()
      .map(e => ({
        date: format(new Date(e.event_occurred_at), 'dd MMM'),
        duration: e.duration_minutes + e.duration_seconds / 60,
      }));
  }, [filteredEvents]);

  // Insights
  const insights = useMemo(() => {
    if (filteredEvents.length === 0) return [];
    const results: { type: 'info' | 'warning' | 'success'; message: string }[] = [];

    // Frequency comparison
    const last7 = filteredEvents.filter(e => differenceInDays(new Date(), new Date(e.event_occurred_at)) <= 7);
    const prev7 = filteredEvents.filter(e => {
      const d = differenceInDays(new Date(), new Date(e.event_occurred_at));
      return d > 7 && d <= 14;
    });
    if (last7.length > prev7.length && last7.length > 1) {
      results.push({ type: 'warning', message: `Seizures are occurring more frequently this week (${last7.length}) compared to last week (${prev7.length}).` });
    } else if (last7.length < prev7.length && prev7.length > 0) {
      results.push({ type: 'success', message: `Seizure frequency has decreased this week (${last7.length}) compared to last week (${prev7.length}).` });
    }

    // Common triggers
    const triggerCounts: Record<string, number> = {};
    filteredEvents.forEach(e => e.triggers.forEach(t => { triggerCounts[t] = (triggerCounts[t] || 0) + 1; }));
    const topTrigger = Object.entries(triggerCounts).sort((a, b) => b[1] - a[1])[0];
    if (topTrigger && topTrigger[1] >= 3) {
      results.push({ type: 'info', message: `Most events follow "${topTrigger[0]}" (${topTrigger[1]} occurrences).` });
    }

    // Cluster detection
    const clusterCount = config?.cluster_seizure_count ?? 2;
    const clusterHours = config?.cluster_seizure_hours ?? 24;
    const sorted = [...filteredEvents].sort((a, b) => new Date(a.event_occurred_at).getTime() - new Date(b.event_occurred_at).getTime());
    for (let i = 0; i < sorted.length - 1; i++) {
      const hoursDiff = (new Date(sorted[i + 1].event_occurred_at).getTime() - new Date(sorted[i].event_occurred_at).getTime()) / (1000 * 60 * 60);
      if (hoursDiff <= clusterHours) {
        results.push({ type: 'warning', message: 'Cluster pattern detected – multiple seizures occurring within a short timeframe.' });
        break;
      }
    }

    // Sleep correlation
    const sleepTriggerCount = filteredEvents.filter(e => e.triggers.includes('Lack of sleep')).length;
    if (sleepTriggerCount >= 2) {
      results.push({ type: 'info', message: `Events often follow poor sleep (${sleepTriggerCount} occurrences).` });
    }

    if (results.length === 0) {
      results.push({ type: 'success', message: 'No concerning patterns detected in the selected period.' });
    }

    results.push({ type: 'info', message: 'Accurate records can assist neurologists in adjusting treatment plans.' });

    return results;
  }, [filteredEvents, config]);

  return (
    <div className="space-y-6">
      {/* Date Range Filter */}
      <div className="flex justify-end">
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Frequency Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Seizure Frequency
          </CardTitle>
        </CardHeader>
        <CardContent>
          {frequencyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={frequencyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-8">No data for selected period.</p>
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Seizure Type Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {typeDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={typeDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {typeDistribution.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">No data.</p>
            )}
          </CardContent>
        </Card>

        {/* Trigger Heat Map */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Trigger Frequency</CardTitle>
          </CardHeader>
          <CardContent>
            {triggerData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={triggerData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--warning))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">No trigger data.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Duration Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Duration Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          {durationData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={durationData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis label={{ value: 'min', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(val: number) => `${val.toFixed(1)} min`} />
                <Line type="monotone" dataKey="duration" stroke="hsl(var(--destructive))" strokeWidth={2} dot />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-8">No data.</p>
          )}
        </CardContent>
      </Card>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {insights.map((insight, i) => (
            <div key={i} className={`flex items-start gap-3 p-3 rounded-lg ${
              insight.type === 'warning' ? 'bg-warning/10' :
              insight.type === 'success' ? 'bg-success/10' : 'bg-muted/50'
            }`}>
              {insight.type === 'warning' && <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />}
              {insight.type === 'success' && <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />}
              {insight.type === 'info' && <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />}
              <p className="text-sm">{insight.message}</p>
            </div>
          ))}
          <p className="text-xs text-muted-foreground italic pt-2">
            These insights are based on recorded patterns and do not constitute a diagnosis. Always consult a neurologist or GP.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
