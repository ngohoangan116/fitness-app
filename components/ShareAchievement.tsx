"use client";

import { useRef, useState } from "react";

export default function ShareAchievement({
  planName,
  overallPct,
  streak,
}: {
  planName: string;
  overallPct: number;
  streak: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  function draw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = 800;
    const H = 800;
    canvas.width = W;
    canvas.height = H;

    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, "#1C1B1A");
    bg.addColorStop(1, "#232220");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    const glow = ctx.createRadialGradient(W * 0.85, H * 0.1, 20, W * 0.85, H * 0.1, 400);
    glow.addColorStop(0, "rgba(232,73,29,0.35)");
    glow.addColorStop(1, "rgba(232,73,29,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    ctx.textAlign = "center";

    ctx.fillStyle = "#F2C14E";
    ctx.font = "600 22px monospace";
    ctx.fillText("SỔ TẬP · THÀNH TÍCH CỦA TÔI", W / 2, 120);

    ctx.fillStyle = "#F5F3EE";
    ctx.font = "700 140px sans-serif";
    ctx.fillText(`${overallPct}%`, W / 2, 340);

    ctx.font = "500 28px sans-serif";
    ctx.fillStyle = "rgba(245,243,238,0.7)";
    ctx.fillText("lộ trình đã hoàn thành", W / 2, 390);

    if (streak > 0) {
      ctx.fillStyle = "#E8491D";
      ctx.font = "700 56px sans-serif";
      ctx.fillText(`🔥 ${streak} ngày liên tục`, W / 2, 500);
    }

    ctx.fillStyle = "#F5F3EE";
    ctx.font = "600 26px sans-serif";
    ctx.fillText(planName, W / 2, 600);

    ctx.fillStyle = "rgba(245,243,238,0.4)";
    ctx.font = "400 20px monospace";
    ctx.fillText("sotap.vn", W / 2, 720);

    setReady(true);
  }

  function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = "so-tap-thanh-tich.png";
    a.click();
  }

  return (
    <div className="border-2 border-line/40 px-5 py-5 mb-6">
      <p className="font-mono text-[11px] text-signal tracking-widest mb-3">
        CHIA SẺ THÀNH TÍCH
      </p>
      <canvas
        ref={canvasRef}
        className="w-full max-w-[280px] mx-auto mb-4 border-2 border-ink"
        style={{ aspectRatio: "1/1" }}
      />
      <div className="flex gap-3">
        <button
          onClick={draw}
          className="flex-1 font-mono text-xs border-2 border-ink px-4 py-2.5 hover:bg-ink hover:text-chalk transition-colors"
        >
          Tạo ảnh
        </button>
        <button
          onClick={download}
          disabled={!ready}
          className="flex-1 btn-signal text-chalk font-display stencil text-xs px-4 py-2.5 disabled:opacity-40"
        >
          Tải về & chia sẻ
        </button>
      </div>
      <p className="font-body text-xs text-steel mt-3">
        Tải ảnh về rồi đăng lên story Zalo/Facebook — cách đơn giản nhất để bạn bè
        biết bạn đang tập đều.
      </p>
    </div>
  );
}
