ALTER TABLE public.fluid_config
  ADD COLUMN IF NOT EXISTS enable_balance_thresholds boolean NOT NULL DEFAULT true;