import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CCTV Denpasar by PasekB",
  description: "Pantau lalu lintas Kota Denpasar secara real-time - CCTV Denpasar by PasekB",
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
