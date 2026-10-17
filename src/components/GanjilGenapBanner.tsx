"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Megaphone,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  BellPlus,
  Check,
  ExternalLink,
} from "lucide-react";

interface GanjilGenapBannerProps {
  className?: string;
  defaultMinimized?: boolean;
}

export default function GanjilGenapBanner({
  className = "",
  defaultMinimized = false,
}: GanjilGenapBannerProps) {
  const [isMinimized, setIsMinimized] = useState(defaultMinimized);
  const [plateInput, setPlateInput] = useState("");
  const [isAturanOpen, setIsAturanOpen] = useState(false);
  const [reminderAdded, setReminderAdded] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Restore saved state from localStorage
  useEffect(() => {
    setMounted(true);
    try {
      const savedMinimized = localStorage.getItem("bbm_ganjil_genap_minimized");
      if (savedMinimized !== null) {
        setIsMinimized(savedMinimized === "true");
      }
      const savedPlate = localStorage.getItem("bbm_user_plate");
      if (savedPlate) {
        setPlateInput(savedPlate);
      }
    } catch {
      // ignore localStorage errors
    }
  }, []);

  const toggleMinimize = () => {
    setIsMinimized((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("bbm_ganjil_genap_minimized", String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handlePlateChange = (val: string) => {
    const uppercaseVal = val.toUpperCase();
    setPlateInput(uppercaseVal);
    try {
      localStorage.setItem("bbm_user_plate", uppercaseVal);
    } catch {
      // ignore
    }
  };

  // Date calculation
  const { todayInfo, tomorrowInfo, dayAfterInfo } = useMemo(() => {
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

    const now = new Date();

    const tDate = now.getDate();
    const tDayName = days[now.getDay()];
    const tMonthName = months[now.getMonth()];
    const isTodayGanjil = tDate % 2 !== 0;

    const tmr = new Date(now);
    tmr.setDate(now.getDate() + 1);
    const tmrDate = tmr.getDate();
    const tmrDayName = days[tmr.getDay()];
    const tmrMonthName = months[tmr.getMonth()];
    const isTmrGanjil = tmrDate % 2 !== 0;

    const daft = new Date(now);
    daft.setDate(now.getDate() + 2);
    const daftDate = daft.getDate();
    const daftDayName = days[daft.getDay()];
    const isDaftGanjil = daftDate % 2 !== 0;

    return {
      todayInfo: {
        rawDate: now,
        dateNum: tDate,
        dayName: tDayName,
        monthName: tMonthName,
        isGanjil: isTodayGanjil,
        statusText: isTodayGanjil ? "ganjil" : "genap",
        headerFormatted: `${tDayName} ${tDate} ${tMonthName}`,
      },
      tomorrowInfo: {
        rawDate: tmr,
        dateNum: tmrDate,
        dayName: tmrDayName,
        monthName: tmrMonthName,
        isGanjil: isTmrGanjil,
        statusText: isTmrGanjil ? "ganjil" : "genap",
        label: `${tmrDayName} ${tmrDate}`,
        fullFormatted: `${tmrDayName} ${tmrDate} ${tmrMonthName}`,
      },
      dayAfterInfo: {
        rawDate: daft,
        dateNum: daftDate,
        dayName: daftDayName,
        monthName: months[daft.getMonth()],
        isGanjil: isDaftGanjil,
        statusText: isDaftGanjil ? "ganjil" : "genap",
        label: `${daftDayName} ${daftDate}`,
      },
    };
  }, []);

  // Parse plate input and determine eligibility
  const plateCheckResult = useMemo(() => {
    const trimmed = plateInput.trim();
    if (!trimmed) return null;

    // Extract digits from plate string
    const digits = trimmed.match(/\d/g);
    if (!digits || digits.length === 0) return null;

    const lastDigitChar = digits[digits.length - 1];
    const lastDigit = parseInt(lastDigitChar, 10);
    const isPlateGanjil = lastDigit % 2 !== 0;
    const isAllowedToday = isPlateGanjil === todayInfo.isGanjil;

    return {
      rawPlate: trimmed,
      lastDigit,
      plateType: isPlateGanjil ? "ganjil" : "genap",
      isAllowedToday,
      nextScheduleDate: isAllowedToday ? todayInfo.rawDate : tomorrowInfo.rawDate,
      nextScheduleLabel: isAllowedToday ? "hari ini" : `besok, ${tomorrowInfo.fullFormatted}`,
    };
  }, [plateInput, todayInfo, tomorrowInfo]);

  // Calendar reminder download (.ics)
  const handleCalendarReminder = () => {
    const targetDate = plateCheckResult?.isAllowedToday
      ? todayInfo.rawDate
      : tomorrowInfo.rawDate;
    const targetPlateType = plateCheckResult?.plateType || todayInfo.statusText;

    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, "0");
    const day = String(targetDate.getDate()).padStart(2, "0");

    // Event at 06:00 WITA (WITA is UTC+8 -> 22:00 UTC previous day, or local floating)
    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//ATCS Bali//BBM Ganjil Genap Reminder//ID",
      "CALSCALE:GREGORIAN",
      "BEGIN:VEVENT",
      `SUMMARY:Giliran Beli BBM Subsidi Pelat ${targetPlateType.toUpperCase()}`,
      `DESCRIPTION:Hari ini giliran pelat nomor ${targetPlateType.toUpperCase()} untuk pembelian BBM bersubsidi (Pertalite/Biosolar) di SPBU Bali. Batas kuota: Mobil 20L, Motor 3L.`,
      `DTSTART:${year}${month}${day}T060000`,
      `DTEND:${year}${month}${day}T070000`,
      "LOCATION:SPBU Bali",
      "STATUS:CONFIRMED",
      "BEGIN:VALARM",
      "TRIGGER:-PT0M",
      "ACTION:DISPLAY",
      `DESCRIPTION:Pengingat: Giliran isi BBM subsidi pelat ${targetPlateType}`,
      "END:VALARM",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Pengingat-BBM-${targetPlateType}-${year}${month}${day}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    setReminderAdded(true);
    setTimeout(() => setReminderAdded(false), 4000);
  };

  // Determine current display state:
  // 1) "allowed" -> user plate matches today (Photos 3 & 4)
  // 2) "not_allowed" -> user plate does not match today (Photos 1 & 2)
  // 3) "default" -> no plate entered yet
  const statusMode: "allowed" | "not_allowed" | "default" = useMemo(() => {
    if (!plateCheckResult) return "default";
    return plateCheckResult.isAllowedToday ? "allowed" : "not_allowed";
  }, [plateCheckResult]);

  // Card background styling based on state
  const containerClasses = useMemo(() => {
    if (statusMode === "allowed") {
      // Light green / mint container matching Photo 3 & 4
      return "bg-[#EAF3EA] dark:bg-[#112718] border border-[#CDE3CD] dark:border-[#1e4828]";
    }
    // White background matching Photo 1 & 2
    return "bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800";
  }, [statusMode]);

  return (
    <div
      className={`rounded-2xl shadow-sm transition-all duration-200 overflow-hidden ${containerClasses} ${className}`}
    >
      {/* ================= HEADER BAR (Clickable to Toggle Minimize) ================= */}
      <div
        onClick={toggleMinimize}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggleMinimize();
          }
        }}
        className="w-full flex items-center justify-between p-3.5 sm:p-4 text-left cursor-pointer hover:opacity-95 select-none transition"
      >
        <div className="flex items-center gap-3">
          {/* LEFT ICON */}
          {statusMode === "allowed" ? (
            /* CheckCircle2 Icon in Green for 'Sudah giliran' (Photo 3 & 4) */
            <div className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center flex-shrink-0 text-[#2D5A27] dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
            </div>
          ) : statusMode === "not_allowed" ? (
            /* Clock Icon for 'Belum giliran' (Photo 1 & 2) */
            <div className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center flex-shrink-0 text-slate-700 dark:text-slate-300">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
            </div>
          ) : (
            /* Default Megaphone Icon when no plate is entered */
            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center flex-shrink-0 text-rose-800 dark:text-rose-400">
              <Megaphone className="w-4 h-4 transform -rotate-12" />
            </div>
          )}

          {/* TEXT BLOCK */}
          <div className="space-y-0.5">
            {statusMode === "allowed" ? (
              /* Sudah giliran (Photo 3 & 4) */
              <>
                <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight">
                  Hari ini Anda boleh isi BBM subsidi
                </h2>
                <div className="flex items-center gap-1.5 flex-wrap text-xs text-slate-600 dark:text-slate-300">
                  <span className="bg-[#2D5A27] text-white text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-md tracking-wider">
                    {plateCheckResult?.rawPlate}
                  </span>
                  <span className="text-[11px] sm:text-xs">
                    Giliran pelat {plateCheckResult?.plateType}
                  </span>
                </div>
              </>
            ) : statusMode === "not_allowed" ? (
              /* Belum giliran (Photo 1 & 2) */
              <>
                <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight">
                  Hari ini pelat Anda belum giliran
                </h2>
                <div className="flex items-center gap-1.5 flex-wrap text-xs text-slate-600 dark:text-slate-300">
                  <span className="bg-[#1c1917] dark:bg-black text-white text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-md tracking-wider">
                    {plateCheckResult?.rawPlate}
                  </span>
                  <span className="text-[11px] sm:text-xs">
                    Bisa isi besok, {tomorrowInfo.fullFormatted}
                  </span>
                </div>
              </>
            ) : (
              /* Default initial state */
              <>
                <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight">
                  {todayInfo.headerFormatted}: BBM subsidi pelat {todayInfo.statusText}
                </h2>
                {/* <p className="text-[11px] sm:text-xs text-rose-800 dark:text-rose-400 font-normal leading-tight">
                  Ketuk di sini untuk diingatkan saat beli bensin
                </p> */}
              </>
            )}
          </div>
        </div>

        {/* Toggle Minimize/Maximize Chevron */}
        <div className="p-1 rounded-md text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition">
          {isMinimized ? (
            <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />
          ) : (
            <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5" />
          )}
        </div>
      </div>

      {/* ================= EXPANDED CONTENT BODY (Photo 1 & 3) ================= */}
      {!isMinimized && (
        <div className="px-3.5 sm:px-4 pb-4 pt-1 border-t border-slate-200/60 dark:border-slate-800/80 space-y-3.5 animate-fadeIn">
          {/* Main rule description */}
          <p className="text-xs sm:text-[13px] text-slate-800 dark:text-slate-200 leading-snug">
            <span className="font-semibold text-slate-900 dark:text-white">
              {todayInfo.headerFormatted}: BBM subsidi untuk pelat {todayInfo.statusText}.
            </span>{" "}
            Pertamax dan BBM non-subsidi bisa diisi semua pelat.
          </p>

          {/* 3 Day Schedule Pills */}
          <div className="flex items-center gap-2 pt-0.5">
            {/* Pill 1: Hari ini */}
            <div
              className={`rounded-xl px-3.5 py-1.5 text-center min-w-[76px] transition border ${
                statusMode === "allowed"
                  ? "bg-white dark:bg-slate-900/90 border-[#CDE3CD] dark:border-emerald-800"
                  : "bg-[#EFEFEF] dark:bg-slate-800/90 border-slate-200/60 dark:border-slate-700/60"
              }`}
            >
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-none">
                Hari ini
              </div>
              <div className="text-xs font-bold text-slate-900 dark:text-white capitalize mt-1">
                {todayInfo.statusText}
              </div>
            </div>

            {/* Pill 2: Besok */}
            <div
              className={`rounded-xl px-3.5 py-1.5 text-center min-w-[76px] transition border ${
                statusMode === "not_allowed"
                  ? /* In Photo 1: Tomorrow is user's turn, highlighted with soft green tint! */
                    "bg-[#DCEFDC] dark:bg-emerald-950/60 text-[#1E4D1E] dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                  : statusMode === "allowed"
                  ? "bg-white dark:bg-slate-900/90 border-[#CDE3CD] dark:border-emerald-800"
                  : "bg-[#EFEFEF] dark:bg-slate-800/90 border-slate-200/60 dark:border-slate-700/60"
              }`}
            >
              <div className="text-[10px] opacity-80 font-medium leading-none">
                {tomorrowInfo.label}
              </div>
              <div className="text-xs font-bold capitalize mt-1">
                {tomorrowInfo.statusText}
              </div>
            </div>

            {/* Pill 3: Lusa */}
            <div
              className={`rounded-xl px-3.5 py-1.5 text-center min-w-[76px] transition border ${
                statusMode === "allowed"
                  ? "bg-white dark:bg-slate-900/90 border-[#CDE3CD] dark:border-emerald-800"
                  : "bg-[#EFEFEF] dark:bg-slate-800/90 border-slate-200/60 dark:border-slate-700/60"
              }`}
            >
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-none">
                {dayAfterInfo.label}
              </div>
              <div className="text-xs font-bold text-slate-900 dark:text-white capitalize mt-1">
                {dayAfterInfo.statusText}
              </div>
            </div>
          </div>

          {/* Plate Input Section */}
          <div className="space-y-2 pt-1">
            <label
              htmlFor="plate-input-field"
              className="block text-xs sm:text-[13px] font-bold text-slate-800 dark:text-slate-200"
            >
              Nomor pelat atau angka terakhir
            </label>
            <div className="relative">
              <input
                id="plate-input-field"
                type="text"
                value={plateInput}
                onChange={(e) => handlePlateChange(e.target.value)}
                placeholder="DK 1234 AB"
                className="w-full px-3.5 py-2.5 rounded-xl border border-blue-400/80 dark:border-blue-500/60 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition tracking-wider"
              />
            </div>

            {/* STATUS BOX (Photo 1 & Photo 3) */}
            {statusMode === "allowed" ? (
              /* Photo 3: 'Boleh isi BBM subsidi hari ini' */
              <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold text-xs sm:text-[13px] py-2.5 px-4 rounded-xl border border-[#CDE3CD] dark:border-emerald-800/60 shadow-xs animate-fadeIn">
                Boleh isi BBM subsidi hari ini
              </div>
            ) : statusMode === "not_allowed" ? (
              /* Photo 1: 'Hari ini belum, bisa isi besok (Minggu 18 Okt)' */
              <div className="bg-[#FDF2F0] dark:bg-rose-950/40 text-[#8B2C24] dark:text-rose-300 font-bold text-xs sm:text-[13px] py-2.5 px-4 rounded-xl border border-rose-100 dark:border-rose-900/50 animate-fadeIn">
                Hari ini belum, bisa isi besok ({tomorrowInfo.label})
              </div>
            ) : null}

            {/* REMINDER BOX (Photo 1 & Photo 3) */}
            {/* <button
              type="button"
              onClick={handleCalendarReminder}
              className={`w-full p-3 rounded-xl border transition flex items-center justify-between text-left cursor-pointer group ${
                statusMode === "allowed"
                  ? "bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border-[#CDE3CD] dark:border-emerald-800/60 shadow-xs"
                  : "bg-[#F3EFEA] dark:bg-slate-800/90 hover:bg-[#eae5df] dark:hover:bg-slate-800 border-stone-200/70 dark:border-slate-700"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="text-[#8B2C24] dark:text-rose-400 flex-shrink-0">
                  {reminderAdded ? (
                    <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
                  ) : (
                    <BellPlus className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className="text-xs sm:text-[13px] font-bold text-slate-900 dark:text-white leading-tight">
                    {reminderAdded
                      ? "Pengingat kalender berhasil disimpan!"
                      : `Ingatkan saya saat giliran pelat ${plateCheckResult?.plateType || todayInfo.statusText}`}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {reminderAdded
                      ? "Buka aplikasi kalender HP untuk melihat pengingat"
                      : "Tambah ke kalender HP, pengingat jam 06.00 WITA"}
                  </div>
                </div>
              </div>
            </button> */}

            {/* Bottom note under input */}
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed pt-0.5">
              BBM subsidi: Pertalite, Biosolar, dinilai dari angka terakhir pelat (DK 1234 AB berarti genap). Batas sekali isi: mobil 20 liter, motor 3 liter.
            </p>
          </div>

          {/* Collapsible 'Aturan 70%' */}
          <div className="pt-1 border-t border-slate-200/60 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsAturanOpen((prev) => !prev)}
              className="w-full flex items-center justify-between py-1 text-xs sm:text-[13px] font-bold text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer text-left"
            >
              <span>Aturan 70%</span>
              <span className="text-slate-400">
                {isAturanOpen ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </span>
            </button>

            {isAturanOpen && (
              <div className="mt-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 space-y-1.5 animate-fadeIn">
                <p className="font-semibold text-slate-800 dark:text-white">
                  Ketentuan Tambahan Penanganan Antrean BBM di Bali:
                </p>
                <ul className="list-disc pl-4 space-y-1 text-[11px] leading-relaxed">
                  <li>
                    <strong>Ketersediaan Stok 70%:</strong> SPBU diinstruksikan menjaga pasokan dan ketersediaan BBM bersubsidi (Pertalite & Biosolar) hingga 70%-100% kapasitas tangki harian.
                  </li>
                  <li>
                    <strong>Batas Pengisian Maksimal:</strong> Kendaraan roda empat (mobil) maksimal 20 liter, dan kendaraan roda dua (motor) maksimal 3 liter per pengisian.
                  </li>
                  <li>
                    <strong>Pengaturan Truk & Kendaraan Berat:</strong> Pengisian BBM subsidi untuk truk dialihkan khusus pada malam hari demi mengurai kepadatan lalu lintas di siang hari.
                  </li>
                  <li>
                    <strong>Jalur Prioritas Bebas Antrean:</strong> Kendaraan layanan darurat seperti Ambulans dan Pemadam Kebakaran mendapatkan jalur cepat khusus tanpa pembatasan ganjil-genap.
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* Reference Notice Footer */}
          <div className="pt-2 text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
            Surat Gubernur Bali B.21.500.1/16673/V/DISNAKER.ESDM, Jumat 16 Okt. Berlaku Sabtu 17 Okt sampai Senin 19 Okt, lalu dievaluasi.{" "}
            <a
              href="https://bali.antaranews.com/berita/357678/gubernur-bali-terbitkan-surat-tangani-antrean-bbm"
              target="_blank"
              rel="noopener noreferrer"
              className="text-rose-800 dark:text-rose-400 underline font-medium hover:text-rose-900 dark:hover:text-rose-300 inline-flex items-center gap-0.5"
            >
              <span>Sumber berita</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
