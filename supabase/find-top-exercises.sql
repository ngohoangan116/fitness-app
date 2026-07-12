-- Chay trong Supabase SQL Editor de biet bai tap nao xuat hien nhieu nhat
-- trong toan bo 48 goi tap — uu tien tim video cho nhung bai nay truoc.

select
  e.id,
  e.name,
  e.muscle_group,
  e.video_url,
  count(*) as so_lan_xuat_hien_trong_cac_goi
from plan_exercises pe
join exercises e on e.id = pe.exercise_id
group by e.id, e.name, e.muscle_group, e.video_url
order by so_lan_xuat_hien_trong_cac_goi desc
limit 25;
