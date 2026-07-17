-- ============================================================
-- ABIDE — QT Mentorship App · Supabase schema
-- Run this whole file once in: Supabase Dashboard -> SQL Editor
-- ============================================================

-- ---------- PROFILES (one row per user) ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  role text not null default 'mentee' check (role in ('mentee', 'admin')),
  created_at timestamptz not null default now()
);

-- Auto-create a profile whenever someone signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper: is the signed-in user an admin?
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- ---------- QT UPLOADS ----------
create table if not exists public.qt_uploads (
  id uuid primary key default gen_random_uuid(),
  mentee_id uuid not null references public.profiles (id) on delete cascade,
  qt_date date not null default current_date,
  pages text[] not null,                       -- storage paths in the qt-pages bucket
  note text not null default '',
  status text not null default 'pending' check (status in ('pending', 'reviewed')),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (mentee_id, qt_date)                  -- one QT per day per mentee
);

-- ---------- SONGS (admin sends, everyone reads) ----------
create table if not exists public.songs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  lyrics text not null,
  created_at timestamptz not null default now()
);

-- ---------- PAYMENTS ----------
-- Anonymity by design: anonymous gifts store NO name and NO user id.
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  giver_name text,                             -- null = anonymous
  amount numeric not null check (amount > 0),
  paid_on date not null default current_date,
  created_at timestamptz not null default now()
);

-- ---------- PRAYER / PRAISE POINTS ----------
create table if not exists public.prayers (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  type text not null check (type in ('prayer', 'praise')),
  content text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- MONTHLY PRAYER LETTER ----------
create table if not exists public.prayer_letters (
  id uuid primary key default gen_random_uuid(),
  month text not null unique,                  -- e.g. '2026-07'
  content text not null,
  updated_at timestamptz not null default now()
);

-- ---------- LITERATURE (poetry / reflections / stories) ----------
create table if not exists public.literature (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  type text not null check (type in ('Poetry', 'Reflection', 'Story')),
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.literature_likes (
  post_id uuid not null references public.literature (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  primary key (post_id, user_id)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles         enable row level security;
alter table public.qt_uploads       enable row level security;
alter table public.songs            enable row level security;
alter table public.payments         enable row level security;
alter table public.prayers          enable row level security;
alter table public.prayer_letters   enable row level security;
alter table public.literature       enable row level security;
alter table public.literature_likes enable row level security;

-- profiles: readable by any signed-in user (names on posts), users edit own name only
create policy "profiles readable" on public.profiles
  for select to authenticated using (true);
create policy "update own profile" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
revoke update on public.profiles from authenticated;
grant update (name) on public.profiles to authenticated;

-- qt_uploads: mentee inserts own (always pending), reads own; admin reads all + marks reviewed
create policy "mentee inserts own QT" on public.qt_uploads
  for insert to authenticated with check (mentee_id = auth.uid() and status = 'pending');
create policy "read own QT or admin" on public.qt_uploads
  for select to authenticated using (mentee_id = auth.uid() or public.is_admin());
create policy "admin reviews QT" on public.qt_uploads
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- songs: everyone reads, only admin writes
create policy "songs readable" on public.songs
  for select to authenticated using (true);
create policy "admin adds songs" on public.songs
  for insert to authenticated with check (public.is_admin());
create policy "admin edits songs" on public.songs
  for update to authenticated using (public.is_admin());
create policy "admin deletes songs" on public.songs
  for delete to authenticated using (public.is_admin());

-- payments: anyone signed in can record a gift; only admin can read the list
create policy "record a gift" on public.payments
  for insert to authenticated with check (amount > 0);
create policy "admin reads gifts" on public.payments
  for select to authenticated using (public.is_admin());

-- prayers: authors insert own; author or admin reads; admin marks read
create policy "send own prayer" on public.prayers
  for insert to authenticated with check (author_id = auth.uid());
create policy "read own prayers or admin" on public.prayers
  for select to authenticated using (author_id = auth.uid() or public.is_admin());
create policy "admin marks prayers read" on public.prayers
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- prayer_letters: everyone reads, only admin publishes
create policy "letters readable" on public.prayer_letters
  for select to authenticated using (true);
create policy "admin inserts letter" on public.prayer_letters
  for insert to authenticated with check (public.is_admin());
create policy "admin updates letter" on public.prayer_letters
  for update to authenticated using (public.is_admin());

-- literature: everyone reads; authors post; author or admin deletes
create policy "literature readable" on public.literature
  for select to authenticated using (true);
create policy "share own writing" on public.literature
  for insert to authenticated with check (author_id = auth.uid());
create policy "author or admin deletes" on public.literature
  for delete to authenticated using (author_id = auth.uid() or public.is_admin());

-- likes
create policy "likes readable" on public.literature_likes
  for select to authenticated using (true);
create policy "like as yourself" on public.literature_likes
  for insert to authenticated with check (user_id = auth.uid());
create policy "unlike as yourself" on public.literature_likes
  for delete to authenticated using (user_id = auth.uid());

-- ============================================================
-- STORAGE — private bucket for QT page photos
-- Files are stored under {user_id}/... and served via signed URLs
-- ============================================================
insert into storage.buckets (id, name, public)
values ('qt-pages', 'qt-pages', false)
on conflict (id) do nothing;

create policy "mentees upload own pages" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'qt-pages' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "read own pages or admin" on storage.objects
  for select to authenticated
  using (bucket_id = 'qt-pages' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

-- ============================================================
-- REALTIME — lets the admin get pinged the moment things arrive
-- ============================================================
alter publication supabase_realtime add table public.prayers;
alter publication supabase_realtime add table public.qt_uploads;

-- ============================================================
-- STARTER CONTENT (safe to edit or delete later)
-- ============================================================
insert into public.songs (title, lyrics) values
('Morning Mercies', $$New every morning, sure as the light,
Mercy comes looking for me.
Before I have spoken, before I am right,
Grace is already set free.

So I will rise with the sun and sing,
Faithful through every season —
Great is Your love over everything,
You are my song and my reason.$$),
('Lamp to My Feet', $$When the road bends dark and I cannot see,
Your word is a lamp to my feet.
One step is enough, You are leading me,
Your promise and my path meet.

Shine on, shine on, through the longest night,
Every letter burning true —
I will walk by faith and not by sight,
For the light I need is You.$$),
('Nearer Still', $$Draw me nearer, nearer still,
Past my hurry, past my will,
To the quiet where You speak —
You're the treasure that I seek.$$);

insert into public.prayer_letters (month, content) values
(to_char(now(), 'YYYY-MM'), $$PRAYER LETTER

Dear family,

Grace and peace to each of you! What a joy it is to read your QT pages — keep bringing your honest hearts to the Word every morning.

GIVE THANKS
· For every mentee building a daily habit in the Word.
· For God's provision for our little family.

PLEASE PRAY
· For consistency — that our quiet times become quiet lives of prayer.
· For those writing exams and starting new jobs this month.

"In the morning, O LORD, You hear my voice." — Psalm 5:3$$)
on conflict (month) do nothing;

-- ============================================================
-- MAKE YOURSELF ADMIN (run AFTER you sign up in the app)
-- Replace the email below with the one you signed up with:
-- ============================================================
-- update public.profiles set role = 'admin'
--   where id = (select id from auth.users where email = 'you@example.com');
