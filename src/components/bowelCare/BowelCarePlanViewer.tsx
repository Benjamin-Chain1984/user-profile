/**
 * Bowel Care Plan Viewer - Read-only structured view for all staff
 * Includes acknowledgement and version history
 */

import { useState } from 'react';
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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { useBowelCarePlan, useBowelCarePlanAcknowledgements, useBowelCarePlanVersions } from '@/hooks/useBowelCarePlan';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { BRISTOL_TYPES } from '@/types/bowelCare';
import { RISK_TYPES, RISK_ACTIONS, TOILETING_ASSISTANCE_OPTIONS } from '@/types/bowelCarePlan';
import type { RiskEntry, PrnEscalationStep, EmergencyResponse, EquipmentChecklist } from '@/types/bowelCarePlan';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import {
  FileText, ChevronDown, Printer, Clock, CheckCircle2,
  AlertTriangle, Loader2, History, User, Heart, Shield, Pill, Package,
} from 'lucide-react';

interface BowelCarePlanViewerProps {
  clientId?: string;
  onClose: () => void;
  onEdit?: () => void;
}

export function BowelCarePlanViewer({ clientId, onClose, onEdit }: BowelCarePlanViewerProps) {
  const { plan, isLoading } = useBowelCarePlan(clientId);
  const { acknowledgements, hasCurrentUserAcknowledged, acknowledge, isAcknowledging } = useBowelCarePlanAcknowledgements(plan?.id, plan?.version);
  const { data: versions = [] } = useBowelCarePlanVersions(plan?.id);
  const { isAdmin } = useRoleAccess();

  const [ackChecked, setAckChecked] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);

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

  const handlePrint = () => {
    const doc = new jsPDF();
    let y = 20;
    const margin = 15;

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Digital Bowel Care Plan', margin, y);
    y += 10;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Version: ${plan.version}`, margin, y); y += 5;
    doc.text(`Author: ${plan.plan_author || 'Not specified'}`, margin, y); y += 5;
    if (plan.last_reviewed_date) doc.text(`Last Reviewed: ${plan.last_reviewed_date}`, margin, y); y += 5;
    if (plan.next_review_due) doc.text(`Next Review Due: ${plan.next_review_due}`, margin, y); y += 5;
    doc.text(`Generated: ${format(new Date(), 'PPp')}`, margin, y); y += 10;

    // Baseline
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Participant Baseline', margin, y); y += 8;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    if (plan.typical_bowel_frequency) { doc.text(`Frequency: ${plan.typical_bowel_frequency}`, margin, y); y += 5; }
    if (plan.known_bowel_patterns) { doc.text(`Patterns: ${plan.known_bowel_patterns}`, margin, y); y += 5; }
    if (plan.dietary_considerations) { doc.text(`Diet: ${plan.dietary_considerations}`, margin, y); y += 5; }
    if (plan.fluid_intake_expectations) { doc.text(`Fluids: ${plan.fluid_intake_expectations}`, margin, y); y += 5; }
    y += 5;

    doc.text(`Toileting Assistance: ${getAssistanceLabel(plan.toileting_assistance)}`, margin, y); y += 10;

    // Risk entries
    if (riskEntries.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Risk Monitoring', margin, y); y += 8;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      riskEntries.forEach(risk => {
        doc.text(`• ${getRiskLabel(risk.risk_type)} → ${risk.actions.map(getActionLabel).join(', ')}`, margin, y);
        y += 5;
      });
      y += 5;
    }

    // PRN steps
    if (prnSteps.length > 0) {
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('PRN Escalation', margin, y); y += 8;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      prnSteps.forEach((step, i) => {
        doc.text(`Step ${i + 1}: ${step.medication_name} ${step.dose} (${step.route}) → wait ${step.wait_hours}h → ${step.next_action}`, margin, y);
        y += 5;
      });
    }

    doc.setFontSize(8);
    doc.text('NDIS Practice Standards – High Intensity Support Skills Descriptors, November 2022', margin, 285);

    doc.save(`bowel-care-plan-v${plan.version}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Digital Bowel Care Plan</h2>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline">Version {plan.version}</Badge>
            <Badge className="bg-green-100 text-green-800">Published</Badge>
            {plan.plan_author && <span className="text-sm text-muted-foreground">by {plan.plan_author}</span>}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowVersionHistory(true)}>
            <History className="h-4 w-4 mr-2" />
            History
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print Plan
          </Button>
          {isAdmin && onEdit && (
            <Button onClick={onEdit}>Edit Plan</Button>
          )}
          <Button variant="outline" onClick={onClose}>Back</Button>
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
            <div><strong>Date Developed:</strong> {plan.date_developed || 'Not specified'}</div>
            <div><strong>Last Reviewed:</strong> {plan.last_reviewed_date || 'Not reviewed'}</div>
            <div><strong>Next Review Due:</strong> {plan.next_review_due || 'Not set'}</div>
            <div><strong>Participant Involvement:</strong> {plan.participant_involvement_confirmed ? 'Yes' : 'No'}</div>
            <div><strong>Consent to Share:</strong> {plan.consent_to_share ? 'Yes' : 'No'}</div>
          </div>
        </CardContent>
      </Card>

      {/* Participant Profile */}
      <Collapsible defaultOpen>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/30">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Participant Profile & Baseline
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
              Risk Monitoring
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {riskEntries.map(risk => (
                <div key={risk.id} className="p-3 bg-muted/50 rounded-lg">
                  <p className="font-medium text-sm">{getRiskLabel(risk.risk_type)}</p>
                  {risk.threshold_value && (
                    <p className="text-xs text-muted-foreground">Threshold: {risk.threshold_value} {risk.threshold_unit || 'days'}</p>
                  )}
                  <div className="flex flex-wrap gap-1 mt-1">
                    {risk.actions.map(a => (
                      <Badge key={a} variant="outline" className="text-xs">{getActionLabel(a)}</Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* PRN Escalation */}
      {prnSteps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5" />
              PRN Escalation Pathway
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {prnSteps.map((step, i) => (
                <div key={step.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <Badge className="mt-0.5">{i + 1}</Badge>
                  <div className="text-sm">
                    <p className="font-medium">{step.medication_name} – {step.dose} ({step.route})</p>
                    <p className="text-muted-foreground">
                      If no BM after {step.wait_hours}h → {step.next_action.replace('_', ' ')}
                    </p>
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

      {/* Equipment */}
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
                  {plan.published_at ? format(new Date(plan.published_at), 'PPp') : 'Draft'}
                </span>
              </div>
            </div>
            {versions.map(v => (
              <div key={v.id} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">v{v.version}</Badge>
                  <span className="text-xs text-muted-foreground">{format(new Date(v.created_at), 'PPp')}</span>
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
