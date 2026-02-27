import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { FluidIntakeEntry, FluidOutputEntry, FluidConfig, HydrationSymptomCheck } from '@/types/fluidBalance';
import { calculateDailySummaries } from '@/utils/fluidBalanceCalculator';

interface FluidInsightsProps {
  intakeEntries: FluidIntakeEntry[];
  outputEntries: FluidOutputEntry[];
  symptomChecks: HydrationSymptomCheck[];
  config: FluidConfig | null;
}

type InsightType = 'warning' | 'success' | 'info';

interface Insight {
  type: InsightType;
  message: string;
}

export const FluidInsights: React.FC<FluidInsightsProps> = ({
  intakeEntries,
  outputEntries,
  symptomChecks,
  config
}) => {
  const insights = useMemo<Insight[]>(() => {
    if (!config) return [];
    const messages: Insight[] = [];

    const summaries7 = calculateDailySummaries(intakeEntries, outputEntries, config, 7);
    const summaries14 = calculateDailySummaries(intakeEntries, outputEntries, config, 14);

    // --- Monitoring gap ---
    const daysWithIntake7 = summaries7.filter(s => s.totalIntake > 0).length;
    if (daysWithIntake7 === 0) {
      messages.push({ type: 'warning', message: 'No fluid intake logged in the last 7 days. Regular monitoring is essential for hydration safety.' });
      return messages;
    }
    if (daysWithIntake7 < 4) {
      messages.push({ type: 'warning', message: `Fluid intake was only logged on ${daysWithIntake7}/7 days this week. Consistent daily logging improves clinical reliability.` });
    }

    // --- Average intake vs target ---
    const target = config.fluid_restriction_enabled && config.max_fluid_allowance_ml
      ? config.max_fluid_allowance_ml
      : config.target_daily_intake_ml;

    const loggedDays7 = summaries7.filter(s => s.totalIntake > 0);
    if (loggedDays7.length > 0) {
      const avgIntake = Math.round(loggedDays7.reduce((s, d) => s + d.totalIntake, 0) / loggedDays7.length);
      const avgPercent = target > 0 ? Math.round((avgIntake / target) * 100) : 0;

      if (avgPercent >= 80 && avgPercent <= 110) {
        messages.push({ type: 'success', message: `Average daily intake is ${avgIntake}ml (${avgPercent}% of ${config.fluid_restriction_enabled ? 'limit' : 'target'}) — within a healthy range.` });
      } else if (avgPercent < 60) {
        messages.push({ type: 'warning', message: `Average daily intake is only ${avgIntake}ml (${avgPercent}% of ${config.fluid_restriction_enabled ? 'limit' : 'target'}). Consider reviewing hydration support.` });
      } else if (avgPercent > 120) {
        messages.push({ type: 'warning', message: `Average daily intake is ${avgIntake}ml (${avgPercent}% of ${config.fluid_restriction_enabled ? 'limit' : 'target'}) — consistently exceeding the ${config.fluid_restriction_enabled ? 'restriction' : 'target'}.` });
      }
    }

    // --- Red/amber day count ---
    const redDays = summaries7.filter(s => s.status === 'red').length;
    const amberDays = summaries7.filter(s => s.status === 'amber').length;
    if (redDays >= 3) {
      messages.push({ type: 'warning', message: `${redDays} of the last 7 days had a Red status. Escalate to a clinician if not already actioned.` });
    } else if (redDays >= 1) {
      messages.push({ type: 'warning', message: `${redDays} day(s) with Red status this week. Review intake patterns and consider clinical follow-up.` });
    }
    if (amberDays >= 4) {
      messages.push({ type: 'info', message: `${amberDays} of the last 7 days were Amber. Hydration may be consistently below target.` });
    }

    // --- Declining trend (14-day comparison) ---
    const week1 = summaries14.slice(0, 7).filter(s => s.totalIntake > 0);
    const week2 = summaries14.slice(7, 14).filter(s => s.totalIntake > 0);
    if (week1.length >= 3 && week2.length >= 3) {
      const avgWeek1 = week1.reduce((s, d) => s + d.totalIntake, 0) / week1.length;
      const avgWeek2 = week2.reduce((s, d) => s + d.totalIntake, 0) / week2.length;
      if (avgWeek1 < avgWeek2 * 0.8) {
        messages.push({ type: 'warning', message: 'Fluid intake appears to be declining compared to the previous week. Monitor closely for dehydration signs.' });
      } else if (avgWeek1 > avgWeek2 * 1.2) {
        messages.push({ type: 'info', message: 'Fluid intake has increased compared to the previous week.' });
      }
    }

    // --- Fluid restriction breach pattern ---
    if (config.fluid_restriction_enabled && config.max_fluid_allowance_ml) {
      const breachDays = summaries7.filter(s => s.totalIntake > config.max_fluid_allowance_ml!).length;
      if (breachDays >= 2) {
        messages.push({ type: 'warning', message: `Fluid restriction was exceeded on ${breachDays} of the last 7 days. Review with the prescribing clinician.` });
      }
    }

    // --- Output imbalance (if enabled) ---
    if (config.enable_output_logging && loggedDays7.length >= 3) {
      const daysWithOutput = summaries7.filter(s => s.totalOutput > 0);
      if (daysWithOutput.length === 0 && loggedDays7.length >= 3) {
        messages.push({ type: 'warning', message: 'No fluid output has been recorded this week despite intake logging. Ensure output is being monitored.' });
      } else if (daysWithOutput.length >= 3) {
        const avgBalance = Math.round(daysWithOutput.reduce((s, d) => s + d.balance, 0) / daysWithOutput.length);
        if (avgBalance > config.overhydration_threshold_ml * 0.8) {
          messages.push({ type: 'info', message: `Average daily fluid balance is +${avgBalance}ml — approaching the overhydration threshold.` });
        }
      }
    }

    // --- Symptom correlation ---
    const recentSymptoms = symptomChecks.filter(sc => {
      const d = new Date(sc.check_date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return d >= weekAgo;
    });
    if (recentSymptoms.length > 0) {
      const withDehydrationSigns = recentSymptoms.filter(s => s.thirst_dry_mouth || s.fatigue_dizziness || s.confusion);
      if (withDehydrationSigns.length >= 2) {
        messages.push({ type: 'warning', message: `${withDehydrationSigns.length} symptom checks this week reported dehydration signs (thirst, fatigue, or confusion). Correlate with intake data.` });
      }
      const darkUrine = recentSymptoms.filter(s => s.urine_colour !== null && s.urine_colour >= 6);
      if (darkUrine.length >= 2) {
        messages.push({ type: 'warning', message: `Dark urine colour (≥6) recorded ${darkUrine.length} times this week — suggests persistent dehydration.` });
      }
    }

    // --- All green ---
    if (messages.length === 0 && daysWithIntake7 >= 5) {
      messages.push({ type: 'success', message: 'Hydration has been well-maintained over the past 7 days. Keep up the good work!' });
    }

    return messages;
  }, [intakeEntries, outputEntries, symptomChecks, config]);

  if (!config) return null;

  const iconMap: Record<InsightType, React.ReactNode> = {
    warning: <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />,
    success: <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />,
    info: <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />,
  };

  const bgMap: Record<InsightType, string> = {
    warning: 'bg-amber-50 dark:bg-amber-950/20',
    success: 'bg-green-50 dark:bg-green-950/20',
    info: 'bg-muted',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.length === 0 ? (
          <p className="text-sm text-muted-foreground">Not enough data to generate insights yet. Log fluid intake for a few days to see patterns.</p>
        ) : (
          insights.map((insight, i) => (
            <div key={i} className={`flex items-start gap-3 p-3 rounded-lg ${bgMap[insight.type]}`}>
              {iconMap[insight.type]}
              <p className="text-sm">{insight.message}</p>
            </div>
          ))
        )}
        <p className="text-xs text-muted-foreground italic pt-2">
          These insights are based on recorded patterns and do not constitute a diagnosis. Always consult a clinician or GP.
        </p>
      </CardContent>
    </Card>
  );
};
