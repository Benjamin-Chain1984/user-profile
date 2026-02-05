-- Create profile monitoring status table for pause/resume functionality
CREATE TABLE public.profile_monitoring_status (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL UNIQUE REFERENCES public.clients(id) ON DELETE CASCADE,
    is_paused BOOLEAN NOT NULL DEFAULT false,
    pause_reason TEXT,
    pause_notes TEXT,
    pause_start_datetime TIMESTAMP WITH TIME ZONE,
    pause_end_datetime TIMESTAMP WITH TIME ZONE,
    paused_by_user_id UUID,
    resumed_by_user_id UUID,
    resumed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profile_monitoring_status ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Staff can view monitoring status"
ON public.profile_monitoring_status
FOR SELECT
USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can insert monitoring status"
ON public.profile_monitoring_status
FOR INSERT
WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can update monitoring status"
ON public.profile_monitoring_status
FOR UPDATE
USING (public.is_staff(auth.uid()));

-- Add timestamp trigger
CREATE TRIGGER update_profile_monitoring_status_updated_at
BEFORE UPDATE ON public.profile_monitoring_status
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for immediate UI updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.profile_monitoring_status;

-- Add audit action types for pause/resume
COMMENT ON TABLE public.profile_monitoring_status IS 'Tracks monitoring pause/resume status per client profile';