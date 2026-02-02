-- Allow client_id to be nullable to support global altered criteria defaults
ALTER TABLE public.vital_sign_altered_criteria
ALTER COLUMN client_id DROP NOT NULL;

-- Add a comment to clarify the usage
COMMENT ON COLUMN public.vital_sign_altered_criteria.client_id IS 'When NULL, represents global default altered criteria. When set, represents client-specific overrides.';