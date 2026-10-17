"use client";

import React, { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import Navbar from "@/components/Navbar";
import SidebarList from "@/components/SidebarList";
import CctvCard from "@/components/CctvCard";
import CctvModal from "@/components/CctvModal";
import MobileBottomNav, { MobileTab } from "@/components/MobileBottomNav";
import MobileStreamCard from "@/components/MobileStreamCard";
import Footer from "@/components/Footer";
import GanjilGenapBanner from "@/components/GanjilGenapBanner";
import { CctvLocation, DeviceLokasi } from "@/types/cctv";
import { cleanStreamUrl } from "@/lib/utils";
import {
  Map,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  Fuel,
  Search,
  RefreshCw,
  ExternalLink,
  X,
  Radio,
  MapPin,
  Play,
  Square,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";

const CctvMap = dynamic(() => import("@/components/CctvMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[300px] flex items-center justify-center bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
      <div className="flex flex-col items-center gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="text-xs font-medium">Memuat Peta Bali...</span>
      </div>
    </div>
  ),
});

export default function StreamingPage() {
  const [locations, setLocations] = useState<CctvLocation[]>([]);
  const [totalSpbu, setTotalSpbu] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Desktop view mode: map or grid
  const [activeTab, setActiveTab] = useState<"map" | "grid">("map");

  // Mobile tab: default "daftar" as requested
  const [mobileTab, setMobileTab] = useState<MobileTab>("daftar");

  // Selected CCTV ID
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);

  // Mobile Map bottom sheet stream state
  const [mobileStreamPlaying, setMobileStreamPlaying] = useState(true);
  const [mobileStreamError, setMobileStreamError] = useState(false);
  const [mobileDeviceIdx, setMobileDeviceIdx] = useState(0);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterSpbuOnly, setFilterSpbuOnly] = useState(false);
  const [sumberFilter, setSumberFilter] = useState<"all" | "atcs" | "balisatudata">("all");

  // Desktop pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Desktop Modal view
  const [modalLocation, setModalLocation] = useState<CctvLocation | null>(null);
  const [modalDeviceIdx, setModalDeviceIdx] = useState(0);

  // BaliFuel iframe
  const [isLoadingFrame, setIsLoadingFrame] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);

  // Auto-dismiss loading overlay after 2.5s so it never blocks the iframe
  useEffect(() => {
    if (mobileTab === "balifuel") {
      setIsLoadingFrame(true);
      const timer = setTimeout(() => {
        setIsLoadingFrame(false);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [mobileTab, iframeKey]);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const res = await fetch("/api/cctv");
        const json = await res.json();
        if (json.success && json.data) {
          setLocations(json.data);
          if (json.meta?.total_spbu !== undefined) {
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

  // Filter + sort (ATCS first, then Bali Satu Data)
  const filteredLocations = useMemo(() => {
    let list = locations;
    if (filterSpbuOnly) list = list.filter((l) => l.dekat_spbu === true);
    if (sumberFilter === "atcs") list = list.filter((l) => (l.sumber || "").toLowerCase().includes("atcs"));
    else if (sumberFilter === "balisatudata") list = list.filter((l) => (l.sumber || "").toLowerCase().includes("bali"));

    const q = searchQuery.toLowerCase().trim();
    if (q) {
      list = list.filter((loc) => {
        const nameMatch = loc.nama_lokasi.toLowerCase().includes(q);
        const descMatch = (loc.ket_lokasi || "").toLowerCase().includes(q);
        const spbuMatch = (loc.nama_spbu || "").toLowerCase().includes(q);
        const cityMatch = (loc.tb_lokasi_kota?.nama_kota || "").toLowerCase().includes(q);
        const sourceMatch = (loc.sumber || "").toLowerCase().includes(q);
        const devMatch = loc.tb_device_lokasi?.some(
          (d) => (d.nama && d.nama.toLowerCase().includes(q)) || (d.nama_alias && d.nama_alias.toLowerCase().includes(q))
        );
        return nameMatch || descMatch || spbuMatch || cityMatch || sourceMatch || devMatch;
      });
    }

    return [...list].sort((a, b) => {
      const aAtcs = (a.sumber || "").toLowerCase().includes("atcs");
      const bAtcs = (b.sumber || "").toLowerCase().includes("atcs");
      if (aAtcs && !bAtcs) return -1;
      if (!aAtcs && bAtcs) return 1;
      return 0;
    });
  }, [locations, searchQuery, filterSpbuOnly, sumberFilter]);

  // Selected CCTV object for mobile inline panel
  const selectedCctvObject = useMemo(() => {
    if (selectedLocation === null) return null;
    return locations.find((l) => l.id_lokasi === selectedLocation) || null;
  }, [locations, selectedLocation]);

  const gridLocations = useMemo(() => {
    if (selectedLocation !== null) return filteredLocations.filter((l) => l.id_lokasi === selectedLocation);
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

  // Global handler for Leaflet popup 'Buka Streaming' button on desktop
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).__openCctvStream = (id: number | string) => {
        const numId = Number(id);
        const target = locations.find((l) => l.id_lokasi === numId || String(l.id_lokasi) === String(id));
        if (target) {
          handleEnlarge(target, 0);
        }
      };
    }
  }, [locations]);

  const handleSelectLocation = (id: number | null) => {
    setSelectedLocation(id);
    setMobileDeviceIdx(0);
    setMobileStreamPlaying(true);
    setMobileStreamError(false);
    setCurrentPage(1);
  };

  // Category filter button row
  const categoryButtons = (
    <div className="grid grid-cols-4 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-[10px] font-bold">
      {(["all", "atcs", "balisatudata"] as const).map((cat) => (
        <button
          key={cat}
          type="button"
          onClick={() => { setSumberFilter(cat); setCurrentPage(1); }}
          className={`py-1.5 rounded-md transition text-center cursor-pointer ${
            sumberFilter === cat
              ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          {cat === "all" ? "Semua" : cat === "atcs" ? "ATCS" : "Bali 1D"}
        </button>
      ))}
      <button
        type="button"
        onClick={() => { setFilterSpbuOnly(!filterSpbuOnly); setCurrentPage(1); }}
        className={`py-1.5 rounded-md transition text-center cursor-pointer ${
          filterSpbuOnly ? "bg-amber-500 text-white shadow-sm" : "text-slate-600 dark:text-slate-400"
        }`}
      >
        ⛽ SPBU
      </button>
    </div>
  );

  const currentMobileDevice: DeviceLokasi | undefined =
    selectedCctvObject?.tb_device_lokasi?.[mobileDeviceIdx] ||
    selectedCctvObject?.tb_device_lokasi?.[0];

  const currentMobileStreamUrl = cleanStreamUrl(currentMobileDevice?.url_proxy_hls);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <Navbar totalCount={locations.length} totalSpbu={totalSpbu} isLoading={isLoading} />

      {/* ==================== MOBILE LAYOUT ==================== */}
      <div className="md:hidden flex-1 flex flex-col" style={{ height: "calc(100dvh - 58px)", paddingBottom: "60px", boxSizing: "border-box" }}>
        {/* Mobile Tab Content */}
        <div className="flex-1 overflow-hidden relative flex flex-col">

          {/* ---- TAB 1: DAFTAR (DEFAULT) ---- */}
          {mobileTab === "daftar" && (
            <div className="flex flex-col w-full overflow-hidden" style={{ height: "calc(100dvh - 118px)" }}>
              {/* Search & Categories */}
              <div className="px-3 pt-3 pb-2 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex-shrink-0 space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari lokasi CCTV..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                    className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                </div>
                {categoryButtons}
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  Menampilkan {filteredLocations.length} dari {locations.length} CCTV
                </div>
              </div>

              {/* 1-column list with inline stream player */}
              <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
                <GanjilGenapBanner className="mb-2" />
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <span className="text-xs">Memuat daftar CCTV...</span>
                  </div>
                ) : filteredLocations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-2 text-slate-400">
                    <p className="text-sm font-medium">Tidak ada CCTV ditemukan</p>
                    <p className="text-xs">Coba ubah kata kunci atau filter</p>
                  </div>
                ) : (
                  filteredLocations.map((loc) => (
                    <MobileStreamCard key={loc.id_lokasi} location={loc} />
                  ))
                )}
              </div>
            </div>
          )}

          {/* ---- TAB 2: PETA ---- */}
          {mobileTab === "peta" && (
            <div className="flex flex-col w-full relative overflow-hidden" style={{ height: "calc(100dvh - 118px)", minHeight: "400px" }}>
              {/* Floating Search & Category Filter */}
              <div
                className="absolute top-0 left-0 right-0 z-[500] px-3 pt-2.5 pb-2 space-y-2 pointer-events-auto"
                style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0.97) 75%, rgba(255,255,255,0) 100%)" }}
              >
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari lokasi CCTV di peta..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                    className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-sm"
                  />
                </div>
                {categoryButtons}
              </div>

              {/* Map */}
              <div className="w-full h-full relative" style={{ height: "100%", width: "100%" }}>
                <CctvMap
                  locations={filteredLocations}
                  selectedLocation={selectedLocation}
                  onLocationSelect={handleSelectLocation}
                  isMobile={true}
                />
              </div>

              {/* Bottom Docked Stream Panel for selected CCTV (NO POPUP MODAL) */}
              {selectedCctvObject && (
                <div className="absolute bottom-0 left-0 right-0 z-[600] bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-2xl rounded-t-2xl p-3 flex flex-col gap-2 max-h-[50%] animate-fadeIn">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-500 text-white flex-shrink-0">
                        <Radio className="w-2.5 h-2.5" /> LIVE
                      </span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {currentMobileDevice?.nama_alias || currentMobileDevice?.nama || selectedCctvObject.nama_lokasi}
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedLocation(null)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 transition cursor-pointer flex-shrink-0"
                      title="Tutup preview"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Multi-camera selector if > 1 */}
                  {selectedCctvObject.tb_device_lokasi && selectedCctvObject.tb_device_lokasi.length > 1 && (
                    <div className="flex items-center gap-1 overflow-x-auto pb-1">
                      {selectedCctvObject.tb_device_lokasi.map((dev, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setMobileDeviceIdx(idx);
                            setMobileStreamPlaying(true);
                            setMobileStreamError(false);
                          }}
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap transition cursor-pointer ${
                            mobileDeviceIdx === idx
                              ? "bg-blue-600 text-white"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          {dev.nama_alias || `Kamera ${idx + 1}`}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Video Player */}
                  <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center">
                    {mobileStreamPlaying && currentMobileStreamUrl && !mobileStreamError ? (
                      <div className="relative w-full h-full">
                        {currentMobileStreamUrl.endsWith(".mp4") || currentMobileStreamUrl.includes(".mp4") ? (
                          <video
                            src={currentMobileStreamUrl}
                            className="w-full h-full object-cover"
                            autoPlay
                            controls
                            playsInline
                            muted
                            onError={() => setMobileStreamError(true)}
                          />
                        ) : (
                          <iframe
                            src={currentMobileStreamUrl}
                            className="w-full h-full border-0"
                            allow="autoplay; fullscreen"
                            allowFullScreen
                            onError={() => setMobileStreamError(true)}
                            title={selectedCctvObject.nama_lokasi}
                          />
                        )}
                        <button
                          onClick={() => setMobileStreamPlaying(false)}
                          className="absolute bottom-2 right-2 p-1.5 rounded-full bg-rose-600/90 text-white shadow transition cursor-pointer"
                          title="Hentikan"
                        >
                          <Square className="w-3 h-3 fill-current" />
                        </button>
                      </div>
                    ) : mobileStreamError || !currentMobileStreamUrl ? (
                      <div className="flex flex-col items-center justify-center p-3 text-center">
                        <AlertTriangle className="w-6 h-6 text-amber-400 mb-1" />
                        <p className="text-white text-[11px] font-medium">Stream tidak dapat diputar</p>
                        <button
                          onClick={() => { setMobileStreamError(false); setMobileStreamPlaying(true); }}
                          className="mt-1.5 inline-flex items-center gap-1 px-2 py-1 rounded bg-white/10 text-white text-[10px]"
                        >
                          <RotateCcw className="w-3 h-3" /> Coba Lagi
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setMobileStreamPlaying(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold shadow transition cursor-pointer"
                      >
                        <Play className="w-4 h-4 fill-current" /> Putar Stream
                      </button>
                    )}
                  </div>

                  {/* Location subtitle */}
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    <MapPin className="w-3 h-3 text-blue-500 flex-shrink-0" />
                    <span className="truncate">{selectedCctvObject.ket_lokasi || selectedCctvObject.nama_lokasi}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ---- TAB 3: BALIFUEL ---- */}
          {mobileTab === "balifuel" && (
            <div className="flex flex-col w-full overflow-hidden bg-slate-50 dark:bg-slate-950" style={{ height: "calc(100dvh - 118px)" }}>
              {/* Header */}
              <div className="px-3 py-2 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 border-b border-amber-200 dark:border-amber-900/50 flex-shrink-0 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Fuel className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-100">BaliFuel</span>
                  <span className="text-[9px] font-bold text-amber-700 dark:text-amber-300 bg-amber-200 dark:bg-amber-900/60 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-amber-600 rounded-full animate-pulse inline-block" />
                    LIVE REPORT
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => { setIsLoadingFrame(true); setIframeKey((k) => k + 1); }}
                    className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-400 hover:bg-amber-50 transition cursor-pointer"
                    title="Muat ulang"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingFrame ? "animate-spin" : ""}`} />
                  </button>
                  <a
                    href="https://balifuel.com/?lang=id"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition cursor-pointer"
                    title="Buka di tab baru"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Iframe container & iframe with direct calc height to override browser 150px default */}
              <div
                className="w-full relative"
                style={{
                  height: "calc(100dvh - 160px)",
                  minHeight: "520px",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {isLoadingFrame && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-slate-50/80 dark:bg-slate-950/80 pointer-events-none transition-opacity">
                    <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                    <p className="text-xs font-semibold text-slate-700 dark:text-white">Menghubungkan ke BaliFuel...</p>
                  </div>
                )}
                <iframe
                  key={iframeKey}
                  src="https://balifuel.com/?lang=id"
                  style={{
                    width: "100%",
                    height: "calc(100dvh - 160px)",
                    minHeight: "520px",
                    border: "none",
                    display: "block",
                  }}
                  title="BaliFuel Live"
                  allow="geolocation"
                  onLoad={() => setIsLoadingFrame(false)}
                />
              </div>
            </div>
          )}

        </div>

        {/* Bottom Nav */}
        <MobileBottomNav activeTab={mobileTab} onTabChange={setMobileTab} />
      </div>

      {/* ==================== DESKTOP LAYOUT ==================== */}
      <main className="hidden md:flex flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-col gap-5">
        <GanjilGenapBanner />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-bold shadow-sm">
              <Map className="w-4 h-4" />
              <span>Tampilan Peta</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500">
            <button
              onClick={() => { setFilterSpbuOnly(!filterSpbuOnly); setCurrentPage(1); }}
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
                <button onClick={() => handleSelectLocation(null)} className="text-blue-600 hover:underline cursor-pointer">Reset</button>
              </span>
            )}
          </div>
        </div>

        {/* Content: Sidebar + Map/Grid */}
        <div className="flex flex-col lg:flex-row gap-6 flex-1">
          <div className="w-full lg:w-80 flex-shrink-0">
            <SidebarList
              locations={filteredLocations}
              selectedLocation={selectedLocation}
              searchQuery={searchQuery}
              filterSpbuOnly={filterSpbuOnly}
              sumberFilter={sumberFilter}
              onSumberFilterChange={(val) => { setSumberFilter(val); setCurrentPage(1); }}
              onFilterSpbuToggle={() => { setFilterSpbuOnly(!filterSpbuOnly); setCurrentPage(1); }}
              onSearchChange={setSearchQuery}
              onSelectLocation={handleSelectLocation}
              onPlayStream={(loc) => handleEnlarge(loc, 0)}
            />
          </div>

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
                    <p className="text-sm text-slate-500 font-medium">Tidak ada kamera CCTV ditemukan untuk filter ini.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {paginatedGridLocations.map((loc) => (
                      <CctvCard key={loc.id_lokasi} location={loc} onEnlarge={handleEnlarge} />
                    ))}
                  </div>
                )}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2 border-t border-slate-200 dark:border-slate-800">
                    <div className="text-xs text-slate-500">
                      Menampilkan {(currentPage - 1) * itemsPerPage + 1} – {Math.min(currentPage * itemsPerPage, gridLocations.length)} dari {gridLocations.length} kamera
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"><ChevronsLeft className="w-4 h-4" /></button>
                      <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"><ChevronLeft className="w-4 h-4" /></button>
                      <div className="flex items-center gap-1 px-2">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let p = i + 1;
                          if (totalPages > 5 && currentPage > 3) p = Math.min(totalPages - 4, currentPage - 2) + i;
                          return (
                            <button key={p} onClick={() => setCurrentPage(p)} className={`w-8 h-8 rounded-lg text-xs font-semibold transition cursor-pointer ${currentPage === p ? "bg-blue-600 text-white shadow-sm" : "border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"}`}>{p}</button>
                          );
                        })}
                      </div>
                      <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"><ChevronRight className="w-4 h-4" /></button>
                      <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"><ChevronsRight className="w-4 h-4" /></button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <div className="hidden md:block"><Footer /></div>

      <CctvModal location={modalLocation} deviceIndex={modalDeviceIdx} onClose={() => setModalLocation(null)} />
    </div>
  );
}
