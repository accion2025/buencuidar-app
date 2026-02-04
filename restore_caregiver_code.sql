-- 🛠️ BuenCuidar - Restauración de caregiver_code
-- 1. Actualizamos el trigger para volver a generar caregiver_code automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insertamos en profiles
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    role, 
    country,
    department,
    municipality
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario Nuevo'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'family'),
    NEW.raw_user_meta_data->>'country',
    NEW.raw_user_meta_data->>'department',
    NEW.raw_user_meta_data->>'municipality'
  );
  
  -- Si el usuario es cuidador, generamos caregiver_code
  IF (NEW.raw_user_meta_data->>'role' = 'caregiver') THEN
    INSERT INTO public.caregiver_details (
      id, 
      caregiver_code, -- <--- RESTORED
      location,
      specialization,
      experience,
      bio
    )
    VALUES (
      NEW.id,
      'BC-' || upper(substr(md5(random()::text), 1, 6)), -- <--- GENERATION LOGIC
      COALESCE(NEW.raw_user_meta_data->>'location', 'Nicaragua'),
      NEW.raw_user_meta_data->>'specialization',
      NULLIF(NEW.raw_user_meta_data->>'experience', '')::numeric,
      NEW.raw_user_meta_data->>'bio'
    )
    ON CONFLICT (id) DO UPDATE SET
      location = EXCLUDED.location,
      specialization = EXCLUDED.specialization,
      experience = EXCLUDED.experience,
      bio = EXCLUDED.bio;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Backfill: Corregimos los registros existentes que tengan caregiver_code nulo
UPDATE public.caregiver_details
SET caregiver_code = 'BC-' || upper(substr(md5(random()::text), 1, 6))
WHERE caregiver_code IS NULL;

-- 3. Verificamos reparación para el usuario afectado
SELECT id, caregiver_code FROM public.caregiver_details 
WHERE id = (SELECT id FROM public.profiles WHERE email = 'gerardo.machado@outlook.com');
