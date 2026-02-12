/**
 * Bowel Care Plan Editor - Admin-only plan editing interface
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { RestrictedSection } from '@/components/ui/restricted-section';
import { useBowelCarePlan } from '@/hooks/useBowelCarePlan';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { BRISTOL_TYPES } from '@/types/bowelCare';
import {
  RISK_TYPES, RISK_ACTIONS, TOILETING_ASSISTANCE_OPTIONS,
  DEFAULT_EMERGENCY_RESPONSES,
  type BowelCarePlan, type RiskEntry, type PrnEscalationStep,
  type EmergencyResponse, type EquipmentChecklist,
} from '@/types/bowelCarePlan';
import {
  Save, ChevronDown, Plus, Trash2, Loader2, Send,
  Shield, User, Heart, AlertTriangle, Pill, Package, FileText, Zap,
} from 'lucide-react';


function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

interface BowelCarePlanEditorProps {
  clientId?: string;
  onClose: () => void;
}

export function BowelCarePlanEditor({ clientId, onClose }: BowelCarePlanEditorProps) {
  const { plan, savePlan, publishPlan, isSaving, isPublishing, isLoading } = useBowelCarePlan(clientId);
  const { isAdmin } = useRoleAccess();

  // Local form state
  const [planAuthor, setPlanAuthor] = useState('');
  const [dateDeveloped, setDateDeveloped] = useState('');
  const [participantInvolvement, setParticipantInvolvement] = useState(false);
  const [consentToShare, setConsentToShare] = useState(false);

  const [normalBristolTypes, setNormalBristolTypes] = useState<number[]>([3, 4]);
  const [typicalFrequency, setTypicalFrequency] = useState('');
  const [knownPatterns, setKnownPatterns] = useState('');
  const [dietaryConsiderations, setDietaryConsiderations] = useState('');
  const [fluidExpectations, setFluidExpectations] = useState('');
  const [mobilityConsiderations, setMobilityConsiderations] = useState('');
  const [communicationPrefs, setCommunicationPrefs] = useState('');

  const [toiletingAssistance, setToiletingAssistance] = useState<string>('independent');
  const [positioningReqs, setPositioningReqs] = useState('');
  const [equipmentReq, setEquipmentReq] = useState('');
  const [continenceSupport, setContinenceSupport] = useState(false);

  const [riskEntries, setRiskEntries] = useState<RiskEntry[]>([]);
  const [prnSteps, setPrnSteps] = useState<PrnEscalationStep[]>([]);
  const [emergencyResponses, setEmergencyResponses] = useState<EmergencyResponse[]>(DEFAULT_EMERGENCY_RESPONSES);

  const [equipChecklist, setEquipChecklist] = useState<EquipmentChecklist>({
    gloves: false, lubricant: false, enema: false, suppositories: false,
    continence_pads: false, hoist: false, commode: false, other: '',
  });
  const [enableAD, setEnableAD] = useState(false);

  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [changeReason, setChangeReason] = useState('');
  const [changeSummary, setChangeSummary] = useState('');

  // Load plan data
  useEffect(() => {
    if (plan) {
      setPlanAuthor(plan.plan_author || '');
      setDateDeveloped(plan.date_developed || '');
      setParticipantInvolvement(plan.participant_involvement_confirmed);
      setConsentToShare(plan.consent_to_share);
      setNormalBristolTypes(plan.normal_stool_bristol_types || [3, 4]);
      setTypicalFrequency(plan.typical_bowel_frequency || '');
      setKnownPatterns(plan.known_bowel_patterns || '');
      setDietaryConsiderations(plan.dietary_considerations || '');
      setFluidExpectations(plan.fluid_intake_expectations || '');
      setMobilityConsiderations(plan.mobility_considerations || '');
      setCommunicationPrefs(plan.communication_preferences || '');
      setToiletingAssistance(plan.toileting_assistance || 'independent');
      setPositioningReqs(plan.positioning_requirements || '');
      setEquipmentReq(plan.equipment_required || '');
      setContinenceSupport(plan.continence_support);
      setRiskEntries((plan.risk_entries as unknown as RiskEntry[]) || []);
      setPrnSteps((plan.prn_escalation_steps as unknown as PrnEscalationStep[]) || []);
      setEmergencyResponses((plan.emergency_responses as unknown as EmergencyResponse[]) || DEFAULT_EMERGENCY_RESPONSES);
      setEquipChecklist((plan.equipment_checklist as unknown as EquipmentChecklist) || equipChecklist);
      setEnableAD(!!(plan as any).enable_autonomic_dysreflexia);
    }
  }, [plan]);

  const handleSave = () => {
    savePlan({
      plan_author: planAuthor,
      date_developed: dateDeveloped || null,
      participant_involvement_confirmed: participantInvolvement,
      consent_to_share: consentToShare,
      normal_stool_bristol_types: normalBristolTypes,
      typical_bowel_frequency: typicalFrequency || null,
      known_bowel_patterns: knownPatterns || null,
      dietary_considerations: dietaryConsiderations || null,
      fluid_intake_expectations: fluidExpectations || null,
      mobility_considerations: mobilityConsiderations || null,
      communication_preferences: communicationPrefs || null,
      toileting_assistance: toiletingAssistance as BowelCarePlan['toileting_assistance'],
      positioning_requirements: positioningReqs || null,
      equipment_required: equipmentReq || null,
      continence_support: continenceSupport,
      risk_entries: riskEntries,
      prn_escalation_steps: prnSteps,
      emergency_responses: emergencyResponses,
      equipment_checklist: equipChecklist,
      enable_autonomic_dysreflexia: enableAD,
      changeReason,
      changeSummary,
    });
  };

  const handlePublish = () => {
    handleSave();
    publishPlan();
    setShowPublishDialog(false);
  };

  const addRiskEntry = () => {
    setRiskEntries([...riskEntries, {
      id: generateId(),
      risk_type: 'no_bm_days',
      enabled: true,
      threshold_value: 3,
      threshold_unit: 'days',
      actions: ['monitor'],
    }]);
  };

  const removeRiskEntry = (id: string) => {
    setRiskEntries(riskEntries.filter(r => r.id !== id));
  };

  const updateRiskEntry = (id: string, updates: Partial<RiskEntry>) => {
    setRiskEntries(riskEntries.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const addPrnStep = () => {
    setPrnSteps([...prnSteps, {
      id: generateId(),
      step_number: prnSteps.length + 1,
      medication_name: '',
      dose: '',
      route: 'oral',
      wait_hours: 6,
      next_action: 'escalate_gp',
    }]);
  };

  const removePrnStep = (id: string) => {
    setPrnSteps(prnSteps.filter(s => s.id !== id));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Digital Bowel Care Plan</h2>
          <p className="text-muted-foreground">
            {plan ? `Version ${plan.version} • ${plan.status === 'published' ? 'Published' : 'Draft'}` : 'New Plan'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>Back</Button>
          {isAdmin && (
            <>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Draft
              </Button>
              <Button variant="default" onClick={() => setShowPublishDialog(true)} disabled={isPublishing}>
                <Send className="h-4 w-4 mr-2" />
                Publish
              </Button>
            </>
          )}
        </div>
      </div>

      {/* NDIS Reference */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="py-3">
          <p className="text-xs text-blue-800">
            <strong>Reference:</strong> NDIS Practice Standards – High Intensity Support Skills Descriptors, November 2022. 
            This plan must be overseen by a relevant health practitioner.
          </p>
        </CardContent>
      </Card>

      {/* A1: Plan Overview */}
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
                <div className="space-y-2">
                  <Label>Plan Author (Health Practitioner)</Label>
                  <Input value={planAuthor} onChange={e => setPlanAuthor(e.target.value)} disabled={!isAdmin} placeholder="e.g. Dr Smith" />
                </div>
                <div className="space-y-2">
                  <Label>Date Developed</Label>
                  <Input type="date" value={dateDeveloped} onChange={e => setDateDeveloped(e.target.value)} disabled={!isAdmin} />
                </div>
              </div>
              {plan?.next_review_due && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm"><strong>Next Review Due:</strong> {plan.next_review_due}</p>
                  <p className="text-xs text-muted-foreground">Auto-set to 12 months from publish date</p>
                </div>
              )}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Checkbox checked={participantInvolvement} onCheckedChange={v => setParticipantInvolvement(!!v)} disabled={!isAdmin} />
                  <Label className="text-sm">Participant Involvement Confirmed</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox checked={consentToShare} onCheckedChange={v => setConsentToShare(!!v)} disabled={!isAdmin} />
                  <Label className="text-sm">Consent to Share Plan</Label>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* A2: Profile & Baseline */}
      <Collapsible>
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
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Normal Stool Appearance (Bristol Types)</Label>
                <div className="flex flex-wrap gap-2">
                  {BRISTOL_TYPES.filter(b => b.type > 0).map(b => (
                    <Button
                      key={b.type}
                      size="sm"
                      variant={normalBristolTypes.includes(b.type) ? 'default' : 'outline'}
                      onClick={() => {
                        if (!isAdmin) return;
                        setNormalBristolTypes(prev =>
                          prev.includes(b.type) ? prev.filter(t => t !== b.type) : [...prev, b.type]
                        );
                      }}
                      disabled={!isAdmin}
                    >
                      Type {b.type}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Typical Bowel Frequency</Label>
                  <Input value={typicalFrequency} onChange={e => setTypicalFrequency(e.target.value)} disabled={!isAdmin} placeholder="e.g. Every 1-2 days" />
                </div>
                <div className="space-y-2">
                  <Label>Known Bowel Patterns</Label>
                  <Input value={knownPatterns} onChange={e => setKnownPatterns(e.target.value)} disabled={!isAdmin} placeholder="e.g. Constipation if no BM after 3 days" />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Dietary Considerations</Label>
                  <Textarea value={dietaryConsiderations} onChange={e => setDietaryConsiderations(e.target.value)} disabled={!isAdmin} rows={2} />
                </div>
                <div className="space-y-2">
                  <Label>Fluid Intake Expectations</Label>
                  <Textarea value={fluidExpectations} onChange={e => setFluidExpectations(e.target.value)} disabled={!isAdmin} rows={2} />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Mobility Considerations</Label>
                  <Textarea value={mobilityConsiderations} onChange={e => setMobilityConsiderations(e.target.value)} disabled={!isAdmin} rows={2} />
                </div>
                <div className="space-y-2">
                  <Label>Communication Preferences</Label>
                  <Textarea value={communicationPrefs} onChange={e => setCommunicationPrefs(e.target.value)} disabled={!isAdmin} rows={2} />
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* A3: Support Requirements */}
      <Collapsible>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/30">
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Bowel Support Requirements
                <ChevronDown className="h-4 w-4 ml-auto" />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Toileting Assistance Level</Label>
                <div className="flex flex-wrap gap-2">
                  {TOILETING_ASSISTANCE_OPTIONS.map(opt => (
                    <Button
                      key={opt.value}
                      size="sm"
                      variant={toiletingAssistance === opt.value ? 'default' : 'outline'}
                      onClick={() => isAdmin && setToiletingAssistance(opt.value)}
                      disabled={!isAdmin}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Positioning Requirements</Label>
                  <Textarea value={positioningReqs} onChange={e => setPositioningReqs(e.target.value)} disabled={!isAdmin} rows={2} />
                </div>
                <div className="space-y-2">
                  <Label>Equipment Required</Label>
                  <Textarea value={equipmentReq} onChange={e => setEquipmentReq(e.target.value)} disabled={!isAdmin} rows={2} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={continenceSupport} onCheckedChange={v => setContinenceSupport(v)} disabled={!isAdmin} />
                <Label>Continence Support Required</Label>
              </div>
              {continenceSupport && (
                <p className="text-sm text-muted-foreground ml-6">
                  → Link to Continence Management Plan (module/continence)
                </p>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* A4: Risk Monitoring */}
      <Collapsible>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/30">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Risk Monitoring & Early Warning Signs
                <ChevronDown className="h-4 w-4 ml-auto" />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              {riskEntries.map((risk) => (
                <div key={risk.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <Select
                      value={risk.risk_type}
                      onValueChange={v => updateRiskEntry(risk.id, { risk_type: v })}
                      disabled={!isAdmin}
                    >
                      <SelectTrigger className="w-64">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {RISK_TYPES.map(rt => (
                          <SelectItem key={rt.value} value={rt.value}>{rt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {isAdmin && (
                      <Button variant="ghost" size="icon" onClick={() => removeRiskEntry(risk.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  {(risk.risk_type === 'no_bm_days' || risk.risk_type === 'hard_pellets') && (
                    <div className="flex items-center gap-2">
                      <Label className="text-sm">Threshold:</Label>
                      <Input
                        type="number"
                        className="w-20"
                        value={risk.threshold_value || 3}
                        onChange={e => updateRiskEntry(risk.id, { threshold_value: Number(e.target.value) })}
                        disabled={!isAdmin}
                      />
                      <span className="text-sm text-muted-foreground">days</span>
                    </div>
                  )}
                  <div className="space-y-1">
                    <Label className="text-sm">Actions:</Label>
                    <div className="flex flex-wrap gap-2">
                      {RISK_ACTIONS.map(ra => (
                        <Button
                          key={ra.value}
                          size="sm"
                          variant={risk.actions.includes(ra.value) ? 'default' : 'outline'}
                          onClick={() => {
                            if (!isAdmin) return;
                            updateRiskEntry(risk.id, {
                              actions: risk.actions.includes(ra.value)
                                ? risk.actions.filter(a => a !== ra.value)
                                : [...risk.actions, ra.value],
                            });
                          }}
                          disabled={!isAdmin}
                        >
                          {ra.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              {isAdmin && (
                <Button variant="outline" onClick={addRiskEntry}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Risk Entry
                </Button>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* A4b: PRN Escalation Builder */}
      <Collapsible>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/30">
              <CardTitle className="flex items-center gap-2">
                <Pill className="h-5 w-5" />
                PRN Escalation Builder
                <ChevronDown className="h-4 w-4 ml-auto" />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              {prnSteps.map((step, idx) => (
                <div key={step.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge>Step {idx + 1}</Badge>
                    {isAdmin && (
                      <Button variant="ghost" size="icon" onClick={() => removePrnStep(step.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="grid sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Medication</Label>
                      <Input
                        value={step.medication_name}
                        onChange={e => setPrnSteps(prnSteps.map(s => s.id === step.id ? { ...s, medication_name: e.target.value } : s))}
                        disabled={!isAdmin}
                        placeholder="e.g. Movicol"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Dose</Label>
                      <Input
                        value={step.dose}
                        onChange={e => setPrnSteps(prnSteps.map(s => s.id === step.id ? { ...s, dose: e.target.value } : s))}
                        disabled={!isAdmin}
                        placeholder="e.g. 1 sachet"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Route</Label>
                      <Select
                        value={step.route}
                        onValueChange={v => setPrnSteps(prnSteps.map(s => s.id === step.id ? { ...s, route: v as 'oral' | 'rectal' } : s))}
                        disabled={!isAdmin}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="oral">Oral</SelectItem>
                          <SelectItem value="rectal">Rectal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">If no BM after (hours)</Label>
                      <Input
                        type="number"
                        value={step.wait_hours}
                        onChange={e => setPrnSteps(prnSteps.map(s => s.id === step.id ? { ...s, wait_hours: Number(e.target.value) } : s))}
                        disabled={!isAdmin}
                        className="w-24"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Next Action</Label>
                      <Select
                        value={step.next_action}
                        onValueChange={v => setPrnSteps(prnSteps.map(s => s.id === step.id ? { ...s, next_action: v as PrnEscalationStep['next_action'] } : s))}
                        disabled={!isAdmin}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="repeat">Repeat same dose</SelectItem>
                          <SelectItem value="second_dose">Give 2nd medication</SelectItem>
                          <SelectItem value="escalate_gp">Escalate to GP</SelectItem>
                          <SelectItem value="attend_hospital">Attend hospital</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}
              {isAdmin && (
                <Button variant="outline" onClick={addPrnStep}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Escalation Step
                </Button>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* A5: Emergency Response */}
      <Collapsible>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/30">
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Incident & Emergency Response
                <ChevronDown className="h-4 w-4 ml-auto" />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              {emergencyResponses.map((resp) => (
                <div key={resp.id} className="p-4 border rounded-lg space-y-3">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">{resp.scenario}</Label>
                  </div>
                  <ol className="list-decimal list-inside space-y-1">
                    {resp.steps.map((step, i) => (
                      <li key={i} className="text-sm text-muted-foreground">{step}</li>
                    ))}
                  </ol>
                  {isAdmin && (
                    <Textarea
                      value={resp.steps.join('\n')}
                      onChange={e => {
                        const newSteps = e.target.value.split('\n').filter(Boolean);
                        setEmergencyResponses(emergencyResponses.map(r =>
                          r.id === resp.id ? { ...r, steps: newSteps } : r
                        ));
                      }}
                      rows={4}
                      placeholder="One step per line"
                      className="text-sm"
                    />
                  )}
                </div>
              ))}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* A6: Equipment Checklist */}
      <Collapsible>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/30">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Equipment & Consumables Required
                <ChevronDown className="h-4 w-4 ml-auto" />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Workers must have access to PPE and relevant equipment to provide safe bowel care.
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { key: 'gloves', label: 'Gloves' },
                  { key: 'lubricant', label: 'Lubricant (if rectal medication prescribed)' },
                  { key: 'enema', label: 'Enema (if prescribed)' },
                  { key: 'suppositories', label: 'Suppositories (if prescribed)' },
                  { key: 'continence_pads', label: 'Continence pads' },
                  { key: 'hoist', label: 'Hoist' },
                  { key: 'commode', label: 'Commode' },
                ].map(item => (
                  <div key={item.key} className="flex items-center gap-2">
                    <Checkbox
                      checked={equipChecklist[item.key as keyof EquipmentChecklist] as boolean}
                      onCheckedChange={v => setEquipChecklist({ ...equipChecklist, [item.key]: !!v })}
                      disabled={!isAdmin}
                    />
                    <Label className="text-sm">{item.label}</Label>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Other equipment</Label>
                <Input
                  value={equipChecklist.other}
                  onChange={e => setEquipChecklist({ ...equipChecklist, other: e.target.value })}
                  disabled={!isAdmin}
                  placeholder="Manual entry..."
                />
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

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

      {/* Safety Footer */}
      <div className="text-xs text-muted-foreground border-t pt-4">
        <p>This plan supports bowel care practice in alignment with NDIS Practice Standards. 
        If concerns are identified, escalate to a GP or qualified health practitioner.</p>
      </div>

      {/* Publish Dialog */}
      <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publish Bowel Care Plan</DialogTitle>
            <DialogDescription>
              Publishing will require all staff to acknowledge the updated plan. 
              The next review will be set to 12 months from today.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Change Summary</Label>
              <Input value={changeSummary} onChange={e => setChangeSummary(e.target.value)} placeholder="Brief description of changes" />
            </div>
            <div className="space-y-2">
              <Label>Reason for Change</Label>
              <Textarea value={changeReason} onChange={e => setChangeReason(e.target.value)} placeholder="Why was this change made?" rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPublishDialog(false)}>Cancel</Button>
            <Button onClick={handlePublish} disabled={isPublishing}>
              {isPublishing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              Publish Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
