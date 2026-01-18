import { useProfile } from '@/contexts/ProfileContext';
import { ProfileAvatar } from './ProfileAvatar';
import { StatusBadge } from './StatusBadge';
import { differenceInYears } from 'date-fns';

export function ProfileHeader() {
  const { profile, globalAlertState } = useProfile();

  if (!profile) return null;

  const age = differenceInYears(new Date(), new Date(profile.dateOfBirth));

  return (
    <div className="flex items-center gap-4 p-6 bg-card rounded-2xl border border-border shadow-sm">
      <ProfileAvatar 
        name={profile.fullName} 
        avatarUrl={profile.avatarUrl} 
        size="lg" 
      />
      <div className="flex-1 min-w-0">
        <h1 className="text-2xl font-bold text-foreground truncate">
          {profile.fullName}
        </h1>
        <p className="text-muted-foreground mt-0.5">
          Age {age}
        </p>
        <div className="mt-3">
          <StatusBadge status={globalAlertState.currentStatus} size="md" />
        </div>
      </div>
    </div>
  );
}
