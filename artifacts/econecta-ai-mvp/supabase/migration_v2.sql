-- ============================================================
--  Econecta AI — Migration v2: expand businesses table
--  Run this in Supabase Dashboard → SQL Editor → New query → Run
--  Safe to run on a table that already has data.
--  All new columns are nullable (no default required).
-- ============================================================

alter table public.businesses
  add column if not exists address               text,
  add column if not exists neighborhood          text,
  add column if not exists postal_code           text,
  add column if not exists whatsapp              text,
  add column if not exists instagram             text,
  add column if not exists website               text,
  add column if not exists description           text,
  add column if not exists opening_hours         text,
  add column if not exists promotion_title       text,
  add column if not exists promotion_description text,
  add column if not exists discount_percentage   numeric(5,2),
  add column if not exists promotion_expiration  date;

-- Verify: list all columns after the migration
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name   = 'businesses'
order by ordinal_position;
