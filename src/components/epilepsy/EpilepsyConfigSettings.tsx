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
import { FREQUENCY_OPTIONS, SEIZURE_TYPES, SEIZURE_TRIGGERS } from '@/types/epilepsy';
import type { EpilepsyWindowUnit } from '@/types/epilepsy';
import { Checkbox } from '@/components/ui/checkbox';
import { Settings, Shield, AlertTriangle, Pill, Link as LinkIcon, Info, Moon, Thermometer, Activity, Droplets, Heart, Brain, Users } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

interface EpilepsyConfigSettingsProps {
  clientId?: string;
}

export function EpilepsyConfigSettings({ clientId }: EpilepsyConfigSettingsProps) {
  const { config, isLoading, updateConfig, isUpdating } = useEpilepsyConfig(clientId);
  const navigate = useNavigate();
  
  const [enableMonitoring, setEnableMonitoring] = useState(true);
  const [frequency, setFrequency] = useState('unknown');
  
  const [rescuePrescribed, setRescuePrescribed] = useState(false);
  const [rescueName, setRescueName] = useState('');
  const [rescueDose, setRescueDose] = useState('');
  const [rescueRoute, setRescueRoute] = useState('');
  const [rescueWhen, setRescueWhen] = useState('');
  const [call000After, setCall000After] = useState(5);

  // Amber thresholds
  const [amberCount, setAmberCount] = useState(2);
  const [amberWindow, setAmberWindow] = useState(24);
  const [amberUnit, setAmberUnit] = useState<EpilepsyWindowUnit>('hours');

  // Red thresholds
  const [redCount, setRedCount] = useState(3);
  const [redWindow, setRedWindow] = useState(24);
  const [redUnit, setRedUnit] = useState<EpilepsyWindowUnit>('hours');

  // Duration threshold
  const [durationThreshold, setDurationThreshold] = useState(5);

  const [knownSeizureTypes, setKnownSeizureTypes] = useState<string[]>([]);
  const [knownSeizureDurations, setKnownSeizureDurations] = useState<Record<string, string>>({});
  const [knownSeizureTriggers, setKnownSeizureTriggers] = useState<string[]>([]);
  const [knownClusterSeizures, setKnownClusterSeizures] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState<ModuleNotificationSettings>({
    enableNotifications: false,
    amberRecipientIds: [],
    redRecipientIds: [],
  });

  // Validation
  const redWindowMinutes = redUnit === 'minutes' ? redWindow : redWindow * 60;
  const amberWindowMinutes = amberUnit === 'minutes' ? amberWindow : amberWindow * 60;
  const isValidThresholds = redCount > amberCount || (redCount === amberCount && redWindowMinutes < amberWindowMinutes);

  useEffect(() => {
    if (config) {
      setEnableMonitoring(config.enable_seizure_monitoring ?? true);
      setFrequency(config.expected_seizure_frequency || 'unknown');
      setRescuePrescribed(config.rescue_medication_prescribed ?? false);
      setRescueName(config.rescue_medication_name || '');
      setRescueDose(config.rescue_medication_dose || '');
      setRescueRoute(config.rescue_medication_route || '');
      setRescueWhen(config.rescue_medication_when || '');
      setCall000After(config.call_000_after_minutes ?? 5);
      setAmberCount(config.amber_seizure_count ?? 2);
      setAmberWindow(config.amber_seizure_window ?? 24);
      setAmberUnit((config.amber_seizure_window_unit as EpilepsyWindowUnit) ?? 'hours');
      setRedCount(config.red_seizure_count ?? 3);
      setRedWindow(config.red_seizure_window ?? 24);
      setRedUnit((config.red_seizure_window_unit as EpilepsyWindowUnit) ?? 'hours');
      setDurationThreshold(config.duration_threshold_minutes ?? 5);
      setKnownSeizureTypes(config.known_seizure_types || []);
      setKnownSeizureDurations((config.known_seizure_durations as Record<string, string>) || {});
      setKnownSeizureTriggers(config.known_seizure_triggers || []);
      setKnownClusterSeizures(config.known_cluster_seizures ?? false);
    }
  }, [config]);

  const handleSave = () => {
    updateConfig({
      enable_seizure_monitoring: enableMonitoring,
      expected_seizure_frequency: frequency,
      rescue_medication_prescribed: rescuePrescribed,
      rescue_medication_name: rescuePrescribed ? rescueName : null,
      rescue_medication_dose: rescuePrescribed ? rescueDose : null,
      rescue_medication_route: rescuePrescribed ? rescueRoute : null,
      rescue_medication_when: rescuePrescribed ? rescueWhen : null,
      call_000_after_minutes: call000After,
      amber_seizure_count: amberCount,
      amber_seizure_window: amberWindow,
      amber_seizure_window_unit: amberUnit,
      red_seizure_count: redCount,
      red_seizure_window: redWindow,
      red_seizure_window_unit: redUnit,
      duration_threshold_minutes: durationThreshold,
      // Keep legacy fields in sync
      cluster_seizure_count: amberCount,
      cluster_seizure_hours: amberUnit === 'hours' ? amberWindow : Math.ceil(amberWindow / 60),
      max_seizures_24h: redCount,
      known_seizure_types: knownSeizureTypes,
      known_seizure_durations: knownSeizureDurations,
      known_seizure_triggers: knownSeizureTriggers,
      known_cluster_seizures: knownClusterSeizures,
      escalation_recipients: [
        ...notificationSettings.amberRecipientIds,
        ...notificationSettings.redRecipientIds,
      ],
    });
  };

  const allSeizureTypeOptions = Object.entries(SEIZURE_TYPES).flatMap(([category, group]) =>
    group.types.map(t => ({ ...t, category: group.label }))
  );

  const toggleSeizureType = (value: string) => {
    setKnownSeizureTypes(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };

  const toggleTrigger = (value: string) => {
    setKnownSeizureTriggers(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };

  return (
    <RestrictedSection>
      <div className="space-y-6">
        {/* Persistent Note */}
        <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg text-sm text-foreground flex gap-2">
          <Info className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
          <span>Always follow the person's Epilepsy Management Plan.</span>
        </div>

        {/* Who Can Help */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Who can help set up this module?
            </CardTitle>
            <CardDescription>
              The following professionals can assist with configuring seizure monitoring and care plans.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {['GP', 'Nurse', 'Neurologist', 'Other Medical Professional'].map(role => (
                <span key={role} className="px-3 py-1.5 bg-muted rounded-full text-sm font-medium text-foreground">
                  {role}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

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

            <Separator />

            <div>
              <Label className="text-base">Known seizure history</Label>
              <p className="text-sm text-muted-foreground mb-3">Select all seizure types this person is known to experience, and the estimated typical duration for each.</p>
              <div className="space-y-2">
                {allSeizureTypeOptions.map(opt => {
                  const isChecked = knownSeizureTypes.includes(opt.value);
                  return (
                    <div key={opt.value} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id={`seizure-${opt.value}`}
                          checked={isChecked}
                          onCheckedChange={() => toggleSeizureType(opt.value)}
                          className="mt-0.5"
                        />
                        <div className="flex-1">
                          <label htmlFor={`seizure-${opt.value}`} className="text-sm font-medium cursor-pointer">
                            {opt.label}
                            <span className="text-xs text-muted-foreground ml-2">({opt.category})</span>
                          </label>
                          <p className="text-xs text-muted-foreground">{opt.info}</p>
                        </div>
                      </div>
                      {isChecked && (
                        <div className="ml-7">
                          <Label className="text-xs">Estimated Duration</Label>
                          <Input
                            value={knownSeizureDurations[opt.value] || ''}
                            onChange={e => setKnownSeizureDurations(prev => ({ ...prev, [opt.value]: e.target.value }))}
                            placeholder="e.g. 1 – 3 mins"
                            className="h-8 text-sm mt-1"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* Known Cluster Seizures */}
            <div className="space-y-3">
              <Label className="text-base">Does the person have known Cluster Seizures?</Label>
              <ul className="text-sm text-muted-foreground space-y-1 ml-1">
                <li className="flex items-baseline gap-2">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-muted-foreground/60 flex-shrink-0 mt-1.5" />
                  Multiple seizures
                </li>
                <li className="flex items-baseline gap-2">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-muted-foreground/60 flex-shrink-0 mt-1.5" />
                  Close together in time (hours to 1–2 days)
                </li>
                <li className="flex items-baseline gap-2">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-muted-foreground/60 flex-shrink-0 mt-1.5" />
                  Recovery between events
                </li>
                <li className="flex items-baseline gap-2">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-muted-foreground/60 flex-shrink-0 mt-1.5" />
                  Different from status epilepticus (which is prolonged or continuous seizure activity)
                </li>
              </ul>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label className="text-base">Known Cluster Seizures</Label>
                  <p className="text-sm text-muted-foreground">Enable if this person is known to experience cluster seizures.</p>
                </div>
                <Switch checked={knownClusterSeizures} onCheckedChange={setKnownClusterSeizures} />
              </div>
            </div>

            <Separator />

            {/* Known Seizure Triggers */}
            <div>
              <Label className="text-base">Potential seizure triggers</Label>
              <p className="text-sm text-muted-foreground mb-3">Select known triggers for this person. These will be displayed on the tracking page for staff awareness.</p>
              <div className="grid sm:grid-cols-2 gap-2">
                {SEIZURE_TRIGGERS.map(trigger => (
                  <div key={trigger} className="flex items-center gap-2 border rounded-lg p-2.5">
                    <Checkbox
                      id={`trigger-${trigger}`}
                      checked={knownSeizureTriggers.includes(trigger)}
                      onCheckedChange={() => toggleTrigger(trigger)}
                    />
                    <label htmlFor={`trigger-${trigger}`} className="text-sm cursor-pointer">{trigger}</label>
                  </div>
                ))}
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
            <CardDescription>Configure Amber and Red alert triggers. Uses rolling window logic (not calendar day).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Amber Threshold */}
            <div className="p-4 border-l-4 border-warning bg-warning/5 rounded-r-lg space-y-3">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <span className="text-lg">🟠</span> Amber – Monitor
              </h4>
              <p className="text-xs text-muted-foreground">Triggers increased observation and monitoring guidance.</p>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm">Amber if &gt;</span>
                <Input type="number" min={1} value={amberCount} onChange={e => setAmberCount(parseInt(e.target.value) || 1)} className="w-16 h-9" />
                <span className="text-sm">seizures within</span>
                <Input type="number" min={1} value={amberWindow} onChange={e => setAmberWindow(parseInt(e.target.value) || 1)} className="w-16 h-9" />
                <Select value={amberUnit} onValueChange={(v) => setAmberUnit(v as EpilepsyWindowUnit)}>
                  <SelectTrigger className="w-24 h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hours">Hours</SelectItem>
                    <SelectItem value="minutes">Minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="p-2 bg-warning/10 rounded text-xs text-muted-foreground">
                <strong>Staff guidance:</strong> Monitor closely. Increase observation. Seek medical advice if pattern continues.
              </div>
            </div>

            {/* Red Threshold */}
            <div className="p-4 border-l-4 border-destructive bg-destructive/5 rounded-r-lg space-y-3">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <span className="text-lg">🔴</span> Red – Emergency
              </h4>
              <p className="text-xs text-muted-foreground">Triggers PRN medication prompt and escalation documentation.</p>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm">Red if &gt;</span>
                <Input type="number" min={1} value={redCount} onChange={e => setRedCount(parseInt(e.target.value) || 1)} className="w-16 h-9" />
                <span className="text-sm">seizures within</span>
                <Input type="number" min={1} value={redWindow} onChange={e => setRedWindow(parseInt(e.target.value) || 1)} className="w-16 h-9" />
                <Select value={redUnit} onValueChange={(v) => setRedUnit(v as EpilepsyWindowUnit)}>
                  <SelectTrigger className="w-24 h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hours">Hours</SelectItem>
                    <SelectItem value="minutes">Minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {!isValidThresholds && (
                <p className="text-xs text-destructive font-medium flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Red threshold must be greater than Amber threshold.
                </p>
              )}
            </div>

            {/* Duration Threshold */}
            <div className="p-4 border-l-4 border-destructive bg-destructive/5 rounded-r-lg space-y-3">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <span className="text-lg">🔴</span> Prolonged Seizure Duration
              </h4>
              <p className="text-xs text-muted-foreground">Duration threshold overrides frequency rules — immediately triggers Red.</p>
              <div className="flex items-center gap-2">
                <span className="text-sm">Red if seizure lasts ≥</span>
                <Input type="number" min={1} value={durationThreshold} onChange={e => setDurationThreshold(parseFloat(e.target.value) || 5)} className="w-16 h-9" />
                <span className="text-sm">minutes</span>
              </div>
            </div>

            {/* Call 000 */}
            <div className="flex items-center gap-2">
              <Label>Call 000 after</Label>
              <Input type="number" min={1} value={call000After} onChange={e => setCall000After(parseFloat(e.target.value) || 5)} className="w-16 h-9" />
              <span className="text-sm text-muted-foreground">minutes</span>
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
            <CardTitle className="text-lg">Other Recommended Related Modules</CardTitle>
            <CardDescription>
              Comprehensive care involves monitoring multiple aspects of health
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { id: 'bowel', name: 'Bowel Care', description: 'Monitor bowel patterns that may be affected by seizure medications', icon: Activity, path: '/module/constipation' },
                { id: 'sleep', name: 'Sleep Chart', description: 'Track sleep quality — a key seizure trigger', icon: Moon, path: '/module/sleep' },
                { id: 'pain', name: 'Pain Assessment', description: 'Identify post-seizure pain or injury', icon: Thermometer, path: '/module/pain-check' },
                { id: 'health', name: 'Health Monitoring', description: 'Monitor vital signs and general health indicators', icon: Heart, path: '/module/health-monitoring' },
                { id: 'fluid', name: 'Fluid Balance', description: 'Track hydration — dehydration can lower seizure threshold', icon: Droplets, path: '/module/fluid-balance' },
                { id: 'prevention', name: 'Health Prevention', description: 'Proactive health monitoring to catch early warning signs', icon: Brain, path: '/module/health-prevention' },
              ].map(mod => (
                <Link
                  key={mod.id}
                  to={mod.path}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="p-2 rounded-md bg-primary/10">
                    <mod.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{mod.name}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{mod.description}</p>
                  </div>
                </Link>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Always consult a healthcare professional to ensure modules are clinically valid and set according to individual need.
            </p>
          </CardContent>
        </Card>

        <Button onClick={handleSave} disabled={isUpdating || !isValidThresholds} className="w-full" size="lg">
          {isUpdating ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </RestrictedSection>
  );
}
