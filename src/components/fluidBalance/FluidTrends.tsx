import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Area, ComposedChart } from 'recharts';
import { FluidIntakeEntry, FluidOutputEntry, FluidConfig } from '@/types/fluidBalance';
import { calculateDailySummaries } from '@/utils/fluidBalanceCalculator';
import { format, parseISO } from 'date-fns';

interface FluidTrendsProps {
  intakeEntries: FluidIntakeEntry[];
  outputEntries: FluidOutputEntry[];
  config: FluidConfig | null;
}

type TimeRange = '7' | '14' | '30';

export const FluidTrends: React.FC<FluidTrendsProps> = ({
  intakeEntries,
  outputEntries,
  config
}) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('7');
  
  if (!config) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">
            Configure fluid balance settings to view trends
          </p>
        </CardContent>
      </Card>
    );
  }
  
  const summaries = calculateDailySummaries(
    intakeEntries,
    outputEntries,
    config,
    parseInt(timeRange)
  ).reverse();
  
  const chartData = summaries.map(s => ({
    date: format(parseISO(s.date), 'dd MMM'),
    intake: s.totalIntake,
    output: config.enable_output_logging ? s.totalOutput : undefined,
    balance: config.enable_output_logging ? s.balance : undefined,
    target: config.fluid_restriction_enabled && config.max_fluid_allowance_ml 
      ? config.max_fluid_allowance_ml 
      : config.target_daily_intake_ml
  }));
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Fluid Balance Trends</CardTitle>
          <div className="flex gap-2">
            {(['7', '14', '30'] as TimeRange[]).map(range => (
              <Button
                key={range}
                variant={timeRange === range ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange(range)}
              >
                {range}d
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
                label={{ value: 'ml', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
                formatter={(value: number, name: string) => [
                  `${value}ml`,
                  name.charAt(0).toUpperCase() + name.slice(1)
                ]}
              />
              <Legend />
              
              {/* Target/Limit reference line */}
              <ReferenceLine 
                y={config.fluid_restriction_enabled && config.max_fluid_allowance_ml 
                  ? config.max_fluid_allowance_ml 
                  : config.target_daily_intake_ml
                } 
                stroke="hsl(var(--primary))" 
                strokeDasharray="5 5"
                label={{ 
                  value: config.fluid_restriction_enabled ? 'Limit' : 'Target', 
                  position: 'right',
                  fill: 'hsl(var(--primary))'
                }}
              />
              
              {/* Intake line */}
              <Line
                type="monotone"
                dataKey="intake"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
                name="Intake"
              />
              
              {/* Output line (if enabled) */}
              {config.enable_output_logging && (
                <Line
                  type="monotone"
                  dataKey="output"
                  stroke="#f97316"
                  strokeWidth={2}
                  dot={{ fill: '#f97316', r: 4 }}
                  name="Output"
                />
              )}
              
              {/* Balance area (if enabled) */}
              {config.enable_output_logging && (
                <Area
                  type="monotone"
                  dataKey="balance"
                  fill="#22c55e"
                  fillOpacity={0.2}
                  stroke="#22c55e"
                  strokeWidth={1}
                  name="Balance"
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend explanation */}
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <p className="text-xs text-muted-foreground">
            <strong>Intake</strong> = Total fluid consumed | 
            {config.enable_output_logging && (
              <>
                {' '}<strong>Output</strong> = Total fluid lost | 
                {' '}<strong>Balance</strong> = Intake − Output | 
              </>
            )}
            {' '}<strong>{config.fluid_restriction_enabled ? 'Limit' : 'Target'}</strong> = {
              config.fluid_restriction_enabled && config.max_fluid_allowance_ml 
                ? `${config.max_fluid_allowance_ml}ml daily cap`
                : `${config.target_daily_intake_ml}ml daily goal`
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
