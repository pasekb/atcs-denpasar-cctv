"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Video, ShieldCheck, Database, CheckCircle2, Fuel } from "lucide-react";

interface NavbarProps {
  totalCount: number;
  totalSpbu?: number;
  isLoading?: boolean;
}

export default function Navbar({ totalCount, totalSpbu, isLoading }: NavbarProps) {
  const pathname = usePathname();
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const handleSyncSupabase = async () => {
    try {
      setSyncing(true);
      setSyncMessage(null);
      const res = await fetch("/api/sync", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setSyncMessage(data.message || "Sinkronisasi Supabase berhasil!");
      } else {
        setSyncMessage(data.message || "Gagal sinkronisasi");
      }
    } catch (err: any) {
      setSyncMessage("Gagal menghubungkan ke Supabase");
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMessage(null), 5000);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">

          {/* Logo & Judul */}
          <div className="flex items-center gap-2.5">
            <Link href="/streaming" className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 hover:bg-blue-700 transition flex-shrink-0">
              <Video className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <Link href="/streaming" className="text-base font-bold tracking-tight text-slate-900 dark:text-white hover:text-blue-600 transition leading-none">
                  CCTV BALI
                </Link>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  <ShieldCheck className="w-2.5 h-2.5" /> Live
                </span>
                {/* Desktop only: SPBU badge */}
                {typeof totalSpbu === "number" && totalSpbu > 0 && (
                  <span className="hidden md:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                    <Fuel className="w-2.5 h-2.5" /> {totalSpbu} Dekat SPBU
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                {isLoading ? "Memuat..." : `${totalCount} CCTV Terpasang di Bali`}
              </p>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Instagram button — always visible on all sizes */}
            <a
              href="https://www.instagram.com/pasekberatha/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-white bg-gradient-to-r from-pink-500 to-purple-600 shadow-sm hover:opacity-90 transition cursor-pointer"
              title="Instagram @pasekberatha"
            >
              <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
              </svg>
              <span>pasekberatha</span>
            </a>

            {/* Desktop-only actions */}
            <div className="hidden md:flex items-center gap-2">
              {/* Live Report Balifuel Button */}
              <Link
                href="/balifuel"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm cursor-pointer ${
                  pathname === "/balifuel"
                    ? "bg-amber-500 text-white border border-amber-600 shadow-md ring-2 ring-amber-400/30"
                    : "text-amber-900 dark:text-amber-100 bg-amber-400 hover:bg-amber-500 dark:bg-amber-500/20 dark:hover:bg-amber-500/30 border border-amber-500/40"
                }`}
                title="Lihat Laporan Langsung Ketersediaan BBM di Bali (BaliFuel)"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-600 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-700 dark:bg-amber-400"></span>
                </span>
                <Fuel className="w-3.5 h-3.5" />
                <span>Live Report Balifuel</span>
              </Link>

              {pathname === "/balifuel" && (
                <Link
                  href="/streaming"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-800 transition shadow-sm cursor-pointer"
                  title="Kembali ke Peta & Streaming CCTV"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Pantau CCTV</span>
                </Link>
              )}

              {/* Supabase Sync Button */}
              <button
                onClick={handleSyncSupabase}
                disabled={syncing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition disabled:opacity-60 cursor-pointer"
                title="Sinkronkan titik CCTV ke database Supabase"
              >
                <Database className={`w-3.5 h-3.5 ${syncing ? "animate-spin text-blue-600" : "text-blue-500"}`} />
                <span>{syncing ? "Syncing..." : "Sync Supabase"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sync message alert banner */}
        {syncMessage && (
          <div className="mt-2 p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span>{syncMessage}</span>
          </div>
        )}
      </div>
    </header>
  );
}
