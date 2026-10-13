"use client";

import React from "react";
import { CctvLocation } from "@/types/cctv";
import { Search, MapPin, Video, CheckCircle2, Fuel } from "lucide-react";

interface SidebarListProps {
  locations: CctvLocation[];
  selectedLocation: number | null;
  searchQuery: string;
  filterSpbuOnly: boolean;
  onFilterSpbuToggle: () => void;
  onSearchChange: (q: string) => void;
  onSelectLocation: (id: number | null) => void;
}

export default function SidebarList({
  locations,
  selectedLocation,
  searchQuery,
  filterSpbuOnly,
  onFilterSpbuToggle,
  onSearchChange,
  onSelectLocation,
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
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
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
              <button
                key={loc.id_lokasi}
                onClick={() => onSelectLocation(loc.id_lokasi)}
                className={`w-full text-left p-2.5 rounded-lg text-xs transition cursor-pointer flex items-start gap-3 border ${
                  isSelected
                    ? "bg-blue-50 dark:bg-blue-950/50 border-blue-500 text-blue-900 dark:text-blue-100 shadow-sm"
                    : "bg-white dark:bg-slate-900/50 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300"
                }`}
              >
                {/* Thumbnail / Pin icon */}
                <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-800 flex-shrink-0 flex items-center justify-center text-slate-400">
                  {posterUrl ? (
                    <img
                      src={posterUrl}
                      alt={loc.nama_lokasi}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <Video className="w-5 h-5 text-blue-500" />
                  )}
                  <span className="absolute bottom-0.5 right-0.5 px-1 py-0.2 rounded bg-black/70 text-[9px] font-bold text-white">
                    #{loc.id_lokasi}
                  </span>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="font-bold truncate text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span className="truncate">{loc.nama_lokasi}</span>
                    {loc.dekat_spbu && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500 text-white flex-shrink-0" title={loc.nama_spbu || "Dekat SPBU"}>
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
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
