/**
 * Oral Health Assessment Form
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useOralHealthAssessments } from '@/hooks/useOralHealth';
import {
  ORAL_HEALTH_CATEGORIES,
  CATEGORY_LABELS,
  ASSESSMENT_DESCRIPTORS,
  MOUTH_ISSUE_TYPES,
  MOUTH_LOCATIONS,
  type OralHealthCategory,
  type AssessmentRating,
  type MouthAnnotation,
} from '@/types/oralHealth';
import { AlertCircle, Plus, Trash2, MapPin } from 'lucide-react';
import { InteractiveMouthDiagram } from './InteractiveMouthDiagram';

interface Props {
  clientId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RATING_COLORS: Record<string, string> = {
  healthy: 'text-success border-success/30',
  changes: 'text-warning border-warning/30',
  unhealthy: 'text-destructive border-destructive/30',
  n_a: 'text-muted-foreground border-muted',
};

export function OralHealthAssessmentForm({ clientId, open, onOpenChange }: Props) {
  const { submitAssessment, isSubmitting } = useOralHealthAssessments(clientId);
  const [trigger, setTrigger] = useState<'scheduled' | 'concern'>('scheduled');
  const [ratings, setRatings] = useState<Record<string, AssessmentRating>>({});
  const [actionTaken, setActionTaken] = useState('');
  const [actionNotes, setActionNotes] = useState('');
  const [escalationContact, setEscalationContact] = useState('');
  const [annotations, setAnnotations] = useState<MouthAnnotation[]>([]);

  const setRating = (category: string, rating: AssessmentRating) => {
    setRatings(prev => ({ ...prev, [category]: rating }));
  };

  // Auto-calculate overall status
  const categoryRatings = ORAL_HEALTH_CATEGORIES.map(c => ratings[c]).filter(Boolean);
  const hasUnhealthy = categoryRatings.includes('unhealthy');
  const hasChanges = categoryRatings.includes('changes');
  const overallStatus = hasUnhealthy ? 'unhealthy' : hasChanges ? 'changes' : 'healthy';

  const addAnnotation = (presetLocation?: string) => {
    setAnnotations(prev => [...prev, { issue_type: '', location: presetLocation || '', notes: '' }]);
  };

  const updateAnnotation = (idx: number, field: keyof MouthAnnotation, value: string) => {
    setAnnotations(prev => prev.map((a, i) => i === idx ? { ...a, [field]: value } : a));
  };

  const removeAnnotation = (idx: number) => {
    setAnnotations(prev => prev.filter((_, i) => i !== idx));
  };

  const handleZoneClick = (location: string) => {
    // If an annotation already exists for this location without an issue_type, focus that one
    const existingEmpty = annotations.findIndex(a => a.location === location && !a.issue_type);
    if (existingEmpty === -1) {
      addAnnotation(location);
    }
  };

  const handleSubmit = () => {
    submitAssessment({
      assessment_trigger: trigger,
      lips: ratings.lips || 'healthy',
      tongue: ratings.tongue || 'healthy',
      roof_of_mouth: ratings.roof_of_mouth || 'healthy',
      gums: ratings.gums || 'healthy',
      teeth: ratings.teeth || 'healthy',
      dentures: ratings.dentures || null,
      breath: ratings.breath || 'healthy',
      cleanliness: ratings.cleanliness || 'healthy',
      dental_pain: ratings.dental_pain || 'healthy',
      overall_status: overallStatus,
      action_taken: actionTaken || null,
      action_notes: actionNotes || null,
      escalation_contact: escalationContact || null,
      mouth_annotations: annotations.filter(a => a.issue_type && a.location),
    }, {
      onSuccess: () => {
        onOpenChange(false);
        setRatings({});
        setActionTaken('');
        setActionNotes('');
        setEscalationContact('');
        setAnnotations([]);
      },
    });
  };

  const autoAction = overallStatus === 'unhealthy'
    ? 'urgent_dental_visit'
    : overallStatus === 'changes'
      ? 'notify_next_visit'
      : 'maintain_daily_care';

  const requiredActionLabel = overallStatus === 'unhealthy'
    ? 'Organise urgent dental appointment'
    : overallStatus === 'changes'
      ? 'Discuss at next dental review'
      : 'No action — continue oral healthcare';

  // Auto-assign action when overall status changes
  const prevOverall = useState<string | null>(null);
  if (prevOverall[0] !== overallStatus) {
    prevOverall[1](overallStatus);
    if (actionTaken !== autoAction) {
      setActionTaken(autoAction);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Oral Health Assessment</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Complete at the configured frequency or when concerns arise.
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Trigger */}
          <div>
            <Label>Assessment Trigger</Label>
            <RadioGroup value={trigger} onValueChange={(v) => setTrigger(v as 'scheduled' | 'concern')} className="flex gap-4 mt-1">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="scheduled" id="trigger-scheduled" />
                <Label htmlFor="trigger-scheduled" className="font-normal">Scheduled</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="concern" id="trigger-concern" />
                <Label htmlFor="trigger-concern" className="font-normal">Concern Identified</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Category Ratings */}
          <div className="space-y-3">
            {ORAL_HEALTH_CATEGORIES.map((cat) => (
              <Card key={cat} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{CATEGORY_LABELS[cat]}</h4>
                  {ratings[cat] && (
                    <Badge className={RATING_COLORS[ratings[cat]]} variant="outline">
                      {ratings[cat] === 'n_a' ? 'N/A' : ratings[cat].charAt(0).toUpperCase() + ratings[cat].slice(1)}
                    </Badge>
                  )}
                </div>

                <RadioGroup
                  value={ratings[cat] || ''}
                  onValueChange={(v) => setRating(cat, v as AssessmentRating)}
                  className="grid grid-cols-2 sm:grid-cols-4 gap-2"
                >
                  {(['healthy', 'changes', 'unhealthy', 'n_a'] as AssessmentRating[]).map((rating) => {
                    const colBg = rating === 'healthy' ? 'bg-success/10 border-success/30'
                      : rating === 'changes' ? 'bg-warning/10 border-warning/30'
                      : rating === 'unhealthy' ? 'bg-destructive/10 border-destructive/30'
                      : 'bg-muted/40 border-muted';
                    const colText = rating === 'healthy' ? 'text-success'
                      : rating === 'changes' ? 'text-warning'
                      : rating === 'unhealthy' ? 'text-destructive'
                      : 'text-muted-foreground';
                    return (
                      <div key={rating} className={`flex items-start gap-2 rounded-lg border p-2 ${colBg}`}>
                        <RadioGroupItem value={rating} id={`${cat}-${rating}`} className="mt-0.5" />
                        <Label htmlFor={`${cat}-${rating}`} className="font-normal text-xs leading-tight cursor-pointer">
                          <span className={`font-semibold block ${colText}`}>
                            {rating === 'n_a' ? 'N/A' : rating.charAt(0).toUpperCase() + rating.slice(1)}
                          </span>
                          {rating !== 'n_a' && ASSESSMENT_DESCRIPTORS[cat] && (
                            <span className="text-muted-foreground">
                              {ASSESSMENT_DESCRIPTORS[cat][rating]}
                            </span>
                          )}
                        </Label>
                      </div>
                    );
                  })}
                </RadioGroup>
              </Card>
            ))}
          </div>

          {/* Overall Status */}
          <Card className={`p-4 ${overallStatus === 'unhealthy' ? 'border-destructive/30 bg-destructive/5' : overallStatus === 'changes' ? 'border-warning/30 bg-warning/5' : 'border-success/30 bg-success/5'}`}>
            <div className="flex items-center gap-2">
              <AlertCircle className={`h-5 w-5 ${overallStatus === 'unhealthy' ? 'text-destructive' : overallStatus === 'changes' ? 'text-warning' : 'text-success'}`} />
              <div>
                <p className="font-medium">Overall: {overallStatus.charAt(0).toUpperCase() + overallStatus.slice(1)}</p>
                <p className="text-sm text-muted-foreground">{requiredActionLabel}</p>
              </div>
            </div>
          </Card>

          {/* Action */}
          <div>
            <Label>Action Taken</Label>
            <Select value={actionTaken} onValueChange={setActionTaken}>
              <SelectTrigger><SelectValue placeholder="Select action" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="maintain_daily_care">Maintain daily oral care</SelectItem>
                <SelectItem value="notify_next_visit">Notify at next dental visit</SelectItem>
                <SelectItem value="urgent_dental_visit">Arrange urgent dental visit</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Textarea
            placeholder="Action notes (optional)"
            value={actionNotes}
            onChange={(e) => setActionNotes(e.target.value)}
            rows={2}
          />

          {overallStatus === 'unhealthy' && (
            <div>
              <Label>Escalation Contact</Label>
              <Input
                placeholder="Name of contact notified"
                value={escalationContact}
                onChange={(e) => setEscalationContact(e.target.value)}
              />
            </div>
          )}

          {/* Mouth Annotations */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="flex items-center gap-2">
                <MapPin className="h-4 w-4" /> Mouth Diagram Annotations
              </Label>
              <Button type="button" variant="outline" size="sm" onClick={() => addAnnotation()}>
                <Plus className="h-4 w-4 mr-1" /> Add Mark
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Tap a zone on the diagram to mark where issues are seen, or use "Add Mark" manually.
            </p>

            <InteractiveMouthDiagram
              annotations={annotations}
              onZoneClick={handleZoneClick}
            />
            {annotations.map((ann, idx) => (
              <Card key={idx} className="p-3 mb-2">
                <div className="grid grid-cols-2 gap-2">
                  <Select value={ann.issue_type} onValueChange={(v) => updateAnnotation(idx, 'issue_type', v)}>
                    <SelectTrigger><SelectValue placeholder="Issue type" /></SelectTrigger>
                    <SelectContent>
                      {MOUTH_ISSUE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={ann.location} onValueChange={(v) => updateAnnotation(idx, 'location', v)}>
                    <SelectTrigger><SelectValue placeholder="Location" /></SelectTrigger>
                    <SelectContent>
                      {MOUTH_LOCATIONS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 mt-2">
                  <Input placeholder="Notes" value={ann.notes || ''} onChange={(e) => updateAnnotation(idx, 'notes', e.target.value)} className="flex-1" />
                  <Button variant="ghost" size="icon" onClick={() => removeAnnotation(idx)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* Citation */}
          <div className="text-xs text-muted-foreground border-t pt-3">
            <p className="italic">
              Pradhan, A. (2013). Oral health impact on quality of life among adults with disabilities: Carer perceptions. 
              Australian Dental Journal, 58(4), 526–530. https://doi.org/10.1111/adj.12124. Used with permission.
            </p>
          </div>

          <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
            Save Assessment
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
