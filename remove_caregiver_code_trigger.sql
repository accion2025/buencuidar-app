-- 🛠️ BuenCuidar - Eliminación de caregiver_code en el Registro
-- Ejecuta este script en el SQL EDITOR de Supabase para actualizar el trigger.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insertamos en profiles (datos básicos + rol + ubicación)
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
  
  -- Si el usuario es cuidador, poblamos caregiver_details SIN caregiver_code
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

-- Comentario informativo
COMMENT ON FUNCTION public.handle_new_user() IS 'Trigger actualizado para eliminar la generación automática de caregiver_code.';
