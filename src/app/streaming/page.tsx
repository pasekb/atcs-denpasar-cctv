"use client";

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
