-- 1. Create Profiles Table (Public Schema)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  updated_at timestamp with time zone DEFAULT now()
);

-- 2. Create Birth Charts Table
CREATE TABLE IF NOT EXISTS public.birth_charts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name_label text NOT NULL,
  birth_date date NOT NULL,
  birth_time time NOT NULL,
  birth_place text,
  lat double precision,
  lon double precision,
  chart_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 3. Automatic Profile Creation Trigger
-- This function inserts a row into public.profiles every time a user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it exists to avoid errors on recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.birth_charts ENABLE ROW LEVEL SECURITY;

-- 5. Profiles Policies (Using DO block to create if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own profile.') THEN
    CREATE POLICY "Users can view their own profile." ON public.profiles FOR SELECT USING (auth.uid() = id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own profile.') THEN
    CREATE POLICY "Users can update their own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);
  END IF;
END $$;

-- 6. Birth Charts Policies
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own charts.') THEN
    CREATE POLICY "Users can view their own charts." ON public.birth_charts FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own charts.') THEN
    CREATE POLICY "Users can insert their own charts." ON public.birth_charts FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own charts.') THEN
    CREATE POLICY "Users can update their own charts." ON public.birth_charts FOR UPDATE USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete their own charts.') THEN
    CREATE POLICY "Users can delete their own charts." ON public.birth_charts FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- 7. Performance Optimization: GIN Index (Optional)
CREATE INDEX IF NOT EXISTS idx_birth_charts_data ON public.birth_charts USING GIN (chart_data);

