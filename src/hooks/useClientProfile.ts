import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { IndividualProfile } from '@/types/ideal';

interface ClientProfileData {
  id: string;
  preferred_name: string;
  full_name: string | null;
  date_of_birth: string | null;
  photo_url: string | null;
  short_bio: string | null;
  person_responsible_name: string | null;
  relationship_to_individual: string | null;
  primary_contact_number: string | null;
  secondary_contact: string | null;
  email: string | null;
  created_at: string;
  created_by: string | null;
  edited_at: string | null;
  edited_by: string | null;
}

// Convert database format to frontend format
function mapDbToProfile(data: ClientProfileData): IndividualProfile {
  return {
    id: data.id,
    fullName: data.full_name || data.preferred_name || '',
    dateOfBirth: data.date_of_birth || '1990-01-01',
    avatarUrl: data.photo_url || undefined,
    personResponsibleName: data.person_responsible_name || '',
    relationshipToIndividual: data.relationship_to_individual || '',
    primaryContactNumber: data.primary_contact_number || '',
    secondaryContact: data.secondary_contact || undefined,
    email: data.email || undefined,
    createdAt: data.created_at,
    createdBy: data.created_by || 'System',
    editedAt: data.edited_at || undefined,
    editedBy: data.edited_by || undefined,
  };
}

export function useClientProfile(clientId?: string) {
  const [profile, setProfile] = useState<IndividualProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch client profile
  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase.from('clients').select('*');
      
      if (clientId) {
        query = query.eq('id', clientId);
      }
      
      const { data, error: fetchError } = await query.limit(1).maybeSingle();

      if (fetchError) {
        console.error('Error fetching profile:', fetchError);
        setError(fetchError.message);
        return;
      }

      if (data) {
        setProfile(mapDbToProfile(data as unknown as ClientProfileData));
      }
    } catch (err) {
      console.error('Error in fetchProfile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Save profile changes
  const saveProfile = useCallback(async (updatedProfile: IndividualProfile): Promise<boolean> => {
    try {
      setSaving(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      const updateData = {
        full_name: updatedProfile.fullName,
        preferred_name: updatedProfile.fullName, // Keep in sync
        date_of_birth: updatedProfile.dateOfBirth || null,
        photo_url: updatedProfile.avatarUrl || null,
        person_responsible_name: updatedProfile.personResponsibleName || null,
        relationship_to_individual: updatedProfile.relationshipToIndividual || null,
        primary_contact_number: updatedProfile.primaryContactNumber || null,
        secondary_contact: updatedProfile.secondaryContact || null,
        email: updatedProfile.email || null,
        edited_at: new Date().toISOString(),
        edited_by: user?.email || 'Unknown',
        updated_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from('clients')
        .update(updateData)
        .eq('id', updatedProfile.id);

      if (updateError) {
        console.error('Error saving profile:', updateError);
        toast.error('Failed to save profile changes');
        return false;
      }

      setProfile(updatedProfile);
      toast.success('Profile saved successfully');
      return true;
    } catch (err) {
      console.error('Error in saveProfile:', err);
      toast.error('Failed to save profile');
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  // Upload profile photo and save to database immediately
  const uploadPhoto = useCallback(async (file: File): Promise<string | null> => {
    if (!profile) return null;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        console.error('Error uploading photo:', uploadError);
        toast.error('Failed to upload photo');
        return null;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(filePath);

      // Save the photo URL to the database immediately
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error: updateError } = await supabase
        .from('clients')
        .update({
          photo_url: publicUrl,
          edited_at: new Date().toISOString(),
          edited_by: user?.email || 'Unknown',
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (updateError) {
        console.error('Error saving photo URL:', updateError);
        toast.error('Photo uploaded but failed to save to profile');
        return publicUrl; // Still return URL even if save failed
      }

      // Update local state
      setProfile({ ...profile, avatarUrl: publicUrl });

      return publicUrl;
    } catch (err) {
      console.error('Error in uploadPhoto:', err);
      toast.error('Failed to upload photo');
      return null;
    }
  }, [profile]);

  return {
    profile,
    setProfile,
    loading,
    saving,
    error,
    saveProfile,
    uploadPhoto,
    refetch: fetchProfile,
  };
}
