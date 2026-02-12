/**
 * Bowel Care Plan Viewer - Read-only structured view for all staff
 * Includes acknowledgement log and version history
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useBowelCarePlan, useBowelCarePlanAcknowledgements, useBowelCarePlanVersions } from '@/hooks/useBowelCarePlan';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { useClientProfile } from '@/hooks/useClientProfile';
import { useBowelCareConfig } from '@/hooks/useBowelCare';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { BRISTOL_TYPES } from '@/types/bowelCare';
import { RISK_TYPES, RISK_ACTIONS, TOILETING_ASSISTANCE_OPTIONS } from '@/types/bowelCarePlan';
import type { RiskEntry, PrnEscalationStep, EmergencyResponse, EquipmentChecklist } from '@/types/bowelCarePlan';
import { ProfileAvatar } from '@/components/ideal/ProfileAvatar';
import jsPDF from 'jspdf';
import {
  FileText, ChevronDown, Printer, CheckCircle2,
  AlertTriangle, Loader2, History, User, Heart, Shield, Pill, Package, Users, Zap, Phone, XCircle,
} from 'lucide-react';

/** Format a date string or Date to DD/MM/YYYY */
function formatDate(val: string | Date | null | undefined): string {
  if (!val) return 'Not specified';
  const d = typeof val === 'string' ? new Date(val.includes('T') ? val : val + 'T00:00:00') : val;
  if (isNaN(d.getTime())) return String(val);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/** Format a date string or Date to "12 February 2026" style */
function formatDateLong(val: string | Date | null | undefined): string {
  if (!val) return 'Not specified';
  const d = typeof val === 'string' ? new Date(val.includes('T') ? val : val + 'T00:00:00') : val;
  if (isNaN(d.getTime())) return String(val);
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

/** Format datetime for acknowledgement log */
function formatDateTime(val: string | Date): string {
  const d = typeof val === 'string' ? new Date(val) : val;
  if (isNaN(d.getTime())) return String(val);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

interface BowelCarePlanViewerProps {
  clientId?: string;
  onClose: () => void;
  onEdit?: () => void;
}

export function BowelCarePlanViewer({ clientId, onClose, onEdit }: BowelCarePlanViewerProps) {
  const { plan, isLoading } = useBowelCarePlan(clientId);
  const { profile } = useClientProfile(clientId);
  const { config } = useBowelCareConfig(clientId);
  const { acknowledgements, hasCurrentUserAcknowledged, acknowledge, isAcknowledging } = useBowelCarePlanAcknowledgements(plan?.id, plan?.version);
  const { data: versions = [] } = useBowelCarePlanVersions(plan?.id);
  const { isAdmin } = useRoleAccess();

  const [ackChecked, setAckChecked] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [teamMembers, setTeamMembers] = useState<{ id: string; full_name: string | null }[]>([]);

  // Fetch team members from profiles
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
          <h2 className="text-2xl font-bold">Digital Bowel Care Plan</h2>
          <Button variant="outline" onClick={onClose}>Back</Button>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {plan?.status === 'draft' ? 'The Bowel Care Plan is currently in draft. Please ask an admin to publish it.' : 'No Bowel Care Plan has been created yet.'}
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

  const riskEntries = (plan.risk_entries as unknown as RiskEntry[]) || [];
  const prnSteps = (plan.prn_escalation_steps as unknown as PrnEscalationStep[]) || [];
  const emergencyResponses = (plan.emergency_responses as unknown as EmergencyResponse[]) || [];
  const equipChecklist: EquipmentChecklist = (plan.equipment_checklist as unknown as EquipmentChecklist) || {
    gloves: false, lubricant: false, enema: false, suppositories: false,
    continence_pads: false, hoist: false, commode: false, other: '',
  };

  const getRiskLabel = (type: string) => RISK_TYPES.find(r => r.value === type)?.label || type;
  const getActionLabel = (action: string) => RISK_ACTIONS.find(r => r.value === action)?.label || action;
  const getAssistanceLabel = (val: string) => TOILETING_ASSISTANCE_OPTIONS.find(o => o.value === val)?.label || val;

  const getNextActionLabel = (action: string) => {
    switch (action) {
      case 'second_dose': return 'Administer second dose';
      case 'escalate_gp': return 'Contact GP';
      case 'attend_hospital': return 'Attend Hospital';
      case 'repeat': return 'Repeat dose';
      default: return action;
    }
  };

  const monitoringHours = config?.monitor_hours_after_prn || 8;

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
    doc.text('Digital Bowel Care Plan', margin, y);
    y += 8;

    // Header info
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    const clientName = profile?.fullName || 'Client';
    addField('Client', clientName);
    addField('Plan Version', `v${plan.version}`);
    addField('Author', plan.plan_author || 'Not specified');
    addField('Date Developed', formatDate(plan.date_developed));
    addField('Last Reviewed', formatDate(plan.last_reviewed_date));
    addField('Next Review Due', formatDate(plan.next_review_due));
    addField('Generated', formatDateTime(new Date()));
    y += 3;

    // Divider
    doc.setDrawColor(180, 180, 180);
    doc.line(margin, y, margin + pageWidth, y);
    y += 6;

    // Plan Overview
    addSectionHeader('Plan Overview');
    addField('Involvement Confirmed', plan.participant_involvement_confirmed ? 'Yes' : 'No');
    addField('Consent to Share', plan.consent_to_share ? 'Yes' : 'No');
    y += 2;

    // Profile & Baseline
    addSectionHeader('Profile & Baseline');
    if (plan.normal_stool_bristol_types?.length) {
      const types = plan.normal_stool_bristol_types.map(t => {
        const info = BRISTOL_TYPES.find(b => b.type === t);
        return info ? `Type ${t} (${info.name})` : `Type ${t}`;
      }).join(', ');
      addField('Normal Stool Types', types);
    }
    if (plan.typical_bowel_frequency) addField('Typical Frequency', plan.typical_bowel_frequency);
    if (plan.known_bowel_patterns) addField('Known Patterns', plan.known_bowel_patterns);
    if (plan.dietary_considerations) addField('Dietary', plan.dietary_considerations);
    if (plan.fluid_intake_expectations) addField('Fluid Intake', plan.fluid_intake_expectations);
    if (plan.mobility_considerations) addField('Mobility', plan.mobility_considerations);
    if (plan.communication_preferences) addField('Communication', plan.communication_preferences);
    y += 2;

    // Support Requirements
    addSectionHeader('Support Requirements');
    addField('Toileting Assistance', getAssistanceLabel(plan.toileting_assistance));
    if (plan.positioning_requirements) addField('Positioning', plan.positioning_requirements);
    if (plan.equipment_required) addField('Equipment', plan.equipment_required);
    addField('Continence Support', plan.continence_support ? 'Yes' : 'No');
    y += 2;

    // Risk Monitoring
    if (riskEntries.length > 0) {
      addSectionHeader('Risk Monitoring & Early Warning Signs');
      riskEntries.forEach(risk => {
        let displayLabel = getRiskLabel(risk.risk_type);
        if (risk.risk_type === 'no_bm_days' && config?.no_bm_days_threshold) {
          displayLabel = `No bowel motion for ${config.no_bm_days_threshold} days`;
        } else if (risk.risk_type === 'hard_pellets' && config?.type1_consecutive_days_threshold) {
          displayLabel = `Hard pellets (Type 1) for ${config.type1_consecutive_days_threshold} days`;
        }
        checkPage(8);
        addBullet(`${displayLabel} → ${risk.actions.map(getActionLabel).join(', ')}`);
      });
      y += 2;
    }

    // PRN Escalation
    if (prnSteps.length > 0) {
      addSectionHeader('PRN Escalation Pathway');
      prnSteps.forEach((step, i) => {
        checkPage(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`Step ${i + 1}:`, margin + 2, y);
        doc.setFont('helvetica', 'normal');
        y += 5;
        addBullet(`Medication: ${step.medication_name}`);
        addBullet(`Dose: ${step.dose}`);
        addBullet(`Route: ${step.route === 'rectal' ? 'Rectal' : 'Oral'}`);
        addBullet(`Monitor for ${step.wait_hours || monitoringHours} hours after administration`);
        addBullet(`If no bowel motion: ${getNextActionLabel(step.next_action)}`);
        if (step.next_medication_name) {
          addBullet(`Next medication: ${step.next_medication_name} ${step.next_dose || ''}`);
        }
        y += 2;
      });
    }

    // Emergency Response
    if (emergencyResponses.length > 0) {
      addSectionHeader('Emergency Response');
      emergencyResponses.forEach(resp => {
        checkPage(10);
        doc.setFont('helvetica', 'bold');
        doc.text(resp.scenario, margin + 2, y);
        doc.setFont('helvetica', 'normal');
        y += 5;
        resp.steps.forEach(step => addBullet(step));
        y += 2;
      });
    }

    // Autonomic Dysreflexia
    if ((plan as any).enable_autonomic_dysreflexia) {
      addSectionHeader('Autonomic Dysreflexia — Signs, Symptoms & Action Plan');
      addBullet('Symptoms: Pounding headache, flushing/sweating above injury level, blurred vision, nasal congestion, slow heart rate, high blood pressure, goosebumps, anxiety');
      y += 2;
      doc.setFont('helvetica', 'bold');
      checkPage(6);
      doc.text('Immediate Actions:', margin + 2, y);
      doc.setFont('helvetica', 'normal');
      y += 5;
      addBullet('1. Sit the person upright immediately');
      addBullet('2. Loosen tight clothing — belts, straps, clothing around waist');
      addBullet('3. Check the catheter — look for blockages, kinks, or twists');
      addBullet('4. Drain the bladder if required');
      addBullet('5. Check for bowel impaction — constipation can be a trigger');
      addBullet('6. Seek urgent medical help if symptoms persist');
      y += 2;

      // Equipment under AD section
      addSectionHeader('Equipment & Consumables');
      const items: string[] = [];
      if (equipChecklist.gloves) items.push('Gloves');
      if (equipChecklist.lubricant) items.push('Lubricant');
      if (equipChecklist.enema) items.push('Enema');
      if (equipChecklist.suppositories) items.push('Suppositories');
      if (equipChecklist.continence_pads) items.push('Continence Pads');
      if (equipChecklist.hoist) items.push('Hoist');
      if (equipChecklist.commode) items.push('Commode');
      if (equipChecklist.other) items.push(equipChecklist.other);
      addField('Required', items.length > 0 ? items.join(', ') : 'None specified');
      y += 2;
    } else {
      // Equipment section (standalone if AD disabled)
      addSectionHeader('Equipment & Consumables');
      const items: string[] = [];
      if (equipChecklist.gloves) items.push('Gloves');
      if (equipChecklist.lubricant) items.push('Lubricant');
      if (equipChecklist.enema) items.push('Enema');
      if (equipChecklist.suppositories) items.push('Suppositories');
      if (equipChecklist.continence_pads) items.push('Continence Pads');
      if (equipChecklist.hoist) items.push('Hoist');
      if (equipChecklist.commode) items.push('Commode');
      if (equipChecklist.other) items.push(equipChecklist.other);
      addField('Required', items.length > 0 ? items.join(', ') : 'None specified');
      y += 2;
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
    doc.text('Reference: NDIS Practice Standards – High Intensity Support Skills Descriptors, November 2022.', margin, y);
    y += 4;
    doc.text('This plan supports bowel care practice. If concerns are identified, escalate to a GP or qualified health practitioner.', margin, y);

    doc.save(`bowel-care-plan-v${plan.version}-${formatDate(new Date()).replace(/\//g, '-')}.pdf`);
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
            <h2 className="text-2xl font-bold">Digital Bowel Care Plan</h2>
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
                <p className="text-sm text-amber-700">You must read and acknowledge this plan before providing bowel care support.</p>
                <div className="flex items-center gap-2">
                  <Checkbox checked={ackChecked} onCheckedChange={v => setAckChecked(!!v)} />
                  <Label className="text-sm">I have read and understood this Bowel Care Plan.</Label>
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
            <div><strong>Author:</strong> {plan.plan_author || 'Not specified'}</div>
            <div><strong>Date Developed:</strong> {formatDate(plan.date_developed)}</div>
            <div><strong>Last Reviewed:</strong> {formatDate(plan.last_reviewed_date)}</div>
            <div><strong>Next Review Due:</strong> {formatDateLong(plan.next_review_due)}</div>
            <div><strong>Involvement Confirmed:</strong> {plan.participant_involvement_confirmed ? 'Yes' : 'No'}</div>
            <div><strong>Consent to Share:</strong> {plan.consent_to_share ? 'Yes' : 'No'}</div>
          </div>
        </CardContent>
      </Card>

      {/* Profile & Baseline */}
      <Collapsible defaultOpen>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/30">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile & Baseline
                <ChevronDown className="h-4 w-4 ml-auto" />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-3 text-sm">
              <div>
                <strong>Normal Stool Types:</strong>{' '}
                {(plan.normal_stool_bristol_types || []).map(t => {
                  const info = BRISTOL_TYPES.find(b => b.type === t);
                  return info ? `Type ${t} (${info.name})` : `Type ${t}`;
                }).join(', ')}
              </div>
              {plan.typical_bowel_frequency && <div><strong>Typical Frequency:</strong> {plan.typical_bowel_frequency}</div>}
              {plan.known_bowel_patterns && <div><strong>Known Patterns:</strong> {plan.known_bowel_patterns}</div>}
              {plan.dietary_considerations && <div><strong>Dietary:</strong> {plan.dietary_considerations}</div>}
              {plan.fluid_intake_expectations && <div><strong>Fluid Intake:</strong> {plan.fluid_intake_expectations}</div>}
              {plan.mobility_considerations && <div><strong>Mobility:</strong> {plan.mobility_considerations}</div>}
              {plan.communication_preferences && <div><strong>Communication:</strong> {plan.communication_preferences}</div>}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Support Requirements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Support Requirements
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div><strong>Toileting Assistance:</strong> {getAssistanceLabel(plan.toileting_assistance)}</div>
          {plan.positioning_requirements && <div><strong>Positioning:</strong> {plan.positioning_requirements}</div>}
          {plan.equipment_required && <div><strong>Equipment:</strong> {plan.equipment_required}</div>}
          <div><strong>Continence Support:</strong> {plan.continence_support ? 'Yes – See Continence Plan' : 'No'}</div>
        </CardContent>
      </Card>

      {/* Risk Monitoring */}
      {riskEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Risk Monitoring & Early Warning Signs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {riskEntries.map(risk => {
                let displayLabel = getRiskLabel(risk.risk_type);
                if (risk.risk_type === 'no_bm_days' && config?.no_bm_days_threshold) {
                  displayLabel = `No bowel motion for ${config.no_bm_days_threshold} days`;
                } else if (risk.risk_type === 'hard_pellets' && config?.type1_consecutive_days_threshold) {
                  displayLabel = `Hard pellets (Type 1) for ${config.type1_consecutive_days_threshold} days`;
                }

                return (
                  <div key={risk.id} className="p-3 bg-muted/50 rounded-lg border-l-4 border-amber-300">
                    <p className="font-medium text-sm">{displayLabel}</p>
                    {risk.custom_label && (
                      <p className="text-xs text-muted-foreground italic mt-1">{risk.custom_label}</p>
                    )}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {risk.actions.map(a => (
                        <Badge key={a} variant="outline" className="text-xs">{getActionLabel(a)}</Badge>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* PRN Escalation — Text-based */}
      {prnSteps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5" />
              PRN Escalation Pathway
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {prnSteps.map((step, i) => (
                <div key={step.id} className="p-4 bg-muted/50 rounded-lg border-l-4 border-blue-300">
                  <p className="font-semibold text-sm mb-2">Step {i + 1}</p>
                  <div className="space-y-1 text-sm">
                    <p><strong>Medication:</strong> {step.medication_name}</p>
                    <p><strong>Dose:</strong> {step.dose}</p>
                    <p><strong>Route:</strong> {step.route === 'rectal' ? 'Rectal' : 'Oral'}</p>
                    <p><strong>Monitor for:</strong> {step.wait_hours || monitoringHours} hours after administration</p>
                    <p><strong>If no bowel motion:</strong> {getNextActionLabel(step.next_action)}</p>
                    {step.next_medication_name && (
                      <p><strong>Next medication:</strong> {step.next_medication_name} {step.next_dose || ''}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Emergency Response */}
      {emergencyResponses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Emergency Response
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {emergencyResponses.map(resp => (
                <div key={resp.id}>
                  <p className="font-medium text-sm">{resp.scenario}</p>
                  <ol className="list-decimal list-inside mt-1 space-y-1">
                    {resp.steps.map((step, i) => (
                      <li key={i} className="text-sm text-muted-foreground">{step}</li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Autonomic Dysreflexia Section */}
      {(plan as any).enable_autonomic_dysreflexia && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Zap className="h-5 w-5" />
              Autonomic Dysreflexia — Signs, Symptoms & Action Plan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-destructive/30">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <AlertTitle className="text-destructive">Emergency Response</AlertTitle>
              <AlertDescription className="space-y-2">
                <p className="font-medium">If you notice any of these symptoms, act immediately:</p>
                <ul className="list-disc list-inside text-sm space-y-1">
                  <li>Pounding headache</li>
                  <li>Flushing or sweating above injury level</li>
                  <li>Blurred vision</li>
                  <li>Nasal congestion</li>
                  <li>Slow heart rate (bradycardia)</li>
                  <li>High blood pressure</li>
                  <li>Goosebumps below injury level</li>
                  <li>Anxiety or sense of unease</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="bg-background rounded-lg p-4 space-y-3 border">
              <h4 className="font-semibold text-destructive">Immediate Actions:</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li><strong>Sit the person upright</strong> immediately</li>
                <li><strong>Loosen tight clothing</strong> — belts, straps, clothing around waist</li>
                <li><strong>Check the catheter</strong> — look for blockages, kinks, or twists</li>
                <li><strong>Drain the bladder</strong> if required</li>
                <li><strong>Check for bowel impaction</strong> — constipation can be a trigger</li>
                <li><strong>Seek urgent medical help</strong> if symptoms persist</li>
              </ol>
            </div>

            <div className="flex gap-2">
              <Button
                variant="destructive"
                className="gap-2"
                onClick={() => window.location.href = 'tel:000'}
              >
                <Phone className="h-4 w-4" />
                Call 000
              </Button>
            </div>

            {/* Equipment & Consumables under AD */}
            <Separator className="my-4" />
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Package className="h-4 w-4" />
                Equipment & Consumables
              </h4>
              <div className="flex flex-wrap gap-2">
                {equipChecklist.gloves && <Badge variant="outline">Gloves</Badge>}
                {equipChecklist.lubricant && <Badge variant="outline">Lubricant</Badge>}
                {equipChecklist.enema && <Badge variant="outline">Enema</Badge>}
                {equipChecklist.suppositories && <Badge variant="outline">Suppositories</Badge>}
                {equipChecklist.continence_pads && <Badge variant="outline">Continence Pads</Badge>}
                {equipChecklist.hoist && <Badge variant="outline">Hoist</Badge>}
                {equipChecklist.commode && <Badge variant="outline">Commode</Badge>}
                {equipChecklist.other && <Badge variant="outline">{equipChecklist.other}</Badge>}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Equipment (standalone if no AD) */}
      {!(plan as any).enable_autonomic_dysreflexia && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Equipment & Consumables
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {equipChecklist.gloves && <Badge variant="outline">Gloves</Badge>}
              {equipChecklist.lubricant && <Badge variant="outline">Lubricant</Badge>}
              {equipChecklist.enema && <Badge variant="outline">Enema</Badge>}
              {equipChecklist.suppositories && <Badge variant="outline">Suppositories</Badge>}
              {equipChecklist.continence_pads && <Badge variant="outline">Continence Pads</Badge>}
              {equipChecklist.hoist && <Badge variant="outline">Hoist</Badge>}
              {equipChecklist.commode && <Badge variant="outline">Commode</Badge>}
              {equipChecklist.other && <Badge variant="outline">{equipChecklist.other}</Badge>}
            </div>
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
        <p>Reference: NDIS Practice Standards – High Intensity Support Skills Descriptors, November 2022.</p>
        <p>This plan supports bowel care practice. If concerns are identified, escalate to a GP or qualified health practitioner.</p>
      </div>

      {/* Version History Dialog */}
      <Dialog open={showVersionHistory} onOpenChange={setShowVersionHistory}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Version History</DialogTitle>
            <DialogDescription>All changes to the Bowel Care Plan</DialogDescription>
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
