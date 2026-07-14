"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { calcStreak } from "@/lib/streak";
import { buildWorkoutIcs, downloadIcs } from "@/lib/ics";
import { formatElapsed, minutesBetween } from "@/lib/sessionTimer";
import WeightLog from "@/components/WeightLog";
import MacroCalculator from "@/components/MacroCalculator";
import ShareAchievement from "@/components/ShareAchievement";
import { equipmentIconFor } from "@/components/EquipmentIcon";

// Icon SVG gọn, theo đúng nét "stencil" của web (nét dày, bo góc nhẹ) —
// dùng thay cho checkbox mặc định trình duyệt + ký tự ▼▲ trước đây.
function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M5 12.5L9.5 17L19 7"
        stroke="currentColor"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function ChevronIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M6 9L12 15L18 9"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function PlayIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M7 4.5v15l13-7.5-13-7.5z" fill="currentColor" />
    </svg>
  );
}
function ClockIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx={12} cy={12} r={9} stroke="currentColor" strokeWidth={2} />
      <path d="M12 7v5.5l3.5 2" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function DumbbellIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="1" y="9" width="3" height="6" rx="1" fill="currentColor" />
      <rect x="20" y="9" width="3" height="6" rx="1" fill="currentColor" />
      <rect x="5" y="7" width="2.5" height="10" rx="1" fill="currentColor" />
      <rect x="16.5" y="7" width="2.5" height="10" rx="1" fill="currentColor" />
      <path d="M7.5 12h9" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" />
    </svg>
  );
}
function TargetIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx={12} cy={12} r={8} stroke="currentColor" strokeWidth={2} />
      <circle cx={12} cy={12} r={3} fill="currentColor" />
    </svg>
  );
}
function PulseIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M3 12h4l2-6 4 12 2-6h6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
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
function MedalIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx={12} cy={14} r={6} stroke="currentColor" strokeWidth={2} />
      <path d="M12 10.5l1.1 2.3 2.5.35-1.8 1.75.43 2.5-2.23-1.18-2.23 1.18.43-2.5-1.8-1.75 2.5-.35L12 10.5z" fill="currentColor" />
      <path d="M9 3.5L7 9M15 3.5L17 9" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

function FlameIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M8.5 14.5c0 2 1.5 3.5 3.5 3.5s3.5-1.5 3.5-3.5c0-1.2-.6-2.3-1.5-3-1-3.5-3.5-5-3.5-5s.5 2.5-1.5 4.5c-.8.8-1.5 2-1.5 3.5z" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CalendarIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth={2} />
      <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}


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
    equipment: string | null;
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

const SCHEDULE_CHANGE_COOLDOWN_DAYS = 56;
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

// Mau sac + icon rieng cho tung loai bai tap, giup phan biet nhanh
// bang mat thay vi chi doc chu.
const ROLE_STYLE: Record<string, { Icon: (p: { className?: string }) => JSX.Element; badgeBg: string; badgeText: string; accentBg: string }> = {
  main: { Icon: DumbbellIcon, badgeBg: "bg-signal/10", badgeText: "text-signal", accentBg: "bg-signal" },
  accessory: { Icon: TargetIcon, badgeBg: "bg-steel/15", badgeText: "text-steel", accentBg: "bg-steel" },
  cardio: { Icon: PulseIcon, badgeBg: "bg-tape/25", badgeText: "text-ink", accentBg: "bg-tape" },
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
    } catch {}

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
        .select("id, day_number, day_label, sets, reps, rest_seconds, order_index, role, exercises(name, muscle_group, video_url, image_url, instructions, equipment)")
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

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!order || order.status === "paid") return;
    const interval = setInterval(() => { load(); }, 25000);
    return () => clearInterval(interval);
  }, [order, load]);

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
    const daysArr = Array.from(new Set(rows.map((r) => r.day_number))).sort((a, b) => a - b);
    const icsDays = daysArr.map((d) => ({
      dayNumber: d,
      label: labelForDay(d),
      exerciseNames: rows.filter((r) => r.day_number === d).map((r) => r.exercises?.name ?? "").filter(Boolean),
    }));
    const ics = buildWorkoutIcs({ planName: order.plan_name, days: icsDays });
    downloadIcs(ics, `so-tap-${order.order_code}.ics`);
  }

  if (loading) return <main className="min-h-screen flex items-center justify-center bg-chalk-premium"><p className="font-mono text-steel">Đang tải...</p></main>;
  if (!order) return <main className="min-h-screen flex items-center justify-center bg-chalk-premium px-6 text-center"><div><p className="font-body text-steel mb-4">Không tìm thấy đơn hàng.</p><a href="/login" className="font-mono text-xs text-signal underline">Đăng nhập lại →</a></div></main>;

  if (order.status !== "paid") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-chalk-premium px-6 text-center py-16">
        <div className="training-card p-8 max-w-sm w-full">
          <p className="stencil text-xl text-tape mb-3">Đang chờ xác nhận</p>
          <p className="font-body text-sm text-chalk/80 mb-4">Đơn hàng <span className="font-mono">{order.order_code}</span> chưa được xác nhận.</p>
          <button onClick={load} className="font-mono text-xs text-tape underline mb-6">Kiểm tra lại ngay</button>
          <div className="text-left border-t border-chalk/15 pt-5">
            <button onClick={() => copyOrderCode(order.order_code)} className="w-full font-mono text-xs border border-chalk/30 text-chalk/80 px-3 py-2 mb-2 hover:bg-chalk/10 transition-colors">{copied ? "Đã copy ✓" : `Copy mã đơn: ${order.order_code}`}</button>
            <a href={SUPPORT_ZALO_URL} target="_blank" rel="noopener noreferrer" className="block text-center font-mono text-xs bg-signal text-chalk px-3 py-2.5 mb-2">Nhắn Zalo cho admin →</a>
          </div>
        </div>
      </main>
    );
  }

  const daysArr = Array.from(new Set(rows.map((r) => r.day_number))).sort((a, b) => a - b);
  const guide = level ? LEVEL_GUIDE[level] : null;
  function labelForDay(day: number) {
    const dayLabel = rows.find((r) => r.day_number === day)?.day_label;
    return dayLabel ? `Buổi ${day} · ${dayLabel}` : `Buổi ${day}`;
  }

  const sinceMs = new Date(order.plan_updated_at ?? order.created_at).getTime();
  const daysSincePlanChange = Math.floor((Date.now() - sinceMs) / (1000 * 60 * 60 * 24));
  const daysUntilFreeChange = Math.max(0, SCHEDULE_CHANGE_COOLDOWN_DAYS - daysSincePlanChange);
  const canChangeForFree = daysUntilFreeChange === 0;

  const dayCompletion = (day: number) => {
    const dayRows = rows.filter((r) => r.day_number === day);
    const done = dayRows.filter((r) => progress[r.id]).length;
    return { done, total: dayRows.length };
  };

  const totalDone = rows.filter((r) => progress[r.id]).length;
  const totalAll = rows.length;
  const overallPct = totalAll > 0 ? Math.round((totalDone / totalAll) * 100) : 0;
  const sessionsPerWeekGuess = order.plan_id.includes("3day") ? 3 : 4;

  return (
    <main className="min-h-screen bg-chalk-premium text-ink pb-20">
      <div className="max-w-xl mx-auto px-6">
        <div className="flex items-center justify-between py-6 mb-6">
          <h1 className="stencil text-3xl text-ink">Dashboard</h1>
          <div className="flex items-center gap-2">
            <a href="/quiz" className="inline-flex items-center gap-1.5 font-mono text-xs text-signal bg-signal/10 hover:bg-signal/15 rounded-full px-3 py-1.5 transition-colors"><FlameIcon className="w-4 h-4" />Đổi mục tiêu</a>
            <button onClick={downloadCalendar} className="inline-flex items-center gap-1.5 font-mono text-xs text-ink bg-tape/25 hover:bg-tape/35 rounded-full px-3 py-1.5 transition-colors"><CalendarIcon className="w-4 h-4" />Xuất lịch</button>
          </div>
        </div>

        {planMeta?.coaching_notes && (
          <div className="training-card p-5 mb-8">
            <p className="font-mono text-[11px] text-tape tracking-widest mb-1">GHI CHÚ TỪ COACH</p>
            <p className="font-body text-sm text-chalk/90 whitespace-pre-wrap">{planMeta.coaching_notes}</p>
          </div>
        )}

        {guide && (
          <div className="training-card p-5 mb-8">
            <p className="font-mono text-[11px] text-tape tracking-widest mb-1">HƯỚNG DẪN CƯỜNG ĐỘ</p>
            <p className="font-body text-sm text-chalk/90 mb-2">Mức độ: <span className="font-bold">{level}</span></p>
            <p className="font-body text-sm text-chalk/90 mb-2">{guide.rir}</p>
            <p className="font-body text-sm text-chalk/70">{guide.note}</p>
          </div>
        )}

        <WeightLog orderCode={order.order_code} />
        <MacroCalculator defaultGoal={order.plan_id.split("-")[0] as any} defaultSessionsPerWeek={sessionsPerWeekGuess} />

        {totalAll > 0 && <ShareAchievement planName={order.plan_name} overallPct={overallPct} streak={streak} />}

        <div className="training-card p-5 mb-8">
          <p className="font-mono text-[11px] text-tape tracking-widest mb-1">ĐỔI LỊCH TẬP</p>
          <p className="font-body text-sm text-chalk/70 mb-3">{canChangeForFree ? "Đã đủ 8 tuần, đổi miễn phí ngay!" : `Còn ${daysUntilFreeChange} ngày nữa để đổi miễn phí.`}</p>
          <button onClick={() => window.location.href="/quiz"} className={`font-mono text-xs border-2 px-4 py-2.5 ${canChangeForFree ? 'border-tape text-tape' : 'border-chalk/30 text-chalk/70'}`}>{canChangeForFree ? "Đổi lịch (miễn phí) →" : `Đổi lịch sớm (${SCHEDULE_CHANGE_FEE_VND.toLocaleString()}đ) →`}</button>
        </div>

        {daysArr.map((day) => {
          const { done, total } = dayCompletion(day);
          const isComplete = total > 0 && done === total;
          return (
            <div key={day} className="mb-10 relative">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-ink text-chalk font-mono text-sm font-bold flex items-center justify-center shrink-0">{day}</span>
                  <h2 className="stencil text-lg text-steel">{labelForDay(day)}</h2>
                  {isComplete && (
                    <span className="stamp text-signal text-[9px] w-16 h-16 flex flex-col items-center justify-center text-center gap-0.5 px-1 shrink-0" style={{ transform: "rotate(-10deg)" }}>
                      <MedalIcon className="w-4 h-4" />HOÀN THÀNH
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs text-steel bg-ink/5 rounded-full px-3 py-1.5">
                    {done}/{total} bài
                  </span>
                  {runningDay === day && startedAt && (
                    <span className="inline-flex items-center gap-1.5 font-mono text-sm font-bold bg-tape text-ink rounded-full px-3 py-1.5">
                      <span className="w-2 h-2 rounded-full bg-signal animate-pulse" />
                      {formatElapsed(Date.now() - startedAt)}
                    </span>
                  )}
                  {done < total && runningDay !== day && (
                    <button
                      onClick={() => startTimer(day)}
                      className="inline-flex items-center gap-1.5 font-mono text-xs font-bold bg-tape text-ink rounded-full px-4 py-2 shadow-sm hover:brightness-95 transition"
                    >
                      <PlayIcon className="w-3.5 h-3.5" />
                      Bắt đầu
                    </button>
                  )}
                  {done < total && (
                    <button
                      onClick={() => completeWholeDay(day)}
                      disabled={bulkSaving === day}
                      className="inline-flex items-center gap-1.5 font-mono text-xs font-bold bg-signal text-chalk rounded-full px-4 py-2 shadow-sm hover:brightness-95 transition disabled:opacity-40"
                    >
                      <CheckIcon className="w-3.5 h-3.5" />
                      {bulkSaving === day ? "Đang lưu..." : "Hoàn thành cả buổi"}
                    </button>
                  )}
                </div>
              </div>

              {lastSessionReport?.day === day && <p className="font-mono text-xs text-tape mb-3">⏱ Bạn đã tập {lastSessionReport.minutes} phút!</p>}

              {(["main", "accessory", "cardio"] as const).map((role) => {
                const roleRows = rows.filter((r) => r.day_number === day && r.role === role);
                if (roleRows.length === 0) return null;
                const RoleIcon = ROLE_STYLE[role].Icon;
                return (
                  <div key={role} className="mb-4">
                    <p className={`inline-flex items-center gap-1.5 font-mono text-[11px] font-bold ${ROLE_STYLE[role].badgeText} ${ROLE_STYLE[role].badgeBg} rounded-full px-3 py-1 tracking-widest mb-2`}>
                      <RoleIcon className="w-3.5 h-3.5" />
                      {ROLE_LABEL[role].toUpperCase()}
                    </p>
                    <ul className="space-y-2">
                      {roleRows.map((r) => (
                        <li key={r.id}>
                          <div className={`relative overflow-hidden flex items-center justify-between border-2 pl-6 pr-5 py-3 transition-colors ${progress[r.id] ? "border-signal/40 bg-signal/5" : "border-ink hover:bg-ink/5"}`}>
                            <span className={`absolute left-0 top-0 bottom-0 w-1.5 ${ROLE_STYLE[role].accentBg}`} aria-hidden="true" />
                            <label className="flex-1 flex items-center gap-3 cursor-pointer">
                              <input type="checkbox" checked={!!progress[r.id]} onChange={() => toggle(r.id)} className="sr-only peer" />
                              <span className={`relative w-6 h-6 shrink-0 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${progress[r.id] ? "bg-signal border-signal" : "border-steel/40 peer-hover:border-signal/70"}`}><CheckIcon className={`w-4 h-4 text-chalk transition-all ${progress[r.id] ? "scale-100 opacity-100" : "scale-50 opacity-0"}`} /></span>
                              <span className="font-body text-ink">{r.exercises?.name}<span className="font-mono text-xs text-steel ml-3">{r.sets} x {r.reps}{r.rest_seconds > 0 && ` · nghỉ ${r.rest_seconds}s`}</span></span>
                            </label>
                            <input type="text" value={weightNotes[r.id] ?? ""} onChange={(e) => updateWeightNoteLocal(r.id, e.target.value)} onBlur={() => saveWeightNote(r.id)} placeholder="Mức tạ" className="font-mono text-xs w-20 md:w-28 border-b-2 border-steel/30 bg-transparent focus:outline-none focus:border-signal px-1 py-1 mx-3 shrink-0" />
                            <button type="button" onClick={() => setOpenGuide((cur) => (cur === r.id ? null : r.id))} className="font-mono text-xs text-signal bg-signal/10 hover:bg-signal/15 rounded-full px-3 py-1.5 flex items-center gap-1.5 ml-4 shrink-0 transition-colors">Hướng dẫn <ChevronIcon className={`w-3.5 h-3.5 transition-transform ${openGuide === r.id ? "rotate-180" : ""}`} /></button>
                          </div>
                          {openGuide === r.id && (
                            <div className="border-2 border-t-0 border-ink px-5 py-4 bg-ink/5">
                              {r.exercises?.image_url ? (
                                <img src={r.exercises.image_url} alt="HD" className="max-w-lg w-full mb-3 border-2 border-ink rounded-lg shadow-lg" style={{ maxHeight: '400px', objectFit: 'contain' }} />
                              ) : (
                                (() => {
                                  const EqIcon = equipmentIconFor(r.exercises?.equipment);
                                  return (
                                    <div className="flex flex-col items-center justify-center gap-2 py-6 mb-3 border-2 border-dashed border-steel/30 rounded-lg text-steel">
                                      <EqIcon className="text-steel/60" />
                                      <p className="font-mono text-[11px] text-steel/70">Ảnh minh hoạ riêng cho bài này đang được cập nhật</p>
                                    </div>
                                  );
                                })()
                              )}
                              {r.exercises?.instructions ? (
                                <ol className="list-decimal list-inside space-y-1.5 font-body text-sm text-steel">{r.exercises.instructions.map((step, i) => <li key={i}>{step}</li>)}</ol>
                              ) : (
                                <p className="font-body text-sm text-steel/70 italic">Chưa có hướng dẫn từng bước chi tiết cho bài này — tập theo tên bài và mức tạ/số lần đã ghi ở trên.</p>
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
