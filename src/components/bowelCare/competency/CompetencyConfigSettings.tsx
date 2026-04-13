/**
 * Competency Config Settings - Admin configurable thresholds
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useBowelCompetencyConfig } from '@/hooks/useBowelCompetency';
import { Loader2, Save } from 'lucide-react';

interface CompetencyConfigSettingsProps {
  clientId?: string;
}

export function CompetencyConfigSettings({ clientId }: CompetencyConfigSettingsProps) {
  const { config, updateConfig, isUpdating } = useBowelCompetencyConfig(clientId);

  const [passThreshold, setPassThreshold] = useState(80);
  const [validityMonths, setValidityMonths] = useState(12);
  const [expiryWarningDays, setExpiryWarningDays] = useState(30);

  useEffect(() => {
    if (config) {
      setPassThreshold(config.pass_threshold_percent ?? 80);
      setValidityMonths(config.validity_months ?? 12);
      setExpiryWarningDays(config.expiry_warning_days ?? 30);
    }
  }, [config]);

  const handleSave = () => {
    updateConfig({
      pass_threshold_percent: passThreshold,
      validity_months: validityMonths,
      expiry_warning_days: expiryWarningDays,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Competency Check Settings</CardTitle>
        <CardDescription>Configure pass thresholds and validity periods</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Pass Threshold (%)</Label>
            <Input
              type="number"
              min={50}
              max={100}
              value={passThreshold}
              onChange={e => setPassThreshold(Number(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">Minimum score to pass</p>
          </div>
          <div className="space-y-2">
            <Label>Validity Period (months)</Label>
            <Input
              type="number"
              min={1}
              max={24}
              value={validityMonths}
              onChange={e => setValidityMonths(Number(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">How long competency remains valid</p>
          </div>
          <div className="space-y-2">
            <Label>Expiry Warning (days)</Label>
            <Input
              type="number"
              min={7}
              max={90}
              value={expiryWarningDays}
              onChange={e => setExpiryWarningDays(Number(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">Days before expiry to show warning</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={isUpdating}>
          {isUpdating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save Settings
        </Button>
      </CardContent>
    </Card>
  );
}
