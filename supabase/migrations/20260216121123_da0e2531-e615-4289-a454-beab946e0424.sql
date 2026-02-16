
-- Add enhanced stoma check fields
ALTER TABLE public.catheter_stoma_checks
  ADD COLUMN IF NOT EXISTS findings text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS pain_level text DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS dressing_status text DEFAULT 'not_applicable',
  ADD COLUMN IF NOT EXISTS status_level text DEFAULT 'green',
  ADD COLUMN IF NOT EXISTS escalation_type text,
  ADD COLUMN IF NOT EXISTS action_taken text;
