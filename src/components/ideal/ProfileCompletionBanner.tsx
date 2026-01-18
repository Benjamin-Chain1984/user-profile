import { useProfile } from '@/contexts/ProfileContext';
import { CheckCircle, AlertCircle } from 'lucide-react';

export function ProfileCompletionBanner() {
  const { isProfileComplete, profile, enabledModules } = useProfile();

  const activeModulesCount = enabledModules.filter(m => m.enabled).length;

  const missingItems: string[] = [];
  if (!profile?.fullName) missingItems.push('Full name');
  if (!profile?.dateOfBirth) missingItems.push('Date of birth');
  if (!profile?.personResponsibleName) missingItems.push('Person responsible');
  if (!profile?.primaryContactNumber) missingItems.push('Primary contact');
  if (activeModulesCount === 0) missingItems.push('Health modules');

  if (isProfileComplete) {
    return (
      <div className="flex items-center gap-3 p-4 bg-success/10 border border-success/20 rounded-xl">
        <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
        <div>
          <p className="font-medium text-foreground">Profile Complete</p>
          <p className="text-sm text-muted-foreground">Ready for active monitoring</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 p-4 bg-warning/10 border border-warning/20 rounded-xl">
      <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
      <div>
        <p className="font-medium text-foreground">Profile Incomplete</p>
        <p className="text-sm text-muted-foreground">
          Missing: {missingItems.join(', ')}
        </p>
      </div>
    </div>
  );
}
