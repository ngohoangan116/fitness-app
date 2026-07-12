"use client";

import { useState } from "react";

type PendingOrder = {
  order_code: string;
  plan_id: string;
  plan_name: string;
  amount_vnd: number;
  phone: string | null;
  status: string;
  created_at: string;
};

type PaidSummary = {
  order_code: string;
  plan_name: string;
  totalExercises: number;
  completedExercises: number;
  trainedToday: boolean;
  lastTrainedAt: string | null;
};

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingOrder[]>([]);
  const [paidSummary, setPaidSummary] = useState<PaidSummary[]>([]);
  const [approvingCode, setApprovingCode] = useState<string | null>(null);

  async function loadData(pw: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Có lỗi xảy ra.");
        setAuthed(false);
        return;
      }
      setPending(data.pending ?? []);
      setPaidSummary(data.paidSummary ?? []);
      setAuthed(true);
    } catch {
      setError("Không kết nối được máy chủ.");
    } finally {
      setLoading(false);
    }
  }

  async function approve(orderCode: string) {
    setApprovingCode(orderCode);
    try {
      const res = await fetch("/api/admin/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, order_code: orderCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Duyệt thất bại.");
        return;
      }
      await loadData(password);
    } finally {
      setApprovingCode(null);
    }
  }

  if (!authed) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-chalk-premium px-6">
        <div className="training-card p-8 max-w-sm w-full">
          <p className="stencil text-xl mb-4">Đăng nhập quản trị</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && loadData(password)}
            placeholder="Mật khẩu"
            className="w-full border-2 border-ink px-4 py-2 mb-3 font-body bg-transparent text-chalk"
          />
          {error && <p className="font-body text-sm text-signal mb-3">{error}</p>}
          <button
            onClick={() => loadData(password)}
            disabled={loading}
            className="w-full btn-ink text-chalk font-display stencil text-sm px-6 py-3 disabled:opacity-50"
          >
            {loading ? "Đang kiểm tra..." : "Vào trang quản trị"}
          </button>
          <p className="font-mono text-[11px] text-steel mt-4">
            Mật khẩu được xác thực ở server, không lộ trong code trình duyệt.
            Hành động duyệt đơn dùng Service Role key phía server, không thể
            gọi trực tiếp từ trình duyệt của khách.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-chalk-premium px-6 py-16">
      <div className="max-w-3xl mx-auto">
        <p className="font-mono text-xs text-signal tracking-widest mb-2">QUẢN TRỊ</p>
        <h1 className="stencil text-3xl mb-10">Bảng điều khiển</h1>

        {error && <p className="font-body text-sm text-signal mb-6">{error}</p>}

        <section className="mb-14">
          <h2 className="stencil text-xl mb-4">
            Chờ duyệt {pending.length > 0 && `(${pending.length})`}
          </h2>
          {pending.length === 0 ? (
            <p className="font-body text-steel text-sm">Không có đơn nào đang chờ.</p>
          ) : (
            <div className="space-y-3">
              {pending.map((o) => (
                <div
                  key={o.order_code}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-2 border-signal/50 px-5 py-4"
                >
                  <div>
                    <p className="font-mono text-sm">{o.order_code}</p>
                    <p className="font-body text-sm">{o.plan_name}</p>
                    <p className="font-mono text-xs text-steel mt-1">
                      {o.amount_vnd.toLocaleString("vi-VN")}đ
                      {o.phone && ` · ${o.phone}`} ·{" "}
                      {new Date(o.created_at).toLocaleString("vi-VN")}
                    </p>
                  </div>
                  <button
                    onClick={() => approve(o.order_code)}
                    disabled={approvingCode === o.order_code}
                    className="btn-signal text-chalk font-display stencil text-xs px-5 py-3 disabled:opacity-50 shrink-0"
                  >
                    {approvingCode === o.order_code ? "Đang duyệt..." : "Duyệt →"}
                  </button>
                </div>
              ))}
            </div>
          )}
          <p className="font-body text-xs text-steel mt-4">
            Trước khi duyệt: kiểm tra sao kê ngân hàng khớp đúng số tiền và
            nội dung chuyển khoản (mã đơn hàng) với dòng tương ứng ở trên.
          </p>
        </section>

        <section>
          <h2 className="stencil text-xl mb-4">Tiến độ khách hàng</h2>
          {paidSummary.length === 0 ? (
            <p className="font-body text-steel text-sm">Chưa có đơn hàng nào đã thanh toán.</p>
          ) : (
            <div className="space-y-3">
              {paidSummary.map((r) => (
                <div
                  key={r.order_code}
                  className="flex items-center justify-between border-2 border-ink px-5 py-4"
                >
                  <div>
                    <p className="font-mono text-sm">{r.order_code}</p>
                    <p className="font-body text-sm text-steel">{r.plan_name}</p>
                    <p className="font-mono text-xs text-steel mt-1">
                      {r.completedExercises}/{r.totalExercises} bài đã hoàn thành
                      {r.lastTrainedAt &&
                        ` · lần tập gần nhất ${new Date(r.lastTrainedAt).toLocaleString("vi-VN")}`}
                    </p>
                  </div>
                  <span
                    className={`font-mono text-xs px-3 py-1 border-2 shrink-0 ${
                      r.trainedToday ? "border-signal text-signal" : "border-steel text-steel"
                    }`}
                  >
                    {r.trainedToday ? "Đã tập hôm nay" : "Chưa tập hôm nay"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
