/**
 * HealthMonitoringTrends - Charts and trend analysis for vital signs
 * Features color-coded zones (Green, Amber, Red) and AI trend insights
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
  Legend,
} from 'recharts';
import { useVitalSignEntries, useVitalSignConfig, useAlteredCriteria } from '@/hooks/useHealthMonitoring';
import { VITAL_THRESHOLDS, type VitalType, type AlteredCriteria } from '@/types/healthMonitoring';
import { format, subDays } from 'date-fns';
import { TrendingUp, AlertTriangle, CheckCircle, Thermometer, Heart, Activity, Wind, Gauge } from 'lucide-react';

interface HealthMonitoringTrendsProps {
  clientId?: string;
}

// Get thresholds considering altered criteria
function getThresholds(vitalType: VitalType, alteredCriteria?: AlteredCriteria | null) {
  const standard = VITAL_THRESHOLDS[vitalType];
  
  if (alteredCriteria?.is_active) {
    return {
      green: {
        min: alteredCriteria.green_min ?? standard.green.min,
        max: alteredCriteria.green_max ?? standard.green.max,
      },
      amberLow: alteredCriteria.amber_low_min !== null && alteredCriteria.amber_low_max !== null
        ? { min: alteredCriteria.amber_low_min, max: alteredCriteria.amber_low_max }
        : standard.amberLow,
      amberHigh: alteredCriteria.amber_high_min !== null && alteredCriteria.amber_high_max !== null
        ? { min: alteredCriteria.amber_high_min, max: alteredCriteria.amber_high_max }
        : standard.amberHigh,
      unit: standard.unit,
      label: standard.label,
    };
  }
  
  return standard;
}

export function HealthMonitoringTrends({ clientId }: HealthMonitoringTrendsProps) {
  const { entries } = useVitalSignEntries(clientId, 100);
  const { config } = useVitalSignConfig(clientId);
  const { criteriaMap } = useAlteredCriteria(clientId);

  // Prepare chart data - reverse to show chronological order
  const chartData = useMemo(() => {
    return [...entries]
      .reverse()
      .map((entry) => ({
        date: format(new Date(entry.event_occurred_at), 'MM/dd HH:mm'),
        dateLabel: format(new Date(entry.event_occurred_at), 'MMM d, HH:mm'),
        fullDate: entry.event_occurred_at,
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
        results.push({ type: 'warning', message: 'Temperature gradually rising over recent entries — possible infection risk' });
      }
    }

    // BP trend
    const recentBP = recent.filter(e => e.bp_systolic).map(e => e.bp_systolic!);
    if (recentBP.length >= 3) {
      const isRising = recentBP.every((v, i, a) => i === 0 || v >= a[i - 1] - 5);
      const isFalling = recentBP.every((v, i, a) => i === 0 || v <= a[i - 1] + 5);
      if (isRising && recentBP[0] > recentBP[recentBP.length - 1] + 15) {
        results.push({ type: 'warning', message: 'Blood pressure showing upward trend — monitor for hypertensive symptoms' });
      }
      if (isFalling && recentBP[0] < recentBP[recentBP.length - 1] - 15) {
        results.push({ type: 'warning', message: 'Blood pressure dropping — monitor for dizziness or hypotension' });
      }
    }

    // Multi-parameter deterioration detection
    const recentOxygen = recent.filter(e => e.oxygen_saturation).map(e => e.oxygen_saturation!);
    const recentRR = recent.filter(e => e.respiratory_rate).map(e => e.respiratory_rate!);
    const recentHR = recent.filter(e => e.heart_rate).map(e => e.heart_rate!);
    
    if (recentOxygen.length >= 2 && recentRR.length >= 2 && recentHR.length >= 2) {
      const oxygenFalling = recentOxygen[0] < recentOxygen[recentOxygen.length - 1];
      const rrRising = recentRR[0] > recentRR[recentRR.length - 1];
      const hrRising = recentHR[0] > recentHR[recentHR.length - 1];
      
      if (oxygenFalling && rrRising && hrRising) {
        results.push({ 
          type: 'warning', 
          message: 'Multi-parameter deterioration detected: SpO₂ falling while RR and HR rising — prompt medical review recommended' 
        });
      }
    }

    // Check for consistent ideal readings
    const recentIdeal = recent.filter(e => e.overall_status === 'ideal');
    if (recentIdeal.length >= 4 && recent.length >= 4) {
      results.push({ type: 'success', message: 'Vital signs consistently within normal range' });
    }

    return results;
  }, [entries]);

  // Render chart with colored zones
  const renderChart = (vitalType: VitalType, dataKey: string, color: string, label: string) => {
    const thresholds = getThresholds(vitalType, criteriaMap[vitalType]);
    const hasAlteredCriteria = criteriaMap[vitalType]?.is_active;
    
    // Calculate y-axis domain to include all zones
    const allValues = chartData.map(d => d[dataKey as keyof typeof d] as number).filter(Boolean);
    let minY = Math.min(...allValues, thresholds.amberLow?.min ?? thresholds.green.min);
    let maxY = Math.max(...allValues, thresholds.amberHigh?.max ?? thresholds.green.max);
    
    // Add padding
    const padding = (maxY - minY) * 0.1;
    minY = Math.floor(minY - padding);
    maxY = Math.ceil(maxY + padding);
    
    return (
      <div className="space-y-2">
        {hasAlteredCriteria && (
          <Badge variant="outline" className="text-xs border-blue-500 text-blue-600">
            Using Altered Criteria
          </Badge>
        )}
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 10 }} 
              interval="preserveStartEnd"
            />
            <YAxis 
              domain={[minY, maxY]}
              tick={{ fontSize: 10 }}
              label={{ value: thresholds.unit, angle: -90, position: 'insideLeft', fontSize: 10 }}
            />
            <Tooltip 
              labelFormatter={(value) => chartData.find(d => d.date === value)?.dateLabel || value}
              formatter={(value: number) => [`${value} ${thresholds.unit}`, label]}
              contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
            />
            <Legend />
            
            {/* Red zone (below amber low) */}
            {thresholds.amberLow && (
              <ReferenceArea
                y1={minY}
                y2={thresholds.amberLow.min}
                fill="#ef4444"
                fillOpacity={0.15}
                label={{ value: 'RED', position: 'insideTopLeft', fontSize: 10, fill: '#ef4444' }}
              />
            )}
            
            {/* Amber Low zone */}
            {thresholds.amberLow && (
              <ReferenceArea
                y1={thresholds.amberLow.min}
                y2={thresholds.amberLow.max}
                fill="#f59e0b"
                fillOpacity={0.15}
                label={{ value: 'AMBER', position: 'insideTopLeft', fontSize: 10, fill: '#f59e0b' }}
              />
            )}
            
            {/* Green (IDEAL) zone */}
            <ReferenceArea
              y1={thresholds.green.min}
              y2={thresholds.green.max}
              fill="#22c55e"
              fillOpacity={0.15}
              label={{ value: 'IDEAL', position: 'insideTopLeft', fontSize: 10, fill: '#22c55e' }}
            />
            
            {/* Amber High zone */}
            {thresholds.amberHigh && (
              <ReferenceArea
                y1={thresholds.amberHigh.min}
                y2={thresholds.amberHigh.max}
                fill="#f59e0b"
                fillOpacity={0.15}
                label={{ value: 'AMBER', position: 'insideTopRight', fontSize: 10, fill: '#f59e0b' }}
              />
            )}
            
            {/* Red zone (above amber high) */}
            {thresholds.amberHigh && (
              <ReferenceArea
                y1={thresholds.amberHigh.max}
                y2={maxY}
                fill="#ef4444"
                fillOpacity={0.15}
                label={{ value: 'RED', position: 'insideTopRight', fontSize: 10, fill: '#ef4444' }}
              />
            )}
            
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              dot={{ r: 4, fill: color }}
              activeDot={{ r: 6 }}
              connectNulls
              name={label}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // Blood pressure dual chart
  const renderBPChart = () => {
    const sysThresholds = getThresholds('bp_systolic', criteriaMap.bp_systolic);
    const diaThresholds = getThresholds('bp_diastolic', criteriaMap.bp_diastolic);
    const hasAlteredCriteria = criteriaMap.bp_systolic?.is_active || criteriaMap.bp_diastolic?.is_active;
    
    // Calculate domain for both systolic and diastolic
    const allSys = chartData.map(d => d.systolic).filter(Boolean) as number[];
    const allDia = chartData.map(d => d.diastolic).filter(Boolean) as number[];
    
    let minY = Math.min(
      ...allDia, 
      diaThresholds.amberLow?.min ?? diaThresholds.green.min, 
      50
    );
    let maxY = Math.max(
      ...allSys, 
      sysThresholds.amberHigh?.max ?? sysThresholds.green.max, 
      180
    );
    
    return (
      <div className="space-y-2">
        {hasAlteredCriteria && (
          <Badge variant="outline" className="text-xs border-blue-500 text-blue-600">
            Using Altered Criteria
          </Badge>
        )}
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis 
              domain={[minY, maxY]} 
              tick={{ fontSize: 10 }}
              label={{ value: 'mmHg', angle: -90, position: 'insideLeft', fontSize: 10 }}
            />
            <Tooltip 
              labelFormatter={(value) => chartData.find(d => d.date === value)?.dateLabel || value}
              contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
            />
            <Legend />
            
            {/* Systolic zones */}
            <ReferenceArea
              y1={sysThresholds.green.min}
              y2={sysThresholds.green.max}
              fill="#22c55e"
              fillOpacity={0.1}
            />
            
            {/* Diastolic zones */}
            <ReferenceArea
              y1={diaThresholds.green.min}
              y2={diaThresholds.green.max}
              fill="#22c55e"
              fillOpacity={0.1}
            />
            
            <Line
              type="monotone"
              dataKey="systolic"
              stroke="#dc2626"
              strokeWidth={2}
              name="Systolic"
              dot={{ r: 4, fill: '#dc2626' }}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="diastolic"
              stroke="#2563eb"
              strokeWidth={2}
              name="Diastolic"
              dot={{ r: 4, fill: '#2563eb' }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="flex gap-4 text-xs text-muted-foreground justify-center">
          <span>Systolic IDEAL: {sysThresholds.green.min}–{sysThresholds.green.max} mmHg</span>
          <span>Diastolic IDEAL: {diaThresholds.green.min}–{diaThresholds.green.max} mmHg</span>
        </div>
      </div>
    );
  };

  // Get enabled tabs
  const enabledTabs: { id: string; label: string; icon: React.ReactNode }[] = [];
  if (config.temperature_enabled) enabledTabs.push({ id: 'temperature', label: 'Temp', icon: <Thermometer className="h-4 w-4" /> });
  if (config.bp_enabled) enabledTabs.push({ id: 'bp', label: 'BP', icon: <Heart className="h-4 w-4" /> });
  if (config.oxygen_enabled) enabledTabs.push({ id: 'oxygen', label: 'SpO₂', icon: <Gauge className="h-4 w-4" /> });
  if (config.heart_rate_enabled) enabledTabs.push({ id: 'heartRate', label: 'HR', icon: <Activity className="h-4 w-4" /> });
  if (config.respiratory_enabled) enabledTabs.push({ id: 'respiratory', label: 'RR', icon: <Wind className="h-4 w-4" /> });

  return (
    <div className="space-y-6">
      {/* AI Insights */}
      {insights.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              AI Trend Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {insights.map((insight, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-2 p-3 rounded-lg ${
                    insight.type === 'warning' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                    insight.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
                    'bg-blue-50 text-blue-800 border border-blue-200'
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
          <p className="text-sm text-muted-foreground">
            Charts display color-coded zones: <span className="text-green-600 font-medium">IDEAL (Green)</span>, 
            <span className="text-amber-600 font-medium"> AMBER</span>, and 
            <span className="text-red-600 font-medium"> RED (Critical)</span>
          </p>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Not enough data to display trends. Start logging vital signs to see trends.
            </p>
          ) : enabledTabs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No vital signs are enabled. Configure vitals in Settings.
            </p>
          ) : (
            <Tabs defaultValue={enabledTabs[0]?.id || 'temperature'}>
              <TabsList className="grid w-full mb-4" style={{ gridTemplateColumns: `repeat(${enabledTabs.length}, 1fr)` }}>
                {enabledTabs.map((tab) => (
                  <TabsTrigger key={tab.id} value={tab.id} className="gap-1.5">
                    {tab.icon}
                    <span className="hidden sm:inline">{tab.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              {config.temperature_enabled && (
                <TabsContent value="temperature">
                  {renderChart('temperature', 'temperature', '#ef4444', 'Temperature')}
                </TabsContent>
              )}

              {config.bp_enabled && (
                <TabsContent value="bp">
                  {renderBPChart()}
                </TabsContent>
              )}

              {config.oxygen_enabled && (
                <TabsContent value="oxygen">
                  {renderChart('oxygen', 'oxygen', '#0ea5e9', 'Oxygen Saturation')}
                </TabsContent>
              )}

              {config.heart_rate_enabled && (
                <TabsContent value="heartRate">
                  {renderChart('heart_rate', 'heartRate', '#8b5cf6', 'Heart Rate')}
                </TabsContent>
              )}

              {config.respiratory_enabled && (
                <TabsContent value="respiratory">
                  {renderChart('respiratory', 'respiratory', '#14b8a6', 'Respiratory Rate')}
                </TabsContent>
              )}
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Zone Legend */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-4 justify-center text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500/30 border border-green-500" />
              <span>IDEAL – No action</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-amber-500/30 border border-amber-500" />
              <span>AMBER – Recheck in 2 hours</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-500/30 border border-red-500" />
              <span>RED – Call 000</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}