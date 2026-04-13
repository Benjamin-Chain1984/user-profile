/**
 * Competency Status Panel - Shows staff completion status
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useStaffCompetencyStatus, useBowelCompetencyConfig } from '@/hooks/useBowelCompetency';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle2, AlertTriangle, XCircle, Clock, ShieldCheck, Users } from 'lucide-react';
import { format } from 'date-fns';
import type { CompetencyStatus } from '@/types/bowelCompetency';

interface CompetencyStatusPanelProps {
  clientId?: string;
  onStartCheck: () => void;
}

const STATUS_CONFIG: Record<CompetencyStatus, {
  label: string;
  icon: typeof CheckCircle2;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  color: string;
}> = {
  completed: { label: 'Completed', icon: CheckCircle2, variant: 'default', color: 'text-green-600' },
  expiring_soon: { label: 'Expiring Soon', icon: Clock, variant: 'secondary', color: 'text-amber-600' },
  expired: { label: 'Expired', icon: XCircle, variant: 'destructive', color: 'text-destructive' },
  not_completed: { label: 'Not Completed', icon: AlertTriangle, variant: 'destructive', color: 'text-destructive' },
  invalidated: { label: 'Invalidated', icon: AlertTriangle, variant: 'destructive', color: 'text-destructive' },
};

export function CompetencyStatusPanel({ clientId, onStartCheck }: CompetencyStatusPanelProps) {
  const { user } = useAuth();
  const { config } = useBowelCompetencyConfig(clientId);
  const { staffStatuses, isLoading, completedCount, totalStaff, overdueCount, expiringSoonCount } = useStaffCompetencyStatus(clientId, config?.expiry_warning_days ?? 30);

  const currentUserStatus = staffStatuses.find(s => s.staffId === user?.id);
  const completionPercent = totalStaff > 0 ? Math.round((completedCount / totalStaff) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <Users className="h-6 w-6 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{totalStaff}</p>
            <p className="text-xs text-muted-foreground">Total Staff</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <CheckCircle2 className="h-6 w-6 mx-auto mb-1 text-green-600" />
            <p className="text-2xl font-bold">{completedCount}</p>
            <p className="text-xs text-muted-foreground">Completed ({completionPercent}%)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <Clock className="h-6 w-6 mx-auto mb-1 text-amber-600" />
            <p className="text-2xl font-bold">{expiringSoonCount}</p>
            <p className="text-xs text-muted-foreground">Expiring Soon</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <XCircle className="h-6 w-6 mx-auto mb-1 text-destructive" />
            <p className="text-2xl font-bold">{overdueCount}</p>
            <p className="text-xs text-muted-foreground">Overdue / Not Done</p>
          </CardContent>
        </Card>
      </div>

      {/* Current user CTA */}
      {currentUserStatus && currentUserStatus.status !== 'completed' && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-amber-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Your competency check is required</p>
                  <p className="text-xs text-amber-700">Complete the assessment to confirm your understanding</p>
                </div>
              </div>
              <Button size="sm" onClick={onStartCheck}>
                Start Check
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Staff List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Staff Competency Status
          </CardTitle>
          <CardDescription>Completion status for each team member</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Loading...</p>
          ) : staffStatuses.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No staff members found</p>
          ) : (
            <div className="space-y-2">
              {staffStatuses.map(staff => {
                const cfg = STATUS_CONFIG[staff.status];
                const Icon = cfg.icon;
                return (
                  <div
                    key={staff.staffId}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon className={`h-5 w-5 shrink-0 ${cfg.color}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{staff.staffName}</p>
                        {staff.lastCompletedAt && (
                          <p className="text-xs text-muted-foreground">
                            Completed: {format(new Date(staff.lastCompletedAt), 'dd/MM/yy')}
                            {staff.validUntil && ` · Expires: ${format(new Date(staff.validUntil), 'dd/MM/yy')}`}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge variant={cfg.variant} className="shrink-0 ml-2">
                      {cfg.label}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
