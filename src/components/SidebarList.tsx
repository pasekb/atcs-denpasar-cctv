"use client";

import React from "react";
import { CctvLocation } from "@/types/cctv";
import { Search, MapPin, Video, CheckCircle2, Fuel, Play } from "lucide-react";

interface SidebarListProps {
  locations: CctvLocation[];
  selectedLocation: number | null;
  searchQuery: string;
  filterSpbuOnly: boolean;
  sumberFilter?: "all" | "atcs" | "balisatudata";
  onSumberFilterChange?: (s: "all" | "atcs" | "balisatudata") => void;
  onFilterSpbuToggle: () => void;
  onSearchChange: (q: string) => void;
  onSelectLocation: (id: number | null) => void;
  onPlayStream?: (location: CctvLocation) => void;
}

export default function SidebarList({
  locations,
  selectedLocation,
  searchQuery,
  filterSpbuOnly,
  sumberFilter = "all",
  onSumberFilterChange,
  onFilterSpbuToggle,
  onSearchChange,
  onSelectLocation,
  onPlayStream,
}: SidebarListProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-[calc(100vh-220px)] min-h-[550px]">
      {/* Header, Search & Filter SPBU */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Video className="w-4 h-4 text-blue-600" /> Daftar Lokasi CCTV
          </h2>
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
            {locations.length}
          </span>
        </div>

        {/* Filter Kategori Sumber (Semua, ATCS Denpasar, Bali Satu Data) */}
        <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-[11px] font-bold">
          <button
            type="button"
            onClick={() => onSumberFilterChange && onSumberFilterChange("all")}
            className={`py-1.5 rounded-md transition text-center cursor-pointer ${
              sumberFilter === "all"
                ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Semua
          </button>
          <button
            type="button"
            onClick={() => onSumberFilterChange && onSumberFilterChange("atcs")}
            className={`py-1.5 rounded-md transition text-center cursor-pointer ${
              sumberFilter === "atcs"
                ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            ATCS Dps
          </button>
          <button
            type="button"
            onClick={() => onSumberFilterChange && onSumberFilterChange("balisatudata")}
            className={`py-1.5 rounded-md transition text-center cursor-pointer ${
              sumberFilter === "balisatudata"
                ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Bali 1 Data
          </button>
        </div>

        {/* Filter Chip SPBU */}
        <div className="flex items-center gap-2">
          <button
            onClick={onFilterSpbuToggle}
            className={`w-full py-1.5 px-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 border cursor-pointer ${
              filterSpbuOnly
                ? "bg-amber-500 text-white border-amber-600 shadow-sm"
                : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
            }`}
          >
            <Fuel className="w-3.5 h-3.5" />
            <span>{filterSpbuOnly ? "Filter: Hanya Dekat SPBU" : "⛽ Filter Dekat SPBU"}</span>
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari lokasi simpang / SPBU..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
          />
        </div>
      </div>

      {/* List items */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {/* All locations filter button */}
        <button
          onClick={() => onSelectLocation(null)}
          className={`w-full text-left p-3 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-between ${
            selectedLocation === null
              ? "bg-blue-600 text-white shadow-sm"
              : "bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <span>🌐 Tampilkan Semua Lokasi</span>
          {selectedLocation === null && <CheckCircle2 className="w-4 h-4" />}
        </button>

        {locations.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs">
            Tidak ada CCTV ditemukan {filterSpbuOnly ? "di dekat SPBU" : `untuk "${searchQuery}"`}
          </div>
        ) : (
          locations.map((loc) => {
            const isSelected = selectedLocation === loc.id_lokasi;
            const device = loc.tb_device_lokasi && loc.tb_device_lokasi[0];
            const posterUrl = device?.poster
              ? `https://atcs.denpasarkota.go.id/poster/${device.poster}`
              : null;

            return (
              <div
                key={loc.id_lokasi}
                onClick={() => onSelectLocation(loc.id_lokasi)}
                className={`w-full text-left p-2.5 rounded-xl text-xs transition cursor-pointer flex flex-col gap-2 border ${
                  isSelected
                    ? "bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-900 dark:text-blue-100 shadow-md ring-1 ring-blue-500/30"
                    : "bg-white dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-300"
                }`}
              >
                {/* Main info row */}
                <div className="flex items-start gap-2.5">
                  {/* Thumbnail with quick play button */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onPlayStream) onPlayStream(loc);
                    }}
                    className="relative w-12 h-12 rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-800 flex-shrink-0 flex items-center justify-center text-slate-400 group/thumb cursor-pointer shadow-sm"
                    title="Klik untuk langsung putar streaming"
                  >
                    {posterUrl ? (
                      <img
                        src={posterUrl}
                        alt={loc.nama_lokasi}
                        className="w-full h-full object-cover group-hover/thumb:scale-105 transition duration-300"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <Video className="w-5 h-5 text-blue-500" />
                    )}

                    {/* Hover play icon overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center text-white">
                      <Play className="w-4 h-4 fill-white" />
                    </div>

                    <span className="absolute bottom-0.5 right-0.5 px-1 py-0.2 rounded bg-black/75 text-[9px] font-bold text-white">
                      #{loc.id_lokasi}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="font-bold truncate text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span className="truncate">{loc.nama_lokasi}</span>
                      {loc.sumber === "ATCS Denpasar" ? (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 flex-shrink-0">
                          ATCS
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300 flex-shrink-0">
                          Bali 1 Data
                        </span>
                      )}
                      {loc.dekat_spbu && (
                        <span
                          className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500 text-white flex-shrink-0"
                          title={loc.nama_spbu || "Dekat SPBU"}
                        >
                          ⛽ SPBU
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{loc.ket_lokasi}</span>
                    </div>
                    {loc.dekat_spbu && loc.nama_spbu && (
                      <div className="text-[10px] text-amber-600 dark:text-amber-400 font-medium truncate mt-0.5">
                        ⛽ {loc.nama_spbu}
                      </div>
                    )}
                  </div>

                  {/* Quick Play Icon Button (on hover or always) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onPlayStream) onPlayStream(loc);
                    }}
                    className={`p-1.5 rounded-lg border transition cursor-pointer flex-shrink-0 ${
                      isSelected
                        ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700 shadow-sm"
                        : "bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 border-slate-200 dark:border-slate-700 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600"
                    }`}
                    title="Buka Streaming"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </button>
                </div>

                {/* Tombol Buka Streaming saat lokasi dipilih */}
                {isSelected && (
                  <div className="pt-2 border-t border-blue-200 dark:border-blue-900/60 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onPlayStream) onPlayStream(loc);
                      }}
                      className="w-full py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Buka Streaming</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
