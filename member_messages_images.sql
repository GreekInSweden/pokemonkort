-- Run after member_messages.sql.
--
-- Låter ett meddelande ha upp till två bilder -- framsida och baksida av
-- det fysiska kortet -- så köparen faktiskt ser exakt det exemplar de
-- får innan de bestämmer sig, precis som med riktiga korthandlare.
--
-- Egen bucket (INTE card-images) eftersom det här är medlemsuppladdat
-- innehåll, inte adminens egna produktbilder -- lättare att moderera/
-- rensa separat om något olämpligt laddas upp. Ingen publik
-- insert-policy: precis som all annan medlemsskrivning i projektet går
-- uppladdningen genom en API-route med service-role-nyckeln
-- (/api/member/messages/upload-image), eftersom medlemmar inte är
-- Supabase Auth-användare och därför inte kan skriva direkt mot Storage
-- under RLS.

alter table member_messages
  add column if not exists front_image_url text,
  add column if not exists back_image_url text;

insert into storage.buckets (id, name, public)
values ('member-message-images', 'member-message-images', true)
on conflict (id) do nothing;

create policy "Public can view member message images"
  on storage.objects for select
  using (bucket_id = 'member-message-images');

-- Ingen insert/update-policy för webbläsaren -- se kommentaren ovan.

notify pgrst, 'reload schema';
