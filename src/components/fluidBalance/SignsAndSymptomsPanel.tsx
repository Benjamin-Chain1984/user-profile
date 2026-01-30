import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AlertTriangle, Info, ChevronDown, ChevronUp, Droplets } from 'lucide-react';
import { URINE_COLOUR_SCALE } from '@/types/fluidBalance';
import { cn } from '@/lib/utils';

// Signs and symptoms with explanations
const SIGNS_AND_SYMPTOMS = [
  {
    id: 'thirst',
    label: 'Thirst or dry mouth',
    icon: '💧',
    explanation: 'Common early sign of dehydration. The body signals the need for more fluids.'
  },
  {
    id: 'fatigue',
    label: 'Fatigue or dizziness',
    icon: '😵',
    explanation: 'Can occur with both dehydration and overhydration. May indicate an electrolyte imbalance.'
  },
  {
    id: 'confusion',
    label: 'Confusion or drowsiness',
    icon: '🧠',
    explanation: 'Significant symptom that can indicate severe dehydration or fluid/electrolyte disturbance.'
  },
  {
    id: 'swelling',
    label: 'Swelling (hands, ankles, face)',
    icon: '🫁',
    explanation: 'May indicate fluid overload or retention. Often seen with heart, kidney, or liver conditions.'
  },
  {
    id: 'nausea',
    label: 'Nausea or vomiting',
    icon: '🤢',
    explanation: 'Can cause rapid fluid loss and worsen dehydration. Also a symptom of overhydration.'
  },
  {
    id: 'headache',
    label: 'Headache',
    icon: '🤕',
    explanation: 'Can be an early sign of dehydration or, less commonly, severe overhydration (hyponatremia).'
  },
  {
    id: 'reduced_urine',
    label: 'Reduced urine output',
    icon: '🚽',
    explanation: 'The body conserves water when dehydrated, producing less urine. Monitor output if enabled.'
  },
  {
    id: 'dark_urine',
    label: 'Dark or strong-smelling urine',
    icon: '🟤',
    explanation: 'Concentrated urine often indicates insufficient fluid intake. Compare with the colour scale below.'
  }
];

// Urine colour feedback messages
const getUrineColourFeedback = (value: number): { message: string; variant: 'success' | 'info' | 'warning' | 'danger' } => {
  if (value <= 2) {
    return {
      message: 'Usually indicates good hydration.',
      variant: 'success'
    };
  } else if (value <= 4) {
    return {
      message: 'Generally normal. Continue regular fluid intake.',
      variant: 'info'
    };
  } else if (value <= 6) {
    return {
      message: 'May indicate dehydration. Encourage fluids as per the care plan.',
      variant: 'warning'
    };
  } else {
    return {
      message: 'Often associated with dehydration. Monitor closely and consider escalation if symptoms are present.',
      variant: 'danger'
    };
  }
};

const SymptomCard: React.FC<{ symptom: typeof SIGNS_AND_SYMPTOMS[0] }> = ({ symptom }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button className="w-full flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors text-left">
          <div className="flex items-center gap-3">
            <span className="text-lg">{symptom.icon}</span>
            <span className="font-medium text-sm">{symptom.label}</span>
          </div>
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-muted-foreground" />
            {isOpen ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-3 py-2 text-sm text-muted-foreground bg-muted/30 rounded-b-lg border-x border-b -mt-1">
          {symptom.explanation}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export const SignsAndSymptomsPanel: React.FC = () => {
  const [selectedUrineColour, setSelectedUrineColour] = useState<number | null>(null);
  
  const feedback = selectedUrineColour ? getUrineColourFeedback(selectedUrineColour) : null;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Droplets className="h-5 w-5 text-blue-500" />
          Signs and Symptoms
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Be aware of these signs that may relate to hydration or fluid balance.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Signs and Symptoms List */}
        <div className="grid gap-2">
          {SIGNS_AND_SYMPTOMS.map(symptom => (
            <SymptomCard key={symptom.id} symptom={symptom} />
          ))}
        </div>
        
        {/* Urine Colour Check */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">Urine Colour Check</span>
            <Info className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground">
            Tap a colour to see what it may indicate. This is for awareness only.
          </p>
          
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {URINE_COLOUR_SCALE.slice(0, 8).map(colour => (
              <button
                key={colour.value}
                type="button"
                onClick={() => setSelectedUrineColour(
                  selectedUrineColour === colour.value ? null : colour.value
                )}
                className={cn(
                  'p-2 rounded-lg border-2 transition-all',
                  selectedUrineColour === colour.value 
                    ? 'border-primary ring-2 ring-primary/20 scale-105' 
                    : 'border-transparent hover:border-muted-foreground/30'
                )}
              >
                <div 
                  className="w-full aspect-square rounded" 
                  style={{ backgroundColor: colour.color }}
                />
                <p className="text-xs text-center mt-1 text-muted-foreground">{colour.value}</p>
              </button>
            ))}
          </div>
          
          {feedback && (
            <div className={cn(
              'p-3 rounded-lg border text-sm',
              feedback.variant === 'success' && 'bg-green-50 border-green-200 text-green-800',
              feedback.variant === 'info' && 'bg-blue-50 border-blue-200 text-blue-800',
              feedback.variant === 'warning' && 'bg-amber-50 border-amber-200 text-amber-800',
              feedback.variant === 'danger' && 'bg-red-50 border-red-200 text-red-800'
            )}>
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium mb-1">
                    {URINE_COLOUR_SCALE.find(c => c.value === selectedUrineColour)?.label}
                  </p>
                  <p>{feedback.message}</p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Safety Disclaimer */}
        <div className="p-3 bg-muted/50 border border-border rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              This information is provided to support awareness only. It does not replace clinical assessment. 
              Follow the person's health plan and seek advice from a health professional if you are concerned.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
