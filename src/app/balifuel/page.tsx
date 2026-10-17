"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GanjilGenapBanner from "@/components/GanjilGenapBanner";
import { Fuel, RefreshCw, ExternalLink, Video, ShieldCheck, Loader2 } from "lucide-react";

export default function BaliFuelPage() {
  const [totalCount, setTotalCount] = useState(185);
  const [totalSpbu, setTotalSpbu] = useState(31);
  const [isLoadingCctv, setIsLoadingCctv] = useState(true);
  const [isLoadingFrame, setIsLoadingFrame] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/cctv");
        const json = await res.json();
        if (json.success && json.data) {
          setTotalCount(json.data.length);
          if (json.meta?.total_spbu !== undefined) {
            setTotalSpbu(json.meta.total_spbu);
          }
        }
      } catch (e) {
        console.error("Gagal mengambil info CCTV:", e);
      } finally {
        setIsLoadingCctv(false);
      }
    }
    fetchStats();
  }, []);

  const handleRefreshFrame = () => {
    setIsLoadingFrame(true);
    setIframeKey((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Top Navbar */}
      <Navbar totalCount={totalCount} totalSpbu={totalSpbu} isLoading={isLoadingCctv} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col gap-4">
        {/* Pemberitahuan Ganjil Genap */}
        <GanjilGenapBanner />

        {/* Header Bar */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                <Fuel className="w-3.5 h-3.5" /> LIVE REPORT KOMUNITAS
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                <ShieldCheck className="w-3 h-3" /> Bahasa Indonesia
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              Laporan Stok BBM Bali (BaliFuel)
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
              Pantau stasiun pengisian bahan bakar (SPBU & Pertamini) yang masih memiliki stok bensin di seluruh Bali secara real-time langsung dari laporan masyarakat.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleRefreshFrame}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
              title="Muat ulang laporan BaliFuel"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingFrame ? "animate-spin" : ""}`} />
              <span>Muat Ulang</span>
            </button>

            <a
              href="https://balifuel.com/?lang=id"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition cursor-pointer"
              title="Buka situs BaliFuel di tab baru"
            >
              <span>Buka balifuel.com</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <Link
              href="/streaming"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-800 transition shadow-sm cursor-pointer"
            >
              <Video className="w-3.5 h-3.5" />
              <span>Pantau CCTV Bali</span>
            </Link>
          </div>
        </div>

        {/* Embedded BaliFuel Iframe Viewport */}
        <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col h-[calc(100vh-210px)] min-h-[620px]">
          {/* Loading Overlay */}
          {isLoadingFrame && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-sm animate-fadeIn">
              <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  Menghubungkan ke BaliFuel...
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Memuat data laporan ketersediaan bahan bakar (Bahasa Indonesia)
                </p>
              </div>
            </div>
          )}

          {/* Iframe */}
          <iframe
            key={iframeKey}
            src="https://balifuel.com/?lang=id"
            className="w-full h-full border-0 rounded-2xl"
            title="BaliFuel Live Fuel Availability"
            allow="geolocation"
            onLoad={() => setIsLoadingFrame(false)}
          />
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
