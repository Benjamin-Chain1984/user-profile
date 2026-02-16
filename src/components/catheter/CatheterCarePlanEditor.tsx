/**
 * Catheter Care Plan Editor - Admin-only editing + versioning
 * Mirrors BowelCarePlanEditor / OralHealthPlanEditor patterns
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  useCatheterCarePlan,
  DEFAULT_HYGIENE_CHECKLIST,
  DEFAULT_BAG_MANAGEMENT_CHECKLIST,
  DEFAULT_DRAINAGE_CHECKLIST,
  DEFAULT_FLUID_ADVICE_CHECKLIST,
  DEFAULT_ESCALATION_INSTRUCTIONS,
  type ChecklistItem,
  type EscalationInstruction,
} from '@/hooks/useCatheterCarePlan';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import {
  Save, ArrowLeft, Send, Loader2, ChevronDown, FileText,
  Droplets, ClipboardList, Shield, Package, Zap,
} from 'lucide-react';

interface Props {
  clientId?: string;
  onClose: () => void;
}

export function CatheterCarePlanEditor({ clientId, onClose }: Props) {
  const { plan, savePlan, publishPlan, isSaving, isPublishing } = useCatheterCarePlan(clientId);
  const { isAdmin } = useRoleAccess();

  // Plan overview
  const [planAuthor, setPlanAuthor] = useState('');
  const [dateDeveloped, setDateDeveloped] = useState('');
  const [prescribingClinician, setPrescribingClinician] = useState('');

  // Catheter details
  const [catheterType, setCatheterType] = useState('');
  const [catheterSizeFr, setCatheterSizeFr] = useState('');
  const [balloonSizeMl, setBalloonSizeMl] = useState('');
  const [insertionDate, setInsertionDate] = useState('');
  const [changeInterval, setChangeInterval] = useState('');
  const [responsibleClinician, setResponsibleClinician] = useState('');

  // Checklists
  const [hygieneChecklist, setHygieneChecklist] = useState<ChecklistItem[]>(DEFAULT_HYGIENE_CHECKLIST);
  const [bagManagementChecklist, setBagManagementChecklist] = useState<ChecklistItem[]>(DEFAULT_BAG_MANAGEMENT_CHECKLIST);
  const [drainageChecklist, setDrainageChecklist] = useState<ChecklistItem[]>(DEFAULT_DRAINAGE_CHECKLIST);
  const [fluidAdviceChecklist, setFluidAdviceChecklist] = useState<ChecklistItem[]>(DEFAULT_FLUID_ADVICE_CHECKLIST);

  // Bag schedule
  const [legBagFreq, setLegBagFreq] = useState('');
  const [nightBagFreq, setNightBagFreq] = useState('');
  const [fullSystemProtocol, setFullSystemProtocol] = useState('');

  // Escalation
  const [noUrineHours, setNoUrineHours] = useState(4);
  const [escalationInstructions, setEscalationInstructions] = useState<EscalationInstruction[]>(DEFAULT_ESCALATION_INSTRUCTIONS);

  // Additional
  const [additionalInstructions, setAdditionalInstructions] = useState('');

  // Autonomic Dysreflexia
  const [enableAD, setEnableAD] = useState(false);

  // Publishing
  const [showPublish, setShowPublish] = useState(false);
  const [changeReason, setChangeReason] = useState('');
  const [changeSummary, setChangeSummary] = useState('');

  useEffect(() => {
    if (plan) {
      setPlanAuthor(plan.plan_author || '');
      setDateDeveloped(plan.date_developed || '');
      setPrescribingClinician(plan.prescribing_clinician || '');
      setCatheterType(plan.catheter_type || '');
      setCatheterSizeFr(plan.catheter_size_fr || '');
      setBalloonSizeMl(plan.balloon_size_ml || '');
      setInsertionDate(plan.insertion_date || '');
      setChangeInterval(plan.change_interval || '');
      setResponsibleClinician(plan.responsible_clinician || '');
      setHygieneChecklist(plan.hygiene_checklist || DEFAULT_HYGIENE_CHECKLIST);
      setBagManagementChecklist(plan.bag_management_checklist || DEFAULT_BAG_MANAGEMENT_CHECKLIST);
      setDrainageChecklist(plan.drainage_monitoring_checklist || DEFAULT_DRAINAGE_CHECKLIST);
      setFluidAdviceChecklist(plan.fluid_advice_checklist || DEFAULT_FLUID_ADVICE_CHECKLIST);
      setLegBagFreq(plan.leg_bag_change_frequency || '');
      setNightBagFreq(plan.night_bag_change_frequency || '');
      setFullSystemProtocol(plan.full_system_change_protocol || '');
      setNoUrineHours(plan.no_urine_hours_threshold || 4);
      setEscalationInstructions(plan.escalation_instructions || DEFAULT_ESCALATION_INSTRUCTIONS);
      setAdditionalInstructions(plan.additional_instructions || '');
      setEnableAD(!!plan.enable_autonomic_dysreflexia);
    }
  }, [plan]);

  const updateChecklist = (
    setter: React.Dispatch<React.SetStateAction<ChecklistItem[]>>,
    id: string,
    enabled: boolean
  ) => {
    setter(prev => prev.map(item => item.id === id ? { ...item, enabled } : item));
  };

  const handleSave = () => {
    savePlan({
      plan_author: planAuthor || null,
      date_developed: dateDeveloped || null,
      prescribing_clinician: prescribingClinician || null,
      catheter_type: catheterType || null,
      catheter_size_fr: catheterSizeFr || null,
      balloon_size_ml: balloonSizeMl || null,
      insertion_date: insertionDate || null,
      change_interval: changeInterval || null,
      responsible_clinician: responsibleClinician || null,
      hygiene_checklist: hygieneChecklist,
      bag_management_checklist: bagManagementChecklist,
      drainage_monitoring_checklist: drainageChecklist,
      fluid_advice_checklist: fluidAdviceChecklist,
      leg_bag_change_frequency: legBagFreq || null,
      night_bag_change_frequency: nightBagFreq || null,
      full_system_change_protocol: fullSystemProtocol || null,
      no_urine_hours_threshold: noUrineHours,
      escalation_instructions: escalationInstructions,
      additional_instructions: additionalInstructions || null,
      enable_autonomic_dysreflexia: enableAD,
      changeReason,
      changeSummary: changeSummary || 'Plan updated',
    });
  };

  const handlePublish = () => {
    handleSave();
    setTimeout(() => {
      publishPlan();
      setShowPublish(false);
      onClose();
    }, 500);
  };

  const renderChecklistSection = (
    title: string,
    icon: React.ReactNode,
    items: ChecklistItem[],
    setter: React.Dispatch<React.SetStateAction<ChecklistItem[]>>
  ) => (
    <div className="space-y-3">
      <h4 className="font-medium text-sm flex items-center gap-2">{icon} {title}</h4>
      {items.map(item => (
        <div key={item.id} className="flex items-center gap-2">
          <Switch
            checked={item.enabled}
            onCheckedChange={v => updateChecklist(setter, item.id, v)}
            disabled={!isAdmin}
          />
          <Label className="text-sm">{item.label}</Label>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Edit Urinary Catheter Care Plan</h2>
          <p className="text-sm text-muted-foreground">
            {plan ? `Editing v${plan.version} — ${plan.status}` : 'Creating new plan'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
        </div>
      </div>

      {/* Plan Overview */}
      <Collapsible defaultOpen>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/30">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Plan Overview
                <ChevronDown className="h-4 w-4 ml-auto" />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Plan Author</Label>
                  <Input value={planAuthor} onChange={e => setPlanAuthor(e.target.value)} disabled={!isAdmin} placeholder="e.g. Nurse Smith" />
                </div>
                <div>
                  <Label>Date Developed</Label>
                  <Input type="date" value={dateDeveloped} onChange={e => setDateDeveloped(e.target.value)} disabled={!isAdmin} />
                </div>
              </div>
              <div>
                <Label>Prescribing Clinician</Label>
                <Input value={prescribingClinician} onChange={e => setPrescribingClinician(e.target.value)} disabled={!isAdmin} placeholder="e.g. Dr Johnson" />
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Catheter Details */}
      <Collapsible defaultOpen>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/30">
              <CardTitle className="flex items-center gap-2">
                <Droplets className="h-5 w-5" />
                Catheter Details
                <ChevronDown className="h-4 w-4 ml-auto" />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div>
                <Label>Catheter Type</Label>
                <Select value={catheterType} onValueChange={setCatheterType} disabled={!isAdmin}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="indwelling_urethral">Indwelling Urethral</SelectItem>
                    <SelectItem value="suprapubic">Suprapubic</SelectItem>
                    <SelectItem value="intermittent">Intermittent</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Catheter Size (Fr)</Label>
                  <Input value={catheterSizeFr} onChange={e => setCatheterSizeFr(e.target.value)} disabled={!isAdmin} placeholder="e.g. 14Fr" />
                </div>
                <div>
                  <Label>Balloon Size (ml)</Label>
                  <Input value={balloonSizeMl} onChange={e => setBalloonSizeMl(e.target.value)} disabled={!isAdmin} placeholder="e.g. 10" />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Insertion Date</Label>
                  <Input type="date" value={insertionDate} onChange={e => setInsertionDate(e.target.value)} disabled={!isAdmin} />
                </div>
                <div>
                  <Label>Expected Change Interval</Label>
                  <Input value={changeInterval} onChange={e => setChangeInterval(e.target.value)} disabled={!isAdmin} placeholder="e.g. Every 6-8 weeks" />
                </div>
              </div>
              <div>
                <Label>Responsible Clinician / Service</Label>
                <Input value={responsibleClinician} onChange={e => setResponsibleClinician(e.target.value)} disabled={!isAdmin} placeholder="e.g. District Nurse Service" />
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Daily Care Instructions */}
      <Collapsible>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/30">
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Daily Care Instructions
                <ChevronDown className="h-4 w-4 ml-auto" />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-6">
              {renderChecklistSection('Hygiene', null, hygieneChecklist, setHygieneChecklist)}
              {renderChecklistSection('Bag Management', null, bagManagementChecklist, setBagManagementChecklist)}
              {renderChecklistSection('Drainage Monitoring', null, drainageChecklist, setDrainageChecklist)}
              {renderChecklistSection('Fluid Advice', null, fluidAdviceChecklist, setFluidAdviceChecklist)}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Bag Change Schedule */}
      <Collapsible>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/30">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Bag Change Schedule
                <ChevronDown className="h-4 w-4 ml-auto" />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div>
                <Label>Leg Bag Change Frequency</Label>
                <Input value={legBagFreq} onChange={e => setLegBagFreq(e.target.value)} disabled={!isAdmin} placeholder="e.g. Every 5-7 days" />
              </div>
              <div>
                <Label>Night Bag Change Frequency</Label>
                <Input value={nightBagFreq} onChange={e => setNightBagFreq(e.target.value)} disabled={!isAdmin} placeholder="e.g. Weekly" />
              </div>
              <div>
                <Label>Full System Change Protocol</Label>
                <Textarea value={fullSystemProtocol} onChange={e => setFullSystemProtocol(e.target.value)} disabled={!isAdmin} rows={2} placeholder="Describe full system change protocol if applicable..." />
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Escalation Instructions */}
      <Collapsible>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/30">
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Shield className="h-5 w-5" />
                Escalation Instructions
                <ChevronDown className="h-4 w-4 ml-auto" />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div>
                <Label>No urine draining threshold (hours)</Label>
                <Input type="number" value={noUrineHours} onChange={e => setNoUrineHours(Number(e.target.value))} disabled={!isAdmin} className="w-24" />
              </div>
              <p className="text-sm text-muted-foreground">Contact RN/GP immediately if:</p>
              {escalationInstructions.map(e => (
                <div key={e.id} className="flex items-center gap-2">
                  <Switch
                    checked={e.enabled}
                    onCheckedChange={v => setEscalationInstructions(prev => prev.map(i => i.id === e.id ? { ...i, enabled: v } : i))}
                    disabled={!isAdmin}
                  />
                  <Label className="text-sm">{e.condition}</Label>
                </div>
              ))}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Additional Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Additional Instructions from Nurse / Urologist / GP</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={additionalInstructions}
            onChange={e => setAdditionalInstructions(e.target.value)}
            disabled={!isAdmin}
            rows={4}
            placeholder="Any additional care instructions..."
          />
        </CardContent>
      </Card>

      {/* Autonomic Dysreflexia Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Autonomic Dysreflexia
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Enable this if the individual is at risk of autonomic dysreflexia. When enabled, the signs, symptoms
            and action plan will appear in the published care plan.
          </p>
          <div className="flex items-center gap-2">
            <Switch checked={enableAD} onCheckedChange={v => setEnableAD(v)} disabled={!isAdmin} />
            <Label>Include Autonomic Dysreflexia action plan in this care plan</Label>
          </div>
        </CardContent>
      </Card>

      {/* Change Reason (required for updates) */}
      {plan && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Change Reason</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Why is this plan being updated? <span className="text-destructive">*</span></Label>
              <Input value={changeReason} onChange={e => setChangeReason(e.target.value)} placeholder="e.g. Updated after urology review" />
            </div>
            <div>
              <Label>Change Summary</Label>
              <Input value={changeSummary} onChange={e => setChangeSummary(e.target.value)} placeholder="Brief description of what changed" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={isSaving || (!!plan && !changeReason)}>
          {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save Draft
        </Button>
        <Button variant="default" onClick={() => setShowPublish(true)} disabled={isSaving || (!!plan && !changeReason)}>
          <Send className="h-4 w-4 mr-2" /> Publish Plan
        </Button>
      </div>

      {/* Publish Confirmation Dialog */}
      <Dialog open={showPublish} onOpenChange={setShowPublish}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publish Urinary Catheter Care Plan</DialogTitle>
            <DialogDescription>
              Publishing this plan will require all staff to re-acknowledge it. Previous acknowledgements will become outdated.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPublish(false)}>Cancel</Button>
            <Button onClick={handlePublish} disabled={isPublishing}>
              {isPublishing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              Confirm & Publish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
