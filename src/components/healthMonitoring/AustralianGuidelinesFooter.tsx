/**
 * AustralianGuidelinesFooter - Clinical reference footer citing Australian Commission guidelines
 */

import { Card, CardContent } from '@/components/ui/card';
import { ExternalLink, BookOpen } from 'lucide-react';

export function AustralianGuidelinesFooter() {
  return (
    <Card className="bg-muted/30 border-dashed">
      <CardContent className="py-4">
        <div className="flex items-start gap-3">
          <BookOpen className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
          <div className="space-y-2 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Clinical References & Guidelines</p>
            <p>
              Vital sign thresholds are based on standard clinical observation ranges. 
              Individual thresholds may be adjusted based on medical professional advice (Altered Criteria).
            </p>
            <div className="space-y-1">
              <a 
                href="https://www.safetyandquality.gov.au/our-work/comprehensive-care/recognising-and-responding-acute-deterioration" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-primary hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                Australian Commission on Safety and Quality in Health Care – Recognising and Responding to Acute Deterioration
              </a>
              <a 
                href="https://www.safetyandquality.gov.au/our-work/clinical-care-standards" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-primary hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                Clinical Care Standards – ACSQHC
              </a>
              <a 
                href="https://www.health.gov.au/topics/chronic-conditions/what-were-doing-about-chronic-conditions" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-primary hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                Australian Government Department of Health and Aged Care
              </a>
            </div>
            <p className="italic pt-1">
              This tool supports monitoring only. It does not replace clinical assessment. 
              Always follow the person's health plan and seek medical advice if concerned.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
