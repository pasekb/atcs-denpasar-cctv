"use client";

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

  const onPlayStreamRef = useRef(onPlayStream);
  onPlayStreamRef.current = onPlayStream;

  const locationsRef = useRef(locations);
  locationsRef.current = locations;

  const BALI_LAT = -8.50;
  const BALI_LON = 115.18;

  // Expose global window handler for popup button click
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).__openCctvStream = (id: number) => {
        const target = locationsRef.current.find((l) => l.id_lokasi === id);
        if (target && onPlayStreamRef.current) {
          onPlayStreamRef.current(target);
        }
      };
    }
    return () => {
      if (typeof window !== "undefined") {
        delete (window as any).__openCctvStream;
      }
    };
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

  // Initialize Map & Markers (only re-runs when locations list changes)
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
        center: [BALI_LAT, BALI_LON],
        zoom: 10,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | CCTV Bali',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
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
      const device = loc.tb_device_lokasi && loc.tb_device_lokasi[0];
      const cameraName = device?.nama_alias || device?.nama || loc.nama_lokasi;

      const customIcon = L.divIcon({
        className: "cctv-custom-marker",
        html: createMarkerHtml(isSelected, isNearSpbu, loc.sumber),
        iconSize: [34, 34],
        iconAnchor: [17, 17],
        popupAnchor: [0, -18],
      });

      const marker = L.marker([loc.lat_lokasi, loc.lon_lokasi], { icon: customIcon }).addTo(map);

      const streamUrl = device?.url_proxy_hls?.trim() || "";
      const popupHtml = `
        <div style="min-width: 230px; font-family: system-ui, sans-serif; padding: 4px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <div style="display: flex; gap: 4px; align-items: center;">
              <span style="font-size: 10px; font-weight: 700; background-color: #f1f5f9; color: #475569; padding: 2px 6px; border-radius: 9999px;">
                #${loc.id_lokasi}
              </span>
              <span style="font-size: 10px; font-weight: 700; background-color: ${loc.sumber === 'Bali Satu Data' ? '#d1fae5' : '#dbeafe'}; color: ${loc.sumber === 'Bali Satu Data' ? '#065f46' : '#1e40af'}; padding: 2px 6px; border-radius: 9999px;">
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
          <div style="font-size: 11px; color: #94a3b8; margin-bottom: 8px;">
            📍 Koordinat: ${loc.lat_lokasi.toFixed(5)}, ${loc.lon_lokasi.toFixed(5)}
          </div>
          ${
            streamUrl
              ? `<button type="button" onclick="window.__openCctvStream && window.__openCctvStream(${loc.id_lokasi})" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 8px 12px; background-color: #2563eb; color: white; border: none; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; transition: background-color 0.2s;" onmouseover="this.style.backgroundColor='#1d4ed8'" onmouseout="this.style.backgroundColor='#2563eb'">
                  ▶ Buka Streaming
                </button>`
              : `<div style="font-size: 11px; color: #ef4444; font-weight: 500;">Stream offline / pemeliharaan</div>`
          }
        </div>
      `;

      marker.bindPopup(popupHtml, {
        autoPan: true,
        closeButton: true,
        offset: [0, -10],
      });

      // On marker click: select location and ensure popup opens
      marker.on("click", () => {
        onLocationSelect(loc.id_lokasi);
        marker.openPopup();
      });

      markersRef.current[loc.id_lokasi] = marker;
    });
  }, [locations]);

  // Handle selectedLocation change: update marker icons & flyTo without destroying all markers!
  useEffect(() => {
    if (!mapInstanceRef.current || typeof window === "undefined") return;

    let L: any;
    try {
      L = require("leaflet");
    } catch (e) {
      return;
    }

    // Update icons for all markers according to current selection
    locations.forEach((loc) => {
      const marker = markersRef.current[loc.id_lokasi];
      if (marker) {
        const isSelected = selectedLocation === loc.id_lokasi;
        const isNearSpbu = Boolean(loc.dekat_spbu);
        const updatedIcon = L.divIcon({
          className: "cctv-custom-marker",
          html: createMarkerHtml(isSelected, isNearSpbu, loc.sumber),
          iconSize: [34, 34],
          iconAnchor: [17, 17],
          popupAnchor: [0, -18],
        });
        marker.setIcon(updatedIcon);
      }
    });

    if (selectedLocation && markersRef.current[selectedLocation]) {
      const selectedMarker = markersRef.current[selectedLocation];
      const targetLoc = locations.find((l) => l.id_lokasi === selectedLocation);
      if (targetLoc) {
        const map = mapInstanceRef.current;

        const openPopupSafely = () => {
          if (markersRef.current[selectedLocation]) {
            markersRef.current[selectedLocation].openPopup();
          }
        };

        // Buka popup saat animasi zoom/pan (flyTo) selesai
        map.once("moveend", openPopupSafely);

        map.flyTo([targetLoc.lat_lokasi, targetLoc.lon_lokasi], 16, {
          animate: true,
          duration: 0.8,
        });

        // Backup timer agar popup selalu terbuka
        setTimeout(openPopupSafely, 200);
        setTimeout(openPopupSafely, 900);
      }
    }
  }, [selectedLocation, locations]);

  return (
    <div className="relative w-full h-full min-h-[500px] rounded-xl overflow-hidden shadow-inner border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating Map Legend */}
      <div className="absolute bottom-4 left-4 z-[400] bg-white/95 dark:bg-slate-900/95 backdrop-blur px-3 py-2 rounded-lg shadow-md border border-slate-200 dark:border-slate-800 text-xs flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-blue-600 inline-block" />
          <span className="text-slate-600 dark:text-slate-300 font-medium">ATCS Denpasar</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block" />
          <span className="text-slate-600 dark:text-slate-300 font-medium">Bali Satu Data</span>
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
