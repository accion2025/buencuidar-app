-- 🔓 BuenCuidar - Relajar Políticas de Avatars (Debug Mode)
-- Ejecuta este script para simplificar las reglas de subida.

-- 1. Eliminar políticas actuales que podrían ser muy estrictas
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated to upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow public to read avatars" ON storage.objects;

-- 2. Crear políticas más permisivas (pero seguras para usuarios autenticados)
-- Permitir INSERTAR a cualquier usuario logueado en el bucket 'avatars'
CREATE POLICY "Debug: Authenticated insert avatars" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'avatars');

-- Permitir ACTUALIZAR a cualquier usuario logueado en el bucket 'avatars'
CREATE POLICY "Debug: Authenticated update avatars" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (bucket_id = 'avatars');

-- Mantener la lectura pública
CREATE POLICY "Debug: Public read avatars" 
ON storage.objects FOR SELECT 
TO public 
USING (bucket_id = 'avatars');

-- 3. Notificación
DO $$ 
BEGIN 
    RAISE NOTICE 'Políticas de avatars relajadas para debug.';
END $$;
