import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePainConfig } from '@/hooks/usePainConfig';
import { PainSeverity, getSeverityLabel, getSeverityColor } from '@/types/painAssessment';
import { ClipboardCheck, ArrowRight, AlertTriangle } from 'lucide-react';

interface PainActiveActionPlanProps {
  severity: PainSeverity;
  tool: 'abbey' | 'painad';
  score: number;
  maxScore: number;
}

const PREDEFINED_ACTION_LABELS: Record<string, string> = {
  give_instructions: 'Give instructions to the person/staff',
  administer_pain_relief: 'Administer Pain Relief medication (if prescribed)',
  recheck_pain: 'Recheck pain again at next scheduled time',
  reposition: 'Reposition the person',
  contact_gp: 'Contact the GP',
  call_ambulance: 'Call Ambulance (000)',
};

const SEVERITY_STYLES: Record<string, { color: string; bgColor: string; borderColor: string; icon: string }> = {
  mild: { color: 'text-amber-700', bgColor: 'bg-amber-50', borderColor: 'border-amber-300', icon: '🟡' },
  moderate: { color: 'text-orange-700', bgColor: 'bg-orange-50', borderColor: 'border-orange-400', icon: '🟠' },
  severe: { color: 'text-destructive', bgColor: 'bg-destructive/5', borderColor: 'border-destructive/40', icon: '🔴' },
};

export function PainActiveActionPlan({ severity, tool, score, maxScore }: PainActiveActionPlanProps) {
  const { config } = usePainConfig();

  const actionSteps = useMemo(() => {
    const cfg = config as any;
    let configuredActions: string[] = [];
    let customActions: string[] = [];

    if (severity === 'mild') {
      configuredActions = cfg?.mild_actions ?? ['reposition', 'recheck_pain'];
      customActions = (cfg?.mild_custom_actions ?? []).filter((s: string) => s.trim());
    } else if (severity === 'moderate') {
      configuredActions = cfg?.moderate_actions ?? ['administer_pain_relief', 'recheck_pain', 'contact_gp'];
      customActions = (cfg?.moderate_custom_actions ?? []).filter((s: string) => s.trim());
    } else if (severity === 'severe') {
      configuredActions = cfg?.severe_actions ?? ['administer_pain_relief', 'contact_gp', 'call_ambulance'];
      customActions = (cfg?.severe_custom_actions ?? []).filter((s: string) => s.trim());
    }

    const steps = configuredActions.map((id, idx) => ({
      stepNumber: idx + 1,
      label: PREDEFINED_ACTION_LABELS[id] || id,
    }));

    customActions.forEach((label) => {
      steps.push({ stepNumber: steps.length + 1, label });
    });

    return steps;
  }, [config, severity]);

  const style = SEVERITY_STYLES[severity];
  if (!style) return null;

  if (actionSteps.length === 0) return null;
  return (
    <Card className={`border-2 ${style.borderColor}`}>
      <CardHeader className={`${style.bgColor} pb-3`}>
        <div className="flex items-center gap-3">
          <ClipboardCheck className={`w-5 h-5 ${style.color}`} />
          <div>
            <CardTitle className={`text-base ${style.color}`}>
              {style.icon} Action Plan — {getSeverityLabel(severity)}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {toolLabel} score: {score}/{maxScore} • Follow these steps in response
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-2">
          {actionSteps.map((step) => (
            <div
              key={step.stepNumber}
              className={`flex items-start gap-3 p-3 rounded-lg ${style.bgColor} border ${style.borderColor}`}
            >
              <span className={`font-bold text-sm ${style.color} shrink-0 mt-0.5`}>
                {step.stepNumber}.
              </span>
              <span className="text-sm leading-relaxed">{step.label}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>If concerned about pain or the person deteriorates, escalate to a medical professional immediately.</span>
        </div>
      </CardContent>
    </Card>
  );
}
