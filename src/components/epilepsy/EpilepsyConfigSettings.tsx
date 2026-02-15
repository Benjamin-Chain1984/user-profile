/**
 * Epilepsy Config Settings - Admin-only configuration
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { RestrictedSection } from '@/components/ui/restricted-section';
import { ModuleNotificationsCard } from '@/components/module';
import type { ModuleNotificationSettings } from '@/components/module';
import { useEpilepsyConfig } from '@/hooks/useEpilepsy';
import { FREQUENCY_OPTIONS } from '@/types/epilepsy';
import { Settings, Shield, AlertTriangle, Pill, Link as LinkIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface EpilepsyConfigSettingsProps {
  clientId?: string;
}

export function EpilepsyConfigSettings({ clientId }: EpilepsyConfigSettingsProps) {
  const { config, isLoading, updateConfig, isUpdating } = useEpilepsyConfig(clientId);
  const navigate = useNavigate();
  
  const [enableMonitoring, setEnableMonitoring] = useState(true);
  const [frequency, setFrequency] = useState('unknown');
  const [typicalDuration, setTypicalDuration] = useState('');
  const [rescuePrescribed, setRescuePrescribed] = useState(false);
  const [rescueName, setRescueName] = useState('');
  const [rescueDose, setRescueDose] = useState('');
  const [rescueRoute, setRescueRoute] = useState('');
  const [rescueWhen, setRescueWhen] = useState('');
  const [call000After, setCall000After] = useState(5);
  const [clusterCount, setClusterCount] = useState(2);
  const [clusterHours, setClusterHours] = useState(24);
  const [maxSeizures24h, setMaxSeizures24h] = useState(3);
  const [durationThreshold, setDurationThreshold] = useState(5);
  const [notificationSettings, setNotificationSettings] = useState<ModuleNotificationSettings>({
    enableNotifications: false,
    amberRecipientIds: [],
    redRecipientIds: [],
  });

  useEffect(() => {
    if (config) {
      setEnableMonitoring(config.enable_seizure_monitoring ?? true);
      setFrequency(config.expected_seizure_frequency || 'unknown');
      setTypicalDuration(config.typical_seizure_duration_minutes?.toString() || '');
      setRescuePrescribed(config.rescue_medication_prescribed ?? false);
      setRescueName(config.rescue_medication_name || '');
      setRescueDose(config.rescue_medication_dose || '');
      setRescueRoute(config.rescue_medication_route || '');
      setRescueWhen(config.rescue_medication_when || '');
      setCall000After(config.call_000_after_minutes ?? 5);
      setClusterCount(config.cluster_seizure_count ?? 2);
      setClusterHours(config.cluster_seizure_hours ?? 24);
      setMaxSeizures24h(config.max_seizures_24h ?? 3);
      setDurationThreshold(config.duration_threshold_minutes ?? 5);
    }
  }, [config]);

  const handleSave = () => {
    updateConfig({
      enable_seizure_monitoring: enableMonitoring,
      expected_seizure_frequency: frequency,
      typical_seizure_duration_minutes: typicalDuration ? parseFloat(typicalDuration) : null,
      rescue_medication_prescribed: rescuePrescribed,
      rescue_medication_name: rescuePrescribed ? rescueName : null,
      rescue_medication_dose: rescuePrescribed ? rescueDose : null,
      rescue_medication_route: rescuePrescribed ? rescueRoute : null,
      rescue_medication_when: rescuePrescribed ? rescueWhen : null,
      call_000_after_minutes: call000After,
      cluster_seizure_count: clusterCount,
      cluster_seizure_hours: clusterHours,
      max_seizures_24h: maxSeizures24h,
      duration_threshold_minutes: durationThreshold,
      escalation_recipients: [
        ...notificationSettings.amberRecipientIds,
        ...notificationSettings.redRecipientIds,
      ],
    });
  };

  return (
    <RestrictedSection>
      <div className="space-y-6">
        {/* Enable Toggle */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="h-5 w-5" />
              General Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label className="text-base">Enable Seizure Monitoring</Label>
                <p className="text-sm text-muted-foreground">If disabled, tile hidden from Home and alerts disabled. Historical data preserved.</p>
              </div>
              <Switch checked={enableMonitoring} onCheckedChange={setEnableMonitoring} />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Expected Seizure Frequency</Label>
                <Select value={frequency} onValueChange={setFrequency}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FREQUENCY_OPTIONS.map(f => (
                      <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Typical Seizure Duration (minutes)</Label>
                <Input type="number" value={typicalDuration} onChange={e => setTypicalDuration(e.target.value)} placeholder="Optional baseline" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rescue Medication */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Pill className="h-5 w-5" />
              Rescue Medication
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label className="text-base">Rescue Medication Prescribed?</Label>
                <p className="text-sm text-muted-foreground">Enable to configure emergency seizure medication protocol.</p>
              </div>
              <Switch checked={rescuePrescribed} onCheckedChange={setRescuePrescribed} />
            </div>

            {rescuePrescribed && (
              <div className="grid sm:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                <div>
                  <Label>Medication Name</Label>
                  <Input value={rescueName} onChange={e => setRescueName(e.target.value)} placeholder="e.g., Midazolam" />
                </div>
                <div>
                  <Label>Dose</Label>
                  <Input value={rescueDose} onChange={e => setRescueDose(e.target.value)} placeholder="e.g., 5mg" />
                </div>
                <div>
                  <Label>Route</Label>
                  <Input value={rescueRoute} onChange={e => setRescueRoute(e.target.value)} placeholder="e.g., Buccal / Intranasal" />
                </div>
                <div>
                  <Label>When to Administer</Label>
                  <Input value={rescueWhen} onChange={e => setRescueWhen(e.target.value)} placeholder="e.g., After 5 min continuous seizure" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Escalation Thresholds */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Escalation Thresholds
            </CardTitle>
            <CardDescription>Thresholds that drive Amber/Red alerts.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Max seizures in 24 hours (Red)</Label>
                <Input type="number" min={1} value={maxSeizures24h} onChange={e => setMaxSeizures24h(parseInt(e.target.value) || 3)} />
              </div>
              <div>
                <Label>Duration threshold (minutes, Red)</Label>
                <Input type="number" min={1} value={durationThreshold} onChange={e => setDurationThreshold(parseFloat(e.target.value) || 5)} />
              </div>
              <div>
                <Label>Cluster: seizures within</Label>
                <div className="flex gap-2 items-center">
                  <Input type="number" min={2} value={clusterCount} onChange={e => setClusterCount(parseInt(e.target.value) || 2)} className="w-20" />
                  <span className="text-sm text-muted-foreground">in</span>
                  <Input type="number" min={1} value={clusterHours} onChange={e => setClusterHours(parseInt(e.target.value) || 24)} className="w-20" />
                  <span className="text-sm text-muted-foreground">hours</span>
                </div>
              </div>
              <div>
                <Label>Call 000 after (minutes)</Label>
                <Input type="number" min={1} value={call000After} onChange={e => setCall000After(parseFloat(e.target.value) || 5)} />
              </div>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
              <p><strong>Auto Red alerts:</strong> Any seizure involving injury or requiring emergency support.</p>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <ModuleNotificationsCard
          moduleName="epilepsy"
          moduleDisplayName="Epilepsy & Seizures"
          settings={notificationSettings}
          onSettingsChange={setNotificationSettings}
          clientId={clientId}
        />

        {/* Related Modules */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <LinkIcon className="h-5 w-5" />
              Other Recommended Related Modules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-2">
              {[
                { label: 'Bowel Care', path: '/module/constipation' },
                { label: 'Sleep Chart', path: '/module/sleep' },
                { label: 'Pain Assessment', path: '/module/pain-check' },
                { label: 'Health Monitoring', path: '/module/health-monitoring' },
                { label: 'Fluid Balance', path: '/module/fluid-balance' },
                { label: 'Health Prevention', path: '/module/health-prevention' },
              ].map(mod => (
                <Button key={mod.path} variant="outline" size="sm" className="justify-start" onClick={() => navigate(mod.path)}>
                  {mod.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSave} disabled={isUpdating} className="w-full" size="lg">
          {isUpdating ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </RestrictedSection>
  );
}
