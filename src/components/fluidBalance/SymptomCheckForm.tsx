import React from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { HeartPulse, AlertCircle } from 'lucide-react';
import { URINE_COLOUR_SCALE } from '@/types/fluidBalance';
import { cn } from '@/lib/utils';

interface SymptomFormValues {
  thirst_dry_mouth: boolean;
  fatigue_dizziness: boolean;
  confusion: boolean;
  swelling: boolean;
  nausea_vomiting: boolean;
  urine_colour: number | null;
  notes: string;
}

interface SymptomCheckFormProps {
  onSubmit: (data: SymptomFormValues) => Promise<void>;
}

const SYMPTOMS = [
  { key: 'thirst_dry_mouth', label: 'Thirst / Dry Mouth', icon: '💧', escalationLevel: 'monitor' },
  { key: 'fatigue_dizziness', label: 'Fatigue / Dizziness', icon: '😵', escalationLevel: 'action' },
  { key: 'confusion', label: 'Confusion', icon: '🤔', escalationLevel: 'action' },
  { key: 'swelling', label: 'Swelling', icon: '🫁', escalationLevel: 'action' },
  { key: 'nausea_vomiting', label: 'Nausea / Vomiting', icon: '🤢', escalationLevel: 'action' }
] as const;

export const SymptomCheckForm: React.FC<SymptomCheckFormProps> = ({ onSubmit }) => {
  const form = useForm<SymptomFormValues>({
    defaultValues: {
      thirst_dry_mouth: false,
      fatigue_dizziness: false,
      confusion: false,
      swelling: false,
      nausea_vomiting: false,
      urine_colour: null,
      notes: ''
    }
  });
  
  const watchedValues = form.watch();
  const hasActionSymptoms = watchedValues.fatigue_dizziness || 
    watchedValues.confusion || 
    watchedValues.swelling || 
    watchedValues.nausea_vomiting;
  
  const handleSubmit = async (data: SymptomFormValues) => {
    await onSubmit({
      ...data,
      check_date: new Date().toISOString().split('T')[0]
    } as any);
    form.reset();
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HeartPulse className="h-5 w-5 text-purple-500" />
          Wellbeing Check
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="space-y-3">
              {SYMPTOMS.map(symptom => (
                <FormField
                  key={symptom.key}
                  control={form.control}
                  name={symptom.key as keyof SymptomFormValues}
                  render={({ field }) => (
                    <FormItem className={cn(
                      'flex items-center justify-between rounded-lg border p-3',
                      field.value && symptom.escalationLevel === 'action' && 'border-red-200 bg-red-50'
                    )}>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{symptom.icon}</span>
                        <FormLabel className="cursor-pointer">{symptom.label}</FormLabel>
                      </div>
                      <FormControl>
                        <Switch 
                          checked={field.value as boolean} 
                          onCheckedChange={field.onChange} 
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              ))}
            </div>
            
            {hasActionSymptoms && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">
                    Concerning symptoms detected
                  </p>
                  <p className="text-xs text-red-700">
                    Consider escalating to a clinician if symptoms persist or worsen.
                  </p>
                </div>
              </div>
            )}
            
            <FormField
              control={form.control}
              name="urine_colour"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quick Urine Colour Check</FormLabel>
                  <div className="grid grid-cols-4 gap-2">
                    {URINE_COLOUR_SCALE.slice(0, 8).map(colour => (
                      <button
                        key={colour.value}
                        type="button"
                        onClick={() => field.onChange(
                          field.value === colour.value ? null : colour.value
                        )}
                        className={cn(
                          'p-2 rounded-lg border-2 transition-all',
                          field.value === colour.value 
                            ? 'border-primary ring-2 ring-primary/20' 
                            : 'border-transparent hover:border-muted-foreground/30'
                        )}
                      >
                        <div 
                          className="w-full h-6 rounded" 
                          style={{ backgroundColor: colour.color }}
                        />
                        <p className="text-xs text-center mt-1">{colour.value}</p>
                      </button>
                    ))}
                  </div>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Any other observations..." />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full">
              Save Wellbeing Check
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
