"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { buildVietQrUrl, generateOrderCode } from "@/lib/vietqr";
import { supabase } from "@/lib/supabase";

const PHONE_REGEX = /^(0|\+84)\d{9,10}$/;

function CheckoutContent() {
  const params = useSearchParams();
  const planId = params.get("plan") ?? "unknown";
  const planName = params.get("name") ?? "Gói tập";
  const price = Number(params.get("price") ?? 149000);
  // Đơn "đổi lịch tập" trước mốc 8 tuần: type=schedule_change kèm mã đơn
  // gốc (target) để sau khi duyệt thì áp dụng plan mới vào đúng đơn đó.
  const orderType = params.get("type") === "schedule_change" ? "schedule_change" : "purchase";
  const targetOrderCode = params.get("target");

  const [orderCode] = useState(() => generateOrderCode());
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "pending" | "error">("idle");

  const qrUrl = useMemo(
    () =>
      buildVietQrUrl({
        bankBin: process.env.NEXT_PUBLIC_BANK_BIN as string,
        accountNo: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NO as string,
        accountName: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME as string,
        amount: price,
        addInfo: orderCode,
      }),
    [price, orderCode]
  );

  async function confirmTransfer() {
    const trimmedPhone = phone.trim();
    if (!PHONE_REGEX.test(trimmedPhone)) {
      setPhoneError("Nhập đúng số điện thoại Việt Nam (vd: 0912345678).");
      return;
    }
    setPhoneError(null);
    setStatus("saving");
    const { error } = await supabase.from("orders").insert({
      order_code: orderCode,
      plan_id: planId,
      plan_name: planName,
      amount_vnd: price,
      phone: trimmedPhone,
      status: "pending_verification",
      order_type: orderType,
      target_order_code: orderType === "schedule_change" ? targetOrderCode : null,
      new_plan_id: orderType === "schedule_change" ? planId : null,
      new_plan_name: orderType === "schedule_change" ? planName : null,
    });
    if (!error) {
      localStorage.setItem("orderCode", orderCode);
      localStorage.setItem("phone", trimmedPhone);
    }
    setStatus(error ? "error" : "pending");
  }

  return (
    <main className="min-h-screen bg-chalk-premium px-6 py-20">
      <div className="max-w-md mx-auto text-center">
        <p className="font-mono text-xs text-signal tracking-widest mb-3">
          THANH TOÁN
        </p>
        <h1 className="stencil text-3xl mb-2">{planName}</h1>
        <p className="font-mono text-2xl text-ink mb-8">
          {price.toLocaleString("vi-VN")}đ
        </p>

        {status !== "pending" ? (
          <>
            <div className="training-card p-6 mb-6 inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrUrl} alt="Mã QR chuyển khoản ngân hàng" className="w-64 h-64 mx-auto bg-white" />
              <p className="font-mono text-xs text-tape mt-4">
                Nội dung CK: {orderCode}
              </p>
            </div>
            <p className="font-body text-sm text-steel mb-6">
              Quét mã bằng app ngân hàng, giữ nguyên nội dung chuyển khoản để
              hệ thống đối soát đúng đơn hàng của bạn.
            </p>

            <div className="text-left mb-2">
              <label className="font-mono text-xs text-steel tracking-widest block mb-2">
                SỐ ĐIỆN THOẠI (để đăng nhập lại trên máy khác)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0912345678"
                className="w-full border-2 border-ink px-4 py-3 font-body bg-transparent focus:outline-none"
              />
              {phoneError && (
                <p className="font-body text-xs text-signal mt-2">{phoneError}</p>
              )}
            </div>

            <button
              onClick={confirmTransfer}
              disabled={status === "saving"}
              className="w-full btn-ink text-chalk font-display stencil text-sm px-8 py-4 mt-6 disabled:opacity-50"
            >
              {status === "saving" ? "Đang lưu..." : "Tôi đã chuyển khoản"}
            </button>
            {status === "error" && (
              <p className="font-body text-sm text-signal mt-4">
                Có lỗi khi lưu đơn hàng. Vui lòng thử lại hoặc liên hệ hỗ trợ.
              </p>
            )}
            <div className="border-2 border-line/40 px-5 py-4 mt-8 text-left">
              <p className="font-mono text-xs text-signal tracking-widest mb-1">
                CAM KẾT
              </p>
              <p className="font-body text-sm text-steel leading-relaxed">
                Trong 7 ngày đầu, nếu gói tập chưa phù hợp, nhắn lại để được
                đổi sang gói khác — không mất thêm phí.
              </p>
            </div>
          </>
        ) : (
          <div className="training-card p-8">
            <p className="stencil text-xl text-tape mb-3">Đã ghi nhận!</p>
            <p className="font-body text-sm text-chalk/80 mb-4">
              Đơn hàng <span className="font-mono">{orderCode}</span> đang chờ
              xác nhận. Sau khi đối soát chuyển khoản (thường trong vài phút),
              {orderType === "schedule_change"
                ? " lịch tập mới sẽ được áp dụng vào đúng tài khoản hiện tại của bạn."
                : " lộ trình sẽ được mở khóa trong mục Tài khoản."}
            </p>
            <p className="font-body text-xs text-tape">
              📱 Nhớ số điện thoại <span className="font-mono">{phone}</span> —
              dùng số này để đăng nhập lại lộ trình trên bất kỳ điện thoại/máy
              tính nào tại trang <span className="font-mono">/login</span>.
            </p>
            <a
              href="/dashboard"
              className="inline-block mt-6 font-mono text-xs text-tape underline"
            >
              Đi đến trang tập luyện →
            </a>
          </div>
        )}
      </div>
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutContent />
    </Suspense>
  );
}
