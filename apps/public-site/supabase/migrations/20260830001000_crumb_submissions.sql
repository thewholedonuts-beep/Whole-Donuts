create table public.crumb_submissions (
  id uuid primary key default gen_random_uuid(),
  submitted_by uuid not null references auth.users on delete cascade,
  category text not null check (category in ('world', 'library', 'ambassador', 'support')),
  source_url text,
  content text not null check (char_length(content) between 1 and 2000),
  rights_confirmed boolean not null check (rights_confirmed),
  review_status text not null default 'pending' check (review_status in ('pending', 'approved', 'declined')),
  reviewer_note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

alter table public.crumb_submissions enable row level security;

create policy "Members submit their own crumbs"
  on public.crumb_submissions for insert to authenticated
  with check (submitted_by = auth.uid() and review_status = 'pending' and reviewer_note is null);

create policy "Members read their own crumbs"
  on public.crumb_submissions for select to authenticated
  using (submitted_by = auth.uid());

revoke all on public.crumb_submissions from anon;
