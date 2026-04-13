/**
 * PRN Escalation Pathway - Simple list view
 */

import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';
import type { PrnEscalationStep } from '@/types/bowelCarePlan';

interface PrnEscalationFlowchartProps {
  steps: PrnEscalationStep[];
  monitoringHours?: number;
}

const NEXT_ACTION_LABELS: Record<string, string> = {
  repeat: 'Repeat',
  second_dose: 'Give second dose',
  escalate_gp: 'Contact GP',
  attend_hospital: 'Attend Hospital',
};

export function PrnEscalationFlowchart({ steps, monitoringHours = 8 }: PrnEscalationFlowchartProps) {
  if (steps.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No PRN escalation steps configured.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {steps.map((step, index) => (
        <div
          key={step.id}
          className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30"
        >
          <Badge variant="secondary" className="mt-0.5 shrink-0">
            {index + 1}
          </Badge>
          <div className="flex-1 min-w-0 space-y-1">
            <p className="text-sm font-medium">{step.medication_name}</p>
            <p className="text-xs text-muted-foreground">
              {step.dose} · {step.route === 'rectal' ? 'Rectal' : 'Oral'} · Wait {step.wait_hours}h
            </p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ArrowRight className="h-3 w-3 shrink-0" />
              <span>
                If no BM: <span className="font-medium text-foreground">{NEXT_ACTION_LABELS[step.next_action] || step.next_action}</span>
                {step.next_medication_name && ` (${step.next_medication_name} ${step.next_dose || ''})`}
              </span>
            </div>
          </div>
        </div>
      ))}
      <p className="text-xs text-muted-foreground pt-1">
        Monitor for {monitoringHours} hours after each dose and record outcome.
      </p>
    </div>
  );
}
