import { useProfile } from '@/contexts/ProfileContext';
import { ProfileAvatar } from './ProfileAvatar';
import { StatusBadge } from './StatusBadge';
import { differenceInYears } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function ProfileHeader() {
  const { profile, globalAlertState, enabledModules } = useProfile();
  const [showQR, setShowQR] = useState(false);

  if (!profile) return null;

  const age = differenceInYears(new Date(), new Date(profile.dateOfBirth));
  
  const qrCodeValue = JSON.stringify({
    type: 'ideal-quick-log',
    profileId: profile.fullName.toLowerCase().replace(/\s+/g, '-'),
    name: profile.fullName,
    enabledModules: enabledModules.filter(m => m.enabled).map(m => m.id),
  });

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
            <StatusBadge status={globalAlertState.currentStatus} size="md" />
          </div>
        </div>
      </div>
      
      {/* QR Code Section */}
      <div className="mt-4 sm:mt-5 pt-4 sm:pt-5 border-t border-border">
        <Button
          variant="outline"
          className="w-full flex items-center justify-center gap-2 py-2.5 sm:py-3 touch-manipulation active:scale-[0.98]"
          onClick={() => setShowQR(!showQR)}
        >
          <QrCode className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          <span className="text-xs sm:text-sm font-medium">
            {showQR ? 'Hide QR Code' : 'Show QR Code for Quick Logging'}
          </span>
        </Button>
        
        {showQR && (
          <div className="mt-3 sm:mt-4 flex flex-col items-center animate-fade-in">
            <div className="p-3 sm:p-4 bg-white rounded-lg sm:rounded-xl shadow-inner border border-border">
              <QRCodeSVG 
                value={qrCodeValue}
                size={180}
                level="M"
                includeMargin={true}
                fgColor="hsl(270, 50%, 40%)"
                className="w-[160px] h-[160px] sm:w-[200px] sm:h-[200px]"
              />
            </div>
            <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-muted-foreground text-center px-4">
              Scan to quickly log data for {profile.fullName}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
