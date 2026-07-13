// Tự soạn lịch tập (workout_plans + plan_exercises) cho TOÀN BỘ 96 tổ hợp
// plan_id mà lib/planLogic.ts có thể sinh ra (4 mục tiêu × 3 dụng cụ ×
// 4 mức số buổi/tuần × 2 trình độ beginner/advanced), lấy bài tập từ kho lớn đã seed ở
// scripts/seed-exercise-library.mjs — thay vì chỉ vài bài mẫu lặp lại.
//
// Chạy SAU khi đã seed kho bài tập:
//   node scripts/generate-plan-exercises.mjs
//
// Script này XOÁ TRẮNG plan_exercises/workout_plans hiện có rồi tạo lại từ
// đầu (idempotent) — an toàn để chạy lại nhiều lần khi bạn muốn "làm mới"
// bộ lịch. Không đụng tới orders/user_progress/exercises.

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

// ---------- Giống hệt các tag trong lib/planLogic.ts (đừng đổi ở 1 chỗ mà quên chỗ kia) ----------
const GOAL_TAGS = ["hypertrophy", "fatloss", "endurance", "maintenance"];
const EQUIPMENT_TAGS = ["bodyweight", "home-dumbbell", "full-gym"];
const DAYS_TAGS = ["2d", "3d", "4-5d", "6d"];
// NEW: beginner = "Mới bắt đầu"/"Tập không đều" ở quiz — loại bài
// olympic weightlifting / powerlifting và các bài cấp độ "expert" ra khỏi
// lịch của nhóm này (khớp lib/planLogic.ts).
const LEVEL_TAGS = ["beginner", "advanced"];
const LEVEL_EXCLUDED_CATEGORIES = new Set(["olympic weightlifting", "powerlifting"]);

const NAME_MAP = {
  hypertrophy: "Gói Tăng Cơ",
  fatloss: "Gói Đốt Mỡ",
  endurance: "Gói Sức Bền",
  maintenance: "Gói Duy Trì Vóc Dáng",
};
const SPLIT_LABEL_MAP = {
  "2d": "Full Body",
  "3d": "Full Body",
  "4-5d": "Upper / Lower",
  "6d": "Push / Pull / Legs",
};
// role + scheme (sets/reps) theo mục tiêu — khớp lib/planLogic.ts focus[]
const GOAL_SCHEME = {
  hypertrophy: { mainSets: 4, mainReps: "6-8", accSets: 3, accReps: "8-10", rest: 100 },
  fatloss: { mainSets: 3, mainReps: "12-15", accSets: 3, accReps: "15", rest: 40 },
  endurance: { mainSets: 3, mainReps: "15-20", accSets: 3, accReps: "15-20", rest: 45 },
  maintenance: { mainSets: 3, mainReps: "10-12", accSets: 3, accReps: "10-12", rest: 60 },
};
const COACHING_NOTES = {
  hypertrophy:
    "Tăng dần mức tạ mỗi 1-2 tuần khi hoàn thành đủ số lần ở hiệp cuối. Ăn dư nhẹ calo, ngủ đủ 7-8h để phục hồi cơ.",
  fatloss:
    "Nghỉ ngắn giữa hiệp để giữ nhịp tim cao. Ưu tiên thâm hụt calo nhẹ (300-500 kcal/ngày), không cắt giảm đột ngột.",
  endurance:
    "Tập với tạ nhẹ hơn, tập trung kiểm soát kỹ thuật khi đã mỏi. Tăng dần số hiệp hoặc thời lượng theo tuần.",
  maintenance:
    "Cường độ vừa phải, ưu tiên tính đều đặn hơn là đẩy nặng. Lịch có thể linh hoạt đổi ngày trong tuần.",
};

// Dụng cụ được phép dùng theo equipmentTag (khớp mô tả trong planLogic.ts)
const EQUIPMENT_ALLOW = {
  bodyweight: new Set(["body only", null]),
  "home-dumbbell": new Set(["body only", "dumbbell", "bands", "kettlebells", null]),
  "full-gym": null, // null = cho phép tất cả
};

// Nhóm cơ -> bucket Push / Pull / Legs / Core. Dò theo MẪU CHỮ (regex)
// thay vì so khớp cứng 1 từ duy nhất — vì các nguồn dữ liệu khác nhau đặt
// tên nhóm cơ khác nhau (vd. free-exercise-db ghi "chest"/"quadriceps",
// còn omercotkd/exercises-gifs ghi "pectorals"/"quads"/"delts"...). Trước
// đây so khớp cứng khiến ngực/vai/đùi không khớp tên nào, bị rơi hết vào
// "core" mặc định, chỉ còn triceps/biceps khớp đúng -> buổi Push/Pull toàn
// bài tay. Regex bắt được cả 2 kiểu đặt tên, không phụ thuộc nguồn dữ liệu.
function bucketOf(ex) {
  const m = (ex.primary_muscle || ex.muscle_group || "").toLowerCase();
  if (/pector|chest|delt|shoulder|tricep/.test(m)) return "push";
  if (/\blat|back|rhomboid|trap|levator|bicep|forearm/.test(m)) return "pull";
  if (/quad|thigh|ham(string)?|glute|calv|abduct|adduct|leg/.test(m)) return "legs";
  return "core"; // abs, spine, lower back, neck, cardiovascular system...
}

// PRNG đơn giản, seed theo chuỗi để mỗi plan_id ra một tổ hợp bài ổn định
// (chạy lại không đổi lịch) nhưng khác nhau giữa các gói -> đa dạng thật sự.
function seedRandom(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}
// Chọn n bài từ arr, ƯU TIÊN bỏ qua bài có tên đã nằm trong `used` (đã
// dùng ở buổi khác trong CÙNG tuần của gói này) — để các buổi không lặp
// bài giống nhau. Nếu nhóm cơ đó không còn đủ bài chưa dùng (thường gặp ở
// gói bodyweight/ít dụng cụ), mới cho phép lấy lại bài đã dùng để buổi đó
// không bị thiếu bài tập.
function pick(arr, n, rng, used) {
  const fresh = used ? arr.filter((ex) => !used.has(ex.name)) : arr;
  const pickFrom = (list, count) => {
    const copy = [...list];
    const out = [];
    while (copy.length && out.length < count) {
      const idx = Math.floor(rng() * copy.length);
      out.push(copy.splice(idx, 1)[0]);
    }
    return out;
  };
  const chosen = pickFrom(fresh, n);
  if (chosen.length < n) {
    const remaining = n - chosen.length;
    const usedNames = new Set(chosen.map((ex) => ex.name));
    const fallback = arr.filter((ex) => !usedNames.has(ex.name));
    chosen.push(...pickFrom(fallback, remaining));
  }
  if (used) chosen.forEach((ex) => used.add(ex.name));
  return chosen;
}

function filterPool(pool, equipmentTag, levelTag) {
  const allow = EQUIPMENT_ALLOW[equipmentTag];
  return pool.filter((ex) => {
    if (ex.category === "stretching") return false;
    if (levelTag === "beginner") {
      if (LEVEL_EXCLUDED_CATEGORIES.has(ex.category)) return false;
      if (ex.level === "expert") return false;
    }
    if (!allow) return true; // full-gym: mọi dụng cụ
    return allow.has(ex.equipment);
  });
}

// Với 1 "buổi" (day), chọn bài theo các bucket mong muốn. `usedInWeek` là
// 1 Set dùng chung xuyên suốt các buổi của CÙNG 1 plan_id — đảm bảo các
// buổi trong tuần không lặp lại y hệt bài của nhau (xem pick() ở trên).
function buildDay({ pool, buckets, rng, scheme, isCardioFinisher, usedInWeek }) {
  const rows = [];
  let orderIndex = 1;
  for (const { bucket, count, role } of buckets) {
    const candidates = pool.filter((ex) => bucketOf(ex) === bucket && ex.category !== "cardio");
    const chosen = pick(candidates, count, rng, usedInWeek);
    for (const ex of chosen) {
      rows.push({
        exercise_name: ex.name,
        day_number: 1, // ghi đè bên ngoài
        sets: role === "main" ? scheme.mainSets : scheme.accSets,
        reps: role === "main" ? scheme.mainReps : scheme.accReps,
        rest_seconds: role === "main" ? scheme.rest : Math.max(30, scheme.rest - 20),
        role,
        order_index: orderIndex++,
      });
    }
  }
  if (isCardioFinisher) {
    const cardio = pool.filter((ex) => ex.category === "cardio");
    const chosen = pick(cardio, 1, rng, usedInWeek);
    for (const ex of chosen) {
      rows.push({
        exercise_name: ex.name,
        day_number: 1,
        sets: 1,
        reps: "10-15 phút",
        rest_seconds: 0,
        role: "cardio",
        order_index: orderIndex++,
      });
    }
  }
  return rows;
}

// ---------- Lịch theo TUẦN — số "buổi" trả về LUÔN khớp đúng số buổi/tuần
// khách chọn ở quiz (2/3/5/6), không còn kiểu "chỉ soạn 3 mẫu rồi bắt lặp"
// như trước (đó là lý do khách 5-6 buổi vẫn chỉ thấy 3 thẻ trên dashboard).
//
// Cách chia lấy cảm hứng từ 2 nguồn bạn gửi:
//  - Darebee: tần suất cao, tập toàn thân + tuần hoàn (circuit) khi mục
//    tiêu là giảm mỡ/sức bền, cường độ tăng dần theo trình độ.
//  - Nourish Move Love: lịch theo TỪNG NGÀY trong tuần có chủ đề rõ ràng
//    (không lặp y hệt 1 buổi), có ngày nghỉ/phục hồi chủ động.
//
// Thứ tự bucket trong mỗi mảng CHÍNH LÀ thứ tự tập trong buổi (order_index
// đi theo thứ tự này) — nhóm cơ lớn/bài compound trước lúc còn sung sức,
// nhóm cơ nhỏ + core dồn về cuối. "pull" (lưng/xô) là nhóm cơ CHÍNH ngang
// với "push" (ngực/vai), không phải bài phụ.
const BUCKET_TEMPLATES = {
  "Full Body": [
    { bucket: "legs", count: 2, role: "main" },
    { bucket: "push", count: 2, role: "main" },
    { bucket: "pull", count: 2, role: "main" },
    { bucket: "core", count: 1, role: "accessory" },
  ],
  Upper: [
    { bucket: "push", count: 3, role: "main" },
    { bucket: "pull", count: 3, role: "main" },
    { bucket: "core", count: 1, role: "accessory" },
  ],
  Lower: [
    { bucket: "legs", count: 4, role: "main" },
    { bucket: "core", count: 1, role: "accessory" },
  ],
  Push: [
    { bucket: "push", count: 4, role: "main" },
    { bucket: "core", count: 1, role: "accessory" },
  ],
  Pull: [
    { bucket: "pull", count: 4, role: "main" },
    { bucket: "core", count: 1, role: "accessory" },
  ],
  Legs: [
    { bucket: "legs", count: 4, role: "main" },
    { bucket: "core", count: 1, role: "accessory" },
  ],
};

// Số buổi THẬT trong tuần ứng với mỗi daysTag — khớp đúng lựa chọn ở quiz
// ("2 buổi" -> 2, "3 buổi" -> 3, "4-5 buổi" -> lấy 5, "6+ buổi" -> 6).
const DAYS_PER_WEEK = { "2d": 2, "3d": 3, "4-5d": 5, "6d": 6 };

// Nhãn từng buổi trong tuần theo goalTag + daysTag. Trả về mảng nhãn có
// độ dài đúng bằng DAYS_PER_WEEK[daysTag] — không còn giới hạn 3 nữa.
function weekLabelsFor(goalTag, daysTag) {
  // Darebee-style: mục tiêu Đốt mỡ luôn tập toàn thân + cardio mỗi buổi dù
  // tần suất cao hay thấp — tần suất cao hơn thì lặp Full Body nhiều buổi
  // hơn trong tuần (mỗi buổi vẫn chọn bài khác nhau nhờ rng), thay vì tách
  // nhóm cơ kiểu Upper/Lower/PPL (vốn hợp tăng cơ hơn).
  if (goalTag === "fatloss") {
    return Array.from({ length: DAYS_PER_WEEK[daysTag] }, () => "Full Body");
  }
  switch (daysTag) {
    case "2d":
      return ["Full Body", "Full Body"];
    case "3d":
      return ["Full Body", "Full Body", "Full Body"];
    case "4-5d":
      // Lịch tuần 5 buổi có chủ đề riêng từng ngày (kiểu lịch tuần
      // Nourish Move Love) thay vì lặp lại y hệt.
      return ["Upper", "Lower", "Push", "Pull", "Legs"];
    case "6d":
    default:
      // Push/Pull/Legs lặp 2 vòng/tuần — 6 buổi THẬT, không phải 3 buổi
      // lặp ngầm như bản cũ.
      return ["Push", "Pull", "Legs", "Push", "Pull", "Legs"];
  }
}

async function main() {
  console.log("Đang tải kho bài tập từ Supabase...");
  const { data: pool, error: poolErr } = await supabase
    .from("exercises")
    .select("id, name, equipment, category, primary_muscle, level");
  if (poolErr) throw poolErr;
  if (!pool || pool.length < 50) {
    console.error(
      "Kho bài tập còn quá ít. Chạy `node scripts/seed-exercise-library.mjs` trước đã."
    );
    process.exit(1);
  }
  console.log(`Có ${pool.length} bài trong kho.`);

  const planRows = [];
  const allPlanExerciseRows = []; // gộp theo plan_id, resolve exercise_id sau

  for (const goalTag of GOAL_TAGS) {
    for (const equipmentTag of EQUIPMENT_TAGS) {
      for (const daysTag of DAYS_TAGS) {
        for (const levelTag of LEVEL_TAGS) {
          const planId = `${goalTag}-${equipmentTag}-${daysTag}-${levelTag}`;
          const weekLabels = weekLabelsFor(goalTag, daysTag); // độ dài = đúng số buổi/tuần khách chọn
          const scheme = GOAL_SCHEME[goalTag];
          const rng = seedRandom(planId);
          const pool2 = filterPool(pool, equipmentTag, levelTag);
          const usedInWeek = new Set(); // reset cho mỗi gói — tránh trùng bài giữa các buổi trong tuần

          let dayNumber = 1;
          for (const label of weekLabels) {
            const buckets = BUCKET_TEMPLATES[label];
            const dayRows = buildDay({
              pool: pool2,
              buckets,
              rng,
              scheme,
              isCardioFinisher: goalTag === "fatloss",
              usedInWeek,
            });
            for (const r of dayRows) {
              allPlanExerciseRows.push({ ...r, plan_id: planId, day_number: dayNumber, day_label: label });
            }
            dayNumber++;
          }

          const uniqueLabels = [...new Set(weekLabels)];
          const scheduleSummary =
            uniqueLabels.length === 1
              ? `${weekLabels.length} buổi/tuần, tất cả đều ${uniqueLabels[0]}`
              : `${weekLabels.length} buổi/tuần: ${weekLabels.join(" → ")}`;
          const restNote =
            weekLabels.length < 7
              ? ` · ${7 - weekLabels.length} ngày còn lại nên nghỉ ngơi hoặc vận động nhẹ (đi bộ, giãn cơ).`
              : "";

          planRows.push({
            id: planId,
            name: NAME_MAP[goalTag],
            description: `${scheduleSummary} · dụng cụ: ${
              equipmentTag === "bodyweight"
                ? "không cần dụng cụ"
                : equipmentTag === "home-dumbbell"
                ? "tạ đơn / dây kháng lực tại nhà"
                : "đầy đủ máy phòng gym"
            }${levelTag === "beginner" ? " · đã lược bớt bài phức tạp (olympic/powerlifting) cho người mới" : ""}${restNote}`,
            coaching_notes: COACHING_NOTES[goalTag],
          });
        }
      }
    }
  }

  console.log(`Soạn xong ${planRows.length} gói, tổng ${allPlanExerciseRows.length} dòng bài tập.`);
  console.log("Đang ghi workout_plans...");
  const { error: wpErr } = await supabase.from("workout_plans").upsert(planRows, { onConflict: "id" });
  if (wpErr) throw wpErr;

  console.log("Đang xoá plan_exercises cũ của các gói này...");
  const planIds = planRows.map((p) => p.id);
  const { error: delErr } = await supabase.from("plan_exercises").delete().in("plan_id", planIds);
  if (delErr) throw delErr;

  console.log("Đang tra cứu exercise_id theo tên...");
  const nameToId = new Map(pool.map((e) => [e.name, e.id]));

  const finalRows = allPlanExerciseRows
    .map((r) => {
      const exerciseId = nameToId.get(r.exercise_name);
      if (!exerciseId) return null;
      return {
        plan_id: r.plan_id,
        exercise_id: exerciseId,
        day_number: r.day_number,
        day_label: r.day_label,
        sets: r.sets,
        reps: r.reps,
        rest_seconds: r.rest_seconds,
        role: r.role,
        order_index: r.order_index,
      };
    })
    .filter(Boolean);

  console.log(`Đang ghi ${finalRows.length} dòng plan_exercises...`);
  const BATCH = 500;
  for (let i = 0; i < finalRows.length; i += BATCH) {
    const batch = finalRows.slice(i, i + BATCH);
    const { error } = await supabase.from("plan_exercises").insert(batch);
    if (error) throw error;
    console.log(`  ...${Math.min(i + BATCH, finalRows.length)}/${finalRows.length}`);
  }

  console.log(
    "Xong! Cả 96 gói (4 mục tiêu × 3 dụng cụ × 4 mức buổi/tuần × 2 trình độ) đã có lịch riêng."
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
