/**
 * Oral Health Trends
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useOralHealthAssessments, useOralHealthTaskLogs } from '@/hooks/useOralHealth';
import { format, parseISO, subDays, differenceInDays } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import { BarChart3, TrendingUp, AlertTriangle, Lightbulb, CheckCircle, TrendingDown, Clock } from 'lucide-react';
import { CATEGORY_LABELS, type OralHealthCategory } from '@/types/oralHealth';

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

  // --- Insights Engine ---
  type Insight = { text: string; type: 'warning' | 'positive' | 'info' };
  const insights: Insight[] = [];

  // Compliance insights
  const last7Am = amComplianceData.slice(-7);
  const amCompletedDays = last7Am.filter(d => d.am === 100).length;
  const pmCompletedDays = last7Am.filter(d => d.pm === 100).length;
  const avgAmPercent = Math.round(last7Am.reduce((s, d) => s + d.am, 0) / 7);
  const avgPmPercent = Math.round(last7Am.reduce((s, d) => s + d.pm, 0) / 7);

  if (amCompletedDays === 7 && pmCompletedDays === 7) {
    insights.push({ text: 'Excellent! 100% oral care compliance this week — both morning and night care completed every day.', type: 'positive' });
  } else {
    if (avgAmPercent >= 85) {
      insights.push({ text: `Morning oral care compliance is strong at ${avgAmPercent}% this week (${amCompletedDays}/7 days).`, type: 'positive' });
    } else if (avgAmPercent > 0 && avgAmPercent < 70) {
      insights.push({ text: `Morning oral care compliance is ${avgAmPercent}% (${amCompletedDays}/7 days). Consider reviewing barriers to AM care.`, type: 'warning' });
    }
    if (avgPmPercent >= 85) {
      insights.push({ text: `Night oral care compliance is strong at ${avgPmPercent}% this week (${pmCompletedDays}/7 days).`, type: 'positive' });
    } else if (avgPmPercent > 0 && avgPmPercent < 70) {
      insights.push({ text: `Night oral care compliance is ${avgPmPercent}% (${pmCompletedDays}/7 days). Review evening care routine.`, type: 'warning' });
    }
    if (avgAmPercent > 0 && avgPmPercent > 0 && Math.abs(avgAmPercent - avgPmPercent) > 30) {
      const weaker = avgAmPercent < avgPmPercent ? 'Morning' : 'Night';
      insights.push({ text: `${weaker} care is significantly lower than the other period. Consider adjusting staffing or routines.`, type: 'info' });
    }
  }

  // Assessment insights
  const recentAssessments = assessments.slice(0, 5);
  if (recentAssessments.length >= 2) {
    const consecutiveUnhealthy = recentAssessments.filter(a => a.overall_status === 'unhealthy').length;
    const consecutiveChanges = recentAssessments.filter(a => a.overall_status !== 'healthy').length;

    if (consecutiveUnhealthy >= 2) {
      insights.push({ text: `${consecutiveUnhealthy} of the last ${recentAssessments.length} assessments recorded as Unhealthy — escalate to dentist or health practitioner.`, type: 'warning' });
    } else if (consecutiveChanges >= 3) {
      insights.push({ text: 'Multiple consecutive assessments show changes. Monitor closely and consider a dental review.', type: 'warning' });
    }

    if (recentAssessments.length >= 3) {
      const scores = recentAssessments.map(a => a.overall_status === 'healthy' ? 3 : a.overall_status === 'changes' ? 2 : 1);
      if (scores[0] > scores[1] && scores[1] >= scores[2]) {
        insights.push({ text: 'Assessment outcomes are trending positively — oral health is improving.', type: 'positive' });
      }
    }
  }

  const categories = ['lips', 'tongue', 'roof_of_mouth', 'gums', 'teeth', 'dentures', 'breath', 'cleanliness', 'dental_pain'] as OralHealthCategory[];
  // Category-specific recurring issues
  const recurringIssues: string[] = [];
  categories.forEach(cat => {
    const recent = assessments.slice(0, 5);
    const unhealthyCount = recent.filter(a => (a[cat as keyof typeof a] as string) === 'unhealthy').length;
    if (unhealthyCount >= 2) recurringIssues.push(CATEGORY_LABELS[cat]);
  });
  if (recurringIssues.length > 0) {
    insights.push({ text: `Recurring concerns in: ${recurringIssues.join(', ')}. These areas have been flagged as unhealthy in multiple recent assessments.`, type: 'warning' });
  }

  // Dental pain
  const dentalPainRecent = assessments.slice(0, 5).filter(a => a.dental_pain === 'unhealthy');
  if (dentalPainRecent.length >= 2) {
    insights.push({ text: 'Persistent dental pain detected across multiple assessments. Assess for underlying cause and consider pain management referral.', type: 'warning' });
  } else if (dentalPainRecent.length === 1) {
    insights.push({ text: 'Dental pain was recorded in a recent assessment. Monitor at next assessment and document any changes.', type: 'info' });
  }

  // Days since last assessment
  if (assessments.length > 0) {
    const daysSince = differenceInDays(new Date(), parseISO(assessments[0].created_at));
    if (daysSince > 30) {
      insights.push({ text: `It has been ${daysSince} days since the last oral health assessment. Consider scheduling one.`, type: 'warning' });
    } else if (daysSince <= 7 && assessments[0].overall_status === 'healthy') {
      insights.push({ text: `Last assessment (${daysSince === 0 ? 'today' : `${daysSince} day${daysSince !== 1 ? 's' : ''} ago`}) showed a healthy result.`, type: 'positive' });
    }
  } else {
    insights.push({ text: 'No assessments have been recorded yet. Complete an initial oral health assessment to establish a baseline.', type: 'info' });
  }

  if (logs.length === 0 && assessments.length > 0) {
    insights.push({ text: 'No oral health tasks have been logged. Enable compliance monitoring in Settings to track AM/PM care.', type: 'info' });
  }

  if (insights.length === 0) {
    insights.push({ text: 'Oral health data is being collected. Continue logging tasks and assessments to generate detailed insights.', type: 'info' });
  }

  const insightIcon = (type: Insight['type']) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />;
      case 'positive': return <CheckCircle className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />;
      case 'info': return <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />;
    }
  };

  const insightColor = (type: Insight['type']) => {
    switch (type) {
      case 'warning': return 'text-warning';
      case 'positive': return 'text-success';
      case 'info': return 'text-muted-foreground';
    }
  };

  

  return (
    <div className="space-y-4">
      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="h-4 w-4" /> Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {insights.map((insight, i) => (
            <div key={i} className="flex items-start gap-2">
              {insightIcon(insight.type)}
              <p className={`text-sm ${insightColor(insight.type)}`}>{insight.text}</p>
            </div>
          ))}
          <p className="text-xs text-muted-foreground mt-3 pt-2 border-t border-border/50 italic">
            These insights are based on recorded data and do not replace professional dental advice. Refer to the individual's oral health care plan.
          </p>
        </CardContent>
      </Card>

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
