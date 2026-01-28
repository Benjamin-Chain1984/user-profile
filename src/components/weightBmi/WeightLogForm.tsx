/**
 * Weight Log Form - Form for logging new weight entries
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useWeightBmi } from '@/hooks/useWeightBmi';
import { Scale, Clock, User } from 'lucide-react';
import { format } from 'date-fns';

const formSchema = z.object({
  weight_kg: z.number().min(1).max(500),
  event_occurred_at: z.string().optional(),
  time_of_day: z.string().optional(),
  meal_timing: z.string().optional(),
  wheelchair_context: z.string().optional(),
  notes: z.string().optional(),
  log_on_behalf: z.boolean().default(false),
  recorded_on_behalf_of_name: z.string().optional(),
  recorded_on_behalf_of_role: z.string().optional(),
  recorded_on_behalf_of_reason: z.string().optional()
});

type FormData = z.infer<typeof formSchema>;

interface WeightLogFormProps {
  clientId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WeightLogForm({ clientId, open, onOpenChange }: WeightLogFormProps) {
  const { logWeight, config } = useWeightBmi(clientId);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      weight_kg: undefined,
      event_occurred_at: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      time_of_day: '',
      meal_timing: '',
      wheelchair_context: '',
      notes: '',
      log_on_behalf: false,
      recorded_on_behalf_of_name: '',
      recorded_on_behalf_of_role: '',
      recorded_on_behalf_of_reason: ''
    }
  });

  const logOnBehalf = form.watch('log_on_behalf');

  async function onSubmit(data: FormData) {
    setIsSubmitting(true);
    try {
      const success = await logWeight({
        weight_kg: data.weight_kg,
        event_occurred_at: data.event_occurred_at ? new Date(data.event_occurred_at).toISOString() : undefined,
        time_of_day: data.time_of_day || undefined,
        meal_timing: data.meal_timing || undefined,
        wheelchair_context: data.wheelchair_context || undefined,
        notes: data.notes || undefined,
        recorded_on_behalf_of_name: data.log_on_behalf ? data.recorded_on_behalf_of_name : undefined,
        recorded_on_behalf_of_role: data.log_on_behalf ? data.recorded_on_behalf_of_role : undefined,
        recorded_on_behalf_of_reason: data.log_on_behalf ? data.recorded_on_behalf_of_reason : undefined
      });

      if (success) {
        form.reset();
        onOpenChange(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Log Weight
          </DialogTitle>
          <DialogDescription>
            Record a new weight measurement
            {config?.height_cm && ` (BMI will be calculated using height: ${config.height_cm}cm)`}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Weight */}
            <FormField
              control={form.control}
              name="weight_kg"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Weight (kg) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 68.5"
                      {...field}
                      onChange={e => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Timestamp */}
            <FormField
              control={form.control}
              name="event_occurred_at"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Date & Time
                  </FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormDescription>
                    Leave as current time or adjust if logging retrospectively
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Context Fields */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="time_of_day"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time of Day</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="morning">Morning</SelectItem>
                        <SelectItem value="afternoon">Afternoon</SelectItem>
                        <SelectItem value="evening">Evening</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="meal_timing"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meal Timing</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="before_meal">Before Meal</SelectItem>
                        <SelectItem value="after_meal">After Meal</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Wheelchair Context */}
            <FormField
              control={form.control}
              name="wheelchair_context"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Wheelchair Context</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select if applicable..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="with_wheelchair">With Wheelchair</SelectItem>
                      <SelectItem value="without_wheelchair">Without Wheelchair</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any additional observations..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Log on Behalf */}
            <FormField
              control={form.control}
              name="log_on_behalf"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      Log on Behalf of Another Staff Member
                    </FormLabel>
                    <FormDescription>
                      Check if you're recording this for someone else
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {/* On Behalf Fields */}
            {logOnBehalf && (
              <div className="space-y-3 p-3 bg-muted/50 rounded-md">
                <FormField
                  control={form.control}
                  name="recorded_on_behalf_of_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Staff Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Name of staff member" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="recorded_on_behalf_of_role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Staff Role *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Support Worker" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="recorded_on_behalf_of_reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason *</FormLabel>
                      <FormControl>
                        <Input placeholder="Why logging on behalf?" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? 'Saving...' : 'Log Weight'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
