/**
 * Client Access Dialog
 * Assign verified team members to a client's record
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
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Phone, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { AppRole } from '@/services/auth/types';

interface Member {
  id: string;
  full_name: string | null;
  verified_phone: string | null;
  phone_verified_at: string | null;
  is_active: boolean;
  role?: AppRole;
}

const roleLabels: Record<AppRole, string> = {
  worker: 'Support Worker',
  team_leader: 'Team Leader',
  clinician: 'Clinician',
  admin: 'Admin',
};

interface ClientAccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string | null;
  clientName?: string;
}

export function ClientAccessDialog({ open, onOpenChange, clientId, clientName }: ClientAccessDialogProps) {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [assigned, setAssigned] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !clientId) return;

    const load = async () => {
      setIsLoading(true);
      try {
        const [{ data: profiles }, { data: roles }, { data: access }] = await Promise.all([
          supabase.from('profiles').select('*').order('full_name'),
          supabase.from('user_roles').select('user_id, role'),
          supabase.from('client_staff_access').select('user_id').eq('client_id', clientId),
        ]);

        setMembers(
          (profiles || []).map((p) => ({
            id: p.id,
            full_name: p.full_name,
            verified_phone: p.verified_phone,
            phone_verified_at: p.phone_verified_at,
            is_active: p.is_active,
            role: roles?.find((r) => r.user_id === p.id)?.role as AppRole | undefined,
          }))
        );
        setAssigned(new Set((access || []).map((a) => a.user_id)));
      } catch (error) {
        console.error('Error loading client access:', error);
        toast.error('Could not load team access');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [open, clientId]);

  const toggleAccess = async (memberId: string, next: boolean) => {
    if (!clientId) return;
    setSavingId(memberId);
    try {
      if (next) {
        const { error } = await supabase
          .from('client_staff_access')
          .insert({ client_id: clientId, user_id: memberId, granted_by: user?.id ?? null });
        if (error) throw error;
        setAssigned((prev) => new Set(prev).add(memberId));
        toast.success('Access granted');
      } else {
        const { error } = await supabase
          .from('client_staff_access')
          .delete()
          .eq('client_id', clientId)
          .eq('user_id', memberId);
        if (error) throw error;
        setAssigned((prev) => {
          const copy = new Set(prev);
          copy.delete(memberId);
          return copy;
        });
        toast.success('Access removed');
      }
    } catch (error) {
      console.error('Error updating client access:', error);
      toast.error('Could not update access');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record access{clientName ? ` — ${clientName}` : ''}</DialogTitle>
          <DialogDescription>
            Choose which team members can access this client's records.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        ) : members.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            No team members yet. Add staff under Admin &gt; Team.
          </p>
        ) : (
          <div className="space-y-2">
            {members.map((member) => {
              const verified = !!member.phone_verified_at;
              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-foreground truncate">
                      {member.full_name || 'Unnamed User'}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                      {member.role && <span>{roleLabels[member.role]}</span>}
                      {member.verified_phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {member.verified_phone}
                          {verified ? (
                            <CheckCircle className="w-3 h-3 text-green-500" />
                          ) : (
                            <XCircle className="w-3 h-3 text-destructive" />
                          )}
                        </span>
                      )}
                      {!member.is_active && <Badge variant="secondary" className="text-xs">Inactive</Badge>}
                    </div>
                  </div>
                  <Switch
                    checked={assigned.has(member.id)}
                    disabled={savingId === member.id}
                    onCheckedChange={(next) => toggleAccess(member.id, next)}
                    aria-label={`Toggle access for ${member.full_name || 'member'}`}
                  />
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
