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
import { FLUID_TYPES } from '@/types/fluidBalance';
import { useCurrentStaff } from '@/hooks/useCurrentStaff';
import { ON_BEHALF_REASONS, STAFF_ROLES } from '@/types/bowelCare';
import { cn } from '@/lib/utils';

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
  const { staffName } = useCurrentStaff();
  const form = useForm<IntakeFormValues>({
    resolver: zodResolver(intakeSchema),
    defaultValues: {
      fluid_type: '',
      amount_ml: 0,
      event_occurred_at: toDateTimeLocalValue(new Date()),
      is_self_reported: false,
      notes: ''
    }
  });

  // On behalf of state (matching Bowel Care)
  const [showOnBehalfOf, setShowOnBehalfOf] = useState(false);
  const [onBehalfOfName, setOnBehalfOfName] = useState('');
  const [onBehalfOfRole, setOnBehalfOfRole] = useState<string | null>(null);
  const [onBehalfOfReason, setOnBehalfOfReason] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentAmount = form.watch('amount_ml');

  const isOnBehalfOfActive = showOnBehalfOf && (onBehalfOfName || onBehalfOfRole || onBehalfOfReason);

  const validateOnBehalfOf = () => {
    if (!isOnBehalfOfActive) return true;
    if (!onBehalfOfName.trim()) return false;
    if (!onBehalfOfReason) return false;
    return true;
  };
  
  const handleQuickAdd = (amount: number) => {
    form.setValue('amount_ml', amount);
  };

  const handleFormSubmit = (data: IntakeFormValues) => {
    if (!validateOnBehalfOf()) return;
    if (isOnBehalfOfActive) {
      setShowConfirmDialog(true);
    } else {
      submitEntry(data);
    }
  };
  
  const submitEntry = async (data?: IntakeFormValues) => {
    const formData = data || form.getValues();
    setIsSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        event_occurred_at: new Date(formData.event_occurred_at).toISOString(),
        recorded_on_behalf_of_name: isOnBehalfOfActive ? onBehalfOfName.trim() : undefined,
        recorded_on_behalf_of_role: isOnBehalfOfActive ? onBehalfOfRole || undefined : undefined,
        recorded_on_behalf_of_reason: isOnBehalfOfActive ? onBehalfOfReason || undefined : undefined,
      });
      form.reset({
        fluid_type: '',
        amount_ml: 0,
        event_occurred_at: toDateTimeLocalValue(new Date()),
        is_self_reported: false,
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
  
  const wouldExceedLimit = isRestricted && maxAllowance && currentAmount > 0 && (currentTotal + currentAmount) > maxAllowance;
  
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
                  <Label htmlFor="intakeOnBehalfName">Staff Name *</Label>
                  <Input
                    id="intakeOnBehalfName"
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
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">
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
            Log Intake
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