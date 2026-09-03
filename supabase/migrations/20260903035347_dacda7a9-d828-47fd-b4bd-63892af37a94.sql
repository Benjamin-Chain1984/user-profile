CREATE UNIQUE INDEX IF NOT EXISTS clients_poster_qr_token_hash_unique
ON public.clients (poster_qr_token_hash)
WHERE poster_qr_token_hash IS NOT NULL;