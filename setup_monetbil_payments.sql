-- Table pour suivre les intentions de paiement Monetbil
CREATE TABLE IF NOT EXISTS public.payment_intents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    payment_ref TEXT UNIQUE NOT NULL,
    plan_tier TEXT NOT NULL,
    amount INTEGER NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Désactivation RLS car cette table est uniquement gérée par le backend de façon sécurisée (Webhooks)
ALTER TABLE public.payment_intents DISABLE ROW LEVEL SECURITY;
