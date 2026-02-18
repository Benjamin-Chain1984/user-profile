/**
 * Pressure Relief Plan Viewer - Read-only structured view with acknowledgement
 * Mirrors OralHealthPlanViewer pattern
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  usePressureReliefPlan, usePressureReliefPlanAcknowledgements,
  usePressureReliefPlanVersions,
} from '@/hooks/usePressureReliefPlan';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { useClientProfile } from '@/hooks/useClientProfile';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ProfileAvatar } from '@/components/ideal/ProfileAvatar';
import { SCHEDULE_TYPE_LABELS, HIGH_RISK_AREAS, DAYS_OF_WEEK, DAY_LABELS, type ScheduleType, type RotationPosition, type DayOfWeek, getPositionsForDay } from '@/types/pressureArea';
import jsPDF from 'jspdf';
import {
  FileText, Printer, CheckCircle2, AlertTriangle, Loader2, History,
  ClipboardList, Users, Clock, Timer,
} from 'lucide-react';

function formatDate(val: string | Date | null | undefined): string {
  if (!val) return 'Not specified';
  const d = typeof val === 'string' ? new Date(val.includes('T') ? val : val + 'T00:00:00') : val;
  if (isNaN(d.getTime())) return String(val);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function formatDateLong(val: string | Date | null | undefined): string {
  if (!val) return 'Not specified';
  const d = typeof val === 'string' ? new Date(val.includes('T') ? val : val + 'T00:00:00') : val;
  if (isNaN(d.getTime())) return String(val);
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function formatDateTime(val: string | Date): string {
  const d = typeof val === 'string' ? new Date(val) : val;
  if (isNaN(d.getTime())) return String(val);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

interface Props {
  clientId?: string;
  onClose: () => void;
  onEdit?: () => void;
}

export function PressureReliefPlanViewer({ clientId, onClose, onEdit }: Props) {
  const { plan, isLoading } = usePressureReliefPlan(clientId);
  const { profile } = useClientProfile(clientId);
  const { acknowledgements, hasCurrentUserAcknowledged, acknowledge, isAcknowledging } = usePressureReliefPlanAcknowledgements(plan?.id, plan?.version);
  const { data: versions = [] } = usePressureReliefPlanVersions(plan?.id);
  const { isAdmin } = useRoleAccess();

  const [ackChecked, setAckChecked] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [teamMembers, setTeamMembers] = useState<{ id: string; full_name: string | null }[]>([]);

  useEffect(() => {
    const fetchTeam = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('is_active', true)
        .order('full_name');
      if (data) setTeamMembers(data);
    };
    fetchTeam();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!plan || plan.status === 'draft') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Digital Pressure Area Relief Plan</h2>
          <Button variant="outline" onClick={onClose}>Back</Button>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {plan?.status === 'draft' ? 'The plan is currently in draft. Please ask an admin to publish it.' : 'No plan has been created yet.'}
            </p>
            {isAdmin && onEdit && (
              <Button className="mt-4" onClick={onEdit}>
                {plan ? 'Edit Draft Plan' : 'Create Plan'}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const scheduleLabel = SCHEDULE_TYPE_LABELS[plan.schedule_type as ScheduleType] || plan.schedule_type;
  const riskAreaLabels = (plan.high_risk_areas || []).map(id => HIGH_RISK_AREAS.find(a => a.id === id)?.label || id);

  // PDF Generation
  const handlePrint = () => {
    const doc = new jsPDF();
    const margin = 15;
    const pageWidth = doc.internal.pageSize.getWidth() - margin * 2;
    let y = 20;

    const checkPage = (needed: number) => {
      if (y + needed > 275) { doc.addPage(); y = 20; }
    };

    const addSectionHeader = (title: string) => {
      checkPage(15);
      y += 4;
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, y - 5, pageWidth, 8, 'F');
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 30, 30);
      doc.text(title, margin + 2, y);
      y += 8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
    };

    const addField = (label: string, value: string) => {
      checkPage(7);
      doc.setFont('helvetica', 'bold');
      doc.text(`${label}:`, margin + 2, y);
      doc.setFont('helvetica', 'normal');
      const labelWidth = doc.getTextWidth(`${label}: `);
      const lines = doc.splitTextToSize(value, pageWidth - labelWidth - 4);
      doc.text(lines, margin + 2 + labelWidth, y);
      y += lines.length * 4.5 + 1.5;
    };

    const addBullet = (text: string) => {
      checkPage(6);
      const lines = doc.splitTextToSize(text, pageWidth - 10);
      doc.text('•', margin + 4, y);
      doc.text(lines, margin + 10, y);
      y += lines.length * 4.5 + 1;
    };

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Digital Pressure Area Relief Plan', margin, y);
    y += 8;

    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    doc.setFont('helvetica', 'normal');
    addField('Client', profile?.fullName || 'Client');
    addField('DOB', profile?.dateOfBirth ? formatDate(profile.dateOfBirth) : 'Not specified');
    addField('Version', `v${plan.version}`);
    addField('Author', plan.plan_author || 'Not specified');
    addField('Contact', `${plan.plan_author_phone || ''} ${plan.plan_author_email || ''}`.trim() || 'Not specified');
    addField('Published', plan.published_at ? formatDateTime(plan.published_at) : 'Not specified');
    addField('Review Due', formatDate(plan.next_review_due));
    y += 3;

    addSectionHeader('Schedule');
    addField('Type', scheduleLabel);
    addField('Interval', `${plan.interval_minutes} minutes`);
    addField('Day', `${plan.day_schedule_start} – ${plan.day_schedule_end}`);
    if (plan.night_schedule_start) addField('Night', `${plan.night_schedule_start} – ${plan.night_schedule_end || ''}`);

    addSectionHeader('Rotation Sequence');
    DAYS_OF_WEEK.forEach(day => {
      const positions = plan.rotation_sequence ? getPositionsForDay(plan.rotation_sequence, day) : [];
      if (positions.length > 0) {
        addBullet(`${DAY_LABELS[day]}:`);
        positions.forEach((pos: RotationPosition, idx: number) => {
          addBullet(`  ${idx + 1}. ${pos.name} — ${pos.target_duration_minutes}min${pos.notes ? ` (${pos.notes})` : ''}`);
        });
      }
    });

    addSectionHeader('High-Risk Areas');
    riskAreaLabels.forEach(l => addBullet(l));

    if (plan.additional_instructions) {
      addSectionHeader('Additional Instructions');
      const lines = doc.splitTextToSize(plan.additional_instructions, pageWidth - 4);
      doc.text(lines, margin + 2, y);
      y += lines.length * 4.5 + 4;
    }

    addSectionHeader('Staff Acknowledgement Log');
    teamMembers.forEach(member => {
      const ack = acknowledgements.find(a => a.user_id === member.id);
      checkPage(6);
      if (ack) addBullet(`${member.full_name || 'Unnamed'} — Acknowledged: ${formatDateTime(ack.acknowledged_at)}`);
      else addBullet(`${member.full_name || 'Unnamed'} — Not yet acknowledged`);
    });

    checkPage(15);
    y += 4;
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.text('Pressure relief and skin checks support prevention and early identification. Seek advice from a health professional if concerns arise.', margin, y);

    doc.save(`pressure-relief-plan-v${plan.version}-${formatDate(new Date()).replace(/\//g, '-')}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-4 items-start flex-1">
          <ProfileAvatar name={profile?.fullName || 'Client'} avatarUrl={profile?.avatarUrl} size="md" />
          <div className="flex-1">
            <h2 className="text-2xl font-bold">Digital Pressure Area Relief Plan</h2>
            <p className="text-sm text-muted-foreground">Follow this plan exactly. Escalate if you cannot reposition safely.</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge variant="outline">v{plan.version}</Badge>
              <Badge className="bg-green-100 text-green-800">Published</Badge>
              {plan.plan_author && <span className="text-sm text-muted-foreground">by {plan.plan_author}</span>}
            </div>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap justify-end w-full sm:w-auto">
          <Button variant="outline" onClick={() => setShowVersionHistory(true)} size="sm">
            <History className="h-4 w-4 mr-2" /> History
          </Button>
          <Button variant="outline" onClick={handlePrint} size="sm">
            <Printer className="h-4 w-4 mr-2" /> Print
          </Button>
          {isAdmin && onEdit && <Button onClick={onEdit} size="sm">Edit</Button>}
          <Button variant="outline" onClick={onClose} size="sm">Back</Button>
        </div>
      </div>

      {/* Acknowledgement Banner */}
      {!hasCurrentUserAcknowledged && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 space-y-3">
                <p className="text-sm font-medium text-amber-800">Plan Acknowledgement Required</p>
                <p className="text-sm text-amber-700">You must read and acknowledge this plan before providing pressure area care.</p>
                <div className="flex items-center gap-2">
                  <Checkbox checked={ackChecked} onCheckedChange={v => setAckChecked(!!v)} />
                  <Label className="text-sm">I have read and understand this Pressure Relief Plan.</Label>
                </div>
                <Button size="sm" disabled={!ackChecked || isAcknowledging} onClick={() => acknowledge(undefined)}>
                  {isAcknowledging ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                  Acknowledge Plan
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Plan Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div><strong>Client:</strong> {profile?.fullName || 'Not specified'}</div>
            <div><strong>DOB:</strong> {profile?.dateOfBirth ? formatDate(profile.dateOfBirth) : 'Not specified'}</div>
            <div><strong>Author:</strong> {plan.plan_author || 'Not specified'}</div>
            <div><strong>Contact:</strong> {plan.plan_author_phone || plan.plan_author_email || 'Not specified'}</div>
            <div><strong>Date Developed:</strong> {formatDate(plan.date_developed)}</div>
            <div><strong>Last Reviewed:</strong> {formatDate(plan.last_reviewed_date)}</div>
            <div><strong>Next Review:</strong> {formatDateLong(plan.next_review_due)}</div>
          </div>
        </CardContent>
      </Card>

      {/* Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Timer className="h-5 w-5" /> Schedule</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div><strong>Type:</strong> {scheduleLabel}</div>
          {plan.schedule_type !== 'as_required' && (
            <>
              <div><strong>Interval:</strong> Every {plan.interval_minutes} minutes</div>
              <div><strong>Day Schedule:</strong> {plan.day_schedule_start} – {plan.day_schedule_end}</div>
              {plan.night_schedule_start && <div><strong>Night Schedule:</strong> {plan.night_schedule_start} – {plan.night_schedule_end}</div>}
            </>
          )}
          <div><strong>Overdue Thresholds:</strong> Amber at +{plan.overdue_amber_minutes}min, Red at +{plan.overdue_red_minutes}min</div>
        </CardContent>
      </Card>

      {/* Rotation Sequence */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ClipboardList className="h-5 w-5" /> Weekly Rotation Schedule</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {DAYS_OF_WEEK.map(day => {
            const positions = plan.rotation_sequence ? getPositionsForDay(plan.rotation_sequence, day) : [];
            if (positions.length === 0) return null;
            return (
              <div key={day}>
                <p className="text-sm font-semibold mb-2 text-primary">{DAY_LABELS[day]}</p>
                <div className="space-y-2">
                  {positions.map((pos: RotationPosition, idx: number) => (
                    <div key={pos.id || idx} className="p-3 bg-muted/50 rounded-lg border-l-4 border-primary/30">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">{idx + 1}</Badge>
                        <span className="font-medium">{pos.name}</span>
                        <Badge variant="secondary" className="text-xs">{pos.target_duration_minutes} min</Badge>
                      </div>
                      {pos.notes && <p className="text-sm text-muted-foreground ml-8">{pos.notes}</p>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {DAYS_OF_WEEK.every(day => (plan.rotation_sequence ? getPositionsForDay(plan.rotation_sequence, day) : []).length === 0) && (
            <p className="text-sm text-muted-foreground text-center py-4">No rotation sequence configured.</p>
          )}
        </CardContent>
      </Card>

      {/* High-Risk Areas */}
      <Card>
        <CardHeader>
          <CardTitle>High-Risk Areas (Bony Prominences to Check)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {riskAreaLabels.map((label, i) => (
              <Badge key={i} variant="outline">{label}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Additional Instructions */}
      {plan.additional_instructions && (
        <Card>
          <CardHeader><CardTitle>Additional Instructions</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{plan.additional_instructions}</p>
          </CardContent>
        </Card>
      )}

      {/* Staff Acknowledgements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Staff Acknowledgements</CardTitle>
        </CardHeader>
        <CardContent>
          {teamMembers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No team members found.</p>
          ) : (
            <div className="space-y-2">
              {teamMembers.map(member => {
                const ack = acknowledgements.find(a => a.user_id === member.id);
                return (
                  <div key={member.id} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
                    <span>{member.full_name || 'Unnamed'}</span>
                    {ack ? (
                      <Badge className="bg-green-100 text-green-800 text-xs">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        {formatDateTime(ack.acknowledged_at)}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs text-amber-600">Pending</Badge>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <div className="text-xs text-muted-foreground border-t pt-4">
        <p>Pressure relief and skin checks support prevention and early identification. If concerns are identified, seek advice from a nurse, GP, or health professional.</p>
      </div>

      {/* Version History Dialog */}
      <Dialog open={showVersionHistory} onOpenChange={setShowVersionHistory}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Plan Version History</DialogTitle>
            <DialogDescription>Previous versions of this plan</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {versions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No version history available.</p>
            ) : (
              versions.map(v => (
                <div key={v.id} className="border rounded-lg p-3 text-sm">
                  <div className="flex justify-between">
                    <Badge variant="outline">v{v.version}</Badge>
                    <span className="text-xs text-muted-foreground">{formatDateTime(v.created_at)}</span>
                  </div>
                  {v.change_reason && <p className="mt-1"><strong>Reason:</strong> {v.change_reason}</p>}
                  {v.change_summary && <p><strong>Summary:</strong> {v.change_summary}</p>}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
