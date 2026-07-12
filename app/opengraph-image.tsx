import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Sổ Tập — Lộ trình tập luyện cá nhân hóa";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          backgroundColor: "#1C1B1A",
          backgroundImage:
            "radial-gradient(ellipse 900px 550px at 88% -10%, rgba(232,73,29,0.35), transparent 60%), radial-gradient(ellipse 700px 550px at -10% 110%, rgba(242,193,78,0.18), transparent 60%)",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 28,
            letterSpacing: 6,
            color: "#F2C14E",
            marginBottom: 24,
          }}
        >
          LỘ TRÌNH CÁ NHÂN HÓA · 60 GIÂY
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 104,
            fontWeight: 700,
            textTransform: "uppercase",
            color: "#F5F3EE",
            lineHeight: 1,
            marginBottom: 28,
          }}
        >
          Sổ Tập
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 32,
            color: "rgba(245,243,238,0.7)",
            maxWidth: 820,
          }}
        >
          Trả lời vài câu hỏi, nhận lộ trình tập luyện dành riêng cho bạn.
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 48,
            padding: "16px 32px",
            backgroundColor: "#E8491D",
            color: "#F5F3EE",
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: 2,
            textTransform: "uppercase",
            width: "fit-content",
          }}
        >
          Bắt đầu bài test →
        </div>
      </div>
    ),
    { ...size }
  );
}
