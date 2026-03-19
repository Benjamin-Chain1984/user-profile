
ALTER TABLE public.bowel_care_config
  ADD COLUMN IF NOT EXISTS amber_no_bm_days_threshold integer NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS red_no_bm_days_threshold integer NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS amber_type1_consecutive_days integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS red_type1_consecutive_days integer NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS amber_diarrhoea_count integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS red_diarrhoea_count integer NOT NULL DEFAULT 3;
