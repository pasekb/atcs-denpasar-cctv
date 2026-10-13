# 1. Update src/components/CctvMap.tsx
cctv_map_code = '''"use client";

import React, { useEffect, useRef } from "react";
import { CctvLocation } from "@/types/cctv";
import "leaflet/dist/leaflet.css";

interface CctvMapProps {
  locations: CctvLocation[];
  selectedLocation: number | null;
  onLocationSelect: (id: number) => void;
  onPlayStream?: (location: CctvLocation) => void;
}

export default function CctvMap({
  locations,
  selectedLocation,
  onLocationSelect,
  onPlayStream,
}: CctvMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<{ [key: number]: any }>({});

  const DENPASAR_LAT = -8.6726833;
  const DENPASAR_LON = 115.2242733;

  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    let L: any;
    try {
      L = require("leaflet");
    } catch (e) {
      console.error("Leaflet import failed:", e);
      return;
    }

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [DENPASAR_LAT, DENPASAR_LON],
        zoom: 13,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | ATCS Denpasar',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear existing markers
    Object.values(markersRef.current).forEach((marker: any) => {
      marker.remove();
    });
    markersRef.current = {};

    // Marker Icon Generator
    const createMarkerHtml = (isActive: boolean, isNearSpbu: boolean) => {
      const bgColor = isActive ? "#ef4444" : isNearSpbu ? "#f59e0b" : "#2563eb";
      const pulseClass = isActive ? "animate-ping opacity-75" : "";
      return `
        <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
          ${isActive ? `<span style="position: absolute; width: 100%; height: 100%; border-radius: 9999px; background-color: #ef4444;" class="${pulseClass}"></span>` : ""}
          <div style="position: relative; width: 32px; height: 32px; border-radius: 9999px; background-color: ${bgColor}; border: 2px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white;">
            ${
              isNearSpbu
                ? `<span style="font-size: 14px; line-height: 1;">⛽</span>`
                : `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>`
            }
          </div>
        </div>
      `;
    };

    locations.forEach((loc) => {
      if (typeof loc.lat_lokasi !== "number" || typeof loc.lon_lokasi !== "number") return;
      if (isNaN(loc.lat_lokasi) || isNaN(loc.lon_lokasi)) return;

      const isSelected = selectedLocation === loc.id_lokasi;
      const isNearSpbu = Boolean(loc.dekat_spbu);
      const device = loc.tb_device_lokasi && loc.tb_device_lokasi[0];
      const cameraName = device?.nama_alias || device?.nama || loc.nama_lokasi;

      const customIcon = L.divIcon({
        className: "cctv-custom-marker",
        html: createMarkerHtml(isSelected, isNearSpbu),
        iconSize: [34, 34],
        iconAnchor: [17, 17],
        popupAnchor: [0, -18],
      });

      const marker = L.marker([loc.lat_lokasi, loc.lon_lokasi], { icon: customIcon }).addTo(map);

      const streamUrl = device?.url_proxy_hls?.trim() || "";
      const popupHtml = `
        <div style="min-width: 230px; font-family: system-ui, sans-serif; padding: 4px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <span style="font-size: 10px; font-weight: 700; background-color: #dbeafe; color: #1e40af; padding: 2px 6px; border-radius: 9999px;">
              ID #${loc.id_lokasi}
            </span>
            <div style="display: flex; gap: 4px;">
              ${
                isNearSpbu
                  ? `<span style="font-size: 10px; font-weight: 700; background-color: #fef3c7; color: #b45309; padding: 2px 6px; border-radius: 9999px;">⛽ SPBU</span>`
                  : ""
              }
              <span style="font-size: 10px; font-weight: 700; background-color: #dcfce7; color: #15803d; padding: 2px 6px; border-radius: 9999px;">
                LIVE
              </span>
            </div>
          </div>
          <h3 style="font-size: 14px; font-weight: 700; margin: 0 0 4px 0; color: #0f172a;">
            ${cameraName}
          </h3>
          <p style="font-size: 12px; color: #64748b; margin: 0 0 6px 0; line-height: 1.3;">
            ${loc.ket_lokasi || "Denpasar, Bali"}
          </p>
          ${
            isNearSpbu
              ? `<div style="font-size: 11px; background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 4px 6px; margin-bottom: 6px; color: #92400e;">
                  ⛽ <strong>${loc.nama_spbu || "Dekat SPBU"}</strong> ${loc.jarak_spbu_meter ? `(~${loc.jarak_spbu_meter}m)` : ""}
                </div>`
              : ""
          }
          <div style="font-size: 11px; color: #94a3b8; margin-bottom: 8px;">
            📍 Koordinat: ${loc.lat_lokasi.toFixed(5)}, ${loc.lon_lokasi.toFixed(5)}
          </div>
          ${
            streamUrl
              ? `<button id="btn-play-stream-${loc.id_lokasi}" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 6px 12px; background-color: #2563eb; color: white; border: none; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer;">
                  ▶ Buka Streaming
                </button>`
              : `<div style="font-size: 11px; color: #ef4444; font-weight: 500;">Stream offline / pemeliharaan</div>`
          }
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on("click", () => {
        onLocationSelect(loc.id_lokasi);
      });

      marker.on("popupopen", () => {
        const btn = document.getElementById(`btn-play-stream-${loc.id_lokasi}`);
        if (btn && onPlayStream) {
          btn.onclick = () => onPlayStream(loc);
        }
      });

      markersRef.current[loc.id_lokasi] = marker;
    });

    if (selectedLocation && markersRef.current[selectedLocation]) {
      const selectedMarker = markersRef.current[selectedLocation];
      const targetLoc = locations.find((l) => l.id_lokasi === selectedLocation);
      if (targetLoc) {
        map.flyTo([targetLoc.lat_lokasi, targetLoc.lon_lokasi], 16, {
          animate: true,
          duration: 1.2,
        });
        selectedMarker.openPopup();
      }
    }
  }, [locations, selectedLocation]);

  return (
    <div className="relative w-full h-full min-h-[500px] rounded-xl overflow-hidden shadow-inner border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating Map Legend */}
      <div className="absolute bottom-4 left-4 z-[400] bg-white/95 dark:bg-slate-900/95 backdrop-blur px-3 py-2 rounded-lg shadow-md border border-slate-200 dark:border-slate-800 text-xs flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-blue-600 inline-block" />
          <span className="text-slate-600 dark:text-slate-300 font-medium">CCTV Simpang</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
          <span className="text-slate-600 dark:text-slate-300 font-medium">⛽ Dekat SPBU</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
          <span className="text-slate-600 dark:text-slate-300 font-medium">Terpilih</span>
        </div>
      </div>
    </div>
  );
}
'''

with open("src/components/CctvMap.tsx", "w") as f:
    f.write(cctv_map_code)

# 2. Update src/components/SidebarList.tsx
sidebar_code = '''"use client";

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
'''

with open("src/components/SidebarList.tsx", "w") as f:
    f.write(sidebar_code)

# 3. Update src/app/streaming/page.tsx
streaming_code = '''"use client";

import React, { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import Navbar from "@/components/Navbar";
import SidebarList from "@/components/SidebarList";
import CctvCard from "@/components/CctvCard";
import CctvModal from "@/components/CctvModal";
import { CctvLocation } from "@/types/cctv";
import { Map, LayoutGrid, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2, Fuel } from "lucide-react";

const CctvMap = dynamic(() => import("@/components/CctvMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[500px] flex items-center justify-center bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
      <div className="flex flex-col items-center gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="text-xs font-medium">Memuat Peta Denpasar...</span>
      </div>
    </div>
  ),
});

export default function StreamingPage() {
  const [locations, setLocations] = useState<CctvLocation[]>([]);
  const [totalSpbu, setTotalSpbu] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"map" | "grid">("map");
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSpbuOnly, setFilterSpbuOnly] = useState(false);

  // Pagination for grid
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Modal enlarged view
  const [modalLocation, setModalLocation] = useState<CctvLocation | null>(null);
  const [modalDeviceIdx, setModalDeviceIdx] = useState(0);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const res = await fetch("/api/cctv");
        const json = await res.json();
        if (json.success && json.data) {
          setLocations(json.data);
          if (json.meta && json.meta.total_spbu !== undefined) {
            setTotalSpbu(json.meta.total_spbu);
          } else {
            setTotalSpbu(json.data.filter((l: any) => l.dekat_spbu).length);
          }
        }
      } catch (err) {
        console.error("Gagal mengambil data CCTV:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  // Filter locations by search query and SPBU
  const filteredLocations = useMemo(() => {
    let list = locations;
    if (filterSpbuOnly) {
      list = list.filter((l) => l.dekat_spbu === true);
    }
    const q = searchQuery.toLowerCase().trim();
    if (!q) return list;
    return list.filter((loc) => {
      const nameMatch = loc.nama_lokasi.toLowerCase().includes(q);
      const descMatch = (loc.ket_lokasi || "").toLowerCase().includes(q);
      const spbuMatch = (loc.nama_spbu || "").toLowerCase().includes(q);
      const devMatch = loc.tb_device_lokasi?.some(
        (d) =>
          (d.nama && d.nama.toLowerCase().includes(q)) ||
          (d.nama_alias && d.nama_alias.toLowerCase().includes(q))
      );
      return nameMatch || descMatch || spbuMatch || devMatch;
    });
  }, [locations, searchQuery, filterSpbuOnly]);

  // Grid filtered locations
  const gridLocations = useMemo(() => {
    if (selectedLocation !== null) {
      return filteredLocations.filter((l) => l.id_lokasi === selectedLocation);
    }
    return filteredLocations;
  }, [filteredLocations, selectedLocation]);

  const totalPages = Math.max(1, Math.ceil(gridLocations.length / itemsPerPage));
  const paginatedGridLocations = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return gridLocations.slice(start, start + itemsPerPage);
  }, [gridLocations, currentPage, itemsPerPage]);

  const handleEnlarge = (location: CctvLocation, deviceIndex: number = 0) => {
    setModalLocation(location);
    setModalDeviceIdx(deviceIndex);
  };

  const handleSelectLocation = (id: number | null) => {
    setSelectedLocation(id);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      {/* Top Navigation */}
      <Navbar totalCount={locations.length} totalSpbu={totalSpbu} isLoading={isLoading} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-5">
        {/* Tab Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="inline-flex items-center p-1 rounded-xl bg-slate-200/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setActiveTab("map")}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === "map"
                  ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Map className="w-4 h-4" />
              <span>Tampilan Peta</span>
            </button>
            <button
              onClick={() => setActiveTab("grid")}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === "grid"
                  ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Grid Kamera ({gridLocations.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500">
            <button
              onClick={() => {
                setFilterSpbuOnly(!filterSpbuOnly);
                setCurrentPage(1);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition border cursor-pointer ${
                filterSpbuOnly
                  ? "bg-amber-500 text-white border-amber-600 shadow-sm"
                  : "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800 hover:bg-amber-100"
              }`}
            >
              <Fuel className="w-3.5 h-3.5" />
              <span>{filterSpbuOnly ? "Filter: Hanya SPBU (Aktif)" : `Lihat ${totalSpbu} CCTV Dekat SPBU`}</span>
            </button>

            {selectedLocation !== null && (
              <span className="inline-flex items-center gap-2">
                <span>Terpilih: <strong>#{selectedLocation}</strong></span>
                <button
                  onClick={() => handleSelectLocation(null)}
                  className="text-blue-600 hover:underline cursor-pointer"
                >
                  Reset
                </button>
              </span>
            )}
          </div>
        </div>

        {/* Content View */}
        <div className="flex flex-col lg:flex-row gap-6 flex-1">
          {/* Left Sidebar List */}
          <div className="w-full lg:w-80 flex-shrink-0">
            <SidebarList
              locations={filteredLocations}
              selectedLocation={selectedLocation}
              searchQuery={searchQuery}
              filterSpbuOnly={filterSpbuOnly}
              onFilterSpbuToggle={() => {
                setFilterSpbuOnly(!filterSpbuOnly);
                setCurrentPage(1);
              }}
              onSearchChange={setSearchQuery}
              onSelectLocation={handleSelectLocation}
            />
          </div>

          {/* Right Main Area: Map or Grid */}
          <div className="flex-1 flex flex-col">
            {activeTab === "map" ? (
              <div className="h-[calc(100vh-220px)] min-h-[550px] w-full">
                <CctvMap
                  locations={filteredLocations}
                  selectedLocation={selectedLocation}
                  onLocationSelect={handleSelectLocation}
                  onPlayStream={(loc) => handleEnlarge(loc, 0)}
                />
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {paginatedGridLocations.length === 0 ? (
                  <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                    <p className="text-sm text-slate-500 font-medium">
                      Tidak ada kamera CCTV ditemukan untuk filter ini.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {paginatedGridLocations.map((loc) => (
                      <CctvCard
                        key={loc.id_lokasi}
                        location={loc}
                        onEnlarge={handleEnlarge}
                      />
                    ))}
                  </div>
                )}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2 border-t border-slate-200 dark:border-slate-800">
                    <div className="text-xs text-slate-500">
                      Menampilkan {(currentPage - 1) * itemsPerPage + 1} sampai{" "}
                      {Math.min(currentPage * itemsPerPage, gridLocations.length)} dari{" "}
                      {gridLocations.length} kamera
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                        title="Halaman Pertama"
                      >
                        <ChevronsLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                        title="Sebelumnya"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      {/* Page Numbers */}
                      <div className="flex items-center gap-1 px-2">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum = i + 1;
                          if (totalPages > 5 && currentPage > 3) {
                            pageNum = Math.min(totalPages - 4, currentPage - 2) + i;
                          }
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`w-8 h-8 rounded-lg text-xs font-semibold transition cursor-pointer ${
                                currentPage === pageNum
                                  ? "bg-blue-600 text-white shadow-sm"
                                  : "border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                        title="Selanjutnya"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                        title="Halaman Terakhir"
                      >
                        <ChevronsRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal Enlarged / Fullscreen View */}
      <CctvModal
        location={modalLocation}
        deviceIndex={modalDeviceIdx}
        onClose={() => setModalLocation(null)}
      />
    </div>
  );
}
'''

with open("src/app/streaming/page.tsx", "w") as f:
    f.write(streaming_code)

print("Map, Sidebar, and Streaming Page updated!")
