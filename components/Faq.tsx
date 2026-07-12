"use client";

import { useState } from "react";

const FAQS = [
  {
    q: "Thanh toán qua QR ngân hàng có an toàn không?",
    a: "Mã QR chuyển thẳng vào tài khoản ngân hàng chính chủ, theo chuẩn VietQR/Napas 247 — giống hệt khi bạn chuyển khoản bình thường qua app ngân hàng. Không cần nhập thông tin thẻ hay mật khẩu ở đâu khác.",
  },
  {
    q: "Bao lâu thì lộ trình được mở khóa sau khi chuyển khoản?",
    a: "Thường trong vòng vài phút sau khi đối soát giao dịch. Bạn có thể bấm \"Kiểm tra lại\" ở trang tập luyện bất cứ lúc nào để xem trạng thái mới nhất.",
  },
  {
    q: "Lỡ chọn sai mục tiêu hoặc số buổi thì sao?",
    a: "Không sao cả — trong 7 ngày đầu, nhắn lại để được đổi sang gói khác phù hợp hơn, không mất thêm phí.",
  },
  {
    q: "Tôi không có dụng cụ tập ở nhà, có tập được không?",
    a: "Được. Ngay từ bài test có lựa chọn \"Không có gì\" — hệ thống sẽ dựng lộ trình chỉ dùng trọng lượng cơ thể, không cần mua thêm gì.",
  },
];

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="divide-y divide-line/20 border-t border-b border-line/20">
      {FAQS.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q}>
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              className="w-full flex items-center justify-between gap-6 py-5 text-left"
              aria-expanded={isOpen}
            >
              <span className="font-body text-base md:text-lg">{item.q}</span>
              <span className="font-mono text-signal text-xl shrink-0">
                {isOpen ? "−" : "+"}
              </span>
            </button>
            {isOpen && (
              <p className="font-body text-sm text-steel leading-relaxed pb-5 pr-8">
                {item.a}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
