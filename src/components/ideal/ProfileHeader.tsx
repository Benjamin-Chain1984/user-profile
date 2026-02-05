import { useProfile } from '@/contexts/ProfileContext';
import { ProfileAvatar } from './ProfileAvatar';
import { StatusBadge } from './StatusBadge';
import { differenceInYears } from 'date-fns';

export function ProfileHeader() {
  const { profile, globalAlertState, isMonitoringPaused } = useProfile();

  if (!profile) return null;

  const age = differenceInYears(new Date(), new Date(profile.dateOfBirth));

  return (
    <div className="p-4 sm:p-6 bg-card rounded-xl sm:rounded-2xl border border-border shadow-sm">
      <div className="flex items-center gap-3 sm:gap-4">
        <ProfileAvatar 
          name={profile.fullName} 
          avatarUrl={profile.avatarUrl} 
          size="lg" 
        />
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">
            {profile.fullName}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-0.5">
            Age {age}
          </p>
          <div className="mt-2 sm:mt-3">
            <StatusBadge 
              status={globalAlertState.currentStatus} 
              size="md" 
              isPaused={isMonitoringPaused}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
