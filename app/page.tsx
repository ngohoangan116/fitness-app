import Link from "next/link";
import Reveal from "@/components/Reveal";
import StickyMobileCta from "@/components/StickyMobileCta";
import Faq from "@/components/Faq";

const TESTIMONIALS = [
  {
    quote:
      "Mình từng bỏ tập vì lộ trình trên mạng không hợp thể trạng. Sau bài test, lộ trình khớp đúng số buổi rảnh của mình mỗi tuần — lần đầu tiên mình duy trì được quá 2 tháng.",
    name: "Minh, 27 tuổi",
    seal: "ĐÃ XÁC NHẬN",
    rotate: "-8deg",
  },
  {
    quote:
      "Trước đây mình tập gym nhưng không biết chia buổi sao cho đúng. Giờ có sẵn lịch Push/Pull/Legs rõ ràng, không cần tự nghĩ nữa.",
    name: "Thảo, 24 tuổi",
    seal: "KHÁCH HÀNG THẬT",
    rotate: "6deg",
  },
  {
    quote:
      "Phần cardio cuối buổi cho gói đốt mỡ rất hợp lý — không bị dồn hết vào 1 buổi như mấy app khác.",
    name: "Đức, 31 tuổi",
    seal: "4 TUẦN LIÊN TỤC",
    rotate: "-4deg",
  },
  {
    quote:
      "Không cần dụng cụ gì vẫn có lộ trình đàng hoàng. Hợp với người mới bắt đầu như mình.",
    name: "Hà, 22 tuổi",
    seal: "ĐÃ XÁC NHẬN",
    rotate: "5deg",
  },
];

const GOALS = [
  { code: "01", name: "Tăng Cơ", desc: "Tạ nặng, ít lặp, nghỉ dài giữa hiệp" },
  { code: "02", name: "Đốt Mỡ", desc: "Nhịp nhanh, có cardio cuối mỗi buổi" },
  { code: "03", name: "Sức Bền", desc: "Nhiều lặp, tập tuần hoàn" },
  { code: "04", name: "Duy Trì Vóc Dáng", desc: "Toàn thân, cường độ vừa phải" },
];

function HazardDivider() {
  return <div className="hazard-divider" aria-hidden="true" />;
}

export default function LandingPage() {
  return (
    <main className="bg-chalk-premium pb-20 md:pb-0">
      {/* HERO */}
      <section className="relative overflow-hidden bg-ink-premium text-chalk">
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-28 grid md:grid-cols-2 gap-14 items-center">
          <div>
            <p className="font-mono text-xs tracking-[0.3em] text-tape mb-6">
              LỘ TRÌNH CÁ NHÂN HÓA · 60 GIÂY
            </p>
            <h1 className="stencil text-5xl md:text-6xl leading-[0.95] mb-6">
              Sổ tập<br />của riêng bạn
            </h1>
            <p className="font-body text-lg text-chalk/70 max-w-md mb-9">
              Không phải bài tập chung chung. Trả lời vài câu hỏi, nhận lộ trình
              luyện tập được dựng riêng theo mục tiêu, mức độ vận động, dụng cụ
              và số buổi rảnh mỗi tuần của bạn.
            </p>
            <Link
              href="/quiz"
              className="inline-block btn-signal text-chalk font-display stencil text-sm px-8 py-4"
            >
              Bắt đầu bài test →
            </Link>
            <p className="font-body text-xs text-chalk/50 mt-4">
              Đã mua gói rồi?{" "}
              <Link href="/login" className="text-tape underline">
                Đăng nhập lại tại đây
              </Link>
            </p>
          </div>

          <div className="training-card p-7 rotate-[-3deg] max-w-sm mx-auto md:mx-0">
            <p className="font-mono text-xs text-tape mb-4">BUỔI TẬP 04 · ĐẨY NGỰC</p>
            <ul className="space-y-3 font-mono text-sm">
              <li className="flex justify-between border-b border-line pb-2">
                <span>Đẩy tạ đòn ngang</span><span>4 x 8 · 90s</span>
              </li>
              <li className="flex justify-between border-b border-line pb-2">
                <span>Hít đất nghiêng</span><span>3 x 12 · 60s</span>
              </li>
              <li className="flex justify-between border-b border-line pb-2">
                <span>Ép ngực cáp</span><span>3 x 15 · 60s</span>
              </li>
              <li className="flex justify-between text-tape">
                <span>Cardio · máy dốc</span><span>15-20 phút</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <HazardDivider />

      {/* STAT TICKER — cap nhat dung so luong goi/mục tieu thuc te */}
      <section className="bg-steel-premium text-chalk">
        <div className="mx-auto max-w-6xl px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            ["48", "lộ trình khác nhau"],
            ["4", "mục tiêu tập luyện"],
            ["12 phút", "thời gian test trung bình"],
            ["3", "mức dụng cụ, kể cả không dụng cụ"],
          ].map(([stat, label]) => (
            <div key={label}>
              <p className="font-mono text-2xl md:text-3xl text-tape">{stat}</p>
              <p className="font-body text-xs text-chalk/70 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <Reveal>
        <section className="mx-auto max-w-6xl px-6 py-24">
          <h2 className="stencil text-3xl mb-12">Bắt đầu trong 3 bước</h2>
          <div className="grid md:grid-cols-3 gap-10">
            {[
              ["01", "Trả lời câu hỏi", "Mục tiêu, mức vận động, dụng cụ bạn có, thời gian rảnh mỗi tuần."],
              ["02", "Nhận lộ trình", "Hệ thống dựng gói tập theo đúng câu trả lời của bạn, không rập khuôn."],
              ["03", "Thanh toán & tập", "Quét mã QR chuyển khoản, mở khóa lộ trình và bắt đầu ngay hôm nay."],
            ].map(([num, title, desc]) => (
              <div key={num} className="border-t-2 border-ink pt-5">
                <span className="font-mono text-signal text-sm">{num}</span>
                <h3 className="stencil text-xl mt-2 mb-2">{title}</h3>
                <p className="font-body text-steel text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      <HazardDivider />

      {/* PLAN PREVIEW — 4 muc tieu that su co trong he thong */}
      <Reveal>
        <section className="mx-auto max-w-6xl px-6 py-24">
          <p className="font-mono text-xs tracking-[0.3em] text-signal mb-3">4 MỤC TIÊU</p>
          <h2 className="stencil text-3xl mb-12">Chọn đúng hướng, không tập lan man</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {GOALS.map((g) => (
              <div key={g.code} className="training-card p-6">
                <p className="font-mono text-xs text-tape mb-2">{g.code}</p>
                <h3 className="stencil text-xl mb-2">{g.name}</h3>
                <p className="font-body text-sm text-chalk/70">{g.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      {/* VALUE COMPARISON — so sanh chi phi voi thue PT ngoai */}
      <Reveal>
        <section className="mx-auto max-w-4xl px-6 py-20">
          <p className="font-mono text-xs tracking-[0.3em] text-signal mb-3 text-center">
            SO SÁNH CHI PHÍ
          </p>
          <h2 className="stencil text-3xl mb-12 text-center">
            Rẻ hơn 1 buổi thuê PT ngoài
          </h2>
          <div className="grid sm:grid-cols-2 gap-6 items-stretch">
            <div className="border-2 border-line/50 p-7 flex flex-col justify-center">
              <p className="font-mono text-xs text-steel tracking-widest mb-3">THUÊ PT NGOÀI</p>
              <p className="stencil text-3xl mb-2">300.000 – 500.000đ</p>
              <p className="font-body text-sm text-steel">
                mỗi buổi tập, chưa tính thời gian đi lại và phải khớp lịch cố định
              </p>
            </div>
            <div className="training-card p-7 flex flex-col justify-center">
              <p className="font-mono text-xs text-tape tracking-widest mb-3">TRỌN GÓI SỔ TẬP</p>
              <p className="stencil text-3xl mb-2 text-chalk">149.000đ</p>
              <p className="font-body text-sm text-chalk/70">
                trọn lộ trình cá nhân hóa, tập bao lâu tùy bạn, không giới hạn số buổi
              </p>
            </div>
          </div>
        </section>
      </Reveal>

      {/* TESTIMONIALS — luoi 4 the con dau, xoay goc khac nhau */}
      <section className="bg-ink-premium text-chalk">
        <Reveal>
          <div className="mx-auto max-w-6xl px-6 py-20">
            <p className="font-mono text-xs tracking-[0.3em] text-tape mb-3">PHẢN HỒI</p>
            <h2 className="stencil text-3xl mb-12">Người tập nói gì</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {TESTIMONIALS.map((t) => (
                <div key={t.name} className="flex gap-6 items-start">
                  <div
                    className="stamp text-tape shrink-0 w-24 h-24 flex items-center justify-center text-center text-[10px] px-2"
                    style={{ transform: `rotate(${t.rotate})` }}
                  >
                    {t.seal}
                  </div>
                  <blockquote className="font-body text-base leading-relaxed text-chalk/85">
                    &ldquo;{t.quote}&rdquo;
                    <footer className="font-mono text-xs text-tape mt-3">— {t.name}</footer>
                  </blockquote>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* FAQ */}
      <Reveal>
        <section className="mx-auto max-w-3xl px-6 py-24">
          <p className="font-mono text-xs tracking-[0.3em] text-signal mb-3">CÂU HỎI THƯỜNG GẶP</p>
          <h2 className="stencil text-3xl mb-10">Còn băn khoăn gì không?</h2>
          <Faq />
        </section>
      </Reveal>

      {/* FINAL CTA */}
      <Reveal>
        <section className="mx-auto max-w-6xl px-6 py-24 text-center">
          <h2 className="stencil text-3xl md:text-4xl mb-6">
            Lộ trình của bạn đang chờ 60 giây trả lời
          </h2>
          <Link
            href="/quiz"
            className="inline-block btn-ink text-chalk font-display stencil text-sm px-8 py-4"
          >
            Làm bài test ngay →
          </Link>
        </section>
      </Reveal>

      <StickyMobileCta />
    </main>
  );
}
