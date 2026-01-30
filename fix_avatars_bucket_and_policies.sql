-- 1. Ensure the 'avatars' bucket exists and is public
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

-- 2. Enable RLS on objects (standard security)
alter table storage.objects enable row level security;

-- 3. Drop any existing conflicting policies for 'avatars' to avoid errors
drop policy if exists "Users can upload their own avatar" on storage.objects;
drop policy if exists "Users can update their own avatar" on storage.objects;
drop policy if exists "Public can view avatars" on storage.objects;
drop policy if exists "Avatar images are publicly accessible" on storage.objects;
drop policy if exists "Anyone can upload an avatar" on storage.objects;

-- 4. Create permissive policies for 'avatars'

-- Allow any authenticated user to upload files to a folder named with their User ID
create policy "Users can upload their own avatar"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars' and
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update/overwrite their own files
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

-- Allow public access to view/download avatars
create policy "Public can view avatars"
on storage.objects for select
to public
using ( bucket_id = 'avatars' );
