// Tinh calo va macro dua tren cong thuc Mifflin-St Jeor (duoc ISSN/ACSM
// danh gia la chinh xac nhat trong cac cong thuc BMR pho bien cho da so
// nguoi, khong phai cong thuc "an lien" tu suy dien).
//
// Luu y quan trong (hien ro cho nguoi dung): day la con so UOC TINH de
// tham khao, khong thay the tu van tu chuyen gia dinh duong hoac bac si,
// dac biet neu co benh ly nen.

export type MacroInput = {
  age: number;
  gender: "male" | "female";
  weightKg: number;
  heightCm: number;
  sessionsPerWeek: number; // tu cau tra loi quiz hoac nhap tay
  goal: "hypertrophy" | "fatloss" | "endurance" | "maintenance";
};

export type MacroResult = {
  bmr: number;
  tdee: number;
  targetCalories: number;
  proteinG: number;
  fatG: number;
  carbG: number;
};

function activityMultiplier(sessionsPerWeek: number) {
  if (sessionsPerWeek <= 1) return 1.2; // it/khong van dong
  if (sessionsPerWeek <= 3) return 1.375; // van dong nhe
  if (sessionsPerWeek <= 5) return 1.55; // van dong vua
  return 1.725; // van dong nhieu
}

// Gram protein / kg can nang — theo khuyen nghi ISSN cho nguoi tap suc de
// khang: 1.6-2.2 g/kg tuy muc tieu.
function proteinPerKg(goal: MacroInput["goal"]) {
  switch (goal) {
    case "hypertrophy":
      return 2.0;
    case "fatloss":
      return 2.2; // protein cao hon khi thieu hut calo, giup giu co
    case "endurance":
      return 1.6;
    default:
      return 1.8;
  }
}

function calorieAdjustment(goal: MacroInput["goal"]) {
  switch (goal) {
    case "hypertrophy":
      return 1.1; // du calo nhe ~10%
    case "fatloss":
      return 0.8; // tham hut ~20%
    default:
      return 1.0; // giu nguyen TDEE
  }
}

export function calcMacros(input: MacroInput): MacroResult {
  const { age, gender, weightKg, heightCm, sessionsPerWeek, goal } = input;

  // Mifflin-St Jeor
  const bmr =
    gender === "male"
      ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
      : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;

  const tdee = bmr * activityMultiplier(sessionsPerWeek);
  const targetCalories = Math.round(tdee * calorieAdjustment(goal));

  const proteinG = Math.round(weightKg * proteinPerKg(goal));
  const proteinKcal = proteinG * 4;

  const fatKcal = targetCalories * 0.25; // 25% tong calo tu chat beo — muc pho bien 20-30%
  const fatG = Math.round(fatKcal / 9);

  const carbKcal = Math.max(targetCalories - proteinKcal - fatKcal, 0);
  const carbG = Math.round(carbKcal / 4);

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    targetCalories,
    proteinG,
    fatG,
    carbG,
  };
}
