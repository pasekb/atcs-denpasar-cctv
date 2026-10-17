import type { Metadata } from "next";
// @ts-ignore -- Next.js handles global CSS imports at build time.
import "./globals.css";

export const metadata: Metadata = {
  title: "CCTV Bali",
  description: "Pantau lalu lintas Bali secara real-time - CCTV Bali",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
