/**
 * Oral Health Care Plan Viewer - Read-only structured view with acknowledgement
 * Mirrors BowelCarePlanViewer pattern exactly
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
  useOralHealthCarePlan,
  useOralHealthPlanAcknowledgements,
  useOralHealthPlanVersions,
  type PlanCategoryEntry,
} from '@/hooks/useOralHealthPlan';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { useClientProfile } from '@/hooks/useClientProfile';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ProfileAvatar } from '@/components/ideal/ProfileAvatar';
import { CATEGORY_LABELS, ASSISTANCE_LABELS, type OralHealthCategory, type AssistanceLevel } from '@/types/oralHealth';
import jsPDF from 'jspdf';
import {
  FileText, Printer, CheckCircle2, AlertTriangle, Loader2, History,
  ClipboardList, Users, XCircle, Sun, Moon, Lock,
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

interface OralHealthPlanViewerProps {
  clientId?: string;
  onClose: () => void;
  onEdit?: () => void;
}

export function OralHealthPlanViewer({ clientId, onClose, onEdit }: OralHealthPlanViewerProps) {
  const { plan, isLoading } = useOralHealthCarePlan(clientId);
  const { profile } = useClientProfile(clientId);
  const { acknowledgements, hasCurrentUserAcknowledged, acknowledge, isAcknowledging } = useOralHealthPlanAcknowledgements(plan?.id, plan?.version);
  const { data: versions = [] } = useOralHealthPlanVersions(plan?.id);
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
          <h2 className="text-2xl font-bold">Digital Oral Health Care Plan</h2>
          <Button variant="outline" onClick={onClose}>Back</Button>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {plan?.status === 'draft' ? 'The Oral Health Care Plan is currently in draft. Please ask an admin to publish it.' : 'No Oral Health Care Plan has been created yet.'}
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

  const categories = plan.plan_categories || [];
  const assistanceLabel = plan.global_assistance_level
    ? (ASSISTANCE_LABELS[plan.global_assistance_level as AssistanceLevel] || plan.global_assistance_level)
    : 'Not specified';

  // --- PDF Generation ---
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
    doc.text('Digital Oral Health Care Plan', margin, y);
    y += 6;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text('As recommended by Dentist or Health Practitioner', margin, y);
    y += 8;

    // Header info
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    const clientName = profile?.fullName || 'Client';
    const dob = profile?.dateOfBirth ? formatDate(profile.dateOfBirth) : 'Not specified';
    addField('Client', clientName);
    addField('Date of Birth', dob);
    addField('Plan Version', `v${plan.version}`);
    addField('Author', plan.plan_author || 'Not specified');
    addField('Published', plan.published_at ? formatDateTime(plan.published_at) : 'Not specified');
    addField('Assistance Level', assistanceLabel);
    addField('Next Review Due', formatDate(plan.next_review_due));
    addField('Generated', formatDateTime(new Date()));
    y += 3;

    doc.setDrawColor(180, 180, 180);
    doc.line(margin, y, margin + pageWidth, y);
    y += 6;

    // Plan Categories
    addSectionHeader('Care Plan — AM/PM Tasks');
    categories.forEach((cat: PlanCategoryEntry) => {
      checkPage(12);
      const catLabel = CATEGORY_LABELS[cat.category as OralHealthCategory] || cat.category;
      const periods = [cat.am_required && 'AM', cat.pm_required && 'PM'].filter(Boolean).join(' / ');
      doc.setFont('helvetica', 'bold');
      doc.text(`${catLabel} (${periods})`, margin + 2, y);
      doc.setFont('helvetica', 'normal');
      y += 5;
      if (cat.products) addBullet(`Products: ${cat.products}`);
      if (cat.cleaning_method) addBullet(`Method: ${cat.cleaning_method}`);
      if (cat.additional_instructions) addBullet(`Instructions: ${cat.additional_instructions}`);
      if (cat.dentist_instructions) addBullet(`Dentist: ${cat.dentist_instructions}`);
      if (cat.assistance_level) {
        const lvl = ASSISTANCE_LABELS[cat.assistance_level as AssistanceLevel] || cat.assistance_level;
        addBullet(`Assistance: ${lvl}`);
      }
      y += 2;
    });

    // Additional Instructions
    if (plan.additional_instructions) {
      addSectionHeader('Additional Instructions');
      const lines = doc.splitTextToSize(plan.additional_instructions, pageWidth - 4);
      doc.text(lines, margin + 2, y);
      y += lines.length * 4.5 + 4;
    }

    // Dentist Instructions
    if (plan.dentist_instructions) {
      addSectionHeader('Additional Instructions from Dentist/Health Practitioner');
      const lines = doc.splitTextToSize(plan.dentist_instructions, pageWidth - 4);
      doc.text(lines, margin + 2, y);
      y += lines.length * 4.5 + 4;
    }

    // Acknowledgement Log
    addSectionHeader('Staff Acknowledgement Log');
    if (teamMembers.length > 0) {
      teamMembers.forEach(member => {
        const ack = acknowledgements.find(a => a.user_id === member.id);
        checkPage(6);
        if (ack) {
          addBullet(`${member.full_name || 'Unnamed'} — Acknowledged: ${formatDateTime(ack.acknowledged_at)}`);
        } else {
          addBullet(`${member.full_name || 'Unnamed'} — Not yet acknowledged`);
        }
      });
    } else {
      addBullet('No team members found');
    }
    y += 2;

    // Footer
    checkPage(15);
    y += 4;
    doc.setDrawColor(180, 180, 180);
    doc.line(margin, y, margin + pageWidth, y);
    y += 5;
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.text('This plan is the source of truth. Follow instructions and escalate concerns to a health professional.', margin, y);
    y += 4;
    doc.text('Pradhan, A. (2013). Oral health impact on quality of life among adults with disabilities. Australian Dental Journal, 58(4), 526–530.', margin, y);

    doc.save(`oral-health-plan-v${plan.version}-${formatDate(new Date()).replace(/\//g, '-')}.pdf`);
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
            <h2 className="text-2xl font-bold">Digital Oral Health Care Plan</h2>
            <p className="text-sm text-muted-foreground">As recommended by Dentist or Health Practitioner</p>
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
                <p className="text-sm text-amber-700">You must read and acknowledge this plan before providing oral health care support.</p>
                <div className="flex items-center gap-2">
                  <Checkbox checked={ackChecked} onCheckedChange={v => setAckChecked(!!v)} />
                  <Label className="text-sm">I have read and understand this Oral Health Care Plan.</Label>
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
            <div><strong>Date Developed:</strong> {formatDate(plan.date_developed)}</div>
            <div><strong>Last Reviewed:</strong> {formatDate(plan.last_reviewed_date)}</div>
            <div><strong>Next Review Due:</strong> {formatDateLong(plan.next_review_due)}</div>
            <div><strong>Assistance Level:</strong> {assistanceLabel}</div>
          </div>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <Card className="border-warning/30 bg-warning/5">
        <CardContent className="py-4">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
            <p className="text-sm text-foreground">
              <strong>Important:</strong> This plan is the source of truth. Follow instructions and escalate concerns to a health professional.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Care Plan Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Care Plan — AM/PM Tasks
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No care plan categories configured yet.</p>
          ) : (
            categories.map((cat: PlanCategoryEntry, idx: number) => {
              const catLabel = CATEGORY_LABELS[cat.category as OralHealthCategory] || cat.category;
              const catAssistance = cat.assistance_level
                ? (ASSISTANCE_LABELS[cat.assistance_level as AssistanceLevel] || cat.assistance_level)
                : null;

              return (
                <div key={idx} className="p-4 bg-muted/50 rounded-lg border-l-4 border-primary/30">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{catLabel}</h4>
                    <div className="flex gap-1.5">
                      {cat.am_required && (
                        <Badge variant="outline" className="text-xs gap-1">
                          <Sun className="h-3 w-3" /> AM
                        </Badge>
                      )}
                      {cat.pm_required && (
                        <Badge variant="outline" className="text-xs gap-1">
                          <Moon className="h-3 w-3" /> PM
                        </Badge>
                      )}
                      {catAssistance && (
                        <Badge variant="secondary" className="text-xs">{catAssistance}</Badge>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    {cat.products && <p><strong>Products:</strong> {cat.products}</p>}
                    {cat.cleaning_method && <p><strong>Method:</strong> {cat.cleaning_method}</p>}
                    {cat.additional_instructions && <p><strong>Instructions:</strong> {cat.additional_instructions}</p>}
                    {cat.dentist_instructions && <p><strong>Dentist:</strong> {cat.dentist_instructions}</p>}
                    {!cat.products && !cat.cleaning_method && !cat.dentist_instructions && (
                      <p className="italic">Not configured</p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Additional Instructions */}
      {plan.additional_instructions && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Additional Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{plan.additional_instructions}</p>
          </CardContent>
        </Card>
      )}

      {/* Dentist Instructions */}
      {plan.dentist_instructions && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Additional Instructions from Dentist/Health Practitioner</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{plan.dentist_instructions}</p>
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
        <p>This plan supports preventive oral health planning and screening. If concerns are identified, escalate to a dentist or health practitioner.</p>
        <p className="font-medium mt-2">Clinical Reference</p>
        <p className="italic">
          Pradhan, A. (2013). Oral health impact on quality of life among adults with disabilities: Carer perceptions.
          Australian Dental Journal, 58(4), 526–530. https://doi.org/10.1111/adj.12124. Used with permission.
        </p>
      </div>

      {/* Version History Dialog */}
      <Dialog open={showVersionHistory} onOpenChange={setShowVersionHistory}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Version History</DialogTitle>
            <DialogDescription>All changes to the Oral Health Care Plan</DialogDescription>
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
