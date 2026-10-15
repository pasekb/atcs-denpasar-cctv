"use client";

import React, { useState } from "react";
import { CctvLocation, DeviceLokasi } from "@/types/cctv";
import { cleanStreamUrl } from "@/lib/utils";
import { Play, Square, RotateCcw, AlertTriangle, MapPin, Radio, Fuel } from "lucide-react";

interface MobileStreamCardProps {
  location: CctvLocation;
}

export default function MobileStreamCard({ location }: MobileStreamCardProps) {
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
    <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
      {/* Video Area */}
      <div className="relative w-full bg-slate-950" style={{ aspectRatio: "16/9" }}>
        {/* Badges */}
        <div className="absolute top-2 left-2 z-20 flex flex-wrap items-center gap-1">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
              hasError
                ? "bg-amber-500 text-white"
                : isPlaying
                ? "bg-rose-500 text-white"
                : "bg-emerald-500 text-white"
            }`}
          >
            <Radio className="w-2.5 h-2.5" />
            {hasError ? "MAINT" : isPlaying ? "LIVE" : "READY"}
          </span>
          {location.dekat_spbu && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white">
              <Fuel className="w-2.5 h-2.5" /> SPBU
            </span>
          )}
          <span
            className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              location.sumber === "ATCS Denpasar"
                ? "bg-blue-600/90 text-white"
                : "bg-emerald-600/90 text-white"
            }`}
          >
            {location.sumber === "ATCS Denpasar" ? "ATCS" : "Bali 1D"}
          </span>
        </div>

        {/* Multi-camera tabs */}
        {devices.length > 1 && (
          <div className="absolute top-2 right-2 z-20 flex gap-1">
            {devices.map((dev, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSelectedDeviceIdx(idx);
                  setIsPlaying(true);
                }}
                className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition cursor-pointer ${
                  selectedDeviceIdx === idx
                    ? "bg-blue-600 text-white"
                    : "bg-black/50 text-white/80 hover:bg-black/70"
                }`}
              >
                {dev.nama_alias || `Cam ${idx + 1}`}
              </button>
            ))}
          </div>
        )}

        {/* Stream content */}
        {isPlaying && streamUrl && !hasError ? (
          <div className="relative w-full h-full">
            {streamUrl.endsWith(".mp4") || streamUrl.includes(".mp4") ? (
              <video
                src={streamUrl}
                className="w-full h-full object-cover"
                autoPlay
                controls
                playsInline
                muted
                onError={() => setHasError(true)}
              />
            ) : (
              <iframe
                src={streamUrl}
                className="w-full h-full border-0"
                allow="autoplay; fullscreen"
                allowFullScreen
                onError={() => setHasError(true)}
                title={cameraName}
              />
            )}
            {/* Stop button overlay */}
            <button
              onClick={handleTogglePlay}
              className="absolute bottom-2 right-2 z-10 p-2 rounded-full bg-rose-600/90 text-white hover:bg-rose-700 shadow-md transition cursor-pointer"
              title="Hentikan Streaming"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
            </button>
          </div>
        ) : hasError || !streamUrl ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-slate-900/95 text-center">
            <AlertTriangle className="w-8 h-8 text-amber-400 mb-2" />
            <p className="text-white text-xs font-medium mb-1">Kamera tidak dapat diakses</p>
            <p className="text-slate-400 text-[10px] mb-3">Sedang dalam pemeliharaan</p>
            <button
              onClick={handleRetry}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition cursor-pointer border border-white/20"
            >
              <RotateCcw className="w-3 h-3" /> Coba Lagi
            </button>
          </div>
        ) : (
          <div
            className="w-full h-full flex flex-col items-center justify-center cursor-pointer relative"
            style={{
              backgroundImage: posterUrl
                ? `linear-gradient(rgba(15,23,42,0.7), rgba(15,23,42,0.85)), url(${posterUrl})`
                : "linear-gradient(135deg, #1e293b, #0f172a)",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
            onClick={handleTogglePlay}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleTogglePlay();
              }}
              className="w-12 h-12 rounded-full bg-blue-600/90 hover:bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 transition cursor-pointer mb-1"
            >
              <Play className="w-5 h-5 ml-0.5 fill-current" />
            </button>
            <span className="text-xs text-white/80">Tap untuk streaming</span>
          </div>
        )}

        {/* Watermark */}
        <div className="absolute bottom-1.5 left-2 z-10 pointer-events-none opacity-30 text-[9px] font-bold text-white tracking-wider uppercase bg-black/40 px-1.5 py-0.5 rounded">
          CCTV BALI
        </div>
      </div>

      {/* Info */}
      <div className="px-3 py-2.5 flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-slate-900 dark:text-white truncate">{cameraName}</div>
          <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            <MapPin className="w-3 h-3 flex-shrink-0 text-blue-500" />
            <span className="truncate">{location.ket_lokasi || location.nama_lokasi}</span>
          </div>
          {location.dekat_spbu && location.nama_spbu && (
            <div className="text-[10px] text-amber-600 dark:text-amber-400 font-medium mt-0.5 truncate">
              ⛽ {location.nama_spbu}
              {location.jarak_spbu_meter ? ` (~${location.jarak_spbu_meter}m)` : ""}
            </div>
          )}
        </div>
        {!isPlaying && streamUrl && (
          <button
            onClick={handleTogglePlay}
            className="flex-shrink-0 p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition cursor-pointer"
            title="Play streaming"
          >
            <Play className="w-4 h-4 fill-current" />
          </button>
        )}
      </div>
    </div>
  );
}
