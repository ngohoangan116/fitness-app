"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type Row = {
  id: string;
  day_number: number;
  day_label: string | null;
  sets: number;
  reps: string;
  rest_seconds: number;
  role: string;
  order_index: number;
  exercises: {
    id: string;
    name: string;
    primary_muscle: string | null;
    equipment: string | null;
    image_url: string | null;
  } | null;
};

type SearchResult = {
  id: string;
  name: string;
  primary_muscle: string | null;
  equipment: string | null;
  image_url: string | null;
};

function EditPlanContent() {
  const params = useSearchParams();
  const orderCode = params.get("order") ?? "";

  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [planName, setPlanName] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [addingToDay, setAddingToDay] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  async function callApi(action: string, extra: Record<string, unknown> = {}) {
    const res = await fetch("/api/admin/edit-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, order_code: orderCode, action, ...extra }),
    });
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error ?? "Có lỗi xảy ra.");
    return data;
  }

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await callApi("load");
      setPlanName(data.plan_name);
      setRows(data.rows);
      setAuthed(true);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Sai mật khẩu hoặc có lỗi xảy ra.");
    }
    setLoading(false);
  }

  async function saveRow(row: Row) {
    try {
      await callApi("update_row", {
        row_id: row.id,
        sets: row.sets,
        reps: row.reps,
        rest_seconds: row.rest_seconds,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không lưu được.");
    }
  }

  async function deleteRow(rowId: string) {
    if (!confirm("Xoá bài tập này khỏi lịch của khách?")) return;
    try {
      await callApi("delete_row", { row_id: rowId });
      setRows((cur) => cur.filter((r) => r.id !== rowId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không xoá được.");
    }
  }

  async function addExercise(dayNumber: number, exerciseId: string) {
    try {
      await callApi("add_row", { day_number: dayNumber, exercise_id: exerciseId });
      setAddingToDay(null);
      setSearchQuery("");
      setSearchResults([]);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thêm được.");
    }
  }

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await callApi("search_exercises", { query: searchQuery });
        setSearchResults(data.results);
      } catch {
        // bỏ qua lỗi tìm kiếm nhỏ, không chặn giao diện
      }
      setSearching(false);
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  if (!orderCode) {
    return (
      <main className="min-h-screen bg-chalk px-6 py-12">
        <p className="font-body text-ink">Thiếu mã đơn hàng trong đường dẫn (?order=...).</p>
      </main>
    );
  }

  if (!authed) {
    return (
      <main className="min-h-screen bg-chalk px-6 py-12 flex items-center justify-center">
        <div className="max-w-sm w-full">
          <h1 className="stencil text-xl text-ink mb-1">Sửa lịch tập</h1>
          <p className="font-mono text-xs text-steel mb-4">Đơn: {orderCode}</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
            placeholder="Mật khẩu admin"
            className="w-full border-2 border-ink px-4 py-2.5 font-mono text-sm mb-3"
          />
          <button
            onClick={load}
            disabled={loading}
            className="w-full btn-ink text-chalk font-display stencil text-sm px-6 py-2.5 disabled:opacity-50"
          >
            {loading ? "Đang kiểm tra..." : "Vào sửa →"}
          </button>
          {authError && <p className="font-body text-sm text-signal mt-3">{authError}</p>}
        </div>
      </main>
    );
  }

  const days = Array.from(new Set(rows.map((r) => r.day_number))).sort((a, b) => a - b);

  return (
    <main className="min-h-screen bg-chalk px-6 py-12 max-w-3xl mx-auto">
      <h1 className="stencil text-xl text-ink mb-1">Sửa lịch tập — {orderCode}</h1>
      <p className="font-body text-sm text-steel mb-8">{planName}</p>
      {error && <p className="font-body text-sm text-signal mb-4">{error}</p>}

      {days.map((day) => {
        const dayRows = rows.filter((r) => r.day_number === day);
        return (
          <div key={day} className="mb-10">
            <h2 className="stencil text-base text-steel mb-3">
              Buổi {day}
              {dayRows[0]?.day_label ? ` · ${dayRows[0].day_label}` : ""}
            </h2>
            <div className="space-y-2">
              {dayRows.map((r) => (
                <div
                  key={r.id}
                  className="flex flex-wrap items-center gap-3 border-2 border-ink px-4 py-3"
                >
                  <span className="font-body text-sm flex-1 min-w-[160px]">
                    {r.exercises?.name ?? "(bài đã bị xoá khỏi kho)"}
                    <span className="font-mono text-[11px] text-steel block">
                      {r.exercises?.primary_muscle ?? "?"} · {r.exercises?.equipment ?? "?"}
                    </span>
                  </span>
                  <input
                    type="number"
                    value={r.sets}
                    onChange={(e) =>
                      setRows((cur) =>
                        cur.map((row) =>
                          row.id === r.id ? { ...row, sets: Number(e.target.value) } : row
                        )
                      )
                    }
                    onBlur={() => saveRow(rows.find((row) => row.id === r.id)!)}
                    className="w-14 border-b-2 border-steel/40 bg-transparent font-mono text-xs px-1 py-1"
                    aria-label="Số hiệp"
                  />
                  <input
                    type="text"
                    value={r.reps}
                    onChange={(e) =>
                      setRows((cur) =>
                        cur.map((row) => (row.id === r.id ? { ...row, reps: e.target.value } : row))
                      )
                    }
                    onBlur={() => saveRow(rows.find((row) => row.id === r.id)!)}
                    className="w-20 border-b-2 border-steel/40 bg-transparent font-mono text-xs px-1 py-1"
                    aria-label="Số lần"
                  />
                  <input
                    type="number"
                    value={r.rest_seconds}
                    onChange={(e) =>
                      setRows((cur) =>
                        cur.map((row) =>
                          row.id === r.id ? { ...row, rest_seconds: Number(e.target.value) } : row
                        )
                      )
                    }
                    onBlur={() => saveRow(rows.find((row) => row.id === r.id)!)}
                    className="w-16 border-b-2 border-steel/40 bg-transparent font-mono text-xs px-1 py-1"
                    aria-label="Nghỉ (giây)"
                  />
                  <button
                    onClick={() => deleteRow(r.id)}
                    className="font-mono text-[11px] text-signal underline shrink-0"
                  >
                    Xoá
                  </button>
                </div>
              ))}
            </div>

            {addingToDay === day ? (
              <div className="mt-3 border-2 border-dashed border-steel/40 p-3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm tên bài tập..."
                  autoFocus
                  className="w-full border-2 border-ink px-3 py-2 font-mono text-xs mb-2"
                />
                {searching && <p className="font-mono text-[11px] text-steel">Đang tìm...</p>}
                <div className="space-y-1 max-h-56 overflow-y-auto">
                  {searchResults.map((ex) => (
                    <button
                      key={ex.id}
                      onClick={() => addExercise(day, ex.id)}
                      className="w-full text-left font-body text-sm px-3 py-2 hover:bg-ink/5 border border-ink/10"
                    >
                      {ex.name}
                      <span className="font-mono text-[11px] text-steel block">
                        {ex.primary_muscle ?? "?"} · {ex.equipment ?? "?"}
                      </span>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => {
                    setAddingToDay(null);
                    setSearchQuery("");
                  }}
                  className="font-mono text-[11px] text-steel underline mt-2"
                >
                  Đóng
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAddingToDay(day)}
                className="mt-3 font-mono text-[11px] text-signal underline"
              >
                + Thêm bài vào buổi này
              </button>
            )}
          </div>
        );
      })}
    </main>
  );
}

export default function EditPlanPage() {
  return (
    <Suspense fallback={null}>
      <EditPlanContent />
    </Suspense>
  );
}
