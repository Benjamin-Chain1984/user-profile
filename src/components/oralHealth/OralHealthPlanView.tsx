/**
 * Oral Health Plan View - Read-only for workers, editable by admins
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useOralHealthPlan } from '@/hooks/useOralHealth';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import {
  ORAL_HEALTH_CATEGORIES,
  CATEGORY_LABELS,
  ASSISTANCE_LABELS,
  type OralHealthPlanCategory,
  type OralHealthCategory,
  type AssistanceLevel,
} from '@/types/oralHealth';
import { ClipboardList, Save, Lock } from 'lucide-react';

interface Props {
  clientId?: string;
}

export function OralHealthPlanView({ clientId }: Props) {
  const { categories, isLoading, savePlan, isSaving } = useOralHealthPlan(clientId);
  const { isAdmin } = useRoleAccess();
  const [editing, setEditing] = useState(false);
  const [planData, setPlanData] = useState<Partial<OralHealthPlanCategory>[]>([]);

  const initEdit = () => {
    if (categories.length > 0) {
      setPlanData(categories.map(c => ({ ...c })));
    } else {
      setPlanData(ORAL_HEALTH_CATEGORIES.map((cat, i) => ({
        category: cat,
        am_required: true,
        pm_required: true,
        products: '',
        cleaning_method: '',
        additional_instructions: '',
        assistance_level: null,
        dentist_instructions: '',
        display_order: i,
      })));
    }
    setEditing(true);
  };

  const updateCategory = (idx: number, field: string, value: any) => {
    setPlanData(prev => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c));
  };

  const handleSave = () => {
    savePlan(planData);
    setEditing(false);
  };

  const displayCategories = editing ? planData : (categories.length > 0 ? categories : ORAL_HEALTH_CATEGORIES.map((cat, i) => ({
    category: cat,
    am_required: true,
    pm_required: true,
    products: null,
    cleaning_method: null,
    additional_instructions: null,
    assistance_level: null,
    dentist_instructions: null,
    display_order: i,
  } as Partial<OralHealthPlanCategory>)));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <ClipboardList className="h-5 w-5" />
          Oral Health Care Plan
        </CardTitle>
        {isAdmin && !editing && (
          <Button variant="outline" size="sm" onClick={initEdit}>Edit Plan</Button>
        )}
        {!isAdmin && (
          <Badge variant="secondary" className="gap-1">
            <Lock className="h-3 w-3" /> Read Only
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          As recommended by Dentist or Health Practitioner. {!isAdmin && 'Only editable by Admin, Dentist, or Health Practitioner.'}
        </p>

        <div className="space-y-4">
          {displayCategories.map((cat, idx) => (
            <Card key={cat.category || idx} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">{CATEGORY_LABELS[(cat.category || '') as OralHealthCategory] || cat.category}</h4>
                {cat.assistance_level && (
                  <Badge variant="outline">{ASSISTANCE_LABELS[cat.assistance_level as AssistanceLevel] || cat.assistance_level}</Badge>
                )}
              </div>

              {editing ? (
                <div className="grid gap-3">
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                      <Switch checked={cat.am_required ?? true} onCheckedChange={(v) => updateCategory(idx, 'am_required', v)} />
                      <Label className="text-sm">AM</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={cat.pm_required ?? true} onCheckedChange={(v) => updateCategory(idx, 'pm_required', v)} />
                      <Label className="text-sm">PM</Label>
                    </div>
                    <Select value={cat.assistance_level || ''} onValueChange={(v) => updateCategory(idx, 'assistance_level', v)}>
                      <SelectTrigger className="w-[180px]"><SelectValue placeholder="Assistance level" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="reminding">Reminding</SelectItem>
                        <SelectItem value="supervision">Supervision</SelectItem>
                        <SelectItem value="full_assistance">Full Assistance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Input placeholder="Products required" value={cat.products || ''} onChange={(e) => updateCategory(idx, 'products', e.target.value)} />
                  <Input placeholder="Cleaning method" value={cat.cleaning_method || ''} onChange={(e) => updateCategory(idx, 'cleaning_method', e.target.value)} />
                  <Textarea placeholder="Additional instructions" value={cat.additional_instructions || ''} onChange={(e) => updateCategory(idx, 'additional_instructions', e.target.value)} rows={2} />
                  <Textarea placeholder="Dentist instructions" value={cat.dentist_instructions || ''} onChange={(e) => updateCategory(idx, 'dentist_instructions', e.target.value)} rows={2} />
                </div>
              ) : (
                <div className="grid gap-1 text-sm text-muted-foreground">
                  <div className="flex gap-2">
                    {cat.am_required !== false && <Badge variant="outline" className="text-xs">AM ✓</Badge>}
                    {cat.pm_required !== false && <Badge variant="outline" className="text-xs">PM ✓</Badge>}
                  </div>
                  {cat.products && <p><strong>Products:</strong> {cat.products}</p>}
                  {cat.cleaning_method && <p><strong>Method:</strong> {cat.cleaning_method}</p>}
                  {cat.additional_instructions && <p><strong>Instructions:</strong> {cat.additional_instructions}</p>}
                  {cat.dentist_instructions && <p><strong>Dentist:</strong> {cat.dentist_instructions}</p>}
                  {!cat.products && !cat.cleaning_method && !cat.dentist_instructions && (
                    <p className="italic">Not configured</p>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>

        {editing && (
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" /> Save Plan
            </Button>
            <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
