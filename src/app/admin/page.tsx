"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CctvLocation } from "@/types/cctv";
import {
  Video,
  Fuel,
  Plus,
  Pencil,
  Trash2,
  Search,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  MapPin,
  X,
  Save,
  Radio,
  Filter,
  LogOut,
  Loader2,
} from "lucide-react";

export default function AdminPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [locations, setLocations] = useState<CctvLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSpbuOnly, setFilterSpbuOnly] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({
    id_lokasi: "",
    nama_lokasi: "",
    ket_lokasi: "",
    lat_lokasi: "",
    lon_lokasi: "",
    is_active: true,
    dekat_spbu: false,
    nama_spbu: "",
    jarak_spbu_meter: "100",
    url_proxy_hls: "",
  });

  // Delete Confirm State
  const [deleteTarget, setDeleteTarget] = useState<CctvLocation | null>(null);

  const fetchLocations = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/cctv");
      const json = await res.json();
      if (json.success && json.data) {
        setLocations(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Verify session on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/session");
        const data = await res.json();
        if (data.authenticated) {
          setIsAuthenticated(true);
          fetchLocations();
        } else {
          router.replace("/admin/login");
        }
      } catch (err) {
        router.replace("/admin/login");
      }
    }
    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/admin/login");
      router.refresh();
    } catch (e) {
      router.replace("/admin/login");
    }
  };


  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Filtered locations
  const filtered = useMemo(() => {
    let list = locations;
    if (filterSpbuOnly) {
      list = list.filter((l) => l.dekat_spbu === true);
    }
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      list = list.filter((l) => {
        const nameMatch = l.nama_lokasi.toLowerCase().includes(q);
        const descMatch = (l.ket_lokasi || "").toLowerCase().includes(q);
        const spbuMatch = (l.nama_spbu || "").toLowerCase().includes(q);
        return nameMatch || descMatch || spbuMatch;
      });
    }
    return list;
  }, [locations, filterSpbuOnly, searchQuery]);

  // Statistics
  const totalCctv = locations.length;
  const totalSpbu = locations.filter((l) => l.dekat_spbu).length;
  const totalActive = locations.filter((l) => l.is_active).length;

  // Open Modal for Add
  const handleOpenAdd = () => {
    setIsEditing(false);
    setFormData({
      id_lokasi: "",
      nama_lokasi: "",
      ket_lokasi: "",
      lat_lokasi: "-8.67268",
      lon_lokasi: "115.22427",
      is_active: true,
      dekat_spbu: false,
      nama_spbu: "",
      jarak_spbu_meter: "150",
      url_proxy_hls: "",
    });
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEdit = (loc: CctvLocation) => {
    setIsEditing(true);
    const dev = loc.tb_device_lokasi && loc.tb_device_lokasi[0];
    setFormData({
      id_lokasi: loc.id_lokasi,
      nama_lokasi: loc.nama_lokasi,
      ket_lokasi: loc.ket_lokasi || "",
      lat_lokasi: loc.lat_lokasi,
      lon_lokasi: loc.lon_lokasi,
      is_active: loc.is_active,
      dekat_spbu: Boolean(loc.dekat_spbu),
      nama_spbu: loc.nama_spbu || "",
      jarak_spbu_meter: loc.jarak_spbu_meter || "150",
      url_proxy_hls: dev?.url_proxy_hls || "",
    });
    setIsModalOpen(true);
  };

  // Submit Add or Edit
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = isEditing ? "PUT" : "POST";
      const res = await fetch("/api/cctv", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message);
        setIsModalOpen(false);
        fetchLocations();
      } else {
        alert(json.message || "Gagal menyimpan data");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  // Execute Delete
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/cctv?id=${deleteTarget.id_lokasi}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message);
        setDeleteTarget(null);
        fetchLocations();
      } else {
        alert(json.message || "Gagal menghapus data");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-xs font-semibold text-slate-500">Memverifikasi akses Administrator...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Header Admin */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/streaming"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Ke Live Stream</span>
            </Link>
            <div>
              <h1 className="text-lg font-bold flex items-center gap-2">
                <span>Panel Admin CCTV ATCS Denpasar</span>
              </h1>
              <p className="text-xs text-slate-500">
                Modifikasi data titik CCTV & kategorisasi SPBU
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah CCTV Baru</span>
            </button>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 border border-rose-200 dark:border-rose-900 transition cursor-pointer"
              title="Keluar dari sesi admin"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col gap-6">
        {/* Toast Alert */}
        {toastMessage && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2 shadow-sm animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="font-medium">{toastMessage}</span>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-100 dark:bg-blue-950/70 text-blue-600 flex items-center justify-center">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Total Titik CCTV</div>
              <div className="text-xl font-extrabold">{totalCctv} Lokasi</div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-100 dark:bg-amber-950/70 text-amber-600 flex items-center justify-center">
              <Fuel className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Kategori Dekat SPBU</div>
              <div className="text-xl font-extrabold text-amber-600 dark:text-amber-400">
                {totalSpbu} Titik
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 flex items-center justify-center">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Status Aktif</div>
              <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {totalActive} Aktif
              </div>
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama simpang, lokasi, atau SPBU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterSpbuOnly(!filterSpbuOnly)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition cursor-pointer border ${
                filterSpbuOnly
                  ? "bg-amber-500 text-white border-amber-600 shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200"
              }`}
            >
              <Fuel className="w-3.5 h-3.5" />
              <span>{filterSpbuOnly ? "Menampilkan: Dekat SPBU Saja" : "Filter: Dekat SPBU"}</span>
            </button>
            <span className="text-xs text-slate-400">
              Ditemukan: <strong>{filtered.length}</strong>
            </span>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex-1">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Nama Simpang & Lokasi</th>
                  <th className="py-3 px-4">Koordinat</th>
                  <th className="py-3 px-4">Kategori SPBU</th>
                  <th className="py-3 px-4">Stream URL</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      Tidak ada data CCTV yang cocok dengan filter.
                    </td>
                  </tr>
                ) : (
                  filtered.map((loc) => {
                    const dev = loc.tb_device_lokasi && loc.tb_device_lokasi[0];
                    const streamUrl = dev?.url_proxy_hls?.trim() || "";

                    if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-xs font-semibold text-slate-500">Memverifikasi akses Administrator...</p>
      </div>
    );
  }

  return (
                      <tr
                        key={loc.id_lokasi}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
                      >
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                          #{loc.id_lokasi}
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          <div className="font-bold text-slate-900 dark:text-white truncate">
                            {loc.nama_lokasi}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                            <span className="truncate">{loc.ket_lokasi}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                          {loc.lat_lokasi?.toFixed(5)}, {loc.lon_lokasi?.toFixed(5)}
                        </td>
                        <td className="py-3 px-4">
                          {loc.dekat_spbu ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                              <Fuel className="w-3 h-3 text-amber-600" />
                              <span>{loc.nama_spbu || "SPBU Terdekat"}</span>
                              {loc.jarak_spbu_meter && (
                                <span className="text-amber-600/80 font-normal">
                                  ({loc.jarak_spbu_meter}m)
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">
                              Bukan area SPBU
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 max-w-[180px]">
                          {streamUrl ? (
                            <a
                              href={streamUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-700 truncate inline-flex items-center gap-1 font-mono text-[11px] max-w-full"
                              title={streamUrl}
                            >
                              <span className="truncate">{streamUrl.replace("https://atcs.denpasarkota.go.id", "")}</span>
                              <ExternalLink className="w-3 h-3 flex-shrink-0" />
                            </a>
                          ) : (
                            <span className="text-rose-400 text-[11px]">Tidak ada URL</span>
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              loc.is_active
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400"
                                : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-400"
                            }`}
                          >
                            {loc.is_active ? "AKTIF" : "NONAKTIF"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(loc)}
                              className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 transition cursor-pointer"
                              title="Edit CCTV"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(loc)}
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition cursor-pointer"
                              title="Hapus CCTV"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* FORM MODAL (TAMBAH / EDIT) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Video className="w-5 h-5 text-blue-600" />
                <span>{isEditing ? `Edit CCTV #${formData.id_lokasi}` : "Tambah Titik CCTV Baru"}</span>
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              {/* Nama & Keterangan */}
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Nama Simpang / Titik CCTV *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: SIMPANG SANUR"
                  value={formData.nama_lokasi}
                  onChange={(e) => setFormData({ ...formData, nama_lokasi: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Keterangan Lokasi / Simpang
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Simpang Hang Tuah - Sanur"
                  value={formData.ket_lokasi}
                  onChange={(e) => setFormData({ ...formData, ket_lokasi: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Koordinat */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Latitude (Lintang) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="-8.67268"
                    value={formData.lat_lokasi}
                    onChange={(e) => setFormData({ ...formData, lat_lokasi: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Longitude (Bujur) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="115.22427"
                    value={formData.lon_lokasi}
                    onChange={(e) => setFormData({ ...formData, lon_lokasi: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* URL Streaming HLS */}
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  URL Proxy Streaming HLS (Iframe Feed)
                </label>
                <input
                  type="text"
                  placeholder="https://atcs.denpasarkota.go.id/stream/.../"
                  value={formData.url_proxy_hls}
                  onChange={(e) => setFormData({ ...formData, url_proxy_hls: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* KATEGORI SPBU SECTION */}
              <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Fuel className="w-4 h-4 text-amber-600" />
                    <span className="font-bold text-slate-900 dark:text-white">
                      Kategori Dekat SPBU
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.dekat_spbu}
                      onChange={(e) => setFormData({ ...formData, dekat_spbu: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>

                {formData.dekat_spbu && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-amber-200/60 dark:border-amber-900/40 animate-fadeIn">
                    <div>
                      <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">
                        Nama SPBU
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: SPBU 54.801.07 PB Sudirman"
                        value={formData.nama_spbu}
                        onChange={(e) => setFormData({ ...formData, nama_spbu: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">
                        Jarak ke SPBU (Meter)
                      </label>
                      <input
                        type="number"
                        placeholder="Contoh: 150"
                        value={formData.jarak_spbu_meter}
                        onChange={(e) => setFormData({ ...formData, jarak_spbu_meter: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Status Aktif */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="is_active_input"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300"
                />
                <label htmlFor="is_active_input" className="font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                  Kamera Aktif & Dapat Ditampilkan
                </label>
              </div>

              {/* Tombol Aksi Form */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow-sm cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{isEditing ? "Simpan Perubahan" : "Tambah CCTV"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/70 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-center font-bold text-base text-slate-900 dark:text-white mb-1">
              Hapus CCTV #{deleteTarget.id_lokasi}?
            </h3>
            <p className="text-center text-xs text-slate-500 mb-5 leading-relaxed">
              Apakah Anda yakin ingin menghapus kamera <strong>{deleteTarget.nama_lokasi}</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex items-center justify-center gap-3 text-xs font-bold">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition shadow-sm cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
