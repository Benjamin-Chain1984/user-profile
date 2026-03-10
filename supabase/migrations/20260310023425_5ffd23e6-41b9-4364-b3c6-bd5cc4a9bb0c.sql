
ALTER TABLE public.abbey_pain_config
  ADD COLUMN mild_actions text[] NOT NULL DEFAULT ARRAY['reposition', 'recheck_pain']::text[],
  ADD COLUMN moderate_actions text[] NOT NULL DEFAULT ARRAY['administer_pain_relief', 'recheck_pain', 'contact_gp']::text[],
  ADD COLUMN severe_actions text[] NOT NULL DEFAULT ARRAY['administer_pain_relief', 'contact_gp', 'call_ambulance']::text[],
  ADD COLUMN mild_custom_actions text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN moderate_custom_actions text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN severe_custom_actions text[] NOT NULL DEFAULT '{}'::text[];
