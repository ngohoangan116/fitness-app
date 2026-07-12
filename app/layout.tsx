import type { Metadata } from "next";
import { Oswald, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const oswald = Oswald({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-oswald",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
});

const jbmono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-jbmono",
});

export const metadata: Metadata = {
  title: "Sổ Tập | Lộ trình tập luyện cá nhân hóa",
  description: "Trả lời 1 phút, nhận lộ trình tập luyện dành riêng cho bạn.",
  openGraph: {
    title: "Sổ Tập | Lộ trình tập luyện cá nhân hóa",
    description: "Trả lời 1 phút, nhận lộ trình tập luyện dành riêng cho bạn — không rập khuôn, không tập lan man.",
    type: "website",
    locale: "vi_VN",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sổ Tập | Lộ trình tập luyện cá nhân hóa",
    description: "Trả lời 1 phút, nhận lộ trình tập luyện dành riêng cho bạn.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={`${oswald.variable} ${inter.variable} ${jbmono.variable}`}>
      <body className="font-body">{children}</body>
    </html>
  );
}
