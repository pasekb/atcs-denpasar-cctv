# 1. Update src/components/Navbar.tsx
navbar_code = '''"use client";

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
                  ATCS Kota Denpasar
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
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-100 bg-blue-50 hover:bg-blue-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-blue-200 dark:border-slate-700 transition cursor-pointer"
              title="Buka Panel Admin untuk modifikasi CCTV"
            >
              <Settings className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Panel Admin</span>
            </Link>

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
'''

with open("src/components/Navbar.tsx", "w") as f:
    f.write(navbar_code)

# 2. Update src/components/CctvCard.tsx
cctv_card_code = '''"use client";

import React, { useState } from "react";
import { CctvLocation, DeviceLokasi } from "@/types/cctv";
import { cleanStreamUrl } from "@/lib/utils";
import { Play, Square, Maximize2, RotateCcw, AlertTriangle, MapPin, Radio, Fuel } from "lucide-react";

interface CctvCardProps {
  location: CctvLocation;
  onEnlarge: (location: CctvLocation, deviceIndex: number) => void;
}

export default function CctvCard({ location, onEnlarge }: CctvCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [selectedDeviceIdx, setSelectedDeviceIdx] = useState(0);

  const devices = location.tb_device_lokasi || [];
  const currentDevice: DeviceLokasi | undefined = devices[selectedDeviceIdx] || devices[0];

  const streamUrl = cleanStreamUrl(currentDevice?.url_proxy_hls);
  const posterUrl = currentDevice?.poster
    ? `https://atcs.denpasarkota.go.id/poster/${currentDevice.poster}`
    : null;

  const cameraName =
    currentDevice?.nama_alias || currentDevice?.nama || location.nama_lokasi;

  const handleTogglePlay = () => {
    if (!streamUrl) {
      setHasError(true);
      return;
    }
    setHasError(false);
    setIsPlaying(!isPlaying);
  };

  const handleRetry = () => {
    setHasError(false);
    setIsPlaying(true);
  };

  return (
    <div className="group bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col">
      {/* Stream / Video Screen */}
      <div className="relative aspect-video bg-slate-950 overflow-hidden flex items-center justify-center">
        {/* Stream Badges */}
        <div className="absolute top-3 left-3 z-20 flex flex-wrap items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide shadow-sm ${
              hasError
                ? "bg-amber-500 text-white"
                : isPlaying
                ? "bg-rose-500 text-white animate-pulse"
                : "bg-emerald-500 text-white"
            }`}
          >
            <Radio className="w-3 h-3" />
            {hasError ? "MAINTENANCE" : isPlaying ? "LIVE" : "READY"}
          </span>

          {/* SPBU Badge if true */}
          {location.dekat_spbu && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow-sm" title={location.nama_spbu || "Dekat SPBU"}>
              <Fuel className="w-3 h-3" />
              <span>SPBU</span>
            </span>
          )}

          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-black/60 text-white/90 backdrop-blur">
            #{location.id_lokasi}
          </span>
        </div>

        {/* Video stream rendering */}
        {isPlaying && streamUrl && !hasError ? (
          <div className="relative w-full h-full">
            <iframe
              src={streamUrl}
              className="w-full h-full border-0 object-cover"
              allow="autoplay; fullscreen"
              allowFullScreen
              onError={() => setHasError(true)}
              title={cameraName}
            />
            {/* Hover overlay to stop streaming */}
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
              <button
                onClick={handleTogglePlay}
                className="pointer-events-auto p-3.5 rounded-full bg-rose-600/90 text-white hover:bg-rose-700 shadow-lg transform hover:scale-110 transition cursor-pointer"
                title="Hentikan Streaming"
              >
                <Square className="w-5 h-5 fill-current" />
              </button>
            </div>
          </div>
        ) : hasError || !streamUrl ? (
          /* Offline / Error Screen */
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-slate-900/95">
            <AlertTriangle className="w-10 h-10 text-amber-400 mb-2 animate-bounce" />
            <p className="text-white font-medium text-xs mb-1">
              Kamera tidak dapat diakses
            </p>
            <p className="text-slate-400 text-[11px] mb-3">
              Sedang dalam pemeliharaan atau sinyal terputus
            </p>
            <button
              onClick={handleRetry}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition cursor-pointer border border-white/20"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Coba Lagi
            </button>
          </div>
        ) : (
          /* Ready Screen with Play Button */
          <div
            className="w-full h-full flex flex-col items-center justify-center p-4 bg-cover bg-center relative cursor-pointer"
            style={{
              backgroundImage: posterUrl
                ? `linear-gradient(rgba(15, 23, 42, 0.7), rgba(15, 23, 42, 0.85)), url(${posterUrl})`
                : "linear-gradient(135deg, #1e293b, #0f172a)",
            }}
            onClick={handleTogglePlay}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleTogglePlay();
              }}
              className="w-14 h-14 rounded-full bg-blue-600/90 hover:bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 transform group-hover:scale-110 transition duration-200 cursor-pointer mb-2"
            >
              <Play className="w-6 h-6 ml-0.5 fill-current" />
            </button>
            <span className="text-xs font-medium text-white/90 drop-shadow">
              Klik untuk memulai live streaming
            </span>
          </div>
        )}

        {/* Watermark Logo */}
        <div className="absolute bottom-2.5 right-2.5 z-10 pointer-events-none opacity-40 text-[10px] font-bold text-white tracking-wider uppercase bg-black/40 px-2 py-0.5 rounded">
          ATCS DENPASAR
        </div>
      </div>

      {/* Camera Information & Multi-camera switch */}
      <div className="p-4 flex-1 flex flex-col justify-between bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-1 group-hover:text-blue-600 transition">
              {cameraName}
            </h3>
          </div>

          <div className="flex items-start gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-2">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-blue-500" />
            <span className="line-clamp-2 leading-relaxed">
              {location.ket_lokasi || location.nama_lokasi}
            </span>
          </div>

          {/* SPBU Info Row if exists */}
          {location.dekat_spbu && (
            <div className="mb-2.5 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-center justify-between text-[11px] text-amber-800 dark:text-amber-300">
              <div className="flex items-center gap-1.5 truncate">
                <Fuel className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                <span className="font-semibold truncate">{location.nama_spbu || "Dekat SPBU"}</span>
              </div>
              {location.jarak_spbu_meter && (
                <span className="text-[10px] bg-amber-200/60 dark:bg-amber-900 px-1.5 py-0.5 rounded font-mono flex-shrink-0">
                  ~{location.jarak_spbu_meter}m
                </span>
              )}
            </div>
          )}

          {/* Multiple camera angles selector if > 1 camera */}
          {devices.length > 1 && (
            <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1">
              {devices.map((dev, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedDeviceIdx(idx);
                    setIsPlaying(true);
                  }}
                  className={`px-2 py-1 rounded text-[11px] font-medium transition cursor-pointer whitespace-nowrap ${
                    selectedDeviceIdx === idx
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                  }`}
                >
                  {dev.nama_alias || `Kamera ${idx + 1}`}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
          <span className="text-slate-400 text-[11px]">
            {location.lon_lokasi?.toFixed(4)}, {location.lat_lokasi?.toFixed(4)}
          </span>

          <button
            onClick={() => onEnlarge(location, selectedDeviceIdx)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5 text-blue-500" />
            <span>Perbesar</span>
          </button>
        </div>
      </div>
    </div>
  );
}
'''

with open("src/components/CctvCard.tsx", "w") as f:
    f.write(cctv_card_code)

print("Navbar & CctvCard written successfully!")
