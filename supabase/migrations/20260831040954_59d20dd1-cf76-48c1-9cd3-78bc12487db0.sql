ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS beacon_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS clients_beacon_id_unique ON public.clients (beacon_id) WHERE beacon_id IS NOT NULL;