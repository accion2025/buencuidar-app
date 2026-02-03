-- 🛠️ BuenCuidar - Actualización de Esquema para Ubicación
-- Ejecuta este script en el SQL EDITOR de Supabase.

-- 1. Añadir columnas de ubicación a la tabla de perfiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS municipality TEXT;

-- 2. Actualizar la función handle_new_user para capturar los metadatos extendidos
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
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
  
  -- Si el usuario es cuidador, también creamos su entrada básica en caregiver_details
  IF (NEW.raw_user_meta_data->>'role' = 'caregiver') THEN
    INSERT INTO public.caregiver_details (id, location)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'location', 'Nicaragua')
    )
    ON CONFLICT (id) DO UPDATE SET
      location = EXCLUDED.location;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Notificación de éxito
DO $$ 
BEGIN 
    RAISE NOTICE 'Esquema actualizado: country, department y municipality añadidos.';
END $$;
