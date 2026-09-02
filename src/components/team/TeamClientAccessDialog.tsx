/**
 * Team Client Access Dialog
 * Assign which client records a team member can open via QR + SMS OTP.
 * QR access requires BOTH a verified phone AND the client checkbox below.
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Loader2, QrCode } from 'lucide-react';
import { toast } from 'sonner';

interface ClientRow {
  id: string;
  preferred_name: string;
  status: string;
}

interface TeamClientAccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberId: string | null;
  memberName?: string | null;
  phoneVerified?: boolean;
  onSaved?: () => void;
}

export function TeamClientAccessDialog({
  open,
  onOpenChange,
  memberId,
  memberName,
  phoneVerified,
  onSaved,
}: TeamClientAccessDialogProps) {
  const { user } = useAuth();
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [assigned, setAssigned] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !memberId) return;

    const load = async () => {
      setIsLoading(true);
      try {
        const [{ data: clientRows }, { data: access }] = await Promise.all([
          supabase
            .from('clients')
            .select('id, preferred_name, status')
            .order('preferred_name'),
          supabase.from('client_staff_access').select('client_id').eq('user_id', memberId),
        ]);

        setClients((clientRows || []) as ClientRow[]);
        setAssigned(new Set((access || []).map((a) => a.client_id)));
      } catch (error) {
        console.error('Error loading client access:', error);
        toast.error('Could not load client access');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [open, memberId]);

  const toggle = async (clientId: string, next: boolean) => {
    if (!memberId) return;
    setSavingId(clientId);
    try {
      if (next) {
        const { error } = await supabase
          .from('client_staff_access')
          .insert({ client_id: clientId, user_id: memberId, granted_by: user?.id ?? null });
        if (error) throw error;
        setAssigned((prev) => new Set(prev).add(clientId));
        toast.success('QR access granted');
      } else {
        const { error } = await supabase
          .from('client_staff_access')
          .delete()
          .eq('client_id', clientId)
          .eq('user_id', memberId);
        if (error) throw error;
        setAssigned((prev) => {
          const copy = new Set(prev);
          copy.delete(clientId);
          return copy;
        });
        toast.success('QR access removed');
      }
      onSaved?.();
    } catch (error) {
      console.error('Error updating client access:', error);
      toast.error('Could not update access');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary" />
            Client access
          </DialogTitle>
          <DialogDescription>
            Select which client records {memberName || 'this member'} can open by scanning that
            client&apos;s QR code.
          </DialogDescription>
        </DialogHeader>

        {!phoneVerified && (
          <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <span className="text-muted-foreground">
              Phone not verified yet. QR access needs a verified phone <strong>and</strong> a
              selected client below.
            </span>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : clients.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No clients yet. Add a client under Admin &gt; Clients.
          </p>
        ) : (
          <div className="space-y-2">
            {clients.map((c) => (
              <label
                key={c.id}
                htmlFor={`access-${c.id}`}
                className="flex cursor-pointer items-center justify-between gap-3 rounded-md border border-border p-3"
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    id={`access-${c.id}`}
                    checked={assigned.has(c.id)}
                    disabled={savingId === c.id}
                    onCheckedChange={(v) => toggle(c.id, v === true)}
                  />
                  <Label htmlFor={`access-${c.id}`} className="cursor-pointer font-medium">
                    {c.preferred_name}
                  </Label>
                </div>
                {c.status !== 'active' && (
                  <Badge variant="secondary" className="text-xs capitalize">
                    {c.status}
                  </Badge>
                )}
              </label>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
