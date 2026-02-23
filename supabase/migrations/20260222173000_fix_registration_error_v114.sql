-- 🛠️ BuenCuidar - Fix Registro V1.1 (V1.0.115)
-- Añade columna trial_expiry_date, actualiza el trigger de registro y expande restricciones de suscripción.

-- 1. Añadir la columna faltante a profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS trial_expiry_date TEXT;

-- 2. Corregir restricciones de la tabla subscriptions para permitir planes del piloto
DO $$
BEGIN
    -- Eliminar restricciones antiguas de plan_type
    ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_type_check;
    
    -- Añadir nueva restricción con los tipos de plan requeridos
    ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_plan_type_check 
    CHECK (plan_type IN ('basic', 'premium', 'pulso', 'monthly', 'free'));

    -- Eliminar restricciones antiguas de status
    ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_status_check;
    
    -- Añadir nueva restricción de estatus
    ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_status_check 
    CHECK (status IN ('active', 'past_due', 'canceled', 'incomplete', 'trialing'));
END $$;

-- 3. Actualizar la función handle_new_user para capturar trial_expiry_date y manejar el registro atómico
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
