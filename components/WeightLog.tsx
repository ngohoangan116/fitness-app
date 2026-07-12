"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

type BodyLog = {
  log_date: string;
  weight_kg: number;
};

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export default function WeightLog({ orderCode }: { orderCode: string }) {
  const [logs, setLogs] = useState<BodyLog[]>([]);
  const [weightInput, setWeightInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("body_logs")
      .select("log_date, weight_kg")
      .eq("order_code", orderCode)
      .order("log_date", { ascending: true });
    setLogs((data as BodyLog[]) ?? []);
    setLoaded(true);
  }, [orderCode]);

  useEffect(() => {
    load();
  }, [load]);

  async function saveWeight() {
    const w = parseFloat(weightInput.replace(",", "."));
    if (!w || w <= 0 || w > 400) return;
    setSaving(true);
    await supabase.from("body_logs").upsert(
      { order_code: orderCode, log_date: todayStr(), weight_kg: w },
      { onConflict: "order_code,log_date" }
    );
    setWeightInput("");
    await load();
    setSaving(false);
  }

  if (!loaded) return null;

  const hasToday = logs.some((l) => l.log_date === todayStr());
  const latest = logs[logs.length - 1];
  const first = logs[0];
  const diff = logs.length >= 2 ? Math.round((latest.weight_kg - first.weight_kg) * 10) / 10 : null;

  return (
    <div className="border-2 border-line/40 px-5 py-5 mb-6">
      <p className="font-mono text-[11px] text-signal tracking-widest mb-3">
        NHẬT KÝ CÂN NẶNG
      </p>

      {!hasToday && (
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            inputMode="decimal"
            value={weightInput}
            onChange={(e) => setWeightInput(e.target.value)}
            placeholder="Cân nặng hôm nay (kg)"
            className="flex-1 border-2 border-ink px-4 py-2.5 font-mono text-sm bg-transparent focus:outline-none"
          />
          <button
            onClick={saveWeight}
            disabled={saving || !weightInput}
            className="btn-ink text-chalk font-display stencil text-xs px-5 py-2.5 disabled:opacity-40 shrink-0"
          >
            Lưu
          </button>
        </div>
      )}
      {hasToday && (
        <p className="font-body text-xs text-steel mb-4">
          Đã ghi nhận cân nặng hôm nay: <span className="font-mono">{latest.weight_kg}kg</span>
        </p>
      )}

      {logs.length === 0 && (
        <p className="font-body text-xs text-steel">
          Ghi lại cân nặng mỗi tuần để theo dõi tiến độ theo thời gian.
        </p>
      )}

      {logs.length > 0 && logs.length < 3 && (
        <p className="font-body text-xs text-steel">
          Đã ghi {logs.length} lần — cần thêm {3 - logs.length} lần nữa để hiện biểu đồ tiến độ.
        </p>
      )}

      {logs.length >= 3 && (
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <p className="font-mono text-xs text-steel">
              {first.log_date} → {latest.log_date}
            </p>
            {diff !== null && (
              <p className={`font-mono text-sm ${diff <= 0 ? "text-signal" : "text-tape"}`}>
                {diff > 0 ? "+" : ""}
                {diff}kg
              </p>
            )}
          </div>
          <WeightChart logs={logs} />
        </div>
      )}
    </div>
  );
}

function WeightChart({ logs }: { logs: BodyLog[] }) {
  const width = 320;
  const height = 100;
  const padding = 8;

  const weights = logs.map((l) => l.weight_kg);
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const range = max - min || 1;

  const points = logs.map((l, i) => {
    const x = padding + (i / (logs.length - 1)) * (width - padding * 2);
    const y = height - padding - ((l.weight_kg - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  });

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-24 text-signal">
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      {logs.map((l, i) => {
        const [x, y] = points[i].split(",").map(Number);
        return <circle key={i} cx={x} cy={y} r="2.5" fill="currentColor" />;
      })}
    </svg>
  );
}
