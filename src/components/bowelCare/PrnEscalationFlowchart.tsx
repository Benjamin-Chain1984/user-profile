/**
 * PRN Escalation Flowchart Component
 * Visual step-by-step flowchart for PRN medication escalation
 */

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowDown, CheckCircle2, AlertTriangle, Phone } from 'lucide-react';
import type { PrnEscalationStep } from '@/types/bowelCarePlan';

interface PrnEscalationFlowchartProps {
  steps: PrnEscalationStep[];
  monitoringHours?: number;
}

export function PrnEscalationFlowchart({ steps, monitoringHours = 8 }: PrnEscalationFlowchartProps) {
  if (steps.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No PRN escalation steps configured.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Trigger */}
      <div className="flex flex-col items-center">
        <div className="w-full max-w-xs">
          <Card className="bg-red-50 border-red-200">
            <CardContent className="py-3 text-center">
              <p className="font-semibold text-sm text-red-900">Trigger Identified</p>
            </CardContent>
          </Card>
        </div>
        <ArrowDown className="h-5 w-5 text-muted-foreground my-2" />
      </div>

      {/* Steps */}
      {steps.map((step, index) => (
        <div key={step.id} className="flex flex-col items-center">
          {/* Step Box */}
          <div className="w-full max-w-xs">
            <Card className="border-2 border-blue-200 bg-blue-50/50">
              <CardContent className="py-4 px-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-600">STEP {index + 1}</Badge>
                    <span className="text-xs font-medium text-muted-foreground">
                      {step.route === 'rectal' ? 'Rectal' : 'Oral'} Route
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{step.medication_name}</p>
                    <p className="text-xs text-muted-foreground">Dose: {step.dose}</p>
                  </div>
                  <div className="bg-white rounded p-2 text-xs space-y-1">
                    <p>✓ Record in IDEAL</p>
                    <p>✓ Monitor closely</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Arrow + Decision or Next Step */}
          <ArrowDown className="h-5 w-5 text-muted-foreground my-2" />

          {/* Monitor Duration */}
          <div className="w-full max-w-xs">
            <Card className="bg-amber-50/50 border-amber-200">
              <CardContent className="py-3 text-center">
                <p className="text-xs font-medium">Monitor for {monitoringHours} hours</p>
                <p className="text-xs text-muted-foreground">Record bowel movement outcome</p>
              </CardContent>
            </Card>
          </div>

          {/* Arrow */}
          <ArrowDown className="h-5 w-5 text-muted-foreground my-2" />

          {/* Decision Diamond */}
          <div className="w-full max-w-xs">
            <div className="flex justify-center">
              <div className="w-40 h-24 bg-yellow-50 border-2 border-yellow-300 rounded-full flex items-center justify-center transform rotate-45">
                <div className="transform -rotate-45 text-center">
                  <p className="text-xs font-semibold">Bowel motion?</p>
                  <p className="text-xs text-muted-foreground mt-1">YES / NO</p>
                </div>
              </div>
            </div>
          </div>

          {/* Arrow */}
          <ArrowDown className="h-5 w-5 text-muted-foreground my-2" />

          {/* Next Action */}
          <div className="w-full max-w-xs">
            <Card
              className={
                step.next_action === 'second_dose'
                  ? 'border-2 border-blue-300 bg-blue-50/30'
                  : step.next_action === 'escalate_gp'
                    ? 'border-2 border-orange-300 bg-orange-50/30'
                    : 'border-2 border-red-300 bg-red-50/30'
              }
            >
              <CardContent className="py-3 px-4">
                <div className="flex items-start gap-2">
                  {step.next_action === 'second_dose' && (
                    <AlertTriangle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  )}
                  {step.next_action === 'escalate_gp' && (
                    <Phone className="h-4 w-4 text-orange-600 flex-shrink-0 mt-0.5" />
                  )}
                  {step.next_action === 'attend_hospital' && (
                    <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="text-xs">
                    <p className="font-semibold">
                      {step.next_action === 'second_dose' && 'Proceed to Second Dose (NO Bowel Motion)'}
                      {step.next_action === 'escalate_gp' && 'Contact GP (NO Bowel Motion)'}
                      {step.next_action === 'attend_hospital' && 'Attend Hospital (Emergency)'}
                    </p>
                    {step.next_action === 'second_dose' && step.next_medication_name && (
                      <p className="text-muted-foreground mt-1">
                        Next: {step.next_medication_name} {step.next_dose}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Arrow between steps */}
          {index < steps.length - 1 && (
            <ArrowDown className="h-5 w-5 text-muted-foreground my-3" />
          )}
        </div>
      ))}

      {/* Final Success State */}
      <div className="flex flex-col items-center">
        <div className="w-full max-w-xs">
          <Card className="bg-green-50/50 border-green-200">
            <CardContent className="py-3 text-center">
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <p className="font-semibold text-sm text-green-900">Bowel Motion Achieved</p>
              </div>
              <p className="text-xs text-green-700 mt-1">Continue regular monitoring</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
