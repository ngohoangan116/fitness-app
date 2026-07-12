// Nạp kho bài tập lớn (800+ bài, public domain) vào bảng `exercises`.
//
// Nguồn dữ liệu: yuhonas/free-exercise-db (Public Domain — an toàn để dùng
// cho sản phẩm thương mại), gồm tên bài, nhóm cơ, dụng cụ, mức độ và các
// bước hướng dẫn. Ảnh minh hoạ được trỏ thẳng tới raw.githubusercontent
// (giống cách CDN) nên không cần tải file ảnh về.
//
// Chạy 1 lần (hoặc mỗi khi muốn đồng bộ lại):
//   node scripts/seed-exercise-library.mjs
//
// Yêu cầu trước khi chạy — thêm 2 dòng vào .env.local (nếu chưa có):
//   NEXT_PUBLIC_SUPABASE_URL=...
//   SUPABASE_SERVICE_ROLE_KEY=...   (Project Settings → API → service_role,
//                                     KHÔNG dùng anon key ở đây, và KHÔNG
//                                     commit key này lên git)
// Và đã chạy supabase/expand-library-and-schedule-fee.sql trong SQL Editor.

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

const SOURCE_JSON_URL =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json";
const IMAGE_BASE_URL =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY (đặt trong .env.local)."
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

async function main() {
  console.log("Đang tải kho bài tập từ free-exercise-db...");
  const res = await fetch(SOURCE_JSON_URL);
  if (!res.ok) throw new Error(`Tải dữ liệu thất bại: HTTP ${res.status}`);
  /** @type {any[]} */
  const raw = await res.json();
  console.log(`Nhận được ${raw.length} bài tập nguồn.`);

  const rows = raw
    // Bỏ nhóm giãn cơ đơn thuần — website này tập trung vào lịch tập tạ/cardio
    .filter((e) => e.category !== "stretching")
    .map((e) => ({
      name: e.name,
      muscle_group: (e.primaryMuscles && e.primaryMuscles[0]) || null,
      // Không tự host video (rủi ro bản quyền + băng thông) — thay vào đó tạo
      // sẵn link tìm kiếm YouTube đúng tên bài, khách bấm vào là ra video
      // hướng dẫn thật, luôn có kết quả, không tốn lưu trữ.
      video_url: `https://www.youtube.com/results?search_query=${encodeURIComponent(
        e.name + " exercise tutorial"
      )}`,
      equipment: e.equipment || "body only",
      category: e.category || null,
      force: e.force || null,
      mechanic: e.mechanic || null,
      level: e.level || null,
      primary_muscle: (e.primaryMuscles && e.primaryMuscles[0]) || null,
      secondary_muscles: e.secondaryMuscles || [],
      instructions: e.instructions || [],
      image_url:
        e.images && e.images.length > 0 ? `${IMAGE_BASE_URL}${e.images[0]}` : null,
      source: "free-exercise-db",
    }));

  console.log(`Chuẩn bị upsert ${rows.length} bài (theo tên, không tạo trùng)...`);

  const BATCH = 200;
  let done = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const { error } = await supabase.from("exercises").upsert(batch, { onConflict: "name" });
    if (error) {
      console.error(`Lỗi ở batch bắt đầu từ dòng ${i}:`, error.message);
      process.exit(1);
    }
    done += batch.length;
    console.log(`  ...${done}/${rows.length}`);
  }

  console.log("Xong! Kho bài tập đã sẵn sàng trong bảng `exercises`.");
  console.log(
    "Tiếp theo: chạy `node scripts/generate-plan-exercises.mjs` để tự soạn lịch cho cả 48 gói."
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
