-- ============================================================
-- NANG CAP: nhat ky can nang theo tuan
-- Chay 1 lan trong Supabase SQL Editor. An toan chay lai nhieu lan.
-- ============================================================

create table if not exists body_logs (
  id uuid primary key default gen_random_uuid(),
  order_code text not null,
  log_date date not null,
  weight_kg numeric(5,2) not null,
  note text,
  created_at timestamptz default now(),
  unique (order_code, log_date)
);

alter table body_logs enable row level security;

do $$ begin
  create policy "anon can read/write own body_logs" on body_logs
    for all to anon using (true) with check (true);
exception when duplicate_object then null;
end $$;
