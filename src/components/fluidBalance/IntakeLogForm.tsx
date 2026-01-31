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
import { Droplets, Plus } from 'lucide-react';
import { FLUID_TYPES } from '@/types/fluidBalance';

const intakeSchema = z.object({
  fluid_type: z.string().min(1, 'Select a fluid type'),
  amount_ml: z.number().min(1, 'Amount must be at least 1ml').max(5000, 'Amount seems too high'),
  event_occurred_at: z.string(),
  is_self_reported: z.boolean(),
  notes: z.string().optional(),
  recorded_on_behalf_of_name: z.string().optional(),
  recorded_on_behalf_of_role: z.string().optional(),
  recorded_on_behalf_of_reason: z.string().optional()
});

type IntakeFormValues = z.infer<typeof intakeSchema>;

interface IntakeLogFormProps {
  onSubmit: (data: IntakeFormValues) => Promise<void>;
  isRestricted?: boolean;
  currentTotal?: number;
  maxAllowance?: number | null;
}

const QUICK_AMOUNTS = [100, 200, 250, 500];

function toDateTimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const min = pad(date.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

export const IntakeLogForm: React.FC<IntakeLogFormProps> = ({
  onSubmit,
  isRestricted,
  currentTotal = 0,
  maxAllowance
}) => {
  const form = useForm<IntakeFormValues>({
    resolver: zodResolver(intakeSchema),
    defaultValues: {
      fluid_type: '',
      amount_ml: 0,
      // IMPORTANT: datetime-local expects *local* time, not UTC.
      // Using toISOString() here causes entries to be logged into the wrong day for many timezones.
      event_occurred_at: toDateTimeLocalValue(new Date()),
      is_self_reported: false,
      notes: ''
    }
  });
  
  const [showOnBehalf, setShowOnBehalf] = React.useState(false);
  const currentAmount = form.watch('amount_ml');
  
  const handleQuickAdd = (amount: number) => {
    form.setValue('amount_ml', amount);
  };
  
  const handleSubmit = async (data: IntakeFormValues) => {
    await onSubmit({
      ...data,
      event_occurred_at: new Date(data.event_occurred_at).toISOString()
    });
    form.reset({
      fluid_type: '',
      amount_ml: 0,
      event_occurred_at: toDateTimeLocalValue(new Date()),
      is_self_reported: false,
      notes: ''
    });
    setShowOnBehalf(false);
  };
  
  const wouldExceedLimit = isRestricted && maxAllowance && (currentTotal + currentAmount) > maxAllowance;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Droplets className="h-5 w-5 text-blue-500" />
          Log Fluid Intake
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fluid_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fluid Type *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select fluid type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {FLUID_TYPES.map(type => (
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
              name="amount_ml"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (ml) *</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      {...field} 
                      onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {QUICK_AMOUNTS.map(amount => (
                      <Button
                        key={amount}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickAdd(amount)}
                      >
                        +{amount}ml
                      </Button>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {wouldExceedLimit && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">
                  ⚠️ This would exceed the daily fluid limit of {maxAllowance}ml. 
                  Current total: {currentTotal}ml + {currentAmount}ml = {currentTotal + currentAmount}ml
                </p>
              </div>
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
                  <FormDescription>When the fluid was consumed</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="is_self_reported"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <FormLabel>Self-Reported</FormLabel>
                    <FormDescription>The person reported this themselves</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
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
            
            <Button type="submit" className="w-full" disabled={wouldExceedLimit}>
              <Plus className="h-4 w-4 mr-2" />
              Log Intake
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
