/**
 * Oral Health Care Plan Editor - Admin-only editing + versioning
 * Mirrors BowelCarePlanEditor pattern
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { useOralHealthCarePlan, type PlanCategoryEntry } from '@/hooks/useOralHealthPlan';
import {
  ORAL_HEALTH_CATEGORIES,
  CATEGORY_LABELS,
  ASSISTANCE_LABELS,
  type OralHealthCategory,
  type AssistanceLevel,
} from '@/types/oralHealth';
import { Save, ArrowLeft, Send, Loader2 } from 'lucide-react';

interface Props {
  clientId?: string;
  onClose: () => void;
}

const DEFAULT_CATEGORIES: PlanCategoryEntry[] = ORAL_HEALTH_CATEGORIES.map((cat, i) => ({
  category: cat,
  am_required: true,
  pm_required: true,
  products: null,
  cleaning_method: null,
  additional_instructions: null,
  assistance_level: null,
  dentist_instructions: null,
  display_order: i,
}));

export function OralHealthPlanEditor({ clientId, onClose }: Props) {
  const { plan, savePlan, publishPlan, isSaving, isPublishing } = useOralHealthCarePlan(clientId);

  const [planAuthor, setPlanAuthor] = useState('');
  const [dateDeveloped, setDateDeveloped] = useState('');
  const [assistanceLevel, setAssistanceLevel] = useState('supervision');
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  const [dentistInstructions, setDentistInstructions] = useState('');
  const [categories, setCategories] = useState<PlanCategoryEntry[]>(DEFAULT_CATEGORIES);

  const [showPublish, setShowPublish] = useState(false);
  const [changeReason, setChangeReason] = useState('');
  const [changeSummary, setChangeSummary] = useState('');

  useEffect(() => {
    if (plan) {
      setPlanAuthor(plan.plan_author || '');
      setDateDeveloped(plan.date_developed || '');
      setAssistanceLevel(plan.global_assistance_level || 'supervision');
      setAdditionalInstructions(plan.additional_instructions || '');
      setDentistInstructions(plan.dentist_instructions || '');
      if (plan.plan_categories && plan.plan_categories.length > 0) {
        setCategories(plan.plan_categories);
      }
    }
  }, [plan]);

  const updateCategory = (idx: number, field: string, value: any) => {
    setCategories(prev => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c));
  };

  const handleSave = () => {
    savePlan({
      plan_author: planAuthor || null,
      date_developed: dateDeveloped || null,
      global_assistance_level: assistanceLevel,
      additional_instructions: additionalInstructions || null,
      dentist_instructions: dentistInstructions || null,
      plan_categories: categories,
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Edit Digital Oral Health Care Plan</h2>
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

      {/* Plan Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Plan Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Plan Author (Dentist / Practitioner)</Label>
              <Input value={planAuthor} onChange={e => setPlanAuthor(e.target.value)} placeholder="e.g. Dr Smith" />
            </div>
            <div>
              <Label>Date Developed</Label>
              <Input type="date" value={dateDeveloped} onChange={e => setDateDeveloped(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Global Assistance Level</Label>
            <Select value={assistanceLevel} onValueChange={setAssistanceLevel}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(ASSISTANCE_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Care Plan Categories (AM/PM Tasks)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {categories.map((cat, idx) => (
            <Card key={cat.category} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">{CATEGORY_LABELS[cat.category as OralHealthCategory] || cat.category}</h4>
                {cat.assistance_level && (
                  <Badge variant="outline">{ASSISTANCE_LABELS[cat.assistance_level as AssistanceLevel] || cat.assistance_level}</Badge>
                )}
              </div>
              <div className="grid gap-3">
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <Switch checked={cat.am_required} onCheckedChange={(v) => updateCategory(idx, 'am_required', v)} />
                    <Label className="text-sm">AM</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={cat.pm_required} onCheckedChange={(v) => updateCategory(idx, 'pm_required', v)} />
                    <Label className="text-sm">PM</Label>
                  </div>
                  <Select value={cat.assistance_level || ''} onValueChange={(v) => updateCategory(idx, 'assistance_level', v || null)}>
                    <SelectTrigger className="w-[180px]"><SelectValue placeholder="Assistance level" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="reminding">Reminding</SelectItem>
                      <SelectItem value="supervision">Supervision</SelectItem>
                      <SelectItem value="full_assistance">Full Assistance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Input placeholder="Products required" value={cat.products || ''} onChange={(e) => updateCategory(idx, 'products', e.target.value || null)} />
                <Input placeholder="Cleaning method" value={cat.cleaning_method || ''} onChange={(e) => updateCategory(idx, 'cleaning_method', e.target.value || null)} />
                <Textarea placeholder="Additional instructions" value={cat.additional_instructions || ''} onChange={(e) => updateCategory(idx, 'additional_instructions', e.target.value || null)} rows={2} />
                <Textarea placeholder="Dentist instructions" value={cat.dentist_instructions || ''} onChange={(e) => updateCategory(idx, 'dentist_instructions', e.target.value || null)} rows={2} />
              </div>
            </Card>
          ))}
        </CardContent>
      </Card>

      {/* Additional Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Additional Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>General Additional Instructions</Label>
            <Textarea value={additionalInstructions} onChange={e => setAdditionalInstructions(e.target.value)} rows={3} placeholder="Any additional care instructions..." />
          </div>
          <div>
            <Label>Additional Instructions from Dentist/Health Practitioner</Label>
            <Textarea value={dentistInstructions} onChange={e => setDentistInstructions(e.target.value)} rows={3} placeholder="Specific instructions from dentist or practitioner..." />
          </div>
        </CardContent>
      </Card>

      {/* Edit Reason (required for updates) */}
      {plan && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Change Reason</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Why is this plan being updated? <span className="text-destructive">*</span></Label>
              <Input value={changeReason} onChange={e => setChangeReason(e.target.value)} placeholder="e.g. Updated after dental review" />
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
            <DialogTitle>Publish Digital Oral Health Care Plan</DialogTitle>
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
