import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine, Area, ComposedChart } from 'recharts';
import { AbbeyPainAssessment, getSeverityLabel } from '@/types/painAssessment';
import { format } from 'date-fns';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface PainTrendChartProps {
  assessments: AbbeyPainAssessment[];
}

export function PainTrendChart({ assessments }: PainTrendChartProps) {
  const chartData = useMemo(() => {
    return [...assessments]
      .reverse()
      .slice(-14) // Last 14 assessments
      .map((a) => ({
        date: format(new Date(a.created_at), 'MM/dd'),
        fullDate: format(new Date(a.created_at), 'PPp'),
        score: a.total_score,
        severity: getSeverityLabel(a.severity),
      }));
  }, [assessments]);

  const trend = useMemo(() => {
    if (chartData.length < 2) return 'stable';
    const recent = chartData.slice(-3);
    const older = chartData.slice(-6, -3);
    
    if (older.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((sum, d) => sum + d.score, 0) / recent.length;
    const olderAvg = older.reduce((sum, d) => sum + d.score, 0) / older.length;
    
    if (recentAvg > olderAvg + 1) return 'increasing';
    if (recentAvg < olderAvg - 1) return 'decreasing';
    return 'stable';
  }, [chartData]);

  const chartConfig = {
    score: {
      label: 'Pain Score',
      color: 'hsl(var(--primary))',
    },
  };

  if (assessments.length === 0) {
    return (
      <Card className="bg-muted/50">
        <CardContent className="p-6 text-center">
          <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No data available for trends</p>
          <p className="text-sm text-muted-foreground mt-1">Complete assessments to see trends</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Trend Summary */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pain Trend</p>
              <p className="text-lg font-medium capitalize flex items-center gap-2">
                {trend === 'increasing' && (
                  <>
                    <TrendingUp className="w-5 h-5 text-destructive" />
                    <span className="text-destructive">Increasing</span>
                  </>
                )}
                {trend === 'decreasing' && (
                  <>
                    <TrendingDown className="w-5 h-5 text-success" />
                    <span className="text-success">Decreasing</span>
                  </>
                )}
                {trend === 'stable' && (
                  <>
                    <Minus className="w-5 h-5 text-muted-foreground" />
                    <span>Stable</span>
                  </>
                )}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Assessments</p>
              <p className="text-lg font-medium">{assessments.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pain Score Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="painGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis 
                domain={[0, 12]} 
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <ChartTooltip 
                content={<ChartTooltipContent />}
                labelFormatter={(label, payload) => {
                  if (payload && payload[0]) {
                    return payload[0].payload.fullDate;
                  }
                  return label;
                }}
              />
              
              {/* Severity zones */}
              <ReferenceLine y={2} stroke="hsl(var(--success))" strokeDasharray="3 3" />
              <ReferenceLine y={7} stroke="hsl(var(--warning))" strokeDasharray="3 3" />
              <ReferenceLine y={13} stroke="hsl(var(--destructive))" strokeDasharray="3 3" />
              
              <Area
                type="monotone"
                dataKey="score"
                stroke="hsl(var(--primary))"
                fill="url(#painGradient)"
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </ComposedChart>
          </ChartContainer>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-4 text-xs justify-center">
            <div className="flex items-center gap-1">
              <div className="w-3 h-0.5 bg-success" />
              <span className="text-muted-foreground">No Pain (0-2)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-0.5 bg-warning" />
              <span className="text-muted-foreground">Mild (3-7)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-0.5 bg-destructive" />
              <span className="text-muted-foreground">Moderate+ (8+)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Average</p>
            <p className="text-xl font-bold">
              {(assessments.reduce((sum, a) => sum + a.total_score, 0) / assessments.length).toFixed(1)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Highest</p>
            <p className="text-xl font-bold text-destructive">
              {Math.max(...assessments.map((a) => a.total_score))}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Lowest</p>
            <p className="text-xl font-bold text-success">
              {Math.min(...assessments.map((a) => a.total_score))}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
