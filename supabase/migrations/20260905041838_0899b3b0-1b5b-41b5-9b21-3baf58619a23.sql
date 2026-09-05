ALTER TABLE public.continence_config
  ADD COLUMN IF NOT EXISTS interval_start_time TEXT NOT NULL DEFAULT '07:00',
  ADD COLUMN IF NOT EXISTS interval_end_time TEXT NOT NULL DEFAULT '22:00';