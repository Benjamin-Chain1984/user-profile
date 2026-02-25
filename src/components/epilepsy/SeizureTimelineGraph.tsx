/**
 * Seizure Timeline Graph - Rolling window scatter plot
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSeizureEvents, useEpilepsyConfig, useSeizureActions } from '@/hooks/useEpilepsy';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { format, differenceInMinutes } from 'date-fns';
import { Clock } from 'lucide-react';

interface SeizureTimelineGraphProps {
  clientId?: string;
}

export function SeizureTimelineGraph({ clientId }: SeizureTimelineGraphProps) {
  const { events } = useSeizureEvents(clientId, 100);
  const { config } = useEpilepsyConfig(clientId);
  const { actions } = useSeizureActions(clientId);

  const windowHours = useMemo(() => {
    const redWindow = config?.red_seizure_window ?? 24;
    const redUnit = config?.red_seizure_window_unit ?? 'hours';
    const amberWindow = config?.amber_seizure_window ?? 24;
    const amberUnit = config?.amber_seizure_window_unit ?? 'hours';
    const redMin = redUnit === 'minutes' ? redWindow : redWindow * 60;
    const amberMin = amberUnit === 'minutes' ? amberWindow : amberWindow * 60;
    return Math.max(redMin, amberMin) / 60;
  }, [config]);

  const durationThreshold = config?.duration_threshold_minutes ?? 5;

  const data = useMemo(() => {
    const now = new Date();
    const windowMin = windowHours * 60;
    return events
      .filter(e => differenceInMinutes(now, new Date(e.event_occurred_at)) <= windowMin)
      .map(e => {
        const duration = e.duration_minutes + e.duration_seconds / 60;
        const hasPrn = actions.some(a => a.seizure_event_id === e.id && a.action_type === 'rescue_medication');
        return {
          time: new Date(e.event_occurred_at).getTime(),
          timeLabel: format(new Date(e.event_occurred_at), 'HH:mm'),
          dateLabel: format(new Date(e.event_occurred_at), 'dd MMM HH:mm'),
          duration: Math.max(duration, 0.5), // min visible size
          rawDuration: duration,
          type: e.seizure_type,
          prnGiven: hasPrn,
          color: duration >= durationThreshold ? 'hsl(var(--destructive))' : 'hsl(var(--primary))',
        };
      })
      .sort((a, b) => a.time - b.time);
  }, [events, actions, windowHours, durationThreshold]);

  if (data.length === 0) {
    return null;
  }

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

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className="bg-card border rounded-lg p-3 shadow-lg text-sm space-y-1">
        <p className="font-medium">{d.dateLabel}</p>
        <p>Duration: {d.rawDuration.toFixed(1)} min</p>
        <p>Type: {seizureTypeLabels[d.type] || d.type}</p>
        <p>PRN given: {d.prnGiven ? 'Yes' : 'No'}</p>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Seizure Timeline – Last {windowHours}h
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="time"
              type="number"
              domain={['dataMin', 'dataMax']}
              tickFormatter={(v) => format(new Date(v), 'HH:mm')}
              tick={{ fontSize: 11 }}
            />
            <YAxis
              dataKey="duration"
              label={{ value: 'min', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }}
              tick={{ fontSize: 11 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              y={durationThreshold}
              stroke="hsl(var(--destructive))"
              strokeDasharray="4 4"
              label={{ value: `${durationThreshold}min threshold`, position: 'right', style: { fontSize: 10, fill: 'hsl(var(--destructive))' } }}
            />
            <Scatter
              data={data}
              fill="hsl(var(--primary))"
            />
          </ScatterChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
