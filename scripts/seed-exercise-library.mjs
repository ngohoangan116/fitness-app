// Nạp kho bài tập lớn (~1300 bài) vào bảng `exercises`, kèm ẢNH ĐỘNG (GIF)
// minh hoạ thay cho link YouTube.
//
// Nguồn dữ liệu: omercotkd/exercises-gifs — repo backup GIF công khai của
// bộ "Fitness Exercises with Animations" (Kaggle), gồm exercises.csv +
// thư mục assets/ chứa toàn bộ file .gif.
//   https://github.com/omercotkd/exercises-gifs
//
// Script này KHÔNG đoán cứng vị trí cột trong CSV — nó đọc dòng tiêu đề
// (header) rồi tự dò cột nào là "name", "muscle", "equipment", "gif"...
// theo tên cột (không phân biệt hoa/thường). In ra "cách hiểu" + 3 dòng
// mẫu đầu tiên trước khi ghi vào Supabase, để bạn kiểm tra bằng mắt xem
// có đọc đúng cột không trước khi nó chạy tiếp cho ~1300 dòng còn lại.
//
// Chạy 1 lần (hoặc mỗi khi muốn đồng bộ lại):
//   node scripts/seed-exercise-library.mjs
//
// Yêu cầu trước khi chạy — thêm vào .env.local (nếu chưa có):
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

const CSV_URL = "https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/exercises.csv";
const GIF_BASE_URL = "https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY (đặt trong .env.local)."
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

// ---------- CSV parser đúng chuẩn (chịu được dấu phẩy/xuống dòng bên trong ô có ngoặc kép) ----------
// Naive `line.split(",")` sẽ vỡ ngay khi 1 ô (vd. hướng dẫn tập) chứa dấu
// phẩy — nên viết 1 parser nhỏ đọc từng ký tự thay vì tách theo dòng trước.
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

// ---------- Tự dò cột theo tên header, không đoán cứng vị trí ----------
function findCol(headers, ...keywordSets) {
  const lower = headers.map((h) => h.toLowerCase().trim());
  for (const keywords of keywordSets) {
    const idx = lower.findIndex((h) => keywords.every((k) => h.includes(k)));
    if (idx !== -1) return idx;
  }
  return -1;
}

// Cột "muscle" chính nhưng KHÔNG được khớp nhầm cột "secondary muscle".
function findPrimaryMuscleCol(headers) {
  const lower = headers.map((h) => h.toLowerCase().trim());
  return lower.findIndex((h) => (h.includes("muscle") || h.includes("target")) && !h.includes("second"));
}

function splitListField(value) {
  if (!value) return [];
  const trimmed = value.trim();
  if (trimmed.startsWith("[")) {
    try {
      return JSON.parse(trimmed.replace(/'/g, '"'));
    } catch {
      /* fall through */
    }
  }
  return trimmed
    .split(/;|\|/)
    .map((s) => s.replace(/^[\[\]'"]+|[\[\]'"]+$/g, "").trim())
    .filter(Boolean); rows = Array.from(new Map(rows.map(r => [r.name, r])).values());
}

function resolveGifUrl(raw) {
  if (!raw) return null;
  const v = raw.trim();
  if (!v) return null;
  if (v.startsWith("http")) return v;
  if (v.startsWith("assets/")) return `https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/${v}`;
  const filename = v.endsWith(".gif") ? v : `${v}.gif`;
  return `${GIF_BASE_URL}${filename}`;
}

async function main() {
  console.log("Đang tải danh sách bài tập từ omercotkd/exercises-gifs...");
  const res = await fetch(CSV_URL);
  if (!res.ok) throw new Error(`Tải dữ liệu thất bại: HTTP ${res.status}`);
  const csvText = await res.text();
  const table = parseCsv(csvText);
  const headers = table[0];
  const dataRows = table.slice(1).filter((r) => r.length === headers.length);
  console.log(`Nhận được ${dataRows.length} dòng, ${headers.length} cột: [${headers.join(", ")}]`);

  const nameCol = findCol(headers, ["name"]);
  const muscleCol = findPrimaryMuscleCol(headers);
  const secondaryCol = findCol(headers, ["second"]);
  const equipmentCol = findCol(headers, ["equip"]);
  const categoryCol = findCol(headers, ["categ"], ["type"], ["bodypart"], ["body", "part"]);
  const levelCol = findCol(headers, ["level"], ["difficult"]);
  const instructionsCol = findCol(headers, ["instruction"], ["step"], ["desc"]);
  const gifCol = findCol(headers, ["gif"], ["asset"], ["image"], ["file"], ["id"]);

  console.log("Cách hiểu cột (kiểm tra kỹ trước khi script chạy tiếp):");
  console.log({ nameCol, muscleCol, secondaryCol, equipmentCol, categoryCol, levelCol, instructionsCol, gifCol });
  console.log("3 dòng mẫu đầu tiên:", dataRows.slice(0, 3));

  if (nameCol === -1 || gifCol === -1) {
    console.error(
      "Không tìm ra cột tên bài / cột ảnh GIF trong CSV — cấu trúc file nguồn có thể đã đổi. Dừng lại, không ghi dữ liệu sai vào Supabase."
    );
    process.exit(1);
  }

  let rows = dataRows
    .map((r) => {
      const name = r[nameCol]?.trim();
      if (!name) return null;
      const primaryMuscle = muscleCol !== -1 ? r[muscleCol]?.trim().toLowerCase() || null : null;
      return {
        name,
        muscle_group: primaryMuscle,
        primary_muscle: primaryMuscle,
        secondary_muscles: secondaryCol !== -1 ? splitListField(r[secondaryCol]) : [],
        equipment: equipmentCol !== -1 ? r[equipmentCol]?.trim().toLowerCase() || "body only" : "body only",
        category: categoryCol !== -1 ? r[categoryCol]?.trim().toLowerCase() || null : null,
        level: levelCol !== -1 ? r[levelCol]?.trim().toLowerCase() || null : null,
        instructions: instructionsCol !== -1 ? splitListField(r[instructionsCol]) : [],
        image_url: resolveGifUrl(gifCol !== -1 ? r[gifCol] : null),
        video_url: null, // luôn xoá link YouTube cũ nếu tên bài trùng
        source: "omercotkd-exercises-gifs",
      };
    })
    .filter(Boolean); rows = Array.from(new Map(rows.map(r => [r.name, r])).values());

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

  // An toàn thêm: xoá sạch video_url còn sót của các bài CŨ (vd. 5 bài demo
  // trong schema.sql gốc) không trùng tên với bài nào trong đợt nạp này —
  // đảm bảo không còn link YouTube nào trong toàn bộ bảng exercises nữa.
  console.log("Đang dọn nốt các link YouTube cũ còn sót (nếu có)...");
  const { error: cleanupError } = await supabase
    .from("exercises")
    .update({ video_url: null })
    .not("video_url", "is", null);
  if (cleanupError) {
    console.error("Không dọn được video_url cũ:", cleanupError.message);
  }

  console.log("Xong! Kho bài tập (kèm GIF minh hoạ) đã sẵn sàng trong bảng `exercises`.");
  console.log(
    "Tiếp theo: chạy `node scripts/generate-plan-exercises.mjs` để tự soạn lịch cho cả 96 gói."
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
