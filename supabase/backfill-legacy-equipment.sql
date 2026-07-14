-- ============================================================
-- SUA LOI: bai tap "tạ đơn/cáp/máy/tạ đòn" bi lot vao goi "khong dung cu"
-- (BAN NANG CAP: dung TU KHOA trong ten thay vi ten day du, vi ten cac
-- bai cu da bi doi hau tu o 1 buoc xu ly khac -> ban khop-ten-chinh-xac
-- truoc do khong con bat dung nua)
--
-- Chi dong vao cac dong dang equipment = NULL/rong — khong dung vao du
-- lieu da co san cua kho bai moi (free-exercise-db), vi kho do luon co
-- equipment tieng Anh (dumbbell/barbell/cable/machine/body only...) roi.
--
-- An toan chay lai nhieu lan. Sau khi chay xong, PHAI chay lai:
--   node scripts/generate-plan-exercises.mjs
-- ============================================================

-- Tạ đơn (dumbbell) — chỉ cần chữ "tạ đơn" xuất hiện ở đâu trong tên
update exercises set equipment = 'dumbbell'
where (equipment is null or equipment = '') and name ilike '%tạ đơn%';

-- Tạ đòn (barbell)
update exercises set equipment = 'barbell'
where (equipment is null or equipment = '') and name ilike '%tạ đòn%';

-- Cáp kéo (cable)
update exercises set equipment = 'cable'
where (equipment is null or equipment = '') and name ilike '%cáp%';

-- Máy tập / Leg press (machine)
update exercises set equipment = 'machine'
where (equipment is null or equipment = '') and (name ilike '%máy%' or name = 'Leg press');

-- Dây kháng lực (bands)
update exercises set equipment = 'bands'
where (equipment is null or equipment = '') and name ilike '%kháng lực%';

-- Xà đơn (cần thiết bị, không tính body-only thuần)
update exercises set equipment = 'other'
where (equipment is null or equipment = '') and name ilike '%xà%';

-- Các bài body-only còn lại — dò theo TỪ GỐC đầu câu, không phụ thuộc
-- hậu tố phía sau (vd "Hít đất%" bắt được cả "Hít đất", "Hít đất kim
-- cương (...)", "Hít đất chân nâng cao" dù hậu tố đổi thế nào).
update exercises set equipment = 'body only'
where (equipment is null or equipment = '') and (
  name ilike 'Squat không tạ%' or name ilike 'Lunge tại chỗ%' or
  name ilike 'Bước lên bậc%' or name ilike 'Đứng lên ngồi xuống ghế%' or
  name ilike 'Nhảy bật gối cao%' or name ilike 'Hít đất%' or
  name ilike 'Superman%' or name ilike 'Bơi ếch%' or
  name ilike 'Đẩy hông cầu%' or name ilike 'Plank%' or
  name = 'Gập bụng' or name ilike 'Leo núi%' or
  name = 'Burpee' or name ilike 'Nhảy dây%' or
  name ilike 'Nâng cao đùi%'
);

-- Đánh dấu lại category='cardio' cho các bài cardio cũ (khớp từ khoá,
-- khong phu thuoc ten day du)
update exercises set category = 'cardio'
where (category is null or category = '') and (
  name ilike 'Nhảy dây%' or name = 'Burpee' or name ilike 'Burpee tạ đơn%' or
  name ilike 'Nâng cao đùi%' or name ilike 'Swing tạ đơn%' or
  name ilike 'Đạp xe%' or name ilike 'Đi bộ máy dốc%'
);

-- ---------- Kiểm tra còn sót bài nào chưa có equipment không ----------
-- (chạy riêng, chỉ để xem — không sửa gì)
-- select name, muscle_group, equipment, category from exercises where equipment is null or equipment = '';
