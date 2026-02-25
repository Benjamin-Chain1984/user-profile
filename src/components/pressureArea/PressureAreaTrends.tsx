/**
 * Pressure Area Prevention Trends
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePressureReliefEvents, useSkinChecks, usePressureAreaConfig } from '@/hooks/usePressureArea';
import { usePressureReliefPlan } from '@/hooks/usePressureReliefPlan';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { subDays, format, startOfDay, isSameDay, differenceInDays } from 'date-fns';
import { TrendingUp, Info } from 'lucide-react';

interface Props {
  clientId?: string;
}

export function PressureAreaTrends({ clientId }: Props) {
  const { events } = usePressureReliefEvents(clientId);
  const { sessions } = useSkinChecks(clientId);
  const { plan } = usePressureReliefPlan(clientId);
  const { config } = usePressureAreaConfig(clientId);

  // Daily compliance over last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dayStart = startOfDay(date);
    const dayEvents = events.filter(e => isSameDay(new Date(e.event_occurred_at), dayStart));
    
    const expectedCount = plan?.interval_minutes && plan.schedule_type !== 'as_required'
      ? Math.floor((16 * 60) / plan.interval_minutes)
      : 0;
    const compliance = expectedCount > 0 ? Math.min(100, Math.round((dayEvents.length / expectedCount) * 100)) : (dayEvents.length > 0 ? 100 : 0);

    return {
      date: format(date, 'EEE'),
      completed: dayEvents.length,
      expected: expectedCount,
      compliance,
    };
  });

  const avgCompliance = last7Days.length > 0
    ? Math.round(last7Days.reduce((sum, d) => sum + d.compliance, 0) / last7Days.length)
    : 0;

  // Insights
  const insights = useMemo(() => {
    const messages: string[] = [];

    // Compliance insight
    if (avgCompliance >= 90) {
      messages.push('Great repositioning compliance this week. Keep it up.');
    } else if (avgCompliance >= 70) {
      messages.push('Repositioning compliance is moderate. Aim to improve consistency.');
    } else if (avgCompliance > 0) {
      messages.push('Repositioning compliance is low. Review the schedule and ensure staff are aware.');
    }

    // Days with zero compliance
    const zeroDays = last7Days.filter(d => d.compliance === 0 && d.expected > 0);
    if (zeroDays.length >= 2) {
      messages.push(`${zeroDays.length} days this week had no repositioning logged. Gaps increase pressure injury risk.`);
    }

    // Skin check frequency
    if (sessions.length > 0) {
      const lastCheck = new Date(sessions[0].event_occurred_at);
      const daysSinceCheck = differenceInDays(new Date(), lastCheck);
      const skinFreqDays = config?.skin_check_frequency_days ?? 7;

      if (daysSinceCheck > skinFreqDays) {
        messages.push(`Last skin check was ${daysSinceCheck} days ago. A skin check is overdue.`);
      } else {
        messages.push('Skin checks are up to date.');
      }
    } else {
      messages.push('No skin checks recorded yet. Regular skin checks help identify concerns early.');
    }

    // Red findings
    const redFindings = sessions.filter(s => s.overall_status === 'red');
    if (redFindings.length > 0) {
      messages.push(`${redFindings.length} skin check(s) had red findings. Ensure follow-up with a healthcare professional.`);
    }

    // Monitoring gap
    if (events.length === 0) {
      messages.push('No pressure relief events recorded. Start logging to track trends.');
    }

    if (messages.length === 0) {
      messages.push('Pressure area prevention appears on track. Continue monitoring.');
    }

    return messages;
  }, [avgCompliance, last7Days, sessions, events, config]);

  return (
    <div className="space-y-4">
      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {insights.map((insight, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span>{insight}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted-foreground italic">
            This is not medical advice. Follow the person's health plan and seek medical advice if concerned.
          </p>
        </CardContent>
      </Card>

      {/* Weekly Compliance */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">7-Day Compliance</CardTitle>
            <Badge variant={avgCompliance >= 90 ? 'default' : avgCompliance >= 70 ? 'outline' : 'destructive'}>
              {avgCompliance}% avg
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={last7Days}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} />
              <Tooltip formatter={(value: number) => `${value}%`} />
              <Bar dataKey="compliance" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold">{events.length}</p>
            <p className="text-sm text-muted-foreground">Total Relief Events</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold">{sessions.length}</p>
            <p className="text-sm text-muted-foreground">Skin Checks</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold">{sessions.filter(s => s.overall_status === 'red').length}</p>
            <p className="text-sm text-muted-foreground">Red Findings</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
