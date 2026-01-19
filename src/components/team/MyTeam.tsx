/**
 * My Team Component - Admin-only team management section
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { 
  Users, 
  Plus, 
  Phone, 
  CheckCircle, 
  XCircle, 
  Edit2,
  Shield,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { TeamMemberDialog } from './TeamMemberDialog';
import type { AppRole } from '@/services/auth/types';

interface TeamMember {
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

const roleIcons: Record<AppRole, React.ElementType> = {
  worker: Shield,
  team_leader: ShieldCheck,
  clinician: ShieldCheck,
  admin: ShieldAlert,
};

export function MyTeam() {
  const { hasRole } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);

  const isAdmin = hasRole('admin');

  const fetchTeamMembers = async () => {
    setIsLoading(true);
    try {
      // Fetch profiles with their roles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name');

      if (profilesError) throw profilesError;

      // Fetch roles for all users
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Combine profiles with roles
      const membersWithRoles: TeamMember[] = (profiles || []).map((profile) => {
        const userRole = roles?.find((r) => r.user_id === profile.id);
        return {
          id: profile.id,
          full_name: profile.full_name,
          verified_phone: profile.verified_phone,
          phone_verified_at: profile.phone_verified_at,
          is_active: profile.is_active,
          role: userRole?.role as AppRole | undefined,
        };
      });

      setMembers(membersWithRoles);
    } catch (error) {
      console.error('Error fetching team members:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchTeamMembers();
    }
  }, [isAdmin]);

  const handleEdit = (member: TeamMember) => {
    setEditingMember(member);
    setDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingMember(null);
    setDialogOpen(true);
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">My Team</h3>
        </div>
        <Button size="sm" onClick={handleAddNew}>
          <Plus className="w-4 h-4 mr-1" />
          Add Member
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        Manage staff who can authenticate via QR + SMS OTP and access client records.
      </p>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
        </div>
      ) : members.length === 0 ? (
        <Card className="p-6 text-center text-muted-foreground">
          No team members found. Add your first team member to get started.
        </Card>
      ) : (
        <div className="space-y-3">
          {members.map((member) => {
            const RoleIcon = member.role ? roleIcons[member.role] : Shield;
            const isPhoneVerified = !!member.phone_verified_at;
            
            return (
              <Card key={member.id} className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-foreground truncate">
                        {member.full_name || 'Unnamed User'}
                      </h4>
                      {!member.is_active && (
                        <Badge variant="secondary" className="text-xs">Inactive</Badge>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      {member.role && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <RoleIcon className="w-3.5 h-3.5" />
                          <span>{roleLabels[member.role]}</span>
                        </div>
                      )}
                      
                      {member.verified_phone && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Phone className="w-3.5 h-3.5" />
                          <span>{member.verified_phone}</span>
                          {isPhoneVerified ? (
                            <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-destructive" />
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 mt-2">
                      <Badge 
                        variant={member.is_active ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {member.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge 
                        variant={isPhoneVerified ? 'default' : 'outline'}
                        className="text-xs"
                      >
                        {isPhoneVerified ? 'Phone Verified' : 'Not Verified'}
                      </Badge>
                    </div>
                  </div>

                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleEdit(member)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <TeamMemberDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        member={editingMember}
        onSaved={fetchTeamMembers}
      />
    </div>
  );
}
