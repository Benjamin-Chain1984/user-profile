/**
 * Oral Health Trends
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useOralHealthAssessments, useOralHealthTaskLogs } from '@/hooks/useOralHealth';
import { format, parseISO, subDays } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, LineChart, Line, CartesianGrid } from 'recharts';
import { BarChart3, TrendingUp, AlertTriangle } from 'lucide-react';

interface Props {
  clientId?: string;
}

export function OralHealthTrends({ clientId }: Props) {
  const { assessments } = useOralHealthAssessments(clientId);
  const { logs } = useOralHealthTaskLogs(clientId);

  // Assessment outcome trend
  const assessmentTrend = assessments.slice(0, 12).reverse().map(a => ({
    date: format(parseISO(a.created_at), 'dd/MM'),
    score: a.overall_status === 'healthy' ? 3 : a.overall_status === 'changes' ? 2 : 1,
    label: a.overall_status,
  }));

  // AM/PM compliance over last 14 days
  const amComplianceData: { date: string; am: number; pm: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = subDays(new Date(), i);
    const dateStr = format(d, 'yyyy-MM-dd');
    const dayLogs = logs.filter(l => l.log_date === dateStr);
    const amLogs = dayLogs.filter(l => l.period === 'am');
    const pmLogs = dayLogs.filter(l => l.period === 'pm');
    amComplianceData.push({
      date: format(d, 'dd/MM'),
      am: amLogs.length > 0 ? (amLogs.some(l => l.completed) ? 100 : 0) : 0,
      pm: pmLogs.length > 0 ? (pmLogs.some(l => l.completed) ? 100 : 0) : 0,
    });
  }

  // Insights
  const insights: string[] = [];
  const recentAssessments = assessments.slice(0, 3);
  const consecutiveChanges = recentAssessments.filter(a => a.overall_status !== 'healthy').length;
  if (consecutiveChanges >= 2) insights.push('Repeated oral health changes detected – consider dental review.');
  
  const dentalPainCount = assessments.filter(a => a.dental_pain === 'unhealthy' || a.dental_pain === 'changes').length;
  if (dentalPainCount >= 2) insights.push('Recurring dental pain recorded. Assess for underlying cause.');

  const recentAm = amComplianceData.slice(-7);
  const avgCompliance = recentAm.reduce((s, d) => s + (d.am + d.pm) / 2, 0) / Math.max(recentAm.length, 1);
  if (avgCompliance > 0 && avgCompliance < 70) insights.push('Oral health compliance is below 70%. Review adherence.');

  return (
    <div className="space-y-4">
      {/* Insights */}
      {insights.length > 0 && (
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="py-4">
            <div className="flex gap-2">
              <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0" />
              <div className="space-y-1">
                {insights.map((insight, i) => (
                  <p key={i} className="text-sm text-warning">{insight}</p>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assessment Outcome Trend */}
      {assessmentTrend.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Assessment Outcomes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={assessmentTrend}>
                <XAxis dataKey="date" fontSize={11} />
                <YAxis domain={[0, 3]} ticks={[1, 2, 3]} tickFormatter={(v) => v === 3 ? 'Healthy' : v === 2 ? 'Changes' : 'Unhealthy'} fontSize={10} />
                <Tooltip formatter={(v: number) => v === 3 ? 'Healthy' : v === 2 ? 'Changes' : 'Unhealthy'} />
                <Bar dataKey="score" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* AM/PM Compliance Trend */}
      {logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" /> Morning & Night Oral Care Compliance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={amComplianceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={11} />
                <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} fontSize={10} />
                <Tooltip formatter={(v: number) => `${v}%`} />
                <Legend />
                <Bar dataKey="am" name="Morning (AM)" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pm" name="Night (PM)" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {assessments.length === 0 && logs.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          No data available yet. Complete assessments and log tasks to see trends.
        </p>
      )}
    </div>
  );
}
