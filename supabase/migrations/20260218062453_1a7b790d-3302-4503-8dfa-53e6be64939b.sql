ALTER TABLE public.iddsi_config
  ADD COLUMN IF NOT EXISTS target_safe_angle integer DEFAULT 80;