/**
 * Sleep Trends - Visual trend charts
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSleepEntries, useSleepConfig } from '@/hooks/useSleep';
import { format } from 'date-fns';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, BarChart, Bar, Legend,
} from 'recharts';

interface SleepTrendsProps {
  clientId?: string;
}

export function SleepTrends({ clientId }: SleepTrendsProps) {
  const { entries } = useSleepEntries(clientId, 30);
  const { config } = useSleepConfig(clientId);

  const chartData = [...entries]
    .reverse()
    .map(e => ({
      date: format(new Date(e.event_occurred_at), 'dd/MM'),
      hours: Number(e.estimated_hours_slept),
      awakenings: e.number_of_awakenings,
      napMinutes: e.day_nap ? (e.day_nap_duration_minutes || 0) : 0,
    }));

  // Assistance frequency
  const assistanceCounts: Record<string, number> = {};
  entries.forEach(e => {
    e.assistance_types.forEach(t => {
      assistanceCounts[t] = (assistanceCounts[t] || 0) + 1;
    });
  });
  const assistanceData = Object.entries(assistanceCounts).map(([type, count]) => ({ type, count }));

  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No sleep data to display trends. Start logging sleep entries.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Sleep Duration Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sleep Duration Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 12]} tick={{ fontSize: 12 }} />
              <Tooltip />
              <ReferenceLine y={config.min_expected_sleep_hours} stroke="hsl(var(--warning))" strokeDasharray="5 5" label="Target" />
              <ReferenceLine y={config.poor_sleep_threshold_hours} stroke="hsl(var(--destructive))" strokeDasharray="5 5" label="Poor" />
              <Line type="monotone" dataKey="hours" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} name="Hours Slept" />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex gap-4 justify-center mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-warning inline-block" /> Target ({config.min_expected_sleep_hours}h)</span>
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-destructive inline-block" /> Poor ({config.poor_sleep_threshold_hours}h)</span>
          </div>
        </CardContent>
      </Card>

      {/* Awakenings Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Awakenings Frequency</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <ReferenceLine y={config.disruption_threshold} stroke="hsl(var(--warning))" strokeDasharray="5 5" />
              <Bar dataKey="awakenings" fill="hsl(var(--primary))" name="Awakenings" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Assistance Types */}
      {assistanceData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Night-time Assistance Frequency</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={assistanceData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="type" type="category" tick={{ fontSize: 12 }} width={100} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--accent))" name="Count" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Nap Patterns */}
      {chartData.some(d => d.napMinutes > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Day Nap Patterns</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="napMinutes" fill="hsl(var(--muted-foreground))" name="Nap (min)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
