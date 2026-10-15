"use client";

import React, { useEffect, useRef } from "react";
import { CctvLocation } from "@/types/cctv";
import "leaflet/dist/leaflet.css";

interface CctvMapProps {
  locations: CctvLocation[];
  selectedLocation: number | null;
  onLocationSelect: (id: number) => void;
  onPlayStream?: (location: CctvLocation) => void;
  isMobile?: boolean;
}

export default function CctvMap({
  locations,
  selectedLocation,
  onLocationSelect,
  onPlayStream,
  isMobile = false,
}: CctvMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<{ [key: number]: any }>({});

  const onPlayStreamRef = useRef(onPlayStream);
  onPlayStreamRef.current = onPlayStream;

  const onLocationSelectRef = useRef(onLocationSelect);
  onLocationSelectRef.current = onLocationSelect;

  const locationsRef = useRef(locations);
  locationsRef.current = locations;

  const BALI_LAT = -8.50;
  const BALI_LON = 115.18;

  // Expose global window handlers for popup button click
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).__openCctvStream = (id: number | string) => {
        const numId = Number(id);
        const target = locationsRef.current.find((l) => l.id_lokasi === numId || String(l.id_lokasi) === String(id));
        if (target && onPlayStreamRef.current) {
          onPlayStreamRef.current(target);
        }
      };
      (window as any).__selectCctv = (id: number | string) => {
        const numId = Number(id);
        if (onLocationSelectRef.current) {
          onLocationSelectRef.current(numId);
        }
      };
    }
  }, []);

  // Helper for generating custom marker pin HTML
  const createMarkerHtml = (isActive: boolean, isNearSpbu: boolean, sumber?: string) => {
    const isBaliSatuData = (sumber || "").toLowerCase().includes("bali");
    const bgColor = isActive
      ? "#ef4444"
      : isNearSpbu
      ? "#f59e0b"
      : isBaliSatuData
      ? "#059669"
      : "#2563eb";
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

  // Helper for generating popup HTML with dynamic streaming button state
  const createPopupHtml = (loc: CctvLocation, isSelected: boolean, isMobileView: boolean) => {
    const isBaliSatuData = (loc.sumber || "").toLowerCase().includes("bali");
    const isNearSpbu = Boolean(loc.dekat_spbu);
    const device = loc.tb_device_lokasi && loc.tb_device_lokasi[0];
    const cameraName = device?.nama_alias || device?.nama || loc.nama_lokasi;
    const streamUrl = device?.url_proxy_hls?.trim() || "";

    // On mobile: when modal is open for this selected CCTV, disable the button
    const isStreamingDisabled = isMobileView && isSelected;

    return `
      <div style="min-width: 230px; font-family: system-ui, sans-serif; padding: 4px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
          <div style="display: flex; gap: 4px; align-items: center;">
            <span style="font-size: 10px; font-weight: 700; background-color: #f1f5f9; color: #475569; padding: 2px 6px; border-radius: 9999px;">
              #${loc.id_lokasi}
            </span>
            <span style="font-size: 10px; font-weight: 700; background-color: ${isBaliSatuData ? '#d1fae5' : '#dbeafe'}; color: ${isBaliSatuData ? '#065f46' : '#1e40af'}; padding: 2px 6px; border-radius: 9999px;">
              ${loc.sumber || 'ATCS Denpasar'}
            </span>
          </div>
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
        <div style="font-size: 11px; color: #94a3b8; margin-bottom: ${isMobileView ? '2px' : '8px'};">
          📍 Koordinat: ${loc.lat_lokasi.toFixed(5)}, ${loc.lon_lokasi.toFixed(5)}
        </div>
        ${
          isMobileView
            ? ""
            : !streamUrl
            ? `<div style="font-size: 11px; color: #ef4444; font-weight: 500;">Stream offline / pemeliharaan</div>`
            : `<button type="button" onclick="window.__openCctvStream && window.__openCctvStream(${loc.id_lokasi})" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 8px 12px; background-color: #2563eb; color: white; border: none; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; transition: background-color 0.2s;" onmouseover="this.style.backgroundColor='#1d4ed8'" onmouseout="this.style.backgroundColor='#2563eb'">
                ▶ Buka Streaming
              </button>`
        }
      </div>
    `;
  };

  // 1. Initialize Map Instance with proper cleanup
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    let L: any;
    try {
      L = require("leaflet");
    } catch (e) {
      console.error("Leaflet import failed:", e);
      return;
    }

    const container = mapContainerRef.current;

    // Clean up any stale leaflet ID if leftover
    if ((container as any)._leaflet_id) {
      delete (container as any)._leaflet_id;
    }

    const map = L.map(container, {
      center: [BALI_LAT, BALI_LON],
      zoom: 10,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | CCTV Bali',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    // Use ResizeObserver for instant responsive resize
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize({ animate: false });
        }
      });
      resizeObserver.observe(container);
    }

    const t1 = setTimeout(() => map.invalidateSize({ animate: false }), 100);
    const t2 = setTimeout(() => map.invalidateSize({ animate: false }), 400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      map.remove();
      mapInstanceRef.current = null;
      markersRef.current = {};
      if ((container as any)._leaflet_id) {
        delete (container as any)._leaflet_id;
      }
    };
  }, []);

  // 2. Render / Update Markers when locations change
  useEffect(() => {
    if (!mapInstanceRef.current || typeof window === "undefined") return;

    let L: any;
    try {
      L = require("leaflet");
    } catch {
      return;
    }

    const map = mapInstanceRef.current;

    // Clear old markers
    Object.values(markersRef.current).forEach((marker: any) => {
      marker.remove();
    });
    markersRef.current = {};

    locations.forEach((loc) => {
      if (typeof loc.lat_lokasi !== "number" || typeof loc.lon_lokasi !== "number") return;
      if (isNaN(loc.lat_lokasi) || isNaN(loc.lon_lokasi)) return;

      const isSelected = selectedLocation === loc.id_lokasi;
      const isNearSpbu = Boolean(loc.dekat_spbu);

      const customIcon = L.divIcon({
        className: "cctv-custom-marker",
        html: createMarkerHtml(isSelected, isNearSpbu, loc.sumber),
        iconSize: [34, 34],
        iconAnchor: [17, 17],
        popupAnchor: [0, -18],
      });

      const marker = L.marker([loc.lat_lokasi, loc.lon_lokasi], { icon: customIcon }).addTo(map);

      const popupHtml = createPopupHtml(loc, isSelected, isMobile);

      marker.bindPopup(popupHtml, {
        autoPan: true,
        closeButton: true,
        offset: [0, -10],
      });

      marker.on("click", () => {
        onLocationSelectRef.current(loc.id_lokasi);
      });

      markersRef.current[loc.id_lokasi] = marker;
    });
  }, [locations, isMobile]);

  // 3. Update active marker styling and popup content when selectedLocation changes
  useEffect(() => {
    if (!mapInstanceRef.current || typeof window === "undefined") return;

    let L: any;
    try {
      L = require("leaflet");
    } catch {
      return;
    }

    locations.forEach((loc) => {
      const marker = markersRef.current[loc.id_lokasi];
      if (marker) {
        const isSelected = selectedLocation === loc.id_lokasi;
        const isNearSpbu = Boolean(loc.dekat_spbu);

        // Update icon
        const updatedIcon = L.divIcon({
          className: "cctv-custom-marker",
          html: createMarkerHtml(isSelected, isNearSpbu, loc.sumber),
          iconSize: [34, 34],
          iconAnchor: [17, 17],
          popupAnchor: [0, -18],
        });
        marker.setIcon(updatedIcon);

        // Dynamically update popup button: disabled if selected on mobile!
        marker.setPopupContent(createPopupHtml(loc, isSelected, isMobile));
      }
    });

    if (selectedLocation && markersRef.current[selectedLocation]) {
      const targetLoc = locations.find((l) => l.id_lokasi === selectedLocation);
      if (
        targetLoc &&
        typeof targetLoc.lat_lokasi === "number" &&
        typeof targetLoc.lon_lokasi === "number" &&
        !isNaN(targetLoc.lat_lokasi) &&
        !isNaN(targetLoc.lon_lokasi)
      ) {
        const map = mapInstanceRef.current;
        try {
          map.flyTo([targetLoc.lat_lokasi, targetLoc.lon_lokasi], 16, {
            animate: true,
            duration: 0.8,
          });
        } catch (e) {
          console.warn("flyTo failed:", e);
        }
      }
    }
  }, [selectedLocation, locations, isMobile]);

  return (
    <div
      className="relative w-full h-full rounded-xl overflow-hidden shadow-inner border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900"
      style={{ height: "100%", width: "100%", minHeight: "350px" }}
    >
      <div ref={mapContainerRef} style={{ height: "100%", width: "100%", minHeight: "350px" }} />

      {/* Floating Map Legend */}
      <div className="absolute bottom-3 left-3 z-[400] bg-white/95 dark:bg-slate-900/95 backdrop-blur px-2.5 py-1.5 rounded-lg shadow-md border border-slate-200 dark:border-slate-800 text-[10px] flex flex-wrap items-center gap-2.5 pointer-events-none">
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
          <span className="text-slate-600 dark:text-slate-300 font-medium">ATCS Denpasar</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
          <span className="text-slate-600 dark:text-slate-300 font-medium">Bali Satu Data</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
          <span className="text-slate-600 dark:text-slate-300 font-medium">⛽ SPBU</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
          <span className="text-slate-600 dark:text-slate-300 font-medium">Terpilih</span>
        </div>
      </div>
    </div>
  );
}
