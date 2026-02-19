import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine, Area, ComposedChart } from 'recharts';
import { AbbeyPainAssessment, getSeverityLabel } from '@/types/painAssessment';
import { PainadAssessment, getPainadSeverityLabel } from '@/types/painad';
import { format } from 'date-fns';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface PainTrendChartProps {
  assessments: AbbeyPainAssessment[];
  painadAssessments?: PainadAssessment[];
}

export function PainTrendChart({ assessments, painadAssessments = [] }: PainTrendChartProps) {
  // Abbey chart data
  const abbeyData = useMemo(() => {
    return [...assessments].reverse().slice(-14).map((a) => ({
      date: format(new Date(a.created_at), 'MM/dd'),
      fullDate: format(new Date(a.created_at), 'PPp'),
      score: a.total_score,
      severity: getSeverityLabel(a.severity),
    }));
  }, [assessments]);

  // PAINAD chart data
  const painadData = useMemo(() => {
    return [...painadAssessments].reverse().slice(-14).map((a) => ({
      date: format(new Date(a.created_at), 'MM/dd'),
      fullDate: format(new Date(a.created_at), 'PPp'),
      score: a.total_score,
      severity: getPainadSeverityLabel(a.severity),
    }));
  }, [painadAssessments]);

  const hasAbbey = assessments.length > 0;
  const hasPainad = painadAssessments.length > 0;

  if (!hasAbbey && !hasPainad) {
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

  const chartConfig = {
    score: { label: 'Pain Score', color: 'hsl(var(--primary))' },
  };

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {hasAbbey && (
          <>
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground">Abbey Avg</p>
                <p className="text-xl font-bold">
                  {(assessments.reduce((s, a) => s + a.total_score, 0) / assessments.length).toFixed(1)}
                </p>
                <p className="text-xs text-muted-foreground">/18</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground">Abbey Count</p>
                <p className="text-xl font-bold">{assessments.length}</p>
              </CardContent>
            </Card>
          </>
        )}
        {hasPainad && (
          <>
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground">PAINAD Avg</p>
                <p className="text-xl font-bold">
                  {(painadAssessments.reduce((s, a) => s + a.total_score, 0) / painadAssessments.length).toFixed(1)}
                </p>
                <p className="text-xs text-muted-foreground">/10</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground">PAINAD Count</p>
                <p className="text-xl font-bold">{painadAssessments.length}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Abbey Chart */}
      {hasAbbey && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Abbey Pain Score Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <ComposedChart data={abbeyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="abbeyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 18]} tick={{ fontSize: 12 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ReferenceLine y={2} stroke="hsl(var(--success))" strokeDasharray="3 3" />
                <ReferenceLine y={7} stroke="hsl(var(--warning))" strokeDasharray="3 3" />
                <ReferenceLine y={13} stroke="hsl(var(--destructive))" strokeDasharray="3 3" />
                <Area type="monotone" dataKey="score" stroke="hsl(var(--success))" fill="url(#abbeyGradient)" />
                <Line type="monotone" dataKey="score" stroke="hsl(var(--success))" strokeWidth={2} dot={{ fill: 'hsl(var(--success))', r: 4 }} />
              </ComposedChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* PAINAD Chart */}
      {hasPainad && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">PAINAD Score Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <ComposedChart data={painadData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="painadGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ReferenceLine y={3} stroke="hsl(var(--warning))" strokeDasharray="3 3" />
                <ReferenceLine y={6} stroke="hsl(var(--destructive))" strokeDasharray="3 3" />
                <Area type="monotone" dataKey="score" stroke="hsl(var(--primary))" fill="url(#painadGradient)" />
                <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))', r: 4 }} />
              </ComposedChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
