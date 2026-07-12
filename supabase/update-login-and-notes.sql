-- ============================================================
-- NANG CAP: dang nhap lai tren thiet bi khac (theo so dien thoai)
-- + ghi chu muc ta rieng cho tung khach hang
-- Chay 1 lan trong Supabase SQL Editor. An toan chay lai nhieu lan.
-- ============================================================

-- So dien thoai dung de tra cuu lai don hang tren thiet bi moi
alter table orders add column if not exists phone text;
create index if not exists orders_phone_idx on orders (phone);

-- Ghi chu muc ta (vd "20kg", "2 x 15kg tay") rieng cho tung don hang
-- (order_code dong vai tro dinh danh khach hang trong he thong hien tai)
alter table user_progress add column if not exists weight_note text;
