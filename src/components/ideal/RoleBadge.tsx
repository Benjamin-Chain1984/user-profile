/**
 * Role Badge Component - Displays user's current role
 */

import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Shield, ShieldCheck, ShieldAlert, User } from 'lucide-react';
import type { AppRole } from '@/services/auth/types';

const roleConfig: Record<AppRole, { label: string; icon: React.ElementType; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  worker: { label: 'Support Worker', icon: Shield, variant: 'secondary' },
  team_leader: { label: 'Team Leader', icon: ShieldCheck, variant: 'default' },
  clinician: { label: 'Clinician', icon: ShieldCheck, variant: 'default' },
  admin: { label: 'Admin', icon: ShieldAlert, variant: 'destructive' },
};

export function RoleBadge() {
  const { user } = useAuth();
  
  if (!user?.roles?.length) {
    return (
      <Badge variant="outline" className="gap-1">
        <User className="w-3 h-3" />
        No Role
      </Badge>
    );
  }

  // Show the highest privilege role
  const roleOrder: AppRole[] = ['admin', 'clinician', 'team_leader', 'worker'];
  const primaryRole = roleOrder.find((r) => user.roles.includes(r)) || user.roles[0];
  const config = roleConfig[primaryRole];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="gap-1">
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  );
}
