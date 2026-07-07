
CREATE TABLE public.disease_scans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  crop TEXT,
  disease_name TEXT NOT NULL,
  severity TEXT,
  confidence INTEGER,
  emergency_level TEXT,
  intro TEXT,
  blocks JSONB NOT NULL DEFAULT '[]'::jsonb,
  image_data_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX disease_scans_user_created_idx ON public.disease_scans (user_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.disease_scans TO authenticated;
GRANT ALL ON public.disease_scans TO service_role;

ALTER TABLE public.disease_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own scans"
  ON public.disease_scans FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scans"
  ON public.disease_scans FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scans"
  ON public.disease_scans FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
