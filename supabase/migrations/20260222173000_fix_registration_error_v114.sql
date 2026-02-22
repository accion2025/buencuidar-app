-- 🛠️ BuenCuidar - Fix Registro V1.0.114
-- Añade columna trial_expiry_date y actualiza el trigger de registro para el Programa Piloto.

-- 1. Añadir la columna faltante a profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS trial_expiry_date TEXT;

-- 2. Actualizar la función handle_new_user para capturar trial_expiry_date
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insertamos en profiles (datos básicos + rol + ubicación + fecha trial)
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    role, 
    country,
    department,
    municipality,
    phone,
    trial_expiry_date
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario Nuevo'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'family'),
    NEW.raw_user_meta_data->>'country',
    NEW.raw_user_meta_data->>'department',
    NEW.raw_user_meta_data->>'municipality',
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'trial_expiry_date'
  );
  
  -- Si el usuario es cuidador, poblamos caregiver_details
  IF (NEW.raw_user_meta_data->>'role' = 'caregiver') THEN
    INSERT INTO public.caregiver_details (
      id, 
      location,
      specialization,
      experience,
      bio
    )
    VALUES (
      NEW.id,
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

-- Comentario para trazabilidad
COMMENT ON COLUMN public.profiles.trial_expiry_date IS 'Fecha de vencimiento del acceso de cortesía (Programa Piloto V1.1)';
