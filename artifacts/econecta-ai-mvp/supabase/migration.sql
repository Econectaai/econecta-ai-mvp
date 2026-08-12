-- Run this SQL in your Supabase SQL Editor to create the businesses table.
-- Dashboard → SQL Editor → New query → paste → Run

create table if not exists public.businesses (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamp with time zone default now(),
  business_name text not null,
  owner_name  text not null,
  email       text not null,
  phone       text not null,
  city        text not null,
  state       text not null,
  category    text not null
);

-- Enable Row Level Security
alter table public.businesses enable row level security;

-- Allow anyone to insert (public registration form)
create policy "Allow public inserts"
  on public.businesses
  for insert
  to anon
  with check (true);

-- Allow authenticated users to read all rows (optional)
create policy "Allow authenticated reads"
  on public.businesses
  for select
  to authenticated
  using (true);
