import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CCTV Denpasar",
  description: "Pantau lalu lintas Kota Denpasar secara real-time - CCTV Denpasar",
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
