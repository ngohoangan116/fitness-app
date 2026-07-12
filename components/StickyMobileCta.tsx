"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function StickyMobileCta() {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    function onScroll() {
      setShown(window.scrollY > 560);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className={`sticky-cta md:hidden ${shown ? "is-shown" : ""}`}>
      <div className="bg-ink-premium border-t border-line px-5 py-3 flex items-center justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] text-tape">LỘ TRÌNH CÁ NHÂN HÓA</p>
          <p className="font-body text-sm text-chalk">Chỉ mất 60 giây</p>
        </div>
        <Link
          href="/quiz"
          className="btn-signal text-chalk font-display stencil text-xs px-5 py-3 whitespace-nowrap"
        >
          Bắt đầu →
        </Link>
      </div>
    </div>
  );
}
