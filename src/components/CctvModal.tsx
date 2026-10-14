"use client";

import React, { useEffect } from "react";
import { CctvLocation } from "@/types/cctv";
import { cleanStreamUrl } from "@/lib/utils";
import { X, MapPin, Radio, ExternalLink } from "lucide-react";

interface CctvModalProps {
  location: CctvLocation | null;
  deviceIndex?: number;
  onClose: () => void;
}

export default function CctvModal({ location, deviceIndex = 0, onClose }: CctvModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (location) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [location, onClose]);

  if (!location) return null;

  const devices = location.tb_device_lokasi || [];
  const currentDevice = devices[deviceIndex] || devices[0];
  const streamUrl = cleanStreamUrl(currentDevice?.url_proxy_hls);
  const cameraName = currentDevice?.nama_alias || currentDevice?.nama || location.nama_lokasi;

  const isBaliSatuData = (location.sumber || "").toLowerCase().includes("bali");
  const sourceUrl = isBaliSatuData
    ? "https://balisatudata.baliprov.go.id/peta-cctv"
    : "https://atcs.denpasarkota.go.id/";
  const sourceName = isBaliSatuData ? "Bali Satu Data" : "ATCS Denpasar";

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <Radio className="w-3 h-3 animate-pulse" /> LIVE STREAM
            </span>
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold transition hover:opacity-85 cursor-pointer ${
                isBaliSatuData
                  ? "bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/50"
                  : "bg-blue-600/30 text-blue-400 border border-blue-500/30 hover:bg-blue-600/50"
              }`}
              title={`Buka situs resmi ${sourceName}`}
            >
              <span>{sourceName}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white line-clamp-1">
                {cameraName}
              </h2>
              <p className="text-xs text-slate-400 flex items-center gap-1 line-clamp-1">
                <MapPin className="w-3 h-3 text-blue-400" /> {location.ket_lokasi}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Tutup (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Player Feed */}
        <div className="relative w-full aspect-video bg-black flex items-center justify-center">
          {streamUrl ? (
            streamUrl.endsWith(".mp4") || streamUrl.includes(".mp4") ? (
              <video
                src={streamUrl}
                className="w-full h-full object-contain"
                autoPlay
                controls
                playsInline
                title={cameraName}
              />
            ) : (
              <iframe
                src={streamUrl}
                className="w-full h-full border-0"
                allow="autoplay; fullscreen"
                allowFullScreen
                title={cameraName}
              />
            )
          ) : (
            <div className="text-center text-slate-400 p-8">
              <p className="text-base font-semibold text-white mb-1">
                Stream CCTV Tidak Tersedia
              </p>
              <p className="text-xs text-slate-500">
                Kamera ini sedang dalam status pemeliharaan teknis.
              </p>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-5 py-3 bg-slate-950/80 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <span>📍 Lat: {location.lat_lokasi}</span>
            <span>Lon: {location.lon_lokasi}</span>
            <span>Kota: {location.tb_lokasi_kota?.nama_kota || "Bali"}</span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white transition font-medium"
              title={`Kunjungi portal resmi ${sourceName}`}
            >
              <span>Sumber: <span className={isBaliSatuData ? "text-emerald-400 font-semibold" : "text-blue-400 font-semibold"}>{sourceName}</span></span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            {streamUrl && (
              <a
                href={streamUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 transition font-medium"
              >
                <span>Buka di Tab Baru</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
