"use client";

import { useState } from "react";
import { calcMacros, MacroInput, MacroResult } from "@/lib/macros";

const GOAL_LABEL: Record<MacroInput["goal"], string> = {
  hypertrophy: "Tăng cơ (dư ~10% calo)",
  fatloss: "Đốt mỡ (thâm hụt ~20% calo)",
  endurance: "Sức bền (giữ nguyên TDEE)",
  maintenance: "Duy trì (giữ nguyên TDEE)",
};

export default function MacroCalculator({
  defaultGoal,
  defaultSessionsPerWeek,
}: {
  defaultGoal: MacroInput["goal"];
  defaultSessionsPerWeek: number;
}) {
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [sessions, setSessions] = useState(String(defaultSessionsPerWeek));
  const [goal, setGoal] = useState<MacroInput["goal"]>(defaultGoal);
  const [result, setResult] = useState<MacroResult | null>(null);

  function compute() {
    const a = parseInt(age, 10);
    const w = parseFloat(weight);
    const h = parseFloat(height);
    const s = parseInt(sessions, 10);
    if (!a || !w || !h || a <= 0 || w <= 0 || h <= 0) return;
    setResult(calcMacros({ age: a, gender, weightKg: w, heightCm: h, sessionsPerWeek: s || 0, goal }));
  }

  return (
    <div className="border-2 border-line/40 px-5 py-5 mb-6">
      <p className="font-mono text-[11px] text-signal tracking-widest mb-1">
        TÍNH MACRO CÁ NHÂN HÓA
      </p>
      <p className="font-body text-xs text-steel mb-4">
        Ước tính lượng calo và đạm/tinh bột/chất béo mỗi ngày, dựa trên công thức
        Mifflin-St Jeor — chỉ mang tính tham khảo, không thay thế tư vấn dinh dưỡng chuyên sâu.
      </p>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <input
          type="number"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          placeholder="Tuổi"
          className="border-2 border-ink px-3 py-2.5 font-mono text-sm bg-transparent focus:outline-none"
        />
        <select
          value={gender}
          onChange={(e) => setGender(e.target.value as "male" | "female")}
          className="border-2 border-ink px-3 py-2.5 font-mono text-sm bg-transparent focus:outline-none"
        >
          <option value="male">Nam</option>
          <option value="female">Nữ</option>
        </select>
        <input
          type="number"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          placeholder="Cân nặng (kg)"
          className="border-2 border-ink px-3 py-2.5 font-mono text-sm bg-transparent focus:outline-none"
        />
        <input
          type="number"
          value={height}
          onChange={(e) => setHeight(e.target.value)}
          placeholder="Chiều cao (cm)"
          className="border-2 border-ink px-3 py-2.5 font-mono text-sm bg-transparent focus:outline-none"
        />
        <input
          type="number"
          value={sessions}
          onChange={(e) => setSessions(e.target.value)}
          placeholder="Số buổi tập/tuần"
          className="border-2 border-ink px-3 py-2.5 font-mono text-sm bg-transparent focus:outline-none"
        />
        <select
          value={goal}
          onChange={(e) => setGoal(e.target.value as MacroInput["goal"])}
          className="border-2 border-ink px-3 py-2.5 font-mono text-xs bg-transparent focus:outline-none"
        >
          {(Object.keys(GOAL_LABEL) as MacroInput["goal"][]).map((g) => (
            <option key={g} value={g}>
              {GOAL_LABEL[g]}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={compute}
        className="w-full btn-ink text-chalk font-display stencil text-xs px-6 py-3 mb-4"
      >
        Tính macro →
      </button>

      {result && (
        <div className="grid grid-cols-2 gap-3">
          <div className="training-card p-4 col-span-2">
            <p className="font-mono text-[11px] text-chalk/60">CALO MỖI NGÀY</p>
            <p className="stencil text-2xl text-tape">{result.targetCalories} kcal</p>
            <p className="font-mono text-[11px] text-chalk/50">
              BMR {result.bmr} · TDEE {result.tdee}
            </p>
          </div>
          <div className="border-2 border-ink px-4 py-3">
            <p className="font-mono text-[11px] text-steel">ĐẠM (PROTEIN)</p>
            <p className="font-mono text-xl">{result.proteinG}g</p>
          </div>
          <div className="border-2 border-ink px-4 py-3">
            <p className="font-mono text-[11px] text-steel">TINH BỘT (CARB)</p>
            <p className="font-mono text-xl">{result.carbG}g</p>
          </div>
          <div className="border-2 border-ink px-4 py-3 col-span-2">
            <p className="font-mono text-[11px] text-steel">CHẤT BÉO (FAT)</p>
            <p className="font-mono text-xl">{result.fatG}g</p>
          </div>
        </div>
      )}
    </div>
  );
}
