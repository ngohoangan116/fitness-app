import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";

// 1. Cấu hình kết nối Database (Lấy từ file .env.local của bạn)
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
const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

// 2. Định nghĩa thứ tự ưu tiên nhóm cơ (Lớn trước - Nhỏ sau)
const MUSCLE_PRIORITY = {
  quadriceps: 1, hamstrings: 1, glutes: 1, // Chân (Lớn nhất)
  chest: 2, back: 2, lats: 2, "middle back": 2, // Ngực & Lưng
  shoulders: 3, traps: 3, // Vai
  triceps: 4, biceps: 4, // Tay sau & Tay trước
  forearms: 5, calves: 5, // Cẳng tay & Bắp chân
  abdominals: 6, core: 6 // Bụng (Thường tập cuối)
};

const MUSCLE_BUCKET = {
  chest: "push", shoulders: "push", triceps: "push",
  lats: "pull", "middle back": "pull", "lower back": "pull", traps: "pull", biceps: "pull",
  quadriceps: "legs", hamstrings: "legs", glutes: "legs", calves: "legs",
  abdominals: "core"
};

const GIF_BASE_URL = "https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/";

async function run( ) {
  console.log("🚀 Bắt đầu cập nhật dữ liệu...");

  // Tải danh sách bài tập từ GitHub
  const res = await fetch("https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/exercises.csv" );
  const csvText = await res.text();
  const lines = csvText.split("\n").slice(1);

  const exercises = lines.map(line => {
    const p = line.split(",");
    if (p.length < 5) return null;
    return {
      name: p[3],
      muscle_group: p[4] || p[0],
      image_url: `${GIF_BASE_URL}${p[2]}.gif`,
      equipment: p[1],
      video_url: null, // Xóa link youtube
      source: "github-gifs"
    };
  }).filter(Boolean);

  console.log(`✅ Đã xử lý ${exercises.length} bài tập. Đang lưu vào Database...`);
  await supabase.from("exercises").upsert(exercises, { onConflict: "name" });

  // Tạo lại lịch tập với thứ tự mới
  const { data: pool } = await supabase.from("exercises").select("*");
  const GOALS = ["hypertrophy", "fatloss", "endurance", "maintenance"];
  const EQUIPS = ["bodyweight", "home-dumbbell", "full-gym"];
  const DAYS = ["2d", "3d", "4-5d", "6d"];

  for (const goal of GOALS) {
    for (const equip of EQUIPS) {
      for (const dayTag of DAYS) {
        const planId = `${goal}-${equip}-${dayTag}-beginner`;
        console.log(`- Đang sắp xếp lịch cho: ${planId}`);
        
        const { data: currentExercises } = await supabase
          .from("plan_exercises")
          .select("*, exercises(*)")
          .eq("plan_id", planId);

        if (!currentExercises) continue;

        // Sắp xếp lại: Nhóm cơ lớn lên trên
        currentExercises.sort((a, b) => {
          const prioA = MUSCLE_PRIORITY[a.exercises.primary_muscle] || 99;
          const prioB = MUSCLE_PRIORITY[b.exercises.primary_muscle] || 99;
          return prioA - prioB;
        });

        // Cập nhật lại order_index trong DB
        for (let i = 0; i < currentExercises.length; i++) {
          await supabase.from("plan_exercises")
            .update({ order_index: i + 1 })
            .eq("id", currentExercises[i].id);
        }
      }
    }
  }
  console.log("🎉 Hoàn thành! Lịch tập đã được sắp xếp khoa học.");
}

run();
