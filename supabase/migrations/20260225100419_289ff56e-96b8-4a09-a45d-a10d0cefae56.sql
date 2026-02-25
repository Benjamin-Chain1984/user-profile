ALTER TABLE public.epilepsy_config
  ADD COLUMN IF NOT EXISTS known_seizure_triggers text[] NOT NULL DEFAULT '{}'::text[];