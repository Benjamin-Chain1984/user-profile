/**
 * Catheter Care Plan Viewer - Read-only structured view with acknowledgement
 * Mirrors BowelCarePlanViewer / OralHealthPlanViewer patterns
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  useCatheterCarePlan,
  useCatheterCarePlanAcknowledgements,
  useCatheterCarePlanVersions,
  type ChecklistItem,
  type EscalationInstruction,
} from '@/hooks/useCatheterCarePlan';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { useClientProfile } from '@/hooks/useClientProfile';
import { supabase } from '@/integrations/supabase/client';
import { ProfileAvatar } from '@/components/ideal/ProfileAvatar';
import jsPDF from 'jspdf';
import {
  FileText, Printer, CheckCircle2, AlertTriangle, Loader2, History,
  ClipboardList, Users, XCircle, Shield, Droplets, Phone,
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

interface CatheterCarePlanViewerProps {
  clientId?: string;
  onClose: () => void;
  onEdit?: () => void;
}

export function CatheterCarePlanViewer({ clientId, onClose, onEdit }: CatheterCarePlanViewerProps) {
  const { plan, isLoading } = useCatheterCarePlan(clientId);
  const { profile } = useClientProfile(clientId);
  const { acknowledgements, hasCurrentUserAcknowledged, acknowledge, isAcknowledging } = useCatheterCarePlanAcknowledgements(plan?.id, plan?.version);
  const { data: versions = [] } = useCatheterCarePlanVersions(plan?.id);
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
          <h2 className="text-2xl font-bold">Digital Urinary Catheter Care Plan</h2>
          <Button variant="outline" onClick={onClose}>Back</Button>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {plan?.status === 'draft' ? 'The Catheter Care Plan is currently in draft. Please ask an admin to publish it.' : 'No Catheter Care Plan has been created yet.'}
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

  const enabledEscalations = (plan.escalation_instructions || []).filter((e: EscalationInstruction) => e.enabled);

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

    // Title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Digital Urinary Catheter Care Plan', margin, y);
    y += 8;

    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    doc.setFont('helvetica', 'normal');
    const clientName = profile?.fullName || 'Client';
    const dob = profile?.dateOfBirth ? formatDate(profile.dateOfBirth) : 'Not specified';
    addField('Client', clientName);
    addField('Date of Birth', dob);
    addField('Catheter Type', plan.catheter_type || 'Not specified');
    addField('Plan Version', `v${plan.version}`);
    addField('Author', plan.plan_author || 'Not specified');
    addField('Prescribing Clinician', plan.prescribing_clinician || 'Not specified');
    addField('Next Review Due', formatDate(plan.next_review_due));
    addField('Generated', formatDateTime(new Date()));
    y += 3;

    doc.setDrawColor(180, 180, 180);
    doc.line(margin, y, margin + pageWidth, y);
    y += 6;

    // Catheter Details
    addSectionHeader('Catheter Details');
    addField('Size', plan.catheter_size_fr || 'Not specified');
    if (plan.balloon_size_ml) addField('Balloon Size', `${plan.balloon_size_ml} ml`);
    if (plan.insertion_date) addField('Insertion Date', formatDate(plan.insertion_date));
    if (plan.change_interval) addField('Change Interval', plan.change_interval);
    if (plan.responsible_clinician) addField('Responsible Clinician', plan.responsible_clinician);
    y += 2;

    // Daily Care
    const renderChecklist = (title: string, items: ChecklistItem[]) => {
      addSectionHeader(title);
      items.filter(i => i.enabled).forEach(item => addBullet(item.label));
      y += 2;
    };
    renderChecklist('Hygiene', plan.hygiene_checklist);
    renderChecklist('Bag Management', plan.bag_management_checklist);
    renderChecklist('Drainage Monitoring', plan.drainage_monitoring_checklist);
    renderChecklist('Fluid Advice', plan.fluid_advice_checklist);

    // Bag Change Schedule
    addSectionHeader('Bag Change Schedule');
    if (plan.leg_bag_change_frequency) addField('Leg Bag', plan.leg_bag_change_frequency);
    if (plan.night_bag_change_frequency) addField('Night Bag', plan.night_bag_change_frequency);
    if (plan.full_system_change_protocol) addField('Full System', plan.full_system_change_protocol);
    y += 2;

    // Escalation
    addSectionHeader('Escalation — Contact RN/GP Immediately If');
    enabledEscalations.forEach((e: EscalationInstruction) => addBullet(e.condition));
    y += 2;

    // Additional
    if (plan.additional_instructions) {
      addSectionHeader('Additional Instructions');
      const lines = doc.splitTextToSize(plan.additional_instructions, pageWidth - 4);
      doc.text(lines, margin + 2, y);
      y += lines.length * 4.5 + 4;
    }

    // Acknowledgement Log
    addSectionHeader('Staff Acknowledgement Log');
    teamMembers.forEach(member => {
      const ack = acknowledgements.find(a => a.user_id === member.id);
      checkPage(6);
      addBullet(ack
        ? `${member.full_name || 'Unnamed'} — Acknowledged: ${formatDateTime(ack.acknowledged_at)}`
        : `${member.full_name || 'Unnamed'} — Not yet acknowledged`
      );
    });
    y += 2;

    // Footer
    checkPage(15);
    y += 4;
    doc.setDrawColor(180, 180, 180);
    doc.line(margin, y, margin + pageWidth, y);
    y += 5;
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.text('This catheter care plan must be followed exactly as prescribed.', margin, y);
    y += 4;
    doc.text('Escalate any concerns to a nurse, GP, or health professional immediately.', margin, y);
    y += 4;
    doc.text('Protocols based on NHS England Best Practice Guidelines and ANZUNS recommendations.', margin, y);

    doc.save(`catheter-care-plan-v${plan.version}-${formatDate(new Date()).replace(/\//g, '-')}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Header with Profile Photo */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-4 items-start flex-1">
          <ProfileAvatar
            name={profile?.fullName || 'Client'}
            avatarUrl={profile?.avatarUrl}
            size="md"
          />
          <div className="flex-1">
            <h2 className="text-2xl font-bold">Digital Urinary Catheter Care Plan</h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge variant="outline">v{plan.version}</Badge>
              <Badge className="bg-green-100 text-green-800">Published</Badge>
              {plan.plan_author && <span className="text-sm text-muted-foreground">by {plan.plan_author}</span>}
              {plan.next_review_due && <span className="text-sm text-muted-foreground">Review: {formatDateLong(plan.next_review_due)}</span>}
            </div>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap justify-end w-full sm:w-auto">
          <Button variant="outline" onClick={() => setShowVersionHistory(true)} size="sm">
            <History className="h-4 w-4 mr-2" />
            History
          </Button>
          <Button variant="outline" onClick={handlePrint} size="sm">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          {isAdmin && onEdit && (
            <Button onClick={onEdit} size="sm">Edit</Button>
          )}
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
                <p className="text-sm text-amber-700">You must read and acknowledge this plan before providing catheter care support.</p>
                <div className="flex items-center gap-2">
                  <Checkbox checked={ackChecked} onCheckedChange={v => setAckChecked(!!v)} />
                  <Label className="text-sm">I have read and understand this Urinary Catheter Care Plan.</Label>
                </div>
                <Button size="sm" disabled={!ackChecked || isAcknowledging} onClick={() => acknowledge()}>
                  {isAcknowledging ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                  Acknowledge Plan
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Safety Disclaimer */}
      <Card className="border-warning/30 bg-warning/5">
        <CardContent className="py-4">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
            <p className="text-sm text-foreground">
              <strong>Important:</strong> This catheter care plan must be followed exactly as prescribed.
              Escalate any concerns to a nurse, GP, or health professional immediately.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Plan Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Plan Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div><strong>Client:</strong> {profile?.fullName || 'Not specified'}</div>
            <div><strong>Date of Birth:</strong> {profile?.dateOfBirth ? formatDate(profile.dateOfBirth) : 'Not specified'}</div>
            <div><strong>Author:</strong> {plan.plan_author || 'Not specified'}</div>
            <div><strong>Prescribing Clinician:</strong> {plan.prescribing_clinician || 'Not specified'}</div>
            <div><strong>Date Developed:</strong> {formatDate(plan.date_developed)}</div>
            <div><strong>Last Reviewed:</strong> {formatDate(plan.last_reviewed_date)}</div>
            <div><strong>Next Review Due:</strong> {formatDateLong(plan.next_review_due)}</div>
          </div>
        </CardContent>
      </Card>

      {/* Catheter Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplets className="h-5 w-5" />
            Catheter Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div><strong>Catheter Type:</strong> {plan.catheter_type || 'Not specified'}</div>
          <div><strong>Catheter Size:</strong> {plan.catheter_size_fr || 'Not specified'}</div>
          {plan.balloon_size_ml && <div><strong>Balloon Size:</strong> {plan.balloon_size_ml} ml</div>}
          {plan.insertion_date && <div><strong>Insertion Date:</strong> {formatDate(plan.insertion_date)}</div>}
          {plan.change_interval && <div><strong>Change Interval:</strong> {plan.change_interval}</div>}
          {plan.responsible_clinician && <div><strong>Responsible Clinician/Service:</strong> {plan.responsible_clinician}</div>}
        </CardContent>
      </Card>

      {/* Daily Care Checklists */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Daily Care Instructions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {[
            { title: 'Hygiene', items: plan.hygiene_checklist },
            { title: 'Bag Management', items: plan.bag_management_checklist },
            { title: 'Drainage Monitoring', items: plan.drainage_monitoring_checklist },
            { title: 'Fluid Advice', items: plan.fluid_advice_checklist },
          ].map(section => {
            const enabled = section.items.filter((i: ChecklistItem) => i.enabled);
            if (enabled.length === 0) return null;
            return (
              <div key={section.title}>
                <h4 className="font-medium text-sm mb-2">{section.title}</h4>
                <div className="space-y-1.5">
                  {enabled.map((item: ChecklistItem) => (
                    <div key={item.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                      {item.label}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Bag Change Schedule */}
      {(plan.leg_bag_change_frequency || plan.night_bag_change_frequency || plan.full_system_change_protocol) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bag Change Schedule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {plan.leg_bag_change_frequency && <div><strong>Leg Bag:</strong> {plan.leg_bag_change_frequency}</div>}
            {plan.night_bag_change_frequency && <div><strong>Night Bag:</strong> {plan.night_bag_change_frequency}</div>}
            {plan.full_system_change_protocol && <div><strong>Full System Change:</strong> {plan.full_system_change_protocol}</div>}
          </CardContent>
        </Card>
      )}

      {/* Escalation Instructions */}
      <Card className="border-destructive/30 bg-destructive/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Shield className="h-5 w-5" />
            Escalation — Contact RN/GP Immediately If
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {enabledEscalations.map((e: EscalationInstruction) => (
              <div key={e.id} className="flex items-start gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                <span>{e.condition}</span>
              </div>
            ))}
          </div>

          <Alert className="border-destructive/30">
            <Phone className="h-4 w-4 text-destructive" />
            <AlertTitle className="text-destructive">Emergency</AlertTitle>
            <AlertDescription>
              Call 000 if person is unwell, confused, septic, or deteriorating.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Additional Instructions */}
      {plan.additional_instructions && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Additional Instructions from Nurse / Urologist / GP</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{plan.additional_instructions}</p>
          </CardContent>
        </Card>
      )}

      {/* Staff Acknowledgement Log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Staff Acknowledgement Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          {teamMembers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No team members found.</p>
          ) : (
            <div className="space-y-2">
              {teamMembers.map(member => {
                const ack = acknowledgements.find(a => a.user_id === member.id);
                return (
                  <div key={member.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg text-sm">
                    <div className="flex items-center gap-2">
                      {ack ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      )}
                      <span className="font-medium">{member.full_name || 'Unnamed User'}</span>
                    </div>
                    <span className="text-muted-foreground text-xs">
                      {ack ? `Acknowledged: ${formatDateTime(ack.acknowledged_at)}` : 'Not yet acknowledged'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Safety Footer */}
      <div className="text-xs text-muted-foreground border-t pt-4 space-y-1">
        <p>This catheter care plan must be followed exactly as prescribed. Escalate any concerns to a nurse, GP, or health professional immediately.</p>
        <p>Catheter care protocols based on NHS England Best Practice Guidelines and ANZUNS recommendations.</p>
      </div>

      {/* Version History Dialog */}
      <Dialog open={showVersionHistory} onOpenChange={setShowVersionHistory}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Version History</DialogTitle>
            <DialogDescription>All changes to the Urinary Catheter Care Plan</DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto space-y-3">
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <Badge>v{plan.version} (Current)</Badge>
                <span className="text-xs text-muted-foreground">
                  {plan.published_at ? formatDateTime(plan.published_at) : 'Draft'}
                </span>
              </div>
            </div>
            {versions.map(v => (
              <div key={v.id} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">v{v.version}</Badge>
                  <span className="text-xs text-muted-foreground">{formatDateTime(v.created_at)}</span>
                </div>
                {v.change_summary && <p className="text-sm mt-1">{v.change_summary}</p>}
                {v.change_reason && <p className="text-xs text-muted-foreground mt-1">Reason: {v.change_reason}</p>}
              </div>
            ))}
            {versions.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No previous versions</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
