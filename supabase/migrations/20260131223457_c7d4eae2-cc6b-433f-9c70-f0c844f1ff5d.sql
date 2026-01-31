-- Add percentage-based threshold fields to fluid_config
ALTER TABLE public.fluid_config 
ADD COLUMN IF NOT EXISTS dehydration_warning_percent integer NOT NULL DEFAULT 30,
ADD COLUMN IF NOT EXISTS overhydration_warning_percent integer NOT NULL DEFAULT 120,
ADD COLUMN IF NOT EXISTS time_checkpoint_for_warning text NOT NULL DEFAULT '12:00';

-- Add comments for documentation
COMMENT ON COLUMN public.fluid_config.dehydration_warning_percent IS 'Percentage threshold below which Amber status triggers (default 30%)';
COMMENT ON COLUMN public.fluid_config.overhydration_warning_percent IS 'Percentage threshold above which Red status triggers (default 120%)';
COMMENT ON COLUMN public.fluid_config.time_checkpoint_for_warning IS 'Time after which low hydration warnings trigger (default 12:00)';