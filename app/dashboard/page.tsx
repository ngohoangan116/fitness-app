"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { calcStreak } from "@/lib/streak";
import { buildWorkoutIcs, downloadIcs } from "@/lib/ics";
import { formatElapsed, minutesBetween } from "@/lib/sessionTimer";
import WeightLog from "@/components/WeightLog";
import MacroCalculator from "@/components/MacroCalculator";
import ShareAchievement from "@/components/ShareAchievement";
import CheckBox from "@/components/CheckBox";
import ChevronIcon from "@/components/ChevronIcon";
import { CheckIcon, FlameIcon, CalendarIcon } from "@/components/Icons";

type PlanExerciseRow = {
  id: string;
  day_number: number;
  day_label: string | null;
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
  } | null;
};

type Order = {
  order_code: string;
  plan_id: string;
  plan_name: string;
  status: string;
  created_at: string;
  plan_updated_at: string | null;
};

// Đổi lịch tập miễn phí sau mỗi 8 tuần kể từ lần bắt đầu / lần đổi gần nhất.
// Đổi sớm hơn thì tính phí — xem checkout?type=schedule_change bên dưới.
const SCHEDULE_CHANGE_COOLDOWN_DAYS = 56; // 8 tuần
const SCHEDULE_CHANGE_FEE_VND = 49000;

type PlanMeta = {
  coaching_notes: string | null;
  description: string | null;
};

const ROLE_LABEL: Record<string, string> = {
  main: "Bài chính",
  accessory: "Bài phụ",
  cardio: "Cardio",
};

const LEVEL_GUIDE: Record<string, { rir: string; note: string }> = {
  "Mới bắt đầu": {
    rir: "RIR 3-4 (dừng khi còn tập được thêm 3-4 lần nữa)",
    note: "Ưu tiên tuyệt đối vào đúng kỹ thuật, tạ nhẹ, tăng dần theo thời gian.",
  },
  "Tập không đều": {
    rir: "RIR 2-3",
    note: "Trọng tâm là xây thói quen tập đều đặn trước khi đẩy cường độ.",
  },
  "Tập đều 3-4 buổi/tuần": {
    rir: "RIR 1-2",
    note: "Có thể đẩy gần sát thất bại ở hiệp cuối mỗi bài chính (không phải bài phụ).",
  },
  "Vận động viên": {
    rir: "RIR 0-1 ở bài chính",
    note: "Có thể cân nhắc drop set / rest-pause nếu muốn tăng mật độ buổi tập.",
  },
};

// Thong tin lien he ho tro — hien ngay lap tuc, khong can cho.
const SUPPORT_ZALO_URL = "https://zalo.me/0367861373";
const SUPPORT_MESSENGER_URL = "https://m.me/Annfit0fficial";

export default function DashboardPage() {
  const [order, setOrder] = useState<Order | null>(null);
  const [planMeta, setPlanMeta] = useState<PlanMeta | null>(null);
  const [rows, setRows] = useState<PlanExerciseRow[]>([]);
  const [progress, setProgress] = useState<Record<string, boolean>>({});
  const [weightNotes, setWeightNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [level, setLevel] = useState<string | null>(null);
  const [showNotes, setShowNotes] = useState(false);
  const [copied, setCopied] = useState(false);
  const [openGuide, setOpenGuide] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  const [bulkSaving, setBulkSaving] = useState<number | null>(null);
  const [runningDay, setRunningDay] = useState<number | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [, setTick] = useState(0);
  const [lastSessionReport, setLastSessionReport] = useState<{ day: number; minutes: number } | null>(
    null
  );

  const load = useCallback(async () => {
    setLoading(true);
    const orderCode = localStorage.getItem("orderCode");

    try {
      const raw = localStorage.getItem("quizAnswers");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.level) setLevel(parsed.level);
      }
    } catch {
      // ignore malformed localStorage data
    }

    if (!orderCode) {
      setLoading(false);
      return;
    }

    const { data: orderData } = await supabase
      .from("orders")
      .select("order_code, plan_id, plan_name, status, created_at, plan_updated_at")
      .eq("order_code", orderCode)
      .maybeSingle();

    setOrder(orderData ?? null);

    if (orderData?.status === "paid") {
      const { data: planRows } = await supabase
        .from("plan_exercises")
        .select(
          "id, day_number, day_label, sets, reps, rest_seconds, order_index, role, exercises(name, muscle_group, video_url, image_url, instructions)"
        )
        .eq("plan_id", orderData.plan_id)
        .order("day_number", { ascending: true })
        .order("order_index", { ascending: true });

      setRows((planRows as unknown as PlanExerciseRow[]) ?? []);

      const { data: planData } = await supabase
        .from("workout_plans")
        .select("coaching_notes, description")
        .eq("id", orderData.plan_id)
        .maybeSingle();
      setPlanMeta(planData ?? null);

      const { data: progressRows } = await supabase
        .from("user_progress")
        .select("plan_exercise_id, completed, weight_note, completed_at")
        .eq("order_code", orderCode);

      const map: Record<string, boolean> = {};
      const notesMap: Record<string, string> = {};
      const completedDates: string[] = [];
      for (const p of progressRows ?? []) {
        map[p.plan_exercise_id] = p.completed;
        if (p.weight_note) notesMap[p.plan_exercise_id] = p.weight_note;
        if (p.completed && p.completed_at) completedDates.push(p.completed_at);
      }
      setProgress(map);
      setWeightNotes(notesMap);
      setStreak(calcStreak(completedDates));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Trong luc dang cho xac nhan, tu dong kiem tra lai moi 25s — khach khong
  // can bam tay lien tuc.
  useEffect(() => {
    if (!order || order.status === "paid") return;
    const interval = setInterval(() => {
      load();
    }, 25000);
    return () => clearInterval(interval);
  }, [order, load]);

  // Dong ho song cho buoi dang bam "Bat dau" — chi de ve lai UI moi giay,
  // khong goi mang.
  useEffect(() => {
    if (runningDay === null) return;
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [runningDay]);

  function startTimer(day: number) {
    setRunningDay(day);
    setStartedAt(Date.now());
    setLastSessionReport(null);
  }

  async function toggle(planExerciseId: string) {
    const orderCode = localStorage.getItem("orderCode");
    if (!orderCode) return;
    const nextVal = !progress[planExerciseId];
    setProgress((p) => ({ ...p, [planExerciseId]: nextVal }));
    await supabase.from("user_progress").upsert(
      {
        order_code: orderCode,
        plan_exercise_id: planExerciseId,
        completed: nextVal,
        completed_at: nextVal ? new Date().toISOString() : null,
        weight_note: weightNotes[planExerciseId] || null,
      },
      { onConflict: "order_code,plan_exercise_id" }
    );
  }

  function updateWeightNoteLocal(planExerciseId: string, value: string) {
    setWeightNotes((w) => ({ ...w, [planExerciseId]: value }));
  }

  async function saveWeightNote(planExerciseId: string) {
    const orderCode = localStorage.getItem("orderCode");
    if (!orderCode) return;
    await supabase.from("user_progress").upsert(
      {
        order_code: orderCode,
        plan_exercise_id: planExerciseId,
        completed: progress[planExerciseId] ?? false,
        weight_note: weightNotes[planExerciseId] || null,
      },
      { onConflict: "order_code,plan_exercise_id" }
    );
  }

  function copyOrderCode(code: string) {
    navigator.clipboard?.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function completeWholeDay(day: number) {
    const orderCode = localStorage.getItem("orderCode");
    if (!orderCode) return;
    const dayRows = rows.filter((r) => r.day_number === day);
    setBulkSaving(day);

    const nowIso = new Date().toISOString();
    setProgress((p) => {
      const next = { ...p };
      for (const r of dayRows) next[r.id] = true;
      return next;
    });

    await supabase.from("user_progress").upsert(
      dayRows.map((r) => ({
        order_code: orderCode,
        plan_exercise_id: r.id,
        completed: true,
        completed_at: nowIso,
        weight_note: weightNotes[r.id] || null,
      })),
      { onConflict: "order_code,plan_exercise_id" }
    );

    // Neu dong ho dang chay cho dung buoi nay, dung lai va ghi tong so phut.
    if (runningDay === day && startedAt) {
      const endMs = Date.now();
      const minutes = minutesBetween(startedAt, endMs);
      await supabase.from("session_logs").insert({
        order_code: orderCode,
        day_number: day,
        started_at: new Date(startedAt).toISOString(),
        ended_at: new Date(endMs).toISOString(),
        minutes,
      });
      setLastSessionReport({ day, minutes });
      setRunningDay(null);
      setStartedAt(null);
    }

    setBulkSaving(null);
  }

  function downloadCalendar() {
    if (!order) return;
    const days = Array.from(new Set(rows.map((r) => r.day_number))).sort((a, b) => a - b);
    const icsDays = days.map((d) => ({
      dayNumber: d,
      label: labelForDay(d),
      exerciseNames: rows
        .filter((r) => r.day_number === d)
        .map((r) => r.exercises?.name ?? "")
        .filter(Boolean),
    }));
    const ics = buildWorkoutIcs({ planName: order.plan_name, days: icsDays });
    downloadIcs(ics, `so-tap-${order.order_code}.ics`);
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-chalk-premium">
        <p className="font-mono text-steel">Đang tải...</p>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-chalk-premium px-6 text-center">
        <div>
          <p className="font-body text-steel mb-4">
            Không tìm thấy đơn hàng. Vui lòng thanh toán qua trang checkout trước.
          </p>
          <a href="/login" className="font-mono text-xs text-signal underline">
            Đã mua gói ở máy khác? Đăng nhập lại bằng số điện thoại →
          </a>
        </div>
      </main>
    );
  }

  if (order.status !== "paid") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-chalk-premium px-6 text-center py-16">
        <div className="training-card p-8 max-w-sm w-full">
          <p className="stencil text-xl text-tape mb-3">Đang chờ xác nhận</p>
          <p className="font-body text-sm text-chalk/80 mb-4">
            Đơn hàng <span className="font-mono">{order.order_code}</span> chưa
            được xác nhận thanh toán. Trang sẽ tự kiểm tra lại mỗi ít giây.
          </p>
          <button onClick={load} className="font-mono text-xs text-tape underline mb-6">
            Kiểm tra lại ngay
          </button>

          <div className="text-left border-t border-chalk/15 pt-5">
            <p className="font-mono text-[11px] text-chalk/50 tracking-widest mb-2">
              CHƯA THẤY MỞ KHÓA?
            </p>
            <ul className="font-body text-xs text-chalk/60 space-y-1.5 mb-5 list-disc list-inside">
              <li>Nội dung chuyển khoản có đúng mã đơn {order.order_code} không?</li>
              <li>Nhắn ngay cho admin để được hỗ trợ nhanh nhất, 24/7.</li>
            </ul>

            <button
              onClick={() => copyOrderCode(order.order_code)}
              className="w-full font-mono text-xs border border-chalk/30 text-chalk/80 px-3 py-2 mb-2 hover:bg-chalk/10 transition-colors"
            >
              {copied ? "Đã copy mã đơn ✓" : `Copy mã đơn: ${order.order_code}`}
            </button>
            <a
              href={SUPPORT_ZALO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center font-mono text-xs bg-signal text-chalk px-3 py-2.5 mb-2"
            >
              Nhắn Zalo cho admin →
            </a>
            <a
              href={SUPPORT_MESSENGER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center font-mono text-xs border-2 border-chalk/30 text-chalk px-3 py-2.5"
            >
              Nhắn Messenger →
            </a>
            <p className="font-body text-[11px] text-chalk/40 mt-3">
              Nhớ dán mã đơn hàng vào tin nhắn để admin xử lý nhanh hơn.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const days = Array.from(new Set(rows.map((r) => r.day_number))).sort((a, b) => a - b);
  const guide = level ? LEVEL_GUIDE[level] : null;

  // "Buổi 1 · Upper" nếu có day_label (lịch mới), fallback "Buổi 1" cho
  // dữ liệu cũ chưa có cột này.
  function labelForDay(day: number) {
    const dayLabel = rows.find((r) => r.day_number === day)?.day_label;
    return dayLabel ? `Buổi ${day} · ${dayLabel}` : `Buổi ${day}`;
  }

  const sinceMs = new Date(order.plan_updated_at ?? order.created_at).getTime();
  const daysSincePlanChange = Math.floor((Date.now() - sinceMs) / (1000 * 60 * 60 * 24));
  const daysUntilFreeChange = Math.max(0, SCHEDULE_CHANGE_COOLDOWN_DAYS - daysSincePlanChange);
  const canChangeForFree = daysUntilFreeChange === 0;

  function startScheduleChange() {
    if (!order) return;
    localStorage.setItem("scheduleChangeOrderCode", order.order_code);
    window.location.href = "/quiz";
  }

  const dayCompletion = (day: number) => {
    const dayRows = rows.filter((r) => r.day_number === day);
    const done = dayRows.filter((r) => progress[r.id]).length;
    return { done, total: dayRows.length };
  };

  const totalDone = rows.filter((r) => progress[r.id]).length;
  const totalAll = rows.length;
  const overallPct = totalAll > 0 ? Math.round((totalDone / totalAll) * 100) : 0;

  const GUARANTEE_DAYS = 7;
  const daysSincePurchase = Math.floor(
    (Date.now() - new Date(order.created_at).getTime()) / (1000 * 60 * 60 * 24)
  );
  const guaranteeDaysLeft = Math.max(0, GUARANTEE_DAYS - daysSincePurchase);

  const goalFromPlanId = order.plan_id.split("-")[0] as
    | "hypertrophy"
    | "fatloss"
    | "endurance"
    | "maintenance";
  const sessionsPerWeekGuess = order.plan_id.includes("3day") ? 3 : 4;

  return (
    <main className="min-h-screen bg-chalk-premium text-chalk pb-20">
      <div className="max-w-xl mx-auto px-6">
        <div className="flex items-center justify-between py-6 mb-6">
          <h1 className="stencil text-3xl text-tape">Dashboard</h1>
          <div className="flex items-center gap-3">
            <a
              href="/quiz"
              className="inline-flex items-center gap-1.5 font-mono text-xs text-steel hover:text-tape transition-colors"
            >
              <FlameIcon className="w-4 h-4" />
              Đổi mục tiêu
            </a>
            <button
              onClick={downloadCalendar}
              className="inline-flex items-center gap-1.5 font-mono text-xs text-steel hover:text-tape transition-colors"
            >
              <CalendarIcon className="w-4 h-4" />
              Xuất lịch
            </button>
          </div>
        </div>

        {guaranteeDaysLeft > 0 && (
          <div className="training-card p-5 mb-8">
            <p className="font-mono text-[11px] text-tape tracking-widest mb-1">HOÀN TIỀN</p>
            <p className="font-body text-sm text-chalk/90">
              Bạn còn {guaranteeDaysLeft} ngày để yêu cầu hoàn tiền nếu không hài lòng.
            </p>
          </div>
        )}

        {planMeta?.coaching_notes && (
          <div className="training-card p-5 mb-8">
            <p className="font-mono text-[11px] text-tape tracking-widest mb-1">GHI CHÚ</p>
            <p className="font-body text-sm text-chalk/90 whitespace-pre-wrap">
              {planMeta.coaching_notes}
            </p>
          </div>
        )}

        {guide && (
          <div className="training-card p-5 mb-8">
            <p className="font-mono text-[11px] text-tape tracking-widest mb-1">HƯỚNG DẪN</p>
            <p className="font-body text-sm text-chalk/90 mb-2">
              Mức độ của bạn: <span className="font-bold">{level}</span>
            </p>
            <p className="font-body text-sm text-chalk/90 mb-2">{guide.rir}</p>
            <p className="font-body text-sm text-chalk/70">{guide.note}</p>
          </div>
        )}

        <WeightLog orderCode={order.order_code} />

        <MacroCalculator defaultGoal={goalFromPlanId} defaultSessionsPerWeek={sessionsPerWeekGuess} />

        {totalAll > 0 && (
          <ShareAchievement planName={order.plan_name} overallPct={overallPct} streak={streak} />
        )}

        <div className="training-card p-5 mb-8">
          <p className="font-mono text-[11px] text-tape tracking-widest mb-1">ĐỔI LỊCH TẬP</p>
          {canChangeForFree ? (
            <>
              <p className="font-body text-sm text-chalk/90 mb-3">
                Bạn đã tập đủ 8 tuần với lịch hiện tại — có thể đổi sang lịch mới miễn phí.
              </p>
              <button
                onClick={startScheduleChange}
                className="font-mono text-xs border-2 border-tape text-tape px-4 py-2.5"
              >
                Làm lại bài test & đổi lịch (miễn phí) →
              </button>
            </>
          ) : (
            <>
              <p className="font-body text-sm text-chalk/70 mb-3">
                Còn {daysUntilFreeChange} ngày nữa là đủ 8 tuần để đổi lịch miễn phí. Muốn đổi
                sớm hơn? Chỉ mất phí {SCHEDULE_CHANGE_FEE_VND.toLocaleString("vi-VN")}đ.
              </p>
              <button
                onClick={startScheduleChange}
                className="font-mono text-xs border-2 border-chalk/30 text-chalk/70 px-4 py-2.5"
              >
                Đổi lịch sớm ({SCHEDULE_CHANGE_FEE_VND.toLocaleString("vi-VN")}đ) →
              </button>
            </>
          )}
        </div>

        {days.map((day) => {
          const { done, total } = dayCompletion(day);
          const isComplete = total > 0 && done === total;
          return (
            <div key={day} className="mb-10 relative">
              <div className="flex items-baseline justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h2 className="stencil text-lg text-steel">{labelForDay(day)}</h2>
                  {isComplete && (
                    <span
                      className="stamp text-signal text-[9px] w-16 h-16 flex flex-col items-center justify-center text-center gap-0.5 px-1 shrink-0"
                      style={{ transform: "rotate(-10deg)" }}
                    >
                      <MedalIcon className="w-4 h-4" />
                      HOÀN THÀNH
                    </span>
                  )}
                </div>
                <span className="font-mono text-xs text-steel flex items-center gap-3">
                  {done}/{total} bài
                  {runningDay === day && startedAt && (
                    <span className="font-mono text-sm font-bold bg-ink/10 text-ink rounded-full px-3 py-1.5">
                      ⏱ {formatElapsed(Date.now() - startedAt)}
                    </span>
                  )}
                  {done < total && runningDay !== day && (
                    <button
                      onClick={() => startTimer(day)}
                      className="inline-flex items-center gap-1.5 font-mono text-[11px] text-signal hover:text-tape transition-colors"
                    >
                      ▶ Bắt đầu
                    </button>
                  )}
                  {done < total && (
                    <button
                      onClick={() => completeWholeDay(day)}
                      disabled={bulkSaving === day}
                      className="inline-flex items-center gap-1.5 font-mono text-[11px] text-signal hover:text-tape transition-colors disabled:opacity-40"
                    >
                      <CheckIcon className="w-3.5 h-3.5" />
                      {bulkSaving === day ? "Đang lưu..." : "Hoàn thành cả buổi"}
                    </button>
                  )}
                </span>
              </div>

              {lastSessionReport?.day === day && (
                <p className="font-mono text-xs text-tape mb-3">
                  ⏱ Bạn đã tập {lastSessionReport.minutes} phút hôm nay!
                </p>
              )}

              {(["main", "accessory", "cardio"] as const).map((role) => {
                const roleRows = rows.filter((r) => r.day_number === day && r.role === role);
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
                              progress[r.id]
                                ? "border-signal/40 bg-signal/5"
                                : "border-ink hover:bg-ink/5"
                            }`}
                          >
                            <label className="flex-1 flex items-center gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={!!progress[r.id]}
                                onChange={() => toggle(r.id)}
                                className="sr-only peer"
                              />
                              <CheckBox checked={!!progress[r.id]} onChange={() => toggle(r.id)} />
                              <span className="font-body">
                                {r.exercises?.name}
                                <span className="font-mono text-xs text-steel ml-3">
                                  {r.sets} x {r.reps}
                                  {r.rest_seconds > 0 && ` · nghỉ ${r.rest_seconds}s`}
                                </span>
                              </span>
                            </label>
                            <input
                              type="text"
                              value={weightNotes[r.id] ?? ""}
                              onChange={(e) => updateWeightNoteLocal(r.id, e.target.value)}
                              onBlur={() => saveWeightNote(r.id)}
                              onClick={(e) => e.stopPropagation()}
                              placeholder="Nhập mức tạ"
                              className="font-mono text-xs w-20 md:w-28 border-b-2 border-steel/30 bg-transparent focus:outline-none focus:border-signal px-1 py-1 mx-3 shrink-0"
                            />
                            
                            {(r.exercises?.image_url ||
                              (r.exercises?.instructions && r.exercises.instructions.length > 0)) && (
                              <button
                                type="button"
                                onClick={() =>
                                  setOpenGuide((cur) => (cur === r.id ? null : r.id))
                                }
                                className="inline-flex items-center gap-1.5 font-mono text-xs text-signal hover:text-tape transition-colors ml-4 shrink-0"
                              >
                                <GuideIcon className="w-4 h-4" />
                                Hướng dẫn
                                <ChevronIcon open={openGuide === r.id} />
                              </button>
                            )}
                          </div>
                          {openGuide === r.id && (
                            <div className="border-2 border-t-0 border-ink px-5 py-4 bg-ink/5">
                              {r.exercises?.image_url && (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img
                                 src={r.exercises.image_url}
                                  alt={r.exercises?.name ?? "Hướng dẫn bài tập"}
                                 className="max-w-lg w-full mb-3 border-2 border-ink rounded-lg shadow-lg"
                                style={{ maxHeight: '400px', objectFit: 'contain' }}
                               />
                              )}
                              {r.exercises?.instructions && r.exercises.instructions.length > 0 && (
                                <ol className="list-decimal list-inside space-y-1.5 font-body text-sm text-steel">
                                  {r.exercises.instructions.map((step, i) => (
                                    <li key={i}>{step}</li>
                                  ))}
                                </ol>
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
          );
        })}
      </div>
    </main>
  );
}

function MedalIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx={12} cy={14} r={6} stroke="currentColor" strokeWidth={2} />
      <path d="M12 10.5l1.1 2.3 2.5.35-1.8 1.75.43 2.5-2.23-1.18-2.23 1.18.43-2.5-1.8-1.75 2.5-.35L12 10.5z" fill="currentColor" />
      <path d="M9 3.5L7 9M15 3.5L17 9" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

function GuideIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx={12} cy={12} r={9} stroke="currentColor" strokeWidth={2} />
      <path d="M12 11v5.5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
      <circle cx={12} cy={7.6} r={1.15} fill="currentColor" />
    </svg>
  );
}
