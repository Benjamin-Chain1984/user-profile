import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RELATIONSHIP_OPTIONS, type NotificationContact } from '@/types/notificationContacts';

const formSchema = z.object({
  full_name: z.string().min(1, 'Name is required'),
  relationship: z.string().min(1, 'Relationship is required'),
  email: z.string().email('Invalid email address'),
  is_active: z.boolean(),
  notes: z.string().optional(),
  preferred_contact_hours: z.string().optional(),
  edit_reason: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface NotificationContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact?: NotificationContact | null;
  onSave: (values: FormValues) => void;
  isLoading?: boolean;
}

export function NotificationContactDialog({
  open,
  onOpenChange,
  contact,
  onSave,
  isLoading,
}: NotificationContactDialogProps) {
  const isEditing = !!contact;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: contact?.full_name || '',
      relationship: contact?.relationship || '',
      email: contact?.email || '',
      is_active: contact?.is_active ?? true,
      notes: contact?.notes || '',
      preferred_contact_hours: contact?.preferred_contact_hours || '',
      edit_reason: '',
    },
  });

  React.useEffect(() => {
    if (contact) {
      form.reset({
        full_name: contact.full_name,
        relationship: contact.relationship,
        email: contact.email,
        is_active: contact.is_active,
        notes: contact.notes || '',
        preferred_contact_hours: contact.preferred_contact_hours || '',
        edit_reason: '',
      });
    } else {
      form.reset({
        full_name: '',
        relationship: '',
        email: '',
        is_active: true,
        notes: '',
        preferred_contact_hours: '',
        edit_reason: '',
      });
    }
  }, [contact, form]);

  const handleSubmit = (values: FormValues) => {
    onSave(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Contact' : 'Add Notification Contact'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the contact details below.'
              : 'Add someone who can receive email notifications when alerts occur.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Jane Smith" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="relationship"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Relationship / Role *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select relationship" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {RELATIONSHIP_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.label}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address *</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="jane.smith@email.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Active</FormLabel>
                    <FormDescription className="text-xs">
                      Inactive contacts won't receive notifications
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="preferred_contact_hours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Contact Hours (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 9am–5pm weekdays" {...field} />
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
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Any additional notes..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isEditing && (
              <FormField
                control={form.control}
                name="edit_reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason for Edit</FormLabel>
                    <FormControl>
                      <Input placeholder="Why is this being changed?" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Contact'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
