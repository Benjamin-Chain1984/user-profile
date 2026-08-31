import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { NotificationContact, ModuleAlertRecipient, AlertSeverity } from '@/types/notificationContacts';
import { toast } from 'sonner';
import { useClientIdOrActive } from '@/contexts/ActiveClientContext';

const CONTACTS_KEY = ['notification_contacts'];
const RECIPIENTS_KEY = ['module_alert_recipients'];

// ─────────────────────────────────────────────────────────────────────────────
// Notification Contacts CRUD
// ─────────────────────────────────────────────────────────────────────────────

export function useNotificationContacts(clientId?: string) {
  clientId = useClientIdOrActive(clientId);
  return useQuery({
    queryKey: [...CONTACTS_KEY, clientId],
    queryFn: async () => {
      let query = supabase.from('notification_contacts').select('*').order('full_name');
      if (clientId) {
        query = query.or(`client_id.eq.${clientId},client_id.is.null`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as NotificationContact[];
    },
  });
}

export function useActiveNotificationContacts(clientId?: string) {
  clientId = useClientIdOrActive(clientId);
  return useQuery({
    queryKey: [...CONTACTS_KEY, clientId, 'active'],
    queryFn: async () => {
      let query = supabase
        .from('notification_contacts')
        .select('*')
        .eq('is_active', true)
        .order('full_name');
      if (clientId) {
        query = query.or(`client_id.eq.${clientId},client_id.is.null`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as NotificationContact[];
    },
  });
}

export function useCreateNotificationContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contact: Omit<NotificationContact, 'id' | 'created_at' | 'edited_at' | 'edited_by' | 'edit_reason'>) => {
      const { data, error } = await supabase
        .from('notification_contacts')
        .insert(contact)
        .select()
        .single();
      if (error) throw error;
      return data as NotificationContact;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTACTS_KEY });
      toast.success('Notification contact added');
    },
    onError: (error: Error) => {
      if (error.message.includes('notification_contacts_client_email_uniq')) {
        toast.error('A contact with this email already exists');
      } else {
        toast.error(`Failed to add contact: ${error.message}`);
      }
    },
  });
}

export function useUpdateNotificationContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Pick<NotificationContact, 'full_name' | 'relationship' | 'email' | 'is_active' | 'notes' | 'preferred_contact_hours' | 'edit_reason'>>;
    }) => {
      const { data, error } = await supabase
        .from('notification_contacts')
        .update({ ...updates, edited_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as NotificationContact;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTACTS_KEY });
      toast.success('Contact updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update contact: ${error.message}`);
    },
  });
}

export function useDeleteNotificationContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('notification_contacts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTACTS_KEY });
      queryClient.invalidateQueries({ queryKey: RECIPIENTS_KEY });
      toast.success('Contact removed');
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove contact: ${error.message}`);
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Module Alert Recipients
// ─────────────────────────────────────────────────────────────────────────────

export function useModuleAlertRecipients(moduleName: string, clientId?: string) {
  return useQuery({
    queryKey: [...RECIPIENTS_KEY, moduleName, clientId],
    queryFn: async () => {
      let query = supabase
        .from('module_alert_recipients')
        .select('*, notification_contacts(*)')
        .eq('module_name', moduleName);
      if (clientId) {
        query = query.eq('client_id', clientId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as (ModuleAlertRecipient & { notification_contacts: NotificationContact })[];
    },
  });
}

export function useSetModuleAlertRecipients() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      moduleName,
      clientId,
      recipients,
    }: {
      moduleName: string;
      clientId: string | null;
      recipients: { contactId: string; severity: AlertSeverity }[];
    }) => {
      // Delete existing recipients for this module
      const deleteQuery = supabase.from('module_alert_recipients').delete().eq('module_name', moduleName);
      if (clientId) {
        await deleteQuery.eq('client_id', clientId);
      } else {
        await deleteQuery.is('client_id', null);
      }

      // Insert new recipients
      if (recipients.length > 0) {
        const rows = recipients.map((r) => ({
          module_name: moduleName,
          client_id: clientId,
          notification_contact_id: r.contactId,
          alert_severity: r.severity,
        }));
        const { error } = await supabase.from('module_alert_recipients').insert(rows);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECIPIENTS_KEY });
      toast.success('Alert recipients updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update recipients: ${error.message}`);
    },
  });
}
