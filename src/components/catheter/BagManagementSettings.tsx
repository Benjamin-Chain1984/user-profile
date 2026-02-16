/**
 * Bag Management Settings - Admin configuration for bag tracking and consumables
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Package, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import { useCatheterConfig, useCatheterBagConfig } from '@/hooks/useCatheter';
import {
  BAG_TYPES,
  BAG_CHANGE_FREQUENCY_OPTIONS,
  type BagType,
  type BagChangeFrequency,
} from '@/types/catheter';

interface BagManagementSettingsProps {
  clientId?: string;
}

interface BagConfigEntry {
  bag_type: string;
  is_active: boolean;
  stock_level: number;
  low_stock_threshold: number;
  change_frequency: BagChangeFrequency | null;
  change_frequency_days: number | null;
}

export function BagManagementSettings({ clientId }: BagManagementSettingsProps) {
  const { config, updateConfig } = useCatheterConfig(clientId);
  const { configs: existingConfigs, upsertBagConfig } = useCatheterBagConfig(clientId);

  const enableBagTracking = (config as any)?.enable_bag_tracking ?? false;

  // Build local state for each bag type
  const [bagEntries, setBagEntries] = useState<BagConfigEntry[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const entries: BagConfigEntry[] = BAG_TYPES.map(bt => {
      const existing = existingConfigs.find(c => c.bag_type === bt.value);
      return {
        bag_type: bt.value,
        is_active: existing?.is_active ?? false,
        stock_level: existing?.stock_level ?? 0,
        low_stock_threshold: existing?.low_stock_threshold ?? 5,
        change_frequency: (existing?.change_frequency as BagChangeFrequency) ?? null,
        change_frequency_days: existing?.change_frequency_days ?? null,
      };
    });
    setBagEntries(entries);
  }, [existingConfigs]);

  const toggleBagTracking = async (enabled: boolean) => {
    await updateConfig.mutateAsync({ enable_bag_tracking: enabled } as any);
  };

  const updateEntry = (bagType: string, updates: Partial<BagConfigEntry>) => {
    setBagEntries(prev =>
      prev.map(e => (e.bag_type === bagType ? { ...e, ...updates } : e))
    );
    setHasChanges(true);
  };

  const handleSave = async () => {
    await upsertBagConfig.mutateAsync(bagEntries);
    setHasChanges(false);
  };

  const getStockIcon = (level: number, threshold: number) => {
    if (level <= threshold) return <AlertCircle className="h-4 w-4 text-destructive" />;
    if (level <= threshold * 2) return <AlertTriangle className="h-4 w-4 text-amber-600" />;
    return <CheckCircle className="h-4 w-4 text-green-600" />;
  };

  const activeEntries = bagEntries.filter(e => e.is_active);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Bag Management & Consumables
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Toggle */}
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <Label className="font-medium">Enable Drainage Bag Tracking</Label>
            <p className="text-sm text-muted-foreground">Track bag changes and monitor consumable stock levels</p>
          </div>
          <Switch
            checked={enableBagTracking}
            onCheckedChange={toggleBagTracking}
          />
        </div>

        {enableBagTracking && (
          <>
            {/* Bag Types Selection */}
            <div className="space-y-3">
              <Label className="font-medium">Bag Types Used</Label>
              <p className="text-sm text-muted-foreground">Select which bag types are in use for this person</p>
              <div className="space-y-2">
                {BAG_TYPES.map(bt => {
                  const entry = bagEntries.find(e => e.bag_type === bt.value);
                  return (
                    <div key={bt.value} className="flex items-center gap-3">
                      <Checkbox
                        id={`bag-${bt.value}`}
                        checked={entry?.is_active ?? false}
                        onCheckedChange={(checked) =>
                          updateEntry(bt.value, { is_active: !!checked })
                        }
                      />
                      <Label htmlFor={`bag-${bt.value}`} className="cursor-pointer">
                        {bt.label}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Per-bag-type config */}
            {activeEntries.length > 0 && (
              <div className="space-y-4">
                <Label className="font-medium">Stock & Frequency Configuration</Label>
                {activeEntries.map(entry => {
                  const label = BAG_TYPES.find(bt => bt.value === entry.bag_type)?.label || entry.bag_type;
                  return (
                    <Card key={entry.bag_type} className="border">
                      <CardContent className="p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{label}</span>
                          {getStockIcon(entry.stock_level, entry.low_stock_threshold)}
                        </div>

                        {/* Stock Level & Threshold */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <Label className="text-xs">Current Stock</Label>
                            <Input
                              type="number"
                              min={0}
                              value={entry.stock_level}
                              onChange={(e) =>
                                updateEntry(entry.bag_type, { stock_level: parseInt(e.target.value) || 0 })
                              }
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Low Stock Alert When ≤</Label>
                            <Input
                              type="number"
                              min={0}
                              value={entry.low_stock_threshold}
                              onChange={(e) =>
                                updateEntry(entry.bag_type, {
                                  low_stock_threshold: parseInt(e.target.value) || 0,
                                })
                              }
                            />
                          </div>
                        </div>

                        {/* Change Frequency */}
                        <div className="space-y-1">
                          <Label className="text-xs">Change Frequency</Label>
                          <Select
                            value={entry.change_frequency || ''}
                            onValueChange={(v) =>
                              updateEntry(entry.bag_type, {
                                change_frequency: (v || null) as BagChangeFrequency | null,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Not set" />
                            </SelectTrigger>
                            <SelectContent>
                              {BAG_CHANGE_FREQUENCY_OPTIONS.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {entry.change_frequency === 'every_x_days' && (
                          <div className="space-y-1">
                            <Label className="text-xs">Every X Days</Label>
                            <Input
                              type="number"
                              min={1}
                              value={entry.change_frequency_days ?? ''}
                              onChange={(e) =>
                                updateEntry(entry.bag_type, {
                                  change_frequency_days: parseInt(e.target.value) || null,
                                })
                              }
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Save */}
            {hasChanges && (
              <Button onClick={handleSave} disabled={upsertBagConfig.isPending}>
                {upsertBagConfig.isPending ? 'Saving...' : 'Save Bag Configuration'}
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
