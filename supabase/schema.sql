-- Run this in Supabase SQL editor (Project > SQL Editor > New query)

create extension if not exists "pgcrypto";

-- Exercise library
create table if not exists exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  muscle_group text,
  video_url text,
  created_at timestamptz default now()
);

-- One row per (goal + equipment) combo produced by lib/planLogic.ts,
-- e.g. "hypertrophy-full-gym", "fatloss-bodyweight"
create table if not exists workout_plans (
  id text primary key,
  name text not null,
  description text
);

-- Exercises assigned to a plan, with sets/reps/day
create table if not exists plan_exercises (
  id uuid primary key default gen_random_uuid(),
  plan_id text references workout_plans(id) on delete cascade,
  exercise_id uuid references exercises(id) on delete cascade,
  day_number int not null default 1,
  sets int not null,
  reps text not null,          -- text to allow "8-12", "AMRAP", etc.
  order_index int not null default 0
);

-- Orders created from the checkout page (VietQR manual-confirm flow)
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_code text unique not null,
  plan_id text not null,
  plan_name text not null,
  amount_vnd int not null,
  status text not null default 'pending_verification', -- pending_verification | paid | rejected
  created_at timestamptz default now()
);

-- Per-order (per "user") completion tracking. Anonymous-session model:
-- swap order_code for a real auth.uid() once Supabase Auth is added.
create table if not exists user_progress (
  id uuid primary key default gen_random_uuid(),
  order_code text not null,
  plan_exercise_id uuid references plan_exercises(id) on delete cascade,
  completed boolean not null default false,
  completed_at timestamptz
);

-- Row Level Security: allow anon key to insert orders + read/write progress,
-- but never let anon flip an order to "paid" (only you, via Table Editor
-- or a service-role key, should do that).
alter table orders enable row level security;
alter table user_progress enable row level security;
alter table workout_plans enable row level security;
alter table plan_exercises enable row level security;
alter table exercises enable row level security;

create policy "anon can insert orders" on orders
  for insert to anon with check (status = 'pending_verification');

create policy "anon can read own order by code" on orders
  for select to anon using (true);

create policy "anon can read plans" on workout_plans for select to anon using (true);
create policy "anon can read plan_exercises" on plan_exercises for select to anon using (true);
create policy "anon can read exercises" on exercises for select to anon using (true);

create policy "anon can read/write own progress" on user_progress
  for all to anon using (true) with check (true);

-- ---------- Seed data: demo plan "hypertrophy-full-gym" ----------
insert into workout_plans (id, name, description) values
  ('hypertrophy-full-gym', 'Gói Tăng Cơ', 'Full-gym hypertrophy plan, 4 buổi/tuần')
  on conflict (id) do nothing;

with e as (
  insert into exercises (name, muscle_group) values
    ('Đẩy tạ đòn ngang', 'Ngực'),
    ('Kéo xà', 'Lưng'),
    ('Squat tạ đòn', 'Chân'),
    ('Đẩy vai tạ đơn', 'Vai'),
    ('Gập bụng cáp', 'Bụng')
  returning id, name
)
insert into plan_exercises (plan_id, exercise_id, day_number, sets, reps, order_index)
select 'hypertrophy-full-gym', e.id, 1, 4, '6-8', 1 from e where e.name = 'Đẩy tạ đòn ngang'
union all
select 'hypertrophy-full-gym', e.id, 1, 4, '6-8', 2 from e where e.name = 'Kéo xà'
union all
select 'hypertrophy-full-gym', e.id, 2, 5, '5', 1 from e where e.name = 'Squat tạ đòn'
union all
select 'hypertrophy-full-gym', e.id, 2, 3, '10-12', 2 from e where e.name = 'Đẩy vai tạ đơn'
union all
select 'hypertrophy-full-gym', e.id, 2, 3, '15', 3 from e where e.name = 'Gập bụng cáp';
