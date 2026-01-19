-- ===========================================
-- IDEAL Client Poster QR Quick Access Schema
-- ===========================================

-- 1. Create role enum for user roles
CREATE TYPE public.app_role AS ENUM ('worker', 'team_leader', 'clinician', 'admin');

-- 2. Create profiles table for additional user information
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    verified_phone TEXT, -- E.164 format
    phone_verified_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Create user_roles table (separate from profiles per security requirements)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- 4. Create clients table
CREATE TABLE public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    preferred_name TEXT NOT NULL,
    short_bio TEXT, -- Non-sensitive brief description
    photo_url TEXT,
    poster_qr_token_hash TEXT NOT NULL, -- Store HASH only, never plaintext
    poster_qr_token_created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    poster_qr_token_rotated_at TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Create audit_events table
CREATE TABLE public.audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Nullable for unauthenticated attempts
    action TEXT NOT NULL, -- CLIENT_ACCESS, QR_ROTATE, LOGIN_SUCCESS, LOGIN_FAIL, OTP_SENT, OTP_VERIFY_FAIL
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    metadata_json JSONB DEFAULT '{}'::jsonb -- device, ip, user_agent, route, module_name, etc.
);

-- 6. Create rate_limits table for OTP rate limiting
CREATE TABLE public.rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier TEXT NOT NULL, -- phone number or IP
    action TEXT NOT NULL, -- OTP_SEND, OTP_VERIFY
    attempt_count INTEGER NOT NULL DEFAULT 1,
    first_attempt_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    locked_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (identifier, action)
);

-- 7. Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- 8. Create security definer function to check roles (prevents recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
    )
$$;

-- 9. Create function to check if user has any staff role
CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role IN ('worker', 'team_leader', 'clinician', 'admin')
    )
$$;

-- 10. Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.has_role(_user_id, 'admin')
$$;

-- 11. RLS Policies for profiles
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Staff can view all profiles"
    ON public.profiles FOR SELECT
    USING (public.is_staff(auth.uid()));

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can manage all profiles"
    ON public.profiles FOR ALL
    USING (public.is_admin(auth.uid()));

-- 12. RLS Policies for user_roles (strict - admins only for writes)
CREATE POLICY "Staff can view roles"
    ON public.user_roles FOR SELECT
    USING (public.is_staff(auth.uid()));

CREATE POLICY "Admins can manage roles"
    ON public.user_roles FOR ALL
    USING (public.is_admin(auth.uid()));

-- 13. RLS Policies for clients
CREATE POLICY "Staff can view active clients"
    ON public.clients FOR SELECT
    USING (public.is_staff(auth.uid()));

CREATE POLICY "Admins can manage clients"
    ON public.clients FOR ALL
    USING (public.is_admin(auth.uid()));

-- 14. RLS Policies for audit_events
CREATE POLICY "Staff can view audit events"
    ON public.audit_events FOR SELECT
    USING (public.is_staff(auth.uid()));

CREATE POLICY "Admins can insert audit events"
    ON public.audit_events FOR INSERT
    WITH CHECK (public.is_admin(auth.uid()));

-- Allow service role to insert audit events (for edge functions)
CREATE POLICY "Service role can insert audit events"
    ON public.audit_events FOR INSERT
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- 15. RLS Policies for rate_limits (service role only)
CREATE POLICY "Service role can manage rate limits"
    ON public.rate_limits FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- 16. Create function to log audit events (callable from edge functions)
CREATE OR REPLACE FUNCTION public.log_audit_event(
    p_actor_user_id UUID,
    p_action TEXT,
    p_client_id UUID DEFAULT NULL,
    p_metadata_json JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_event_id UUID;
BEGIN
    INSERT INTO public.audit_events (actor_user_id, action, client_id, metadata_json)
    VALUES (p_actor_user_id, p_action, p_client_id, p_metadata_json)
    RETURNING id INTO v_event_id;
    
    RETURN v_event_id;
END;
$$;

-- 17. Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 18. Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON public.clients
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 19. Create index for faster token lookups
CREATE INDEX idx_clients_token_hash ON public.clients(poster_qr_token_hash);
CREATE INDEX idx_audit_events_timestamp ON public.audit_events(timestamp DESC);
CREATE INDEX idx_audit_events_client ON public.audit_events(client_id);
CREATE INDEX idx_audit_events_actor ON public.audit_events(actor_user_id);
CREATE INDEX idx_rate_limits_identifier ON public.rate_limits(identifier, action);

-- 20. Create function to handle profile creation on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 21. Create trigger for new user profile creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();