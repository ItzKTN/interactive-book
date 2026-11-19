import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Константин Фотинов — Историческа презентация (Стоян Калчев и Константин Караниколов)",
  description:
    "Интерактивен уебсайт на слайдове за възрожденеца Константин Фотинов, направен от Стоян Калчев и Константин Караниколов.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bg">
      <body className="min-h-screen bg-[#e8d9bc] text-[#2b1d0e]">
        {children}
      </body>
    </html>
  );
}
