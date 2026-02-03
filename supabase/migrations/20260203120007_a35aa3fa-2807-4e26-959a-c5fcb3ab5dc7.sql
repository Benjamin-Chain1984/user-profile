-- Add profile fields to clients table
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS person_responsible_name TEXT,
ADD COLUMN IF NOT EXISTS relationship_to_individual TEXT,
ADD COLUMN IF NOT EXISTS primary_contact_number TEXT,
ADD COLUMN IF NOT EXISTS secondary_contact TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS created_by TEXT,
ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS edited_by TEXT;

-- Create storage bucket for profile photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for profile photos
CREATE POLICY "Public can view profile photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-photos');

CREATE POLICY "Authenticated users can upload profile photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'profile-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update their profile photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'profile-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete profile photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'profile-photos' AND auth.role() = 'authenticated');