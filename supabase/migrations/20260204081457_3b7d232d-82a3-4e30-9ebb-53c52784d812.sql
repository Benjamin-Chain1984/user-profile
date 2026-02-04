-- Add sex column to clients table
ALTER TABLE public.clients 
ADD COLUMN sex TEXT CHECK (sex IN ('male', 'female', 'intersex', 'prefer_not_to_say'));