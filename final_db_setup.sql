-- 🛡️ BuenCuidar - Script de Verificación y Configuración (Versión Corregida)
-- Este script se enfoca en políticas y tablas del usuario para evitar errores de permisos.

-- 1. CONFIGURACIÓN DE STORAGE (BUCKETS)
-- El bucket 'avatars' debe ser público para que las fotos de perfil se vean.
-- El bucket 'documents' debe ser privado.
-- Nota: Si los buckets no existen, créalos desde la interfaz de Supabase Dashboard > Storage.

-- 2. POLÍTICAS PARA 'AVATARS'
-- Borramos políticas anteriores para evitar conflictos
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated to upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow public to read avatars" ON storage.objects;

-- Crear nuevas políticas
CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can update their own avatar" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Public can view avatars" ON storage.objects FOR SELECT TO public USING (bucket_id = 'avatars');

-- 3. POLÍTICAS PARA 'DOCUMENTS'
DROP POLICY IF EXISTS "Allow authenticated to upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to view own documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow admins to view all documents" ON storage.objects;

CREATE POLICY "Allow authenticated to upload documents" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'documents' AND (auth.uid())::text = (storage.foldername(name))[1]);
CREATE POLICY "Allow users to view own documents" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'documents' AND (auth.uid())::text = (storage.foldername(name))[1]);
CREATE POLICY "Allow admins to view all documents" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'documents' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- 4. VERIFICACIÓN DE TABLAS DE USUARIO (caregiver_documents)
-- Aquí sí podemos usar ALTER TABLE porque es una tabla que creamos nosotros.
ALTER TABLE IF EXISTS caregiver_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Caregivers can view their own documents" ON caregiver_documents;
CREATE POLICY "Caregivers can view their own documents" ON caregiver_documents FOR SELECT TO authenticated USING (auth.uid() = caregiver_id);

DROP POLICY IF EXISTS "Caregivers can upload their own documents" ON caregiver_documents;
CREATE POLICY "Caregivers can upload their own documents" ON caregiver_documents FOR INSERT TO authenticated WITH CHECK (auth.uid() = caregiver_id);

DROP POLICY IF EXISTS "Caregivers can update their own documents" ON caregiver_documents;
CREATE POLICY "Caregivers can update their own documents" ON caregiver_documents FOR UPDATE TO authenticated USING (auth.uid() = caregiver_id);

DROP POLICY IF EXISTS "Admins can view all documents" ON caregiver_documents;
CREATE POLICY "Admins can view all documents" ON caregiver_documents FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- 5. PERMISOS GENERALES
GRANT ALL ON caregiver_documents TO authenticated;
GRANT ALL ON caregiver_documents TO service_role;
