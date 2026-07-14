"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { equipmentIconFor } from "@/components/EquipmentIcon";

// So buoi duoc dung thu MIEN PHI — chinh o day de doi 1 hoac 2 tuy y.
const TRIAL_DAYS = 2;

type PlanExerciseRow = {
  id: string;
  day_number: number;
  sets: number;
  reps: string;
  rest_seconds: number;
  order_index: number;
  role: "main" | "accessory" | "cardio";
  exercises: {
    name: string;
    muscle_group: string | null;
    video_url: string | null;
    image_url: string | null;
    instructions: string[] | null;
    equipment: string | null;
  } | null;
};

type PlanMeta = {
  name: string | null;
  description: string | null;
};

const ROLE_LABEL: Record<string, string> = {
  main: "Bài chính",
  accessory: "Bài phụ",
  cardio: "Cardio",
};

function TrialPageInner() {
  const searchParams = useSearchParams();
  const planId = searchParams.get("plan") ?? "";
  const price = searchParams.get("price") ?? "149000";
  const name = searchParams.get("name") ?? "";

  const [loading, setLoading] = useState(true);
  const [planMeta, setPlanMeta] = useState<PlanMeta | null>(null);
  const [unlockedRows, setUnlockedRows] = useState<PlanExerciseRow[]>([]);
  const [totalDays, setTotalDays] = useState(0);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});
  const [openGuide, setOpenGuide] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!planId) {
      setLoading(false);
      return;
    }
    setLoading(true);

    const { data: planData } = await supabase
      .from("workout_plans")
      .select("name, description")
      .eq("id", planId)
      .maybeSingle();
    setPlanMeta(planData ?? null);

    // Chi lay day_number de biet tong so buoi — KHONG lay ten bai tap
    // cho cac buoi bi khoa, tranh lo noi dung qua network request.
    const { data: dayRows } = await supabase
      .from("plan_exercises")
      .select("day_number")
      .eq("plan_id", planId);

    const daySet = Array.from(new Set((dayRows ?? []).map((r) => r.day_number))).sort(
      (a, b) => a - b
    );
    setTotalDays(daySet.length);
    const unlockedDayNumbers = daySet.slice(0, TRIAL_DAYS);

    if (unlockedDayNumbers.length > 0) {
      const { data: fullRows } = await supabase
        .from("plan_exercises")
        .select(
          "id, day_number, sets, reps, rest_seconds, order_index, role, exercises(name, muscle_group, video_url, image_url, instructions, equipment)"
        )
        .eq("plan_id", planId)
        .in("day_number", unlockedDayNumbers)
        .order("day_number", { ascending: true })
        .order("order_index", { ascending: true });
      setUnlockedRows((fullRows as unknown as PlanExerciseRow[]) ?? []);
    }

    setLoading(false);
  }, [planId]);

  useEffect(() => {
    load();
  }, [load]);

  function toggleLocal(id: string) {
    setChecked((c) => ({ ...c, [id]: !c[id] }));
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-chalk-premium">
        <p className="font-mono text-steel">Đang tải...</p>
      </main>
    );
  }

  if (!planId || unlockedRows.length === 0) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-chalk-premium px-6 text-center">
        <div>
          <p className="font-body text-steel mb-4">Không tìm thấy lộ trình để dùng thử.</p>
          <Link href="/quiz" className="font-mono text-signal underline">
            Làm bài test →
          </Link>
        </div>
      </main>
    );
  }

  const unlockedDayNumbers = Array.from(new Set(unlockedRows.map((r) => r.day_number))).sort(
    (a, b) => a - b
  );
  const lockedDayCount = Math.max(totalDays - unlockedDayNumbers.length, 0);
  const checkoutHref = `/checkout?plan=${planId}&price=${price}&name=${encodeURIComponent(name)}`;

  return (
    <main className="min-h-screen bg-chalk-premium pb-24">
      <div className="bg-ink-premium text-chalk">
        <div className="max-w-2xl mx-auto px-6 py-14">
          <p className="font-mono text-xs text-signal tracking-[0.3em] mb-2">
            DÙNG THỬ MIỄN PHÍ · {unlockedDayNumbers.length} BUỔI ĐẦU
          </p>
          <h1 className="stencil text-3xl md:text-4xl mb-2">{planMeta?.name ?? name}</h1>
          {planMeta?.description && (
            <p className="font-mono text-xs text-chalk/60">{planMeta.description}</p>
          )}
        </div>
      </div>
      <div className="hazard-divider" aria-hidden="true" />

      <div className="max-w-2xl mx-auto px-6 py-12">
        {unlockedDayNumbers.map((day) => (
          <div key={day} className="mb-10">
            <h2 className="stencil text-lg text-steel mb-4">Buổi {day}</h2>
            {(["main", "accessory", "cardio"] as const).map((role) => {
              const roleRows = unlockedRows.filter(
                (r) => r.day_number === day && r.role === role
              );
              if (roleRows.length === 0) return null;
              return (
                <div key={role} className="mb-4">
                  <p className="font-mono text-[11px] text-steel/70 tracking-widest mb-2">
                    {ROLE_LABEL[role].toUpperCase()}
                  </p>
                  <ul className="space-y-2">
                    {roleRows.map((r) => (
                      <li key={r.id}>
                        <div
                          className={`flex items-center justify-between border-2 px-5 py-3 transition-colors ${
                            checked[r.id] ? "border-signal/40 bg-signal/5" : "border-ink hover:bg-ink/5"
                          }`}
                        >
                          <label className="flex-1 flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!!checked[r.id]}
                              onChange={() => toggleLocal(r.id)}
                              className="w-5 h-5 accent-signal shrink-0"
                            />
                            <span className="font-body">
                              {r.exercises?.name}
                              <span className="font-mono text-xs text-steel ml-3">
                                {r.sets} x {r.reps}
                                {r.rest_seconds > 0 && ` · nghỉ ${r.rest_seconds}s`}
                              </span>
                            </span>
                          </label>
                          <button
                            type="button"
                            onClick={() =>
                              setOpenGuide((cur) => (cur === r.id ? null : r.id))
                            }
                            className="font-mono text-xs text-signal underline ml-4 shrink-0"
                          >
                            {openGuide === r.id ? "Ẩn hướng dẫn ▲" : "Xem hướng dẫn ▼"}
                          </button>
                        </div>
                        {openGuide === r.id && (
                          <div className="border-2 border-t-0 border-ink px-5 py-4 bg-ink/5">
                            {r.exercises?.image_url && !brokenImages[r.id] ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={r.exercises.image_url}
                                alt={r.exercises?.name ?? "Hướng dẫn bài tập"}
                                className="max-w-xs mb-3 border-2 border-ink"
                                onError={() => setBrokenImages((cur) => ({ ...cur, [r.id]: true }))}
                              />
                            ) : (
                              (() => {
                                const EqIcon = equipmentIconFor(r.exercises?.equipment);
                                return (
                                  <div className="flex flex-col items-center justify-center gap-2 py-6 mb-3 border-2 border-dashed border-steel/30 max-w-xs text-steel">
                                    <EqIcon className="text-steel/60" />
                                    <p className="font-mono text-[11px] text-steel/70 text-center px-3">
                                      Ảnh minh hoạ riêng cho bài này đang được cập nhật
                                    </p>
                                  </div>
                                );
                              })()
                            )}
                            {r.exercises?.instructions && r.exercises.instructions.length > 0 ? (
                              <ol className="list-decimal list-inside space-y-1.5 font-body text-sm text-steel">
                                {r.exercises.instructions.map((step, i) => (
                                  <li key={i}>{step}</li>
                                ))}
                              </ol>
                            ) : (
                              <p className="font-body text-sm text-steel/70 italic">
                                Chưa có hướng dẫn từng bước chi tiết cho bài này — tập theo tên bài
                                và mức tạ/số lần đã ghi ở trên.
                              </p>
                            )}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        ))}

        {lockedDayCount > 0 && (
          <div className="mb-10">
            {Array.from({ length: lockedDayCount }).map((_, i) => (
              <div key={i} className="training-card p-5 mb-3 relative overflow-hidden">
                <p className="stencil text-base text-chalk/90 mb-2">
                  🔒 Buổi {unlockedDayNumbers.length + i + 1}
                </p>
                <div style={{ filter: "blur(4px)" }} aria-hidden="true" className="select-none">
                  <p className="font-mono text-xs text-chalk/50 mb-1">████████████ · 4 x 8</p>
                  <p className="font-mono text-xs text-chalk/50">████████ · 3 x 12</p>
                </div>
                <p className="font-mono text-xs text-tape mt-3">
                  Mua trọn gói để mở khóa buổi này
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Thanh CTA co dinh cuoi trang */}
      <div className="fixed bottom-0 left-0 right-0 bg-ink-premium border-t border-chalk/10 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] text-chalk/50">Thích lộ trình này?</p>
            <p className="font-mono text-sm text-tape">
              {Number(price).toLocaleString("vi-VN")}đ trọn gói {totalDays} buổi
            </p>
          </div>
          <Link
            href={checkoutHref}
            className="shrink-0 bg-signal text-chalk font-display stencil text-sm px-6 py-3"
          >
            Mở khóa toàn bộ →
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function TrialPage() {
  return (
    <Suspense fallback={null}>
      <TrialPageInner />
    </Suspense>
  );
}
