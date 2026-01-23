/**
 * Skin Check Form - Log skin integrity checks
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSkinChecks } from '@/hooks/useContinence';
import { BodyMapMarker } from './BodyMapMarker';
import {
  SKIN_CONDITIONS,
  MOISTURE_STATUSES,
  DISCOMFORT_LEVELS,
  BARRIER_CREAM_OPTIONS,
  SkinArea,
  SkinCondition,
  MoistureStatus,
  DiscomfortLevel,
  BarrierCreamStatus,
  BodyMapMarker as BodyMapMarkerType,
} from '@/types/continence';
import { AlertTriangle, List, MapPin } from 'lucide-react';

interface SkinCheckFormProps {
  clientId?: string;
  padChangeId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

export function SkinCheckForm({
  clientId,
  padChangeId,
  open,
  onOpenChange,
  onComplete,
}: SkinCheckFormProps) {
  const { addCheck } = useSkinChecks(clientId);

  const [areasChecked, setAreasChecked] = useState<SkinArea[]>([]);
  const [bodyMapMarkers, setBodyMapMarkers] = useState<BodyMapMarkerType[]>([]);
  const [skinCondition, setSkinCondition] = useState<SkinCondition>('clear');
  const [moistureStatus, setMoistureStatus] = useState<MoistureStatus>('dry');
  const [discomfortLevel, setDiscomfortLevel] = useState<DiscomfortLevel>('unknown');
  const [barrierCream, setBarrierCream] = useState<BarrierCreamStatus>('no');
  const [escalated, setEscalated] = useState(false);
  const [escalationNotes, setEscalationNotes] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'bodymap' | 'details'>('bodymap');

  const requiresEscalation = ['broken_skin', 'fungal_signs'].includes(skinCondition);

  const handleSubmit = async () => {
    if (areasChecked.length === 0) return;

    setIsSubmitting(true);
    try {
      await addCheck.mutateAsync({
        pad_change_id: padChangeId,
        areas_checked: areasChecked,
        skin_condition: skinCondition,
        moisture_status: moistureStatus,
        discomfort_level: discomfortLevel,
        barrier_cream_applied: barrierCream,
        escalated_to_clinician: escalated,
        escalation_notes: escalated ? escalationNotes : undefined,
        body_map_markers: bodyMapMarkers,
        notes: notes || undefined,
      });

      resetForm();
      onOpenChange(false);
      onComplete?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setAreasChecked([]);
    setBodyMapMarkers([]);
    setSkinCondition('clear');
    setMoistureStatus('dry');
    setDiscomfortLevel('unknown');
    setBarrierCream('no');
    setEscalated(false);
    setEscalationNotes('');
    setNotes('');
    setActiveTab('bodymap');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Skin Integrity Check</DialogTitle>
          <DialogDescription>
            Record skin condition during pad change
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'bodymap' | 'details')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="bodymap" className="gap-2">
              <MapPin className="h-4 w-4" />
              Body Map
            </TabsTrigger>
            <TabsTrigger value="details" className="gap-2">
              <List className="h-4 w-4" />
              Details
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bodymap" className="mt-4">
            <BodyMapMarker
              markers={bodyMapMarkers}
              onMarkersChange={setBodyMapMarkers}
              selectedAreas={areasChecked}
              onAreasChange={setAreasChecked}
            />
          </TabsContent>

          <TabsContent value="details" className="mt-4 space-y-6">
          {/* Skin Condition */}
          <div className="space-y-2">
            <Label>Skin Condition</Label>
            <div className="grid grid-cols-2 gap-2">
              {SKIN_CONDITIONS.map((condition) => (
                <Button
                  key={condition.value}
                  type="button"
                  variant={skinCondition === condition.value ? 'default' : 'outline'}
                  className={`justify-start ${
                    ['broken_skin', 'fungal_signs'].includes(condition.value)
                      ? 'border-destructive/50'
                      : ''
                  }`}
                  onClick={() => setSkinCondition(condition.value)}
                >
                  {condition.label}
                  {['broken_skin', 'fungal_signs'].includes(condition.value) && (
                    <AlertTriangle className="h-3 w-3 ml-auto text-destructive" />
                  )}
                </Button>
              ))}
            </div>
          </div>

          {/* Alert for serious conditions */}
          {requiresEscalation && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                <div>
                  <p className="font-medium text-destructive">Escalation Required</p>
                  <p className="text-sm text-muted-foreground">
                    This condition requires review by a Registered Nurse or GP.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Moisture Status */}
          <div className="space-y-2">
            <Label>Moisture Status</Label>
            <Select value={moistureStatus} onValueChange={(v) => setMoistureStatus(v as MoistureStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MOISTURE_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Discomfort Level */}
          <div className="space-y-2">
            <Label>Discomfort / Pain</Label>
            <div className="flex flex-wrap gap-2">
              {DISCOMFORT_LEVELS.map((level) => (
                <Badge
                  key={level.value}
                  variant={discomfortLevel === level.value ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setDiscomfortLevel(level.value)}
                >
                  {level.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Barrier Cream */}
          <div className="space-y-2">
            <Label>Barrier Cream Applied</Label>
            <div className="flex flex-wrap gap-2">
              {BARRIER_CREAM_OPTIONS.map((option) => (
                <Badge
                  key={option.value}
                  variant={barrierCream === option.value ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setBarrierCream(option.value)}
                >
                  {option.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Escalation */}
          <div className="space-y-4 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <Label>Escalated to RN / GP</Label>
                <p className="text-xs text-muted-foreground">
                  Record if a clinician was contacted about this check
                </p>
              </div>
              <Switch checked={escalated} onCheckedChange={setEscalated} />
            </div>

            {escalated && (
              <div className="space-y-2">
                <Label htmlFor="escalationNotes">Escalation Notes</Label>
                <Textarea
                  id="escalationNotes"
                  placeholder="Who was contacted and what advice was given..."
                  value={escalationNotes}
                  onChange={(e) => setEscalationNotes(e.target.value)}
                  rows={3}
                />
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any additional observations..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || areasChecked.length === 0}
          >
            {isSubmitting ? 'Saving...' : 'Save Skin Check'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
