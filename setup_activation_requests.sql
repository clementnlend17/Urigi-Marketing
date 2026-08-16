CREATE TABLE IF NOT EXISTS public.activation_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  user_email TEXT,
  license_key TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS (Row Level Security)
ALTER TABLE public.activation_requests ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir et créer leurs propres requêtes
CREATE POLICY "Users can insert their own requests"
  ON public.activation_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own requests"
  ON public.activation_requests FOR SELECT
  USING (auth.uid() = user_id);

-- L'administrateur peut tout voir et tout modifier
CREATE POLICY "Admin can do everything"
  ON public.activation_requests FOR ALL
  USING (auth.jwt() ->> 'email' = 'freddynlend7@gmail.com');
