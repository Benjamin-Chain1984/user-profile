
ALTER TABLE public.continence_config
ADD COLUMN skin_check_frequency text NOT NULL DEFAULT 'every_pad_change';
-- Valid values: 'daily', 'twice_daily', 'three_times_daily', 'every_pad_change'

COMMENT ON COLUMN public.continence_config.skin_check_frequency IS 'How often skin checks should be completed: daily, twice_daily, three_times_daily, every_pad_change';
