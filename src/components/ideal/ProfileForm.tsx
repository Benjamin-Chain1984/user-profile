import { useProfile } from '@/contexts/ProfileContext';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ProfileAvatar } from './ProfileAvatar';
import { RoleBadge } from './RoleBadge';
import { RestrictedSection } from '@/components/ui/restricted-section';
import { MyTeam } from '@/components/team/MyTeam';
import { differenceInYears } from 'date-fns';
import { Camera, User, Phone, Users, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export function ProfileForm() {
  const { profile, setProfile } = useProfile();
  const { hasRole } = useAuth();

  const isAdmin = hasRole('admin');

  if (!profile) return null;

  const age = differenceInYears(new Date(), new Date(profile.dateOfBirth));

  const handleChange = (field: string, value: string) => {
    if (!isAdmin) return; // Prevent changes for non-admins
    setProfile({
      ...profile,
      [field]: value,
      editedAt: new Date().toISOString(),
      editedBy: 'Current User', // Would come from auth context
    });
  };

  return (
    <div className="space-y-8">
      {/* Role Display */}
      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-border">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Your Role</span>
        </div>
        <RoleBadge />
      </div>

      {/* Avatar Section */}
      <RestrictedSection requiredRole="admin" message="Admin access required to edit profile">
        <div className="flex flex-col items-center gap-4 pb-6 border-b border-border">
          <div className="relative">
            <ProfileAvatar name={profile.fullName} avatarUrl={profile.avatarUrl} size="xl" />
            <button 
              className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-colors"
              disabled={!isAdmin}
            >
              <Camera className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-muted-foreground">
            {isAdmin ? 'Tap to update photo' : 'Photo changes require admin access'}
          </p>
        </div>
      </RestrictedSection>

      {/* Identity Section */}
      <RestrictedSection requiredRole="admin" message="Admin access required to edit identity details">
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Identity & Core Details</h3>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={profile.fullName}
                onChange={(e) => handleChange('fullName', e.target.value)}
                className="mt-1.5"
                disabled={!isAdmin}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dob">Date of Birth</Label>
                <Input
                  id="dob"
                  type="date"
                  value={profile.dateOfBirth}
                  onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                  className="mt-1.5"
                  disabled={!isAdmin}
                />
              </div>
              <div>
                <Label>Age</Label>
                <div className="mt-1.5 h-10 px-3 flex items-center bg-muted rounded-md text-muted-foreground">
                  {age} years
                </div>
              </div>
            </div>
          </div>
        </div>
      </RestrictedSection>

      {/* Person Responsible Section */}
      <RestrictedSection requiredRole="admin" message="Admin access required to edit emergency contacts">
        <div className="space-y-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Person Responsible / Emergency Contact</h3>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="responsibleName">Name</Label>
              <Input
                id="responsibleName"
                value={profile.personResponsibleName}
                onChange={(e) => handleChange('personResponsibleName', e.target.value)}
                className="mt-1.5"
                disabled={!isAdmin}
              />
            </div>

            <div>
              <Label htmlFor="relationship">Relationship to Individual</Label>
              <Input
                id="relationship"
                value={profile.relationshipToIndividual}
                onChange={(e) => handleChange('relationshipToIndividual', e.target.value)}
                placeholder="e.g., Spouse, Parent, Carer"
                className="mt-1.5"
                disabled={!isAdmin}
              />
            </div>
          </div>
        </div>
      </RestrictedSection>

      {/* Contact Details */}
      <RestrictedSection requiredRole="admin" message="Admin access required to edit contact details">
        <div className="space-y-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2 mb-4">
            <Phone className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Contact Details</h3>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="primaryPhone">Primary Contact Number</Label>
              <Input
                id="primaryPhone"
                type="tel"
                value={profile.primaryContactNumber}
                onChange={(e) => handleChange('primaryContactNumber', e.target.value)}
                className="mt-1.5"
                disabled={!isAdmin}
              />
            </div>

            <div>
              <Label htmlFor="secondaryPhone">Secondary Contact (Optional)</Label>
              <Input
                id="secondaryPhone"
                type="tel"
                value={profile.secondaryContact || ''}
                onChange={(e) => handleChange('secondaryContact', e.target.value)}
                className="mt-1.5"
                disabled={!isAdmin}
              />
            </div>

            <div>
              <Label htmlFor="email">Email (Optional)</Label>
              <Input
                id="email"
                type="email"
                value={profile.email || ''}
                onChange={(e) => handleChange('email', e.target.value)}
                className="mt-1.5"
                disabled={!isAdmin}
              />
            </div>
          </div>
        </div>
      </RestrictedSection>

      {/* Audit Trail */}
      <div className="pt-4 border-t border-border">
        <div className="p-4 bg-muted/50 rounded-xl text-sm text-muted-foreground space-y-1">
          <p><strong>Created:</strong> {new Date(profile.createdAt).toLocaleDateString()} by {profile.createdBy}</p>
          {profile.editedAt && (
            <p><strong>Last edited:</strong> {new Date(profile.editedAt).toLocaleDateString()} by {profile.editedBy}</p>
          )}
        </div>
      </div>

      {isAdmin && (
        <Button className="w-full" size="lg">
          Save Changes
        </Button>
      )}

      {/* My Team Section - Admin Only */}
      <Separator className="my-8" />
      <MyTeam />
    </div>
  );
}
