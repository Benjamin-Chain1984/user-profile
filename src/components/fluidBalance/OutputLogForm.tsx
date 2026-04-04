import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Plus, User, Users, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { OUTPUT_TYPES, URINE_COLOUR_SCALE } from '@/types/fluidBalance';
import { cn } from '@/lib/utils';
import { useCurrentStaff } from '@/hooks/useCurrentStaff';
import { ON_BEHALF_REASONS, STAFF_ROLES } from '@/types/bowelCare';

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
  
  const { staffName } = useCurrentStaff();

  // On behalf of state (matching Bowel Care)
  const [showOnBehalfOf, setShowOnBehalfOf] = useState(false);
  const [onBehalfOfName, setOnBehalfOfName] = useState('');
  const [onBehalfOfRole, setOnBehalfOfRole] = useState<string | null>(null);
  const [onBehalfOfReason, setOnBehalfOfReason] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const outputType = form.watch('output_type');
  const isUnmeasured = form.watch('is_unmeasured');

  const isOnBehalfOfActive = showOnBehalfOf && (onBehalfOfName || onBehalfOfRole || onBehalfOfReason);

  const validateOnBehalfOf = () => {
    if (!isOnBehalfOfActive) return true;
    if (!onBehalfOfName.trim()) return false;
    if (!onBehalfOfReason) return false;
    return true;
  };

  const handleFormSubmit = (data: OutputFormValues) => {
    if (!validateOnBehalfOf()) return;
    if (isOnBehalfOfActive) {
      setShowConfirmDialog(true);
    } else {
      submitEntry(data);
    }
  };
  
  const submitEntry = async (data?: OutputFormValues) => {
    const formData = data || form.getValues();
    setIsSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        event_occurred_at: new Date(formData.event_occurred_at).toISOString(),
        amount_ml: formData.is_unmeasured ? null : formData.amount_ml,
        recorded_on_behalf_of_name: isOnBehalfOfActive ? onBehalfOfName.trim() : undefined,
        recorded_on_behalf_of_role: isOnBehalfOfActive ? onBehalfOfRole || undefined : undefined,
        recorded_on_behalf_of_reason: isOnBehalfOfActive ? onBehalfOfReason || undefined : undefined,
      } as OutputFormValues);
      form.reset({
        output_type: '',
        amount_ml: undefined,
        is_unmeasured: false,
        urine_colour: undefined,
        event_occurred_at: new Date().toISOString().slice(0, 16),
        notes: ''
      });
      setShowOnBehalfOf(false);
      setOnBehalfOfName('');
      setOnBehalfOfRole(null);
      setOnBehalfOfReason(null);
    } finally {
      setIsSubmitting(false);
      setShowConfirmDialog(false);
    }
  };
  
  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Logged by */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Logged by:</span>
            <span className="text-sm font-medium">{staffName}</span>
          </div>

          {/* Recorded on Behalf Of - Collapsible (matching Bowel Care) */}
          <Collapsible open={showOnBehalfOf} onOpenChange={setShowOnBehalfOf}>
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className={cn(
                  "flex items-center justify-between w-full p-3 rounded-lg border text-left transition-colors",
                  showOnBehalfOf
                    ? "bg-blue-50 border-blue-200"
                    : "bg-muted/30 border-muted hover:bg-muted/50"
                )}
              >
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">Recorded on Behalf Of</span>
                </div>
                {showOnBehalfOf ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3 p-4 border rounded-lg bg-blue-50/50 space-y-4">
              <p className="text-xs text-muted-foreground">
                Use this option only when a staff member cannot log in themselves.
                All entries will be clearly marked as recorded on behalf of another person.
              </p>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="outputOnBehalfName">Staff Name *</Label>
                  <Input
                    id="outputOnBehalfName"
                    placeholder="e.g., Jamie Brown"
                    value={onBehalfOfName}
                    onChange={(e) => setOnBehalfOfName(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Staff Role / Relationship</Label>
                  <Select
                    value={onBehalfOfRole || ''}
                    onValueChange={(v) => setOnBehalfOfRole(v || null)}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role..." />
                    </SelectTrigger>
                    <SelectContent>
                      {STAFF_ROLES.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Reason for Recording on Behalf *</Label>
                <Select
                  value={onBehalfOfReason || ''}
                  onValueChange={(v) => setOnBehalfOfReason(v || null)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select reason..." />
                  </SelectTrigger>
                  <SelectContent>
                    {ON_BEHALF_REASONS.map((reason) => (
                      <SelectItem key={reason.value} value={reason.value}>
                        {reason.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CollapsibleContent>
          </Collapsible>

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

          {/* Validation errors */}
          {isOnBehalfOfActive && !validateOnBehalfOf() && (
            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-destructive">
              When recording on behalf of another staff member, Staff Name and Reason are required.
            </div>
          )}
          
          <Button type="submit" className="w-full" disabled={isSubmitting || (isOnBehalfOfActive && !validateOnBehalfOf())}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <Plus className="h-4 w-4 mr-2" />
            Log Output
          </Button>
        </form>
      </Form>

      {/* Confirmation Dialog for On Behalf Of entries */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Entry on Behalf of Another Staff Member</AlertDialogTitle>
            <AlertDialogDescription>
              You are recording this entry on behalf of <strong>{onBehalfOfName}</strong>
              {onBehalfOfRole && (
                <> ({STAFF_ROLES.find(r => r.value === onBehalfOfRole)?.label})</>
              )}.
              <br /><br />
              This entry will be clearly marked in the timeline and audit records.
              Please confirm this information is accurate.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => submitEntry()} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirm & Log Entry
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};