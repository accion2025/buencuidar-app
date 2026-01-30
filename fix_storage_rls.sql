-- Enable RLS just in case
alter table storage.objects enable row level security;

-- Policy to allow authenticated users to upload their own avatar
-- Path convention: user_id/filename.ext
create policy "Users can upload their own avatar"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars' and
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy to allow updates (overwrite)
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

-- Policy to allow public read (already set bucket public, but RLS might need this too if "public" flag is weird)
create policy "Public can view avatars"
on storage.objects for select
to public
using ( bucket_id = 'avatars' );
