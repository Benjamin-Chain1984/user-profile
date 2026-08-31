import { useState, useRef } from 'react';
import { useProfile } from '@/contexts/ProfileContext';
import { useAuth } from '@/contexts/AuthContext';
import { useClientProfile } from '@/hooks/useClientProfile';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ProfileAvatar } from './ProfileAvatar';
import { RoleBadge } from './RoleBadge';
import { RestrictedSection } from '@/components/ui/restricted-section';
import { MyTeam } from '@/components/team/MyTeam';
import { QRPosterSection } from './QRPosterSection';
import { SubscriptionBillingSection } from './SubscriptionBillingSection';
import { NotificationContactsSection } from '@/components/profile';
import { differenceInYears } from 'date-fns';
import { Camera, User, Phone, Users, Lock, Loader2, Save, Watch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import type { IndividualProfile } from '@/types/ideal';

export function ProfileForm() {
  const { profile: contextProfile, setProfile: setContextProfile } = useProfile();
  const { hasRole } = useAuth();
  const { profile: dbProfile, saving, saveProfile, uploadPhoto, loading } = useClientProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [localProfile, setLocalProfile] = useState<IndividualProfile | null>(null);

  const isAdmin = hasRole('admin');

  // Use database profile if available, otherwise fall back to context
  const profile = localProfile || dbProfile || contextProfile;

  if (!profile) {
    if (loading) {
      return (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      );
    }
    return null;
  }

  const age = profile.dateOfBirth ? differenceInYears(new Date(), new Date(profile.dateOfBirth)) : null;

  const handleChange = (field: keyof IndividualProfile, value: string) => {
    if (!isAdmin) return;
    
    const updatedProfile = {
      ...profile,
      [field]: value,
      editedAt: new Date().toISOString(),
      editedBy: 'Current User',
    };
    
    setLocalProfile(updatedProfile);
    setHasChanges(true);
    
    // Also update context for immediate UI feedback
    setContextProfile(updatedProfile);
  };

  const handlePhotoClick = () => {
    if (isAdmin && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploadingPhoto(true);
    try {
      const photoUrl = await uploadPhoto(file);
      if (photoUrl) {
        const updatedProfile = {
          ...profile,
          avatarUrl: photoUrl,
          editedAt: new Date().toISOString(),
        };
        setLocalProfile(updatedProfile);
        setContextProfile(updatedProfile);
        setHasChanges(true);
        toast.success('Photo uploaded successfully');
      }
    } finally {
      setUploadingPhoto(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSave = async () => {
    if (!profile || !hasChanges) return;
    
    const success = await saveProfile(profile);
    if (success) {
      setHasChanges(false);
      setLocalProfile(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Hidden file input for photo upload */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handlePhotoChange}
      />

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
              className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              disabled={!isAdmin || uploadingPhoto}
              onClick={handlePhotoClick}
            >
              {uploadingPhoto ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Camera className="w-5 h-5" />
              )}
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

            <div>
              <Label htmlFor="sex">Sex</Label>
              <select
                id="sex"
                value={profile.sex || ''}
                onChange={(e) => handleChange('sex', e.target.value)}
                className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                disabled={!isAdmin}
              >
                <option value="">Select...</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="intersex">Intersex</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
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
                  {age !== null ? `${age} years` : 'Not set'}
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
        <Button 
          className="w-full" 
          size="lg" 
          onClick={handleSave}
          disabled={saving || !hasChanges}
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              {hasChanges ? 'Save Changes' : 'No Changes'}
            </>
          )}
        </Button>
      )}

      {/* IoT Wearable Device */}
      <Separator className="my-8" />
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Watch className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">IoT Wearable Device</CardTitle>
          </div>
          <CardDescription>
            Connect a wearable device to enable continuous health monitoring
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" disabled>
            <Watch className="w-4 h-4 mr-2" />
            Enable IoT Wearable Device
          </Button>
          <p className="text-xs text-muted-foreground mt-2">Coming soon — wearable integration is under development.</p>
        </CardContent>
      </Card>

      {/* QR & Poster Section */}
      <Separator className="my-8" />
      <QRPosterSection />

      {/* My Team Section - Admin Only */}
      <Separator className="my-8" />
      <MyTeam />

      {/* Notification Contacts Section - Admin Only */}
      <Separator className="my-8" />
      <NotificationContactsSection />

      {/* Subscription & Billing Section - MUST BE LAST */}
      <Separator className="my-8" />
      <SubscriptionBillingSection />
    </div>
  );
}
