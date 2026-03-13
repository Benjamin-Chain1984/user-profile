/**
 * Team Member Dialog - Add/Edit team members
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { auditService } from '@/services/audit';
import type { AppRole } from '@/services/auth/types';

interface TeamMember {
  id: string;
  full_name: string | null;
  verified_phone: string | null;
  phone_verified_at: string | null;
  is_active: boolean;
  role?: AppRole;
}

interface TeamMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member?: TeamMember | null;
  onSaved: () => void;
}

export function TeamMemberDialog({ open, onOpenChange, member, onSaved }: TeamMemberDialogProps) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<AppRole>('worker');
  const [isActive, setIsActive] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [tempPassword, setTempPassword] = useState('');
  const [showCredentials, setShowCredentials] = useState(false);

  const isEditing = !!member;

  useEffect(() => {
    if (member) {
      setFullName(member.full_name || '');
      setPhone(member.verified_phone || '');
      setEmail('');
      setRole(member.role || 'worker');
      setIsActive(member.is_active);
    } else {
      setFullName('');
      setPhone('');
      setEmail('');
      setRole('worker');
      setIsActive(true);
    }
    setTempPassword('');
    setShowCredentials(false);
  }, [member, open]);

  const formatPhoneToE164 = (phone: string): string => {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    // Assume Australian number if no country code
    if (digits.startsWith('0')) {
      return '+61' + digits.slice(1);
    }
    if (!digits.startsWith('61') && !digits.startsWith('+')) {
      return '+61' + digits;
    }
    return '+' + digits.replace(/^\+/, '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formattedPhone = formatPhoneToE164(phone);

      if (isEditing && member) {
        // Update existing profile
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            full_name: fullName,
            verified_phone: formattedPhone,
            is_active: isActive,
          })
          .eq('id', member.id);

        if (profileError) throw profileError;

        // Update role if changed
        if (member.role !== role) {
          // Remove old role
          if (member.role) {
            await supabase
              .from('user_roles')
              .delete()
              .eq('user_id', member.id)
              .eq('role', member.role);
            
            await auditService.logEvent('ROLE_REMOVED', undefined, {
              targetUserId: member.id,
              oldRole: member.role,
            });
          }

          // Add new role
          await supabase
            .from('user_roles')
            .insert({ user_id: member.id, role });

          await auditService.logEvent('ROLE_ASSIGNED', undefined, {
            targetUserId: member.id,
            newRole: role,
          });
        }

        // Log status change if applicable
        if (member.is_active !== isActive) {
          await auditService.logEvent(
            isActive ? 'TEAM_MEMBER_REACTIVATED' : 'TEAM_MEMBER_DEACTIVATED',
            undefined,
            { targetUserId: member.id, fullName }
          );
        } else {
          await auditService.logEvent('TEAM_MEMBER_EDITED', undefined, {
            targetUserId: member.id,
            fullName,
          });
        }

        toast.success('Team member updated');
      } else {
        // Create new team member via edge function
        if (!email.trim()) {
          toast.error('Email is required to add a new team member');
          setIsLoading(false);
          return;
        }

        const { data, error } = await supabase.functions.invoke('invite-team-member', {
          body: { email, fullName, role, phone: formattedPhone },
        });

        if (error) throw error;

        if (data.error) {
          toast.error(data.error);
          setIsLoading(false);
          return;
        }

        // Show temporary password to admin
        setTempPassword(data.tempPassword);
        setShowCredentials(true);
        toast.success(`Team member ${fullName} added successfully`);
      }

      onSaved();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving team member:', error);
      toast.error(error.message || 'Failed to save team member');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Team Member' : 'Add Team Member'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter full name"
              className="mt-1.5"
              required
            />
          </div>

          <div>
            <Label htmlFor="phone">Mobile Number (E.164)</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+61 400 000 000"
              className="mt-1.5"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Must be verified before QR access is allowed
            </p>
          </div>

          <div>
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="worker">Support Worker</SelectItem>
                <SelectItem value="team_leader">Team Leader</SelectItem>
                <SelectItem value="clinician">Clinician</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isEditing && (
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <Label htmlFor="isActive" className="text-sm font-medium">Account Status</Label>
                <p className="text-xs text-muted-foreground">
                  {isActive ? 'Active - can access the system' : 'Inactive - access disabled'}
                </p>
              </div>
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Member'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
