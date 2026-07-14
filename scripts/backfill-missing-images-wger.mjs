// Bù ảnh thật cho các bài tập ĐANG THIẾU ảnh (image_url = null) — nguyên
// nhân là bộ GIF omercotkd/exercises-gifs không có file cho đúng những bài
// đó (thiếu ở nguồn gốc, không phải lỗi khớp tên).
//
// Nguồn ảnh bù: wger.de — dự án fitness mã nguồn mở, API công khai không
// cần đăng ký, ảnh giấy phép CC-BY-SA.
//   https://wger.de/api/v2/exercise/search/  (tìm bài theo tên)
//   https://wger.de/api/v2/exerciseimage/    (lấy ảnh theo id bài)
//
// CHỈ cập nhật đúng các dòng đang thiếu ảnh — không đổi gì ở các bài đã
// có sẵn GIF, không đổi cấu trúc bảng.
//
// Chạy: node scripts/backfill-missing-images-wger.mjs

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";

function loadEnvLocal() {
  const path = new URL("../.env.local", import.meta.url);
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!(key in process.env)) process.env[key] = val;
  }
}
loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY trong .env.local.");
  process.exit(1);
}
const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

const VI_TO_EN = {
  "Hít đất": "push-up",
  "Hít đất nghiêng chân cao": "decline push-up",
  "Hít đất kim cương": "diamond push-up",
  "Superman": "superman exercise back",
  "Bơi cạn (Swimmers)": "swimmers exercise back",
  "Chim bay ngược không tạ": "bodyweight reverse fly prone Y-T-W",
  "Squat không tạ": "bodyweight squat",
  "Lunge bước tới": "forward lunge",
  "Bulgarian split squat (ghế)": "bulgarian split squat",
  "Đẩy hông (Glute bridge)": "glute bridge",
  "Pike push-up": "pike push-up",
  "Plank chạm vai": "plank shoulder tap",
  "Hand walk": "inchworm hand walk exercise",
  "Dip trên ghế": "bench dip triceps",
  "Hít đất kim cương (tay sau)": "diamond push-up triceps",
  "Curl khăn đẳng trường (tay trước)": "isometric towel bicep curl",
  "Plank": "plank exercise",
  "Gập bụng đạp xe (Bicycle crunch)": "bicycle crunch",
  "Nâng chân (Leg raise)": "leg raise abs",
  "Hollow hold": "hollow body hold",
  "Nhón gót (Calf raise)": "calf raise",
  "Nhón gót 1 chân": "single-leg calf raise",
  "Burpee": "burpee exercise",
  "Nhảy dây": "jump rope",
  "High knees (chạy nâng gối)": "high knees exercise",
  "Jumping jack": "jumping jack",
  "Chạy bộ tại chỗ": "running in place exercise",
  "Đẩy ngực tạ đơn": "dumbbell bench press",
  "Ép ngực tạ đơn (Fly)": "dumbbell chest fly",
  "Row tạ đơn 1 tay": "one-arm dumbbell row",
  "Deadlift tạ đơn": "dumbbell deadlift",
  "Chim bay ngược tạ đơn (Rear delt fly)": "dumbbell rear delt fly",
  "Squat tạ đơn (Goblet squat)": "goblet squat",
  "Lunge tạ đơn": "dumbbell lunge",
  "Romanian deadlift tạ đơn": "dumbbell romanian deadlift",
  "Đẩy hông tạ đơn (Hip thrust)": "dumbbell hip thrust",
  "Đẩy vai tạ đơn": "dumbbell shoulder press",
  "Nâng tạ ngang vai (Lateral raise)": "dumbbell lateral raise",
  "Nâng tạ trước (Front raise)": "dumbbell front raise",
  "Cuốn tạ tay trước (Bicep curl)": "dumbbell bicep curl",
  "Đẩy tạ sau đầu (Overhead triceps extension)": "dumbbell overhead triceps extension",
  "Kickback tay sau": "dumbbell triceps kickback",
  "Nghiêng bụng tạ đơn (Weighted side bend)": "dumbbell side bend",
  "Nâng chân": "leg raise abs",
  "Gập bụng đạp xe": "bicycle crunch",
  "Nhón gót tạ đơn": "dumbbell calf raise",
  "Nhón gót 1 chân tạ đơn": "single-leg dumbbell calf raise",
  "Leo núi (Mountain climber)": "mountain climber exercise",
  "Burpee tạ nhẹ": "dumbbell burpee",
  "Swing tạ đơn (Kettlebell-style)": "dumbbell swing",
  "High knees": "high knees exercise",
  "Đẩy tạ đòn ngang": "barbell bench press",
  "Đẩy ngực máy (Chest press machine)": "chest press machine",
  "Ép ngực cáp (Cable fly)": "cable chest fly",
  "Kéo xà": "pull-up",
  "Kéo cáp ngồi (Seated cable row)": "seated cable row",
  "Deadlift tạ đòn": "barbell deadlift",
  "Squat tạ đòn": "barbell back squat",
  "Leg press": "leg press machine",
  "Đá đùi máy (Leg extension)": "leg extension machine",
  "Gập gối máy (Leg curl)": "leg curl machine",
  "Đẩy vai tạ đòn": "barbell overhead press",
  "Nâng tạ ngang vai": "dumbbell lateral raise",
  "Đẩy vai Arnold": "arnold press",
  "Cuốn tay trước tạ đòn (Barbell curl)": "barbell curl",
  "Đẩy cáp tay sau (Triceps pushdown)": "cable triceps pushdown",
  "Cuốn tay tạ đơn": "dumbbell bicep curl",
  "Gập bụng cáp": "cable crunch",
  "Nâng chân treo xà (Hanging leg raise)": "hanging leg raise",
  "Máy nhón gót (Calf raise machine)": "calf raise machine",
  "Nhón gót tạ đòn": "barbell calf raise",
  "Máy chạy bộ dốc (Treadmill incline walk)": "treadmill incline walk",
  "Xe đạp tập (Stationary bike)": "stationary bike cardio",
  "Máy elliptical": "elliptical machine cardio",
  "Máy chèo (Rowing machine)": "rowing machine cardio",
  "Reverse snow angel (vai sau)": "reverse snow angel rear delt exercise",
  "Chữ Y nằm sấp (Prone Y-raise)": "prone Y raise rear delt",
  "Curl khăn kháng lực (tay trước)": "resistance band isometric bicep curl",
  "Pull-over tạ đơn (Dumbbell pullover)": "dumbbell pullover",
  "Face pull dây kháng lực": "resistance band face pull",
  "Cuốn tạ nghiêng (Hammer curl)": "dumbbell hammer curl",
  "Face pull (cáp)": "cable face pull",
  "Đẩy vai sau máy (Reverse pec deck)": "reverse pec deck rear delt machine",
  "Đẩy tạ sau đầu máy (Overhead triceps machine)": "cable overhead triceps extension machine",
};

// Danh sach dich san (uu tien hang dau) cho cac bai tieng Viet KHONG co
// goi y tieng Anh trong ngoac — lay tu kho bai tap goc ban dau.
// Bang bai tap dang tron 2 dot du lieu: ten tieng Anh moi (co san GIF) va
// ten tieng Viet cu hon (chua co anh). Voi ten tieng Anh, phan trong ngoac
// thuong la ghi chu thua (vd "(male)") nen bo di. Nhung voi ten tieng Viet,
// phan trong ngoac lai chinh la goi y tieng Anh — PHAI dung phan do de tim
// tren wger.de (trang chi hieu tieng Anh), khong duoc bo di.
const VIETNAMESE_DIACRITICS = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/;

function cleanNameForSearch(name) {
  if (VI_TO_EN[name]) return VI_TO_EN[name]; // uu tien tra bang dich san
  const parenMatch = name.match(/\(([^)]*)\)/);
  if (VIETNAMESE_DIACRITICS.test(name)) {
    if (parenMatch && parenMatch[1].trim()) return parenMatch[1].trim();
    return name.replace(/\([^)]*\)/g, "").trim();
  }
  return name
    .replace(/\([^)]*\)/g, "")
    .replace(/\b(male|female)\b/gi, "")
    .trim();
}

async function searchWger(term) {
  const searchUrl = `https://wger.de/api/v2/exercise/search/?term=${encodeURIComponent(
    term
  )}&language=english&format=json`;
  const res = await fetch(searchUrl);
  if (!res.ok) return null;
  const data = await res.json();
  const suggestions = data?.suggestions ?? [];
  if (suggestions.length === 0) return null;
  return suggestions[0]?.data?.base_id ?? suggestions[0]?.data?.id ?? null;
}

async function getImageForExercise(exerciseId) {
  const imgUrl = `https://wger.de/api/v2/exerciseimage/?exercise=${exerciseId}&format=json`;
  const res = await fetch(imgUrl);
  if (!res.ok) return null;
  const data = await res.json();
  const results = data?.results ?? [];
  if (results.length === 0) return null;
  const main = results.find((r) => r.is_main) ?? results[0];
  return main?.image ?? null;
}

// Kiểm tra 1 URL ảnh có THẬT SỰ tải được không (không chỉ có giá trị
// trong cột image_url) — bắt đúng trường hợp link die/404 (vd. file gif
// không tồn tại trong kho omercotkd dù CSV nguồn có ghi tên file).
async function isImageReachable(imageUrl) {
  try {
    const res = await fetch(imageUrl, { method: "HEAD" });
    return res.ok;
  } catch {
    return false;
  }
}

async function main() {
  console.log("Đang tải danh sách toàn bộ bài tập để kiểm tra ảnh...");
  const { data: all, error } = await supabase.from("exercises").select("id, name, image_url");
  if (error) throw error;

  console.log(`Có ${all.length} bài. Đang kiểm tra ảnh nào còn thiếu HOẶC link đã die (404)...`);
  const missing = [];
  let checked = 0;
  for (const ex of all) {
    checked++;
    if (checked % 200 === 0) console.log(`  ...đã kiểm tra ${checked}/${all.length}`);
    if (!ex.image_url) {
      missing.push(ex);
      continue;
    }
    const ok = await isImageReachable(ex.image_url);
    if (!ok) missing.push(ex);
  }

  if (missing.length === 0) {
    console.log("Không có bài nào thiếu ảnh (hay link ảnh die) cả — xong, không cần làm gì thêm.");
    return;
  }
  console.log(`Có ${missing.length} bài đang thiếu ảnh hoặc link ảnh die. Bắt đầu tra cứu trên wger.de...`);

  let matched = 0;
  const stillMissing = [];

  async function clearBrokenLink(ex) {
    // Nếu bài này TRƯỚC ĐÓ có link ảnh (die/404) mà không tìm được ảnh
    // thay thế, xoá link cũ đi — để dashboard hiện icon dụng cụ thay thế
    // thay vì tiếp tục trỏ tới ảnh vỡ.
    if (!ex.image_url) return;
    const { error: clearErr } = await supabase
      .from("exercises")
      .update({ image_url: null })
      .eq("id", ex.id);
    if (clearErr) console.error(`  Không xoá được link ảnh die của "${ex.name}":`, clearErr.message);
  }

  for (const ex of missing) {
    const term = cleanNameForSearch(ex.name);
    try {
      const exerciseId = await searchWger(term);
      if (!exerciseId) {
        stillMissing.push(ex.name);
        await clearBrokenLink(ex);
        await sleep(250);
        continue;
      }
      const imageUrl = await getImageForExercise(exerciseId);
      if (!imageUrl) {
        stillMissing.push(ex.name);
        await clearBrokenLink(ex);
        await sleep(250);
        continue;
      }
      const { error: updateErr } = await supabase
        .from("exercises")
        .update({ image_url: imageUrl, source: "wger.de" })
        .eq("id", ex.id);
      if (updateErr) {
        console.error(`  Lỗi khi cập nhật "${ex.name}":`, updateErr.message);
      } else {
        matched++;
        console.log(`  ✓ ${ex.name} -> có ảnh`);
      }
    } catch (err) {
      console.error(`  Lỗi tra cứu "${ex.name}":`, err.message);
      stillMissing.push(ex.name);
    }
    await sleep(250); // lịch sự với server công khai, tránh gửi quá nhanh
  }

  console.log("");
  console.log(`Xong! Bù được ảnh cho ${matched}/${missing.length} bài.`);
  if (stillMissing.length > 0) {
    console.log(`Vẫn còn ${stillMissing.length} bài chưa tìm được ảnh (giữ icon dụng cụ thay thế):`);
    stillMissing.forEach((n) => console.log(`  - ${n}`));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
