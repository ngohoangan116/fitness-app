"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type OrderHit = {
  order_code: string;
  plan_name: string;
  status: string;
  created_at: string;
};

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "notfound" | "error">("idle");
  const [hits, setHits] = useState<OrderHit[]>([]);

  async function lookup() {
    const trimmed = phone.trim();
    if (!trimmed) return;
    setStatus("loading");
    setHits([]);

    const { data, error } = await supabase
      .from("orders")
      .select("order_code, plan_name, status, created_at")
      .eq("phone", trimmed)
      .order("created_at", { ascending: false });

    if (error) {
      setStatus("error");
      return;
    }
    if (!data || data.length === 0) {
      setStatus("notfound");
      return;
    }

    if (data.length === 1) {
      localStorage.setItem("orderCode", data[0].order_code);
      localStorage.setItem("phone", trimmed);
      router.push("/dashboard");
      return;
    }

    // Nhiều đơn hàng cùng số điện thoại — cho khách chọn đúng đơn
    localStorage.setItem("phone", trimmed);
    setHits(data);
    setStatus("idle");
  }

  function chooseOrder(orderCode: string) {
    localStorage.setItem("orderCode", orderCode);
    router.push("/dashboard");
  }

  return (
    <main className="min-h-screen bg-chalk-premium flex items-center justify-center px-6 py-20">
      <div className="max-w-sm w-full">
        <p className="font-mono text-xs text-signal tracking-widest mb-3">
          ĐĂNG NHẬP LẠI
        </p>
        <h1 className="stencil text-3xl mb-3">Tìm lộ trình của bạn</h1>
        <p className="font-body text-sm text-steel mb-8">
          Nhập đúng số điện thoại bạn đã dùng lúc thanh toán để khôi phục lộ
          trình và tiến độ tập luyện trên máy này.
        </p>

        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && lookup()}
          placeholder="0912345678"
          className="w-full border-2 border-ink px-4 py-3 font-body bg-transparent focus:outline-none mb-4"
        />

        <button
          onClick={lookup}
          disabled={status === "loading"}
          className="w-full btn-ink text-chalk font-display stencil text-sm px-8 py-4 disabled:opacity-50"
        >
          {status === "loading" ? "Đang tìm..." : "Tìm lộ trình →"}
        </button>

        {status === "notfound" && (
          <p className="font-body text-sm text-signal mt-4">
            Không tìm thấy đơn hàng nào với số điện thoại này. Kiểm tra lại
            đúng số bạn đã nhập lúc thanh toán.
          </p>
        )}
        {status === "error" && (
          <p className="font-body text-sm text-signal mt-4">
            Có lỗi khi tra cứu. Vui lòng thử lại.
          </p>
        )}

        {hits.length > 0 && (
          <div className="mt-8">
            <p className="font-mono text-xs text-steel tracking-widest mb-3">
              CÓ {hits.length} ĐƠN HÀNG — CHỌN ĐÚNG ĐƠN
            </p>
            <div className="space-y-2">
              {hits.map((h) => (
                <button
                  key={h.order_code}
                  onClick={() => chooseOrder(h.order_code)}
                  className="w-full text-left border-2 border-ink px-4 py-3 hover:bg-ink hover:text-chalk transition-colors"
                >
                  <p className="font-body text-sm">{h.plan_name}</p>
                  <p className="font-mono text-xs text-steel">
                    {h.order_code} ·{" "}
                    {h.status === "paid" ? "Đã kích hoạt" : "Chờ xác nhận"} ·{" "}
                    {new Date(h.created_at).toLocaleDateString("vi-VN")}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
