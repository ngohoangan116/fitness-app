export type QuizAnswers = {
  goal: string;
  level: string;
  equipment: string;
  days: string;
};

export type PlanResult = {
  id: string;
  name: string;
  summary: string;
  focus: string[];
  priceVnd: number;
  splitLabel: string;
};

// Simple rule-based mapping. Replace/extend with a real recommendation
// engine (or a Supabase-stored ruleset) as the exercise library grows.
export function recommendPlan(answers: QuizAnswers): PlanResult {
  const equipmentTag =
    answers.equipment === "Không có gì"
      ? "bodyweight"
      : answers.equipment === "Tạ đơn / dây kháng lực"
      ? "home-dumbbell"
      : "full-gym";

  const goalTag =
    answers.goal === "Tăng cơ"
      ? "hypertrophy"
      : answers.goal === "Giảm mỡ"
      ? "fatloss"
      : answers.goal === "Tăng sức bền"
      ? "endurance"
      : "maintenance";

  // NEW: map the "days" answer to a tag so plan_id actually reflects
  // how many sessions/week the person picked in the quiz.
  const daysTag =
    answers.days === "2 buổi"
      ? "2d"
      : answers.days === "3 buổi"
      ? "3d"
      : answers.days === "4-5 buổi"
      ? "4-5d"
      : "6d";

  const splitLabelMap: Record<string, string> = {
    "2d": "Full Body",
    "3d": "Full Body",
    "4-5d": "Upper / Lower",
    "6d": "Push / Pull / Legs",
  };

  // NEW: mục tiêu "Đốt mỡ" luôn dùng Full Body dù chọn bao nhiêu buổi/tuần —
  // tần suất cao kích thích toàn thân + cardio mỗi buổi phù hợp đốt mỡ hơn
  // là tách nhóm cơ kiểu Push/Pull/Legs (vốn hợp với mục tiêu tăng cơ).
  const splitLabel = goalTag === "fatloss" ? "Full Body" : splitLabelMap[daysTag];

  // NEW: map trình độ (level) sang beginner/advanced để lọc bớt bài
  // olympic weightlifting / powerlifting phức tạp ra khỏi lịch của người
  // mới — trước đây trình độ chỉ hiển thị gợi ý RIR chứ không đổi bài tập.
  const levelTag =
    answers.level === "Mới bắt đầu" || answers.level === "Tập không đều"
      ? "beginner"
      : "advanced";

  // NEW: mỗi tổ hợp giờ có 3 phiên bản bài tập khác nhau (v1/v2/v3) được
  // soạn sẵn trong database (xem scripts/generate-plan-exercises.mjs).
  // Bốc ngẫu nhiên 1 trong 3 ở đây — để 2 khách trả lời quiz giống hệt
  // nhau (vd cùng khu vực, cùng thói quen) không nhận đúng 1 lịch tập y
  // hệt nhau. Không cần đổi checkout hay thêm cột database nào cả, vì
  // biến thể đã nằm sẵn trong chuỗi plan_id.
  const variant = `v${1 + Math.floor(Math.random() * 3)}`;
  const id = `${goalTag}-${equipmentTag}-${daysTag}-${levelTag}-${variant}`;

  const nameMap: Record<string, string> = {
    hypertrophy: "Gói Tăng Cơ",
    fatloss: "Gói Đốt Mỡ",
    endurance: "Gói Sức Bền",
    maintenance: "Gói Duy Trì Vóc Dáng",
  };

  const focusMap: Record<string, string[]> = {
    hypertrophy: ["Tập tạ nặng, ít lặp", "Nghỉ 90-120s giữa hiệp", "Ăn dư calo nhẹ" , "Nhóm cơ lớn trước"],
    fatloss: ["Kết hợp cardio cuối mỗi buổi", "Nghỉ ngắn 30-45s", "Ưu tiên thâm hụt calo" , "Nhóm cơ lớn trước"],
    endurance: ["Nhiều lặp, tạ nhẹ", "Tập tuần hoàn (circuit)", "Tăng dần thời lượng" , "Nhóm cơ lớn trước"],
    maintenance: ["Toàn thân, cường độ vừa phải", "Lịch tập linh hoạt", "Duy trì lâu dài" , "Nhóm cơ lớn trước"],
  };

  const equipmentNote: Record<string, string> = {
    bodyweight: "dùng chính trọng lượng cơ thể, không cần dụng cụ",
    "home-dumbbell": "dùng tạ đơn và dây kháng lực tại nhà",
    "full-gym": "tận dụng đầy đủ máy móc phòng gym",
  };

  return {
    id,
    name: nameMap[goalTag],
    summary: `Lộ trình ${answers.days.toLowerCase()}/tuần (chia lịch ${splitLabel}), ${equipmentNote[equipmentTag]}, phù hợp trình độ "${answers.level.toLowerCase()}".`,
    focus: focusMap[goalTag],
    priceVnd: 149000,
    splitLabel,
  };
}
