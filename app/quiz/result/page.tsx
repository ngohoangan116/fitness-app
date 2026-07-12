"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { recommendPlan, PlanResult, QuizAnswers } from "@/lib/planLogic";
import { supabase } from "@/lib/supabase";

type PreviewRow = {
  sets: number;
  reps: string;
  role: string;
};

const CALC_STEPS = [
  "Đang đọc câu trả lời của bạn...",
  "Đang chọn nhóm cơ chính phù hợp...",
  "Đang cân bằng khối lượng tập luyện...",
  "Đang hoàn thiện lộ trình...",
];

export default function ResultPage() {
  const [plan, setPlan] = useState<PlanResult | null>(null);
  const [calculating, setCalculating] = useState(true);
  const [stepIndex, setStepIndex] = useState(0);
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [totalExercises, setTotalExercises] = useState<number | null>(null);
  const [changeOrderCode, setChangeOrderCode] = useState<string | null>(null);
  const [changeStatus, setChangeStatus] = useState<"idle" | "checking" | "error">("idle");
  const [changeError, setChangeError] = useState<string | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("quizAnswers");
    if (!raw) return;
    const answers = JSON.parse(raw) as QuizAnswers;
    setPlan(recommendPlan(answers));
    // Nếu người dùng đến đây từ nút "Đổi lịch tập" ở dashboard, ta có
    // sẵn order_code cần áp lịch mới vào.
    setChangeOrderCode(localStorage.getItem("scheduleChangeOrderCode"));
  }, []);

  async function confirmScheduleChange() {
    if (!plan || !changeOrderCode) return;
    setChangeStatus("checking");
    setChangeError(null);
    try {
      const res = await fetch("/api/schedule-change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_code: changeOrderCode,
          new_plan_id: plan.id,
          new_plan_name: plan.name,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setChangeError(data.error ?? "Có lỗi xảy ra, thử lại sau.");
        setChangeStatus("error");
        return;
      }
      localStorage.removeItem("scheduleChangeOrderCode");
      if (data.applied || data.unchanged) {
        window.location.href = "/dashboard";
        return;
      }
      if (data.requiresPayment) {
        const qs = new URLSearchParams({
          plan: plan.id,
          name: plan.name,
          price: String(data.feeVnd),
          type: "schedule_change",
          target: changeOrderCode,
        });
        window.location.href = `/checkout?${qs.toString()}`;
      }
    } catch {
      setChangeError("Không kết nối được máy chủ.");
      setChangeStatus("error");
    }
  }

  // Hieu ung "dang tinh toan" — thuan giao dien, khong anh huong ket qua that
  useEffect(() => {
    if (!plan) return;
    const interval = setInterval(() => {
      setStepIndex((i) => {
        if (i >= CALC_STEPS.length - 1) {
          clearInterval(interval);
          setCalculating(false);
          return i;
        }
        return i + 1;
      });
    }, 550);
    return () => clearInterval(interval);
  }, [plan]);

  // Lay truoc 2 bai dau cua Buoi 1 (so lieu that) de lam preview mo
  useEffect(() => {
    if (!plan) return;
    (async () => {
      const { data: rows } = await supabase
        .from("plan_exercises")
        .select("sets, reps, role")
        .eq("plan_id", plan.id)
        .eq("day_number", 1)
        .order("order_index", { ascending: true })
        .limit(2);
      setPreviewRows((rows as PreviewRow[]) ?? []);

      const { count } = await supabase
        .from("plan_exercises")
        .select("id", { count: "exact", head: true })
        .eq("plan_id", plan.id);
      setTotalExercises(count ?? null);
    })();
  }, [plan]);

  if (!plan) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-chalk-premium px-6 text-center">
        <div>
          <p className="font-body text-steel mb-4">
            Chưa có dữ liệu bài test. Vui lòng làm lại bài test.
          </p>
          <Link href="/quiz" className="font-mono text-signal underline">
            Quay lại bài test →
          </Link>
        </div>
      </main>
    );
  }

  if (calculating) {
    const pct = Math.round(((stepIndex + 1) / CALC_STEPS.length) * 100);
    return (
      <main className="min-h-screen flex items-center justify-center bg-chalk-premium px-6">
        <div className="max-w-sm w-full text-center">
          <div className="h-1 bg-line/20 mb-6">
            <div
              className="h-1 bg-signal transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="font-mono text-sm text-steel">{CALC_STEPS[stepIndex]}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-chalk-premium px-6 py-20">
      <div className="max-w-lg mx-auto">
        <p className="font-mono text-xs text-signal tracking-widest mb-3">
          LỘ TRÌNH DÀNH RIÊNG CHO BẠN
        </p>
        <h1 className="stencil text-4xl mb-4">{plan.name}</h1>
        <p className="font-body text-steel mb-8">{plan.summary}</p>

        <ul className="space-y-2 mb-8 font-body">
          {plan.focus.map((f) => (
            <li key={f} className="flex gap-3">
              <span className="text-signal">—</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>

        {/* Preview mo — so lieu that, ten bai che lai */}
        {previewRows.length > 0 && (
          <div className="training-card p-5 mb-8 relative overflow-hidden">
            <p className="font-mono text-[11px] text-tape tracking-widest mb-3">
              BUỔI 1 · XEM TRƯỚC
            </p>
            <ul className="space-y-2 mb-2">
              {previewRows.map((r, i) => (
                <li key={i} className="flex items-center justify-between">
                  <span
                    className="font-body text-chalk/90 select-none"
                    style={{ filter: "blur(5px)" }}
                    aria-hidden="true"
                  >
                    ████████ ██████
                  </span>
                  <span className="font-mono text-xs text-chalk/60 shrink-0 ml-3">
                    {r.sets} x {r.reps}
                  </span>
                </li>
              ))}
            </ul>
            <p className="font-mono text-xs text-chalk/50 mt-3">
              {totalExercises ? `+ ${totalExercises - previewRows.length} bài tập khác` : "..."} đã
              được tính riêng cho bạn — mở khóa để xem đầy đủ tên bài, video hướng dẫn và lịch tập
              cả tuần.
            </p>
          </div>
        )}

        <div className="training-card p-6 mb-4">
          <div className="flex justify-between items-baseline">
            <span className="font-body text-chalk/70 text-sm">Giá trọn gói</span>
            <span className="font-mono text-2xl text-tape">
              {plan.priceVnd.toLocaleString("vi-VN")}đ
            </span>
          </div>
          <p className="font-mono text-[11px] text-chalk/50 mt-2">
            Rẻ hơn 1 buổi thuê PT ngoài (300.000 – 500.000đ)
          </p>
        </div>

        {changeOrderCode ? (
          <>
            <button
              onClick={confirmScheduleChange}
              disabled={changeStatus === "checking"}
              className="block w-full text-center btn-ink text-chalk font-display stencil text-sm px-8 py-4 disabled:opacity-50"
            >
              {changeStatus === "checking" ? "Đang kiểm tra..." : "Áp dụng lịch tập mới →"}
            </button>
            {changeError && (
              <p className="font-body text-sm text-signal text-center mt-3">{changeError}</p>
            )}
            <p className="font-body text-xs text-steel text-center mt-4">
              Nếu đã đủ 8 tuần kể từ lần đổi gần nhất, lịch mới được áp dụng miễn phí ngay lập
              tức. Nếu chưa, bạn sẽ được chuyển tới trang thanh toán một khoản phí nhỏ để đổi
              sớm.
            </p>
          </>
        ) : (
          <>
            <Link
              href={`/checkout?plan=${plan.id}&price=${plan.priceVnd}&name=${encodeURIComponent(plan.name)}`}
              className="block text-center btn-ink text-chalk font-display stencil text-sm px-8 py-4"
            >
              Mở khóa lộ trình →
            </Link>

            <Link
              href={`/trial?plan=${plan.id}&price=${plan.priceVnd}&name=${encodeURIComponent(plan.name)}`}
              className="block text-center font-mono text-xs text-signal underline mt-4"
            >
              Chưa chắc chắn? Dùng thử 2 buổi đầu miễn phí →
            </Link>

            <p className="font-body text-xs text-steel text-center mt-4">
              Cam kết đổi gói miễn phí trong 7 ngày đầu nếu chưa phù hợp.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
