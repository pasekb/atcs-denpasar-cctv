"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Video, ShieldCheck, Database, CheckCircle2, Settings, Fuel } from "lucide-react";

interface NavbarProps {
  totalCount: number;
  totalSpbu?: number;
  isLoading?: boolean;
}

export default function Navbar({ totalCount, totalSpbu, isLoading }: NavbarProps) {
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Logo & Judul */}
          <div className="flex items-center gap-3.5">
            <Link href="/streaming" className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 hover:bg-blue-700 transition">
              <Video className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Link href="/streaming" className="text-xl font-bold tracking-tight text-slate-900 dark:text-white hover:text-blue-600 transition">
                  CCTV KOTA DENPASAR
                </Link>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  <ShieldCheck className="w-3 h-3" /> Live Stream
                </span>
                {typeof totalSpbu === "number" && totalSpbu > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800 hidden md:inline-flex">
                    <Fuel className="w-3 h-3" /> {totalSpbu} Dekat SPBU
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isLoading ? "Memuat data CCTV..." : `${totalCount} CCTV Terpasang di Kota Denpasar`}
              </p>
            </div>
          </div>

          {/* Quick Actions & Links */}
          <div className="flex items-center gap-2">
            {/* Link Admin Panel */}
            {/* <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-100 bg-blue-50 hover:bg-blue-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-blue-200 dark:border-slate-700 transition cursor-pointer"
              title="Buka Panel Admin untuk modifikasi CCTV"
            >
              <Settings className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Panel Admin</span>
            </Link> */}

            {/* Supabase Sync Button */}
            <button
              onClick={handleSyncSupabase}
              disabled={syncing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition disabled:opacity-60 cursor-pointer"
              title="Sinkronkan titik CCTV ke database Supabase"
            >
              <Database className={`w-3.5 h-3.5 ${syncing ? "animate-spin text-blue-600" : "text-blue-500"}`} />
              <span className="hidden sm:inline">{syncing ? "Syncing..." : "Sync Supabase"}</span>
            </button>
          </div>
        </div>

        {/* Sync message alert banner */}
        {syncMessage && (
          <div className="mt-2.5 p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span>{syncMessage}</span>
          </div>
        )}
      </div>
    </header>
  );
}
