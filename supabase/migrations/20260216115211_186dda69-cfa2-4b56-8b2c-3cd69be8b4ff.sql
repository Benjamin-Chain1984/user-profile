
-- =============================================
-- Catheter Bag Config: per-bag-type stock tracking
-- =============================================
CREATE TABLE public.catheter_bag_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id),
  bag_type TEXT NOT NULL,
  stock_level INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 5,
  change_frequency TEXT NULL, -- 'daily', 'every_x_days', 'prn'
  change_frequency_days INTEGER NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID NULL,
  UNIQUE(client_id, bag_type)
);

ALTER TABLE public.catheter_bag_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view catheter bag config"
  ON public.catheter_bag_config FOR SELECT
  USING (public.is_staff(auth.uid()));

CREATE POLICY "Admins can insert catheter bag config"
  ON public.catheter_bag_config FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update catheter bag config"
  ON public.catheter_bag_config FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete catheter bag config"
  ON public.catheter_bag_config FOR DELETE
  USING (public.is_admin(auth.uid()));

CREATE TRIGGER update_catheter_bag_config_updated_at
  BEFORE UPDATE ON public.catheter_bag_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- Add new columns to catheter_bag_change_logs
-- =============================================
ALTER TABLE public.catheter_bag_change_logs
  ADD COLUMN IF NOT EXISTS condition TEXT NULL,
  ADD COLUMN IF NOT EXISTS tubing_changed BOOLEAN NOT NULL DEFAULT false;

-- =============================================
-- Enable bag tracking toggle in catheter_config  
-- =============================================
ALTER TABLE public.catheter_config
  ADD COLUMN IF NOT EXISTS enable_bag_tracking BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS frequent_change_threshold INTEGER NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS frequent_change_window_hours INTEGER NULL DEFAULT 48;
