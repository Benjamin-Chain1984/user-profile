/**
 * Consumables Check Form - Log stock levels
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
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useConsumablesChecks } from '@/hooks/useContinence';
import { CONSUMABLE_LEVELS, ConsumableLevel } from '@/types/continence';
import { Package, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';

interface ConsumablesCheckFormProps {
  clientId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

const CONSUMABLE_CATEGORIES = [
  { key: 'continence_pads_level', label: 'Continence Pads', description: 'Good = >1 month, Medium = ≥2 weeks, Low = <2 weeks' },
  { key: 'barrier_creams_level', label: 'Barrier Creams', description: 'Good = ≥1 tube, Medium = >½ tube, Low = <½ tube' },
  { key: 'gloves_wipes_level', label: 'Gloves / Wipes', description: 'Good = >2 boxes/packs, Medium = >1, Low = <1' },
  { key: 'cleansing_products_level', label: 'Cleansing Products', description: 'Good = ≥1 bottle, Medium = >½ bottle, Low = <½ bottle' },
  { key: 'disposable_sheets_level', label: 'Disposable Sheets', description: 'Good = >1 month, Medium = ≥2 weeks, Low = <2 weeks' },
] as const;

type ConsumableKey = typeof CONSUMABLE_CATEGORIES[number]['key'];

export function ConsumablesCheckForm({
  clientId,
  open,
  onOpenChange,
  onComplete,
}: ConsumablesCheckFormProps) {
  const { addCheck } = useConsumablesChecks(clientId);

  const [levels, setLevels] = useState<Record<ConsumableKey, ConsumableLevel>>({
    continence_pads_level: 'good',
    barrier_creams_level: 'good',
    gloves_wipes_level: 'good',
    cleansing_products_level: 'good',
    disposable_sheets_level: 'good',
  });
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasLowStock = Object.values(levels).includes('low');

  const getLevelIcon = (level: ConsumableLevel) => {
    switch (level) {
      case 'good':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'medium':
        return <AlertTriangle className="h-4 w-4 text-amber-600" />;
      case 'low':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const getLevelColor = (level: ConsumableLevel) => {
    switch (level) {
      case 'good':
        return 'bg-green-100 border-green-300';
      case 'medium':
        return 'bg-amber-100 border-amber-300';
      case 'low':
        return 'bg-red-100 border-red-300';
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await addCheck.mutateAsync({
        ...levels,
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
    setLevels({
      continence_pads_level: 'good',
      barrier_creams_level: 'good',
      gloves_wipes_level: 'good',
      cleansing_products_level: 'good',
      disposable_sheets_level: 'good',
    });
    setNotes('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Consumables Stock Check
          </DialogTitle>
          <DialogDescription>
            Record current stock levels for continence supplies
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Low Stock Warning */}
          {hasLowStock && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                <div>
                  <p className="font-medium text-destructive">Low Stock Alert</p>
                  <p className="text-sm text-muted-foreground">
                    One or more items are running low. Admin will be notified.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Stock Level Cards */}
          {CONSUMABLE_CATEGORIES.map((category) => (
            <Card key={category.key} className={getLevelColor(levels[category.key])}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>{category.label}</span>
                  {getLevelIcon(levels[category.key])}
                </CardTitle>
                <p className="text-xs text-muted-foreground">{category.description}</p>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  {CONSUMABLE_LEVELS.map((level) => (
                    <Badge
                      key={level.value}
                      variant={levels[category.key] === level.value ? 'default' : 'outline'}
                      className={`cursor-pointer flex-1 justify-center py-2 ${
                        level.value === 'low' ? 'border-red-300' : ''
                      }`}
                      onClick={() =>
                        setLevels((prev) => ({ ...prev, [category.key]: level.value }))
                      }
                    >
                      {level.label}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any additional notes about stock levels or orders..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Stock Check'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
