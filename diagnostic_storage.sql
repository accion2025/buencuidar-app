-- 🔍 DIAGNÓSTICO DE STORAGE (Versión Robusta)
-- Ejecuta esto en el SQL Editor de Supabase.

-- 1. Ver si los Buckets existen
SELECT name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets;

-- 2. Ver todas las políticas de Storage (sin filtrar nombres de columnas)
SELECT * 
FROM pg_policies 
WHERE schemaname = 'storage';

-- 3. Ver si RLS está activo en objetos
SELECT relname, relrowsecurity 
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'storage' AND relname = 'objects';
