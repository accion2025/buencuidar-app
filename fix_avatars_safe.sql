-- 1. Asegurar que el bucket 'avatars' existe y es público
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

-- 2. (Omitido: ALTER TABLE por falta de permisos - RLS ya debería estar activo por defecto)

-- 3. Limpiar políticas antiguas (Si alguna falla, puedes borrar estas líneas)
drop policy if exists "Users can upload their own avatar" on storage.objects;
drop policy if exists "Users can update their own avatar" on storage.objects;
drop policy if exists "Public can view avatars" on storage.objects;

-- 4. Crear políticas permisivas para 'avatars'

-- Permitir SUBIR (Insert) a usuarios autenticados en su propia carpeta
create policy "Users can upload their own avatar"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars' and
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Permitir EDITAR (Update) archivos propios
create policy "Users can update their own avatar"
on storage.objects for update
to authenticated
using (
  bucket_id = 'avatars' and
  (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'avatars' and
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Permitir que CUALQUIERA vea las fotos (Público)
create policy "Public can view avatars"
on storage.objects for select
to public
using ( bucket_id = 'avatars' );
