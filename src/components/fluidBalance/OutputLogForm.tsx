import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { TrendingDown, Plus } from 'lucide-react';
import { OUTPUT_TYPES, URINE_COLOUR_SCALE } from '@/types/fluidBalance';
import { cn } from '@/lib/utils';

const outputSchema = z.object({
  output_type: z.string().min(1, 'Select an output type'),
  amount_ml: z.number().optional(),
  is_unmeasured: z.boolean(),
  urine_colour: z.number().optional(),
  event_occurred_at: z.string(),
  notes: z.string().optional(),
  recorded_on_behalf_of_name: z.string().optional(),
  recorded_on_behalf_of_role: z.string().optional(),
  recorded_on_behalf_of_reason: z.string().optional()
});

type OutputFormValues = z.infer<typeof outputSchema>;

interface OutputLogFormProps {
  onSubmit: (data: OutputFormValues) => Promise<void>;
}

export const OutputLogForm: React.FC<OutputLogFormProps> = ({ onSubmit }) => {
  const form = useForm<OutputFormValues>({
    resolver: zodResolver(outputSchema),
    defaultValues: {
      output_type: '',
      amount_ml: undefined,
      is_unmeasured: false,
      urine_colour: undefined,
      event_occurred_at: new Date().toISOString().slice(0, 16),
      notes: ''
    }
  });
  
  const [showOnBehalf, setShowOnBehalf] = React.useState(false);
  const outputType = form.watch('output_type');
  const isUnmeasured = form.watch('is_unmeasured');
  
  const handleSubmit = async (data: OutputFormValues) => {
    await onSubmit({
      ...data,
      event_occurred_at: new Date(data.event_occurred_at).toISOString(),
      amount_ml: data.is_unmeasured ? null : data.amount_ml
    } as OutputFormValues);
    form.reset({
      output_type: '',
      amount_ml: undefined,
      is_unmeasured: false,
      urine_colour: undefined,
      event_occurred_at: new Date().toISOString().slice(0, 16),
      notes: ''
    });
    setShowOnBehalf(false);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingDown className="h-5 w-5 text-orange-500" />
          Log Fluid Output
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="output_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Output Type *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select output type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {OUTPUT_TYPES.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="is_unmeasured"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <FormLabel>Unmeasured</FormLabel>
                    <FormDescription>Unable to measure exact amount</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            
            {!isUnmeasured && (
              <FormField
                control={form.control}
                name="amount_ml"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (ml)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={e => field.onChange(parseInt(e.target.value) || undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            {outputType === 'Urine' && (
              <FormField
                control={form.control}
                name="urine_colour"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Urine Colour</FormLabel>
                    <div className="grid grid-cols-4 gap-2">
                      {URINE_COLOUR_SCALE.map(colour => (
                        <button
                          key={colour.value}
                          type="button"
                          onClick={() => field.onChange(colour.value)}
                          className={cn(
                            'p-2 rounded-lg border-2 transition-all',
                            field.value === colour.value 
                              ? 'border-primary ring-2 ring-primary/20' 
                              : 'border-transparent hover:border-muted-foreground/30'
                          )}
                        >
                          <div 
                            className="w-full h-8 rounded mb-1" 
                            style={{ backgroundColor: colour.color }}
                          />
                          <p className="text-xs text-center">{colour.value}</p>
                        </button>
                      ))}
                    </div>
                    {field.value && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {URINE_COLOUR_SCALE.find(c => c.value === field.value)?.description}
                        {field.value >= 5 && (
                          <span className="text-amber-600 font-medium ml-1">
                            — Encourage fluids
                          </span>
                        )}
                      </p>
                    )}
                  </FormItem>
                )}
              />
            )}
            
            <FormField
              control={form.control}
              name="event_occurred_at"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Time</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Log on Behalf</p>
                <p className="text-xs text-muted-foreground">Recording for another staff member</p>
              </div>
              <Switch checked={showOnBehalf} onCheckedChange={setShowOnBehalf} />
            </div>
            
            {showOnBehalf && (
              <div className="space-y-3 p-3 bg-muted rounded-lg">
                <FormField
                  control={form.control}
                  name="recorded_on_behalf_of_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Staff Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter staff member's name" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="recorded_on_behalf_of_role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Support Worker" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="recorded_on_behalf_of_reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Why are you logging on their behalf?" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            )}
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Any additional observations..." />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Log Output
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
