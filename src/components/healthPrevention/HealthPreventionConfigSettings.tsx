/**
 * HealthPreventionConfigSettings - Admin settings for Health Prevention module
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RestrictedSection } from '@/components/ui/restricted-section';
import { ModuleNotificationsCard, ModuleNotificationSettings } from '@/components/module/ModuleNotificationsCard';
import { useHealthPrevention } from '@/hooks/useHealthPrevention';
import { useProfile } from '@/contexts/ProfileContext';
import { 
  REMINDER_TEXT_OPTIONS,
  SmokingHistory,
} from '@/types/healthPrevention';
import { Settings, Stethoscope, FileSearch, Syringe, Save } from 'lucide-react';
import { toast } from 'sonner';

export function HealthPreventionConfigSettings() {
  const { config, saveConfig } = useHealthPrevention();
  const { profile } = useProfile();
  
  const [enableCancerScreening, setEnableCancerScreening] = useState(true);
  const [enableVaccinationReminders, setEnableVaccinationReminders] = useState(true);
  const [gpPracticeName, setGpPracticeName] = useState('');
  const [gpContactDetails, setGpContactDetails] = useState('');
  const [reminderText, setReminderText] = useState('Discuss at next GP visit');
  const [customReminderText, setCustomReminderText] = useState('');
  const [isCustomReminder, setIsCustomReminder] = useState(false);
  const [lungSmokingHistory, setLungSmokingHistory] = useState<SmokingHistory | ''>('');
  const [notificationSettings, setNotificationSettings] = useState<ModuleNotificationSettings>({
    enableNotifications: false,
    amberRecipientIds: [],
    redRecipientIds: [],
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize from config
  useEffect(() => {
    if (config) {
      setEnableCancerScreening(config.enableCancerScreening);
      setEnableVaccinationReminders(config.enableVaccinationReminders);
      setGpPracticeName(config.gpPracticeName || '');
      setGpContactDetails(config.gpContactDetails || '');
      setLungSmokingHistory(config.lungScreeningSmokingHistory || '');
      
      // Check if reminder text is custom
      const isPreset = REMINDER_TEXT_OPTIONS.includes(config.reminderText as typeof REMINDER_TEXT_OPTIONS[number]);
      if (isPreset) {
        setReminderText(config.reminderText);
        setIsCustomReminder(false);
      } else {
        setReminderText('custom');
        setCustomReminderText(config.reminderText);
        setIsCustomReminder(true);
      }
    }
  }, [config]);

  const handleSave = async () => {
    setIsSaving(true);
    
    const finalReminderText = isCustomReminder ? customReminderText : reminderText;
    
    await saveConfig({
      enableCancerScreening,
      enableVaccinationReminders,
      gpPracticeName: gpPracticeName || null,
      gpContactDetails: gpContactDetails || null,
      reminderText: finalReminderText,
      lungScreeningSmokingHistory: lungSmokingHistory || null,
    });
    
    setHasChanges(false);
    setIsSaving(false);
  };

  const markChanged = () => setHasChanges(true);

  return (
    <RestrictedSection requiredRole="admin">
      <div className="space-y-6">
        {/* Feature Toggles */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Feature Toggles
            </CardTitle>
            <CardDescription>
              Enable or disable health prevention features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-start gap-3">
                <FileSearch className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <Label className="text-base">Enable Cancer Screening</Label>
                  <p className="text-sm text-muted-foreground">
                    Show cancer screening reminders and tracking
                  </p>
                </div>
              </div>
              <Switch
                checked={enableCancerScreening}
                onCheckedChange={(v) => { setEnableCancerScreening(v); markChanged(); }}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-start gap-3">
                <Syringe className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <Label className="text-base">Enable Vaccination Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Show vaccination tracking and reminders
                  </p>
                </div>
              </div>
              <Switch
                checked={enableVaccinationReminders}
                onCheckedChange={(v) => { setEnableVaccinationReminders(v); markChanged(); }}
              />
            </div>
          </CardContent>
        </Card>

        {/* GP / Health Provider Context */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              GP / Health Provider Context
            </CardTitle>
            <CardDescription>
              Optional details for health provider coordination
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="gpPracticeName">Usual GP / Medical Practice Name</Label>
              <Input
                id="gpPracticeName"
                placeholder="e.g., Main Street Medical Centre"
                value={gpPracticeName}
                onChange={(e) => { setGpPracticeName(e.target.value); markChanged(); }}
              />
            </div>

            <div>
              <Label htmlFor="gpContactDetails">GP Contact Details (optional)</Label>
              <Textarea
                id="gpContactDetails"
                placeholder="Phone, address, or other contact information"
                value={gpContactDetails}
                onChange={(e) => { setGpContactDetails(e.target.value); markChanged(); }}
              />
            </div>

            <div>
              <Label>Preferred Reminder Text</Label>
              <p className="text-sm text-muted-foreground mb-2">
                This text appears on due/overdue items
              </p>
              <Select 
                value={isCustomReminder ? 'custom' : reminderText}
                onValueChange={(v) => {
                  if (v === 'custom') {
                    setIsCustomReminder(true);
                    setReminderText('custom');
                  } else {
                    setIsCustomReminder(false);
                    setReminderText(v);
                  }
                  markChanged();
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REMINDER_TEXT_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">Custom text...</SelectItem>
                </SelectContent>
              </Select>
              
              {isCustomReminder && (
                <Input
                  className="mt-2"
                  placeholder="Enter custom reminder text"
                  value={customReminderText}
                  onChange={(e) => { setCustomReminderText(e.target.value); markChanged(); }}
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Lung Screening Configuration */}
        {enableCancerScreening && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Lung Cancer Screening</CardTitle>
              <CardDescription>
                Advisory setting for lung cancer screening eligibility
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Label>Smoking History</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Used to determine if lung screening discussion is recommended
              </p>
              <RadioGroup 
                value={lungSmokingHistory} 
                onValueChange={(v) => { setLungSmokingHistory(v as SmokingHistory); markChanged(); }}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="smoking-yes" />
                  <Label htmlFor="smoking-yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="smoking-no" />
                  <Label htmlFor="smoking-no">No</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="unsure" id="smoking-unsure" />
                  <Label htmlFor="smoking-unsure">Unsure</Label>
                </div>
              </RadioGroup>
              <p className="text-xs text-muted-foreground mt-2">
                If Yes or Unsure, the module will prompt to discuss with GP.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Notification Settings */}
        <ModuleNotificationsCard
          moduleName="health-prevention"
          moduleDisplayName="Health Prevention"
          settings={notificationSettings}
          onSettingsChange={(settings) => {
            setNotificationSettings(settings);
            markChanged();
          }}
          clientId={profile?.id}
        />

        {/* Save Button */}
        {hasChanges && (
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isSaving} className="gap-2">
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
      </div>
    </RestrictedSection>
  );
}
