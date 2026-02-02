/**
 * HealthMonitoringTrends - Charts and trend analysis for vital signs
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
} from 'recharts';
import { useVitalSignEntries } from '@/hooks/useHealthMonitoring';
import { VITAL_THRESHOLDS, type VitalType } from '@/types/healthMonitoring';
import { format, subDays } from 'date-fns';
import { TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

interface HealthMonitoringTrendsProps {
  clientId?: string;
}

export function HealthMonitoringTrends({ clientId }: HealthMonitoringTrendsProps) {
  const { entries } = useVitalSignEntries(clientId, 100);

  // Prepare chart data - reverse to show chronological order
  const chartData = useMemo(() => {
    return [...entries]
      .reverse()
      .map((entry) => ({
        date: format(new Date(entry.event_occurred_at), 'MM/dd HH:mm'),
        dateLabel: format(new Date(entry.event_occurred_at), 'MMM d, HH:mm'),
        temperature: entry.temperature_celsius,
        systolic: entry.bp_systolic,
        diastolic: entry.bp_diastolic,
        oxygen: entry.oxygen_saturation,
        heartRate: entry.heart_rate,
        respiratory: entry.respiratory_rate,
      }));
  }, [entries]);

  // Calculate trend insights
  const insights = useMemo(() => {
    if (entries.length < 2) return [];

    const results: { type: 'warning' | 'info' | 'success'; message: string }[] = [];
    const recent = entries.slice(0, 5);
    const older = entries.slice(5, 10);

    // Temperature trend
    const recentTemps = recent.filter(e => e.temperature_celsius).map(e => e.temperature_celsius!);
    const olderTemps = older.filter(e => e.temperature_celsius).map(e => e.temperature_celsius!);
    if (recentTemps.length >= 2 && olderTemps.length >= 2) {
      const recentAvg = recentTemps.reduce((a, b) => a + b, 0) / recentTemps.length;
      const olderAvg = olderTemps.reduce((a, b) => a + b, 0) / olderTemps.length;
      if (recentAvg > olderAvg + 0.3) {
        results.push({ type: 'warning', message: 'Temperature gradually rising over recent entries' });
      }
    }

    // BP trend
    const recentBP = recent.filter(e => e.bp_systolic).map(e => e.bp_systolic!);
    if (recentBP.length >= 3) {
      const isRising = recentBP.every((v, i, a) => i === 0 || v >= a[i - 1] - 5);
      const isFalling = recentBP.every((v, i, a) => i === 0 || v <= a[i - 1] + 5);
      if (isRising && recentBP[0] > recentBP[recentBP.length - 1] + 15) {
        results.push({ type: 'warning', message: 'Blood pressure showing upward trend' });
      }
      if (isFalling && recentBP[0] < recentBP[recentBP.length - 1] - 15) {
        results.push({ type: 'warning', message: 'Blood pressure dropping - monitor for dizziness' });
      }
    }

    // Check for consistent ideal readings
    const recentIdeal = recent.filter(e => e.overall_status === 'ideal');
    if (recentIdeal.length >= 4 && recent.length >= 4) {
      results.push({ type: 'success', message: 'Vital signs consistently within normal range' });
    }

    return results;
  }, [entries]);

  const renderChart = (vitalType: VitalType, dataKey: string, color: string) => {
    const threshold = VITAL_THRESHOLDS[vitalType];
    
    return (
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 10 }} 
            interval="preserveStartEnd"
          />
          <YAxis 
            domain={['auto', 'auto']}
            tick={{ fontSize: 10 }}
          />
          <Tooltip 
            labelFormatter={(value) => chartData.find(d => d.date === value)?.dateLabel || value}
            formatter={(value: number) => [`${value} ${threshold.unit}`, threshold.label]}
          />
          
          {/* Green zone reference area */}
          <ReferenceArea
            y1={threshold.green.min}
            y2={threshold.green.max}
            fill="#22c55e"
            fillOpacity={0.1}
          />
          
          {/* Reference lines for thresholds */}
          <ReferenceLine 
            y={threshold.green.min} 
            stroke="#22c55e" 
            strokeDasharray="3 3" 
            label={{ value: 'Low', fontSize: 10, fill: '#22c55e' }}
          />
          <ReferenceLine 
            y={threshold.green.max} 
            stroke="#22c55e" 
            strokeDasharray="3 3"
            label={{ value: 'High', fontSize: 10, fill: '#22c55e' }}
          />
          
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="space-y-6">
      {/* AI Insights */}
      {insights.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Trend Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {insights.map((insight, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-2 p-2 rounded ${
                    insight.type === 'warning' ? 'bg-amber-50 text-amber-800' :
                    insight.type === 'success' ? 'bg-green-50 text-green-800' :
                    'bg-blue-50 text-blue-800'
                  }`}
                >
                  {insight.type === 'warning' ? (
                    <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  )}
                  <p className="text-sm">{insight.message}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              These insights are based on pattern analysis and do not replace clinical assessment.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Vital Sign Trends</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Not enough data to display trends
            </p>
          ) : (
            <Tabs defaultValue="temperature">
              <TabsList className="grid w-full grid-cols-5 mb-4">
                <TabsTrigger value="temperature">Temp</TabsTrigger>
                <TabsTrigger value="bp">BP</TabsTrigger>
                <TabsTrigger value="oxygen">SpO₂</TabsTrigger>
                <TabsTrigger value="heartRate">HR</TabsTrigger>
                <TabsTrigger value="respiratory">RR</TabsTrigger>
              </TabsList>

              <TabsContent value="temperature">
                {renderChart('temperature', 'temperature', '#ef4444')}
              </TabsContent>

              <TabsContent value="bp">
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                    <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <ReferenceArea y1={110} y2={140} fill="#22c55e" fillOpacity={0.1} />
                    <Line
                      type="monotone"
                      dataKey="systolic"
                      stroke="#dc2626"
                      strokeWidth={2}
                      name="Systolic"
                      dot={{ r: 3 }}
                      connectNulls
                    />
                    <Line
                      type="monotone"
                      dataKey="diastolic"
                      stroke="#2563eb"
                      strokeWidth={2}
                      name="Diastolic"
                      dot={{ r: 3 }}
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              </TabsContent>

              <TabsContent value="oxygen">
                {renderChart('oxygen', 'oxygen', '#0ea5e9')}
              </TabsContent>

              <TabsContent value="heartRate">
                {renderChart('heart_rate', 'heartRate', '#8b5cf6')}
              </TabsContent>

              <TabsContent value="respiratory">
                {renderChart('respiratory', 'respiratory', '#14b8a6')}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
