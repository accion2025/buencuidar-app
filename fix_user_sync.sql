-- 🛠️ BuenCuidar - Reparación de Usuarios y Sincronización Automática
-- Ejecuta este script en el SQL EDITOR de Supabase.

-- 1. Crear la función que sincroniza Auth -> Profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario Nuevo'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'family')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Vincular la función al evento de creación de usuario en Auth
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. REPARACIÓN: Crear perfiles para usuarios que ya existen en Auth pero no en Profiles
INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'full_name', 'Usuario Migrado'),
    COALESCE(raw_user_meta_data->>'role', 'family')
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles);

-- 4. Notificación de éxito
DO $$ 
BEGIN 
    RAISE NOTICE 'Sincronización completada y trigger activado.';
END $$;
