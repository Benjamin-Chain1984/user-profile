
ALTER TABLE public.epilepsy_config
ADD COLUMN known_seizure_types text[] NOT NULL DEFAULT '{}',
ADD COLUMN known_seizure_durations jsonb NOT NULL DEFAULT '{}';
