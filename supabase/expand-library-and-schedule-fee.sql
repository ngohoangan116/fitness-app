-- Chạy sau schema.sql. Bổ sung:
--  1) Metadata phong phú cho bảng exercises (để nhập kho bài tập lớn từ
--     scripts/seed-exercise-library.mjs thay vì chỉ vài bài mẫu).
--  2) plan_exercises.rest_seconds / role (dashboard đã dùng 2 cột này,
--     file schema.sql gốc chưa có — thêm cho khớp).
--  3) Cơ chế "đổi lịch tập" có phí nếu đổi trước 8 tuần kể từ lần bắt
--     đầu / lần đổi gần nhất.

-- ---------- 1) Kho bài tập: thêm cột mô tả từ free-exercise-db ----------
alter table exercises add column if not exists equipment text;
alter table exercises add column if not exists category text;
alter table exercises add column if not exists force text;
alter table exercises add column if not exists mechanic text;
alter table exercises add column if not exists level text;
alter table exercises add column if not exists primary_muscle text;
alter table exercises add column if not exists secondary_muscles text[];
alter table exercises add column if not exists instructions text[];
alter table exercises add column if not exists image_url text;
alter table exercises add column if not exists source text default 'manual';

-- Cần unique theo tên để script seed có thể upsert (chạy lại không tạo trùng).
create unique index if not exists exercises_name_key on exercises (name);

-- ---------- 2) plan_exercises: rest_seconds + role ----------
alter table plan_exercises add column if not exists rest_seconds int not null default 60;
alter table plan_exercises add column if not exists role text not null default 'main';
-- role: 'main' | 'accessory' | 'cardio' (đúng như ROLE_LABEL trong dashboard)

-- workout_plans: mô tả + ghi chú huấn luyện hiển thị trên dashboard
alter table workout_plans add column if not exists description text;
alter table workout_plans add column if not exists coaching_notes text;

-- ---------- 3) Đổi lịch tập mỗi 8 tuần — miễn phí; đổi sớm hơn thì tính phí ----------
alter table orders add column if not exists order_type text not null default 'purchase';
-- order_type: 'purchase' (đơn mua gói ban đầu) | 'schedule_change' (đơn trả phí đổi lịch sớm)

alter table orders add column if not exists plan_updated_at timestamptz;
update orders set plan_updated_at = created_at where plan_updated_at is null;
alter table orders alter column plan_updated_at set default now();

-- Với đơn 'schedule_change', target_order_code trỏ tới đơn gốc (đơn 'purchase')
-- cần được cập nhật plan_id sau khi đơn đổi lịch này được duyệt (paid).
alter table orders add column if not exists target_order_code text;
alter table orders add column if not exists new_plan_id text;
alter table orders add column if not exists new_plan_name text;

-- Lưu ý: không cần thêm policy UPDATE cho anon — việc duyệt đơn và áp dụng
-- đổi lịch chỉ chạy qua app/api/admin/approve/route.ts bằng Service Role
-- key (server-side), key này bỏ qua RLS nên không bị chặn bởi các policy
-- SELECT/INSERT hiện có.
