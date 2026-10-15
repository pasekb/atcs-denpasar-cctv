import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { CctvApiResponse, CctvLocation } from "@/types/cctv";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

const bundledFilePath = path.join(process.cwd(), "src/data/cctv-locations.json");
const tmpFilePath = path.join("/tmp", "cctv-locations.json");

// In-memory cache for serverless environments
let memoryLocationsCache: CctvLocation[] | null = null;

function getLocalCctvData(): CctvLocation[] {
  if (memoryLocationsCache && memoryLocationsCache.length > 0) {
    return memoryLocationsCache;
  }

  // 1. Coba baca dari /tmp (jika ada modifikasi sebelumnya di lingkungan serverless)
  try {
    if (fs.existsSync(tmpFilePath)) {
      const fileContent = fs.readFileSync(tmpFilePath, "utf-8");
      const parsed = JSON.parse(fileContent);
      if (parsed.data && parsed.data.length > 0) {
        memoryLocationsCache = parsed.data;
        return memoryLocationsCache || [];
      }
    }
  } catch (err) {
    console.warn("Gagal membaca cache /tmp:", err);
  }

  // 2. Baca dari file bundled lokal
  try {
    if (fs.existsSync(bundledFilePath)) {
      const fileContent = fs.readFileSync(bundledFilePath, "utf-8");
      const parsed = JSON.parse(fileContent);
      memoryLocationsCache = parsed.data || [];
      return memoryLocationsCache || [];
    }
  } catch (err) {
    console.error("Error reading local cctv data:", err);
  }

  return [];
}

function saveLocalCctvData(locations: CctvLocation[]) {
  // Update in-memory cache seketika
  memoryLocationsCache = locations;

  const jsonContent = {
    success: true,
    message: "Req. Success",
    data: locations,
    meta: {
      pages: Math.ceil(locations.length / 6),
      paginate: 6,
      total: locations.length,
    },
  };
  const stringified = JSON.stringify(jsonContent, null, 2);

  // 1. Coba tulis ke file bundled lokal (berhasil di localhost / server biasa)
  let wroteToBundled = false;
  try {
    fs.writeFileSync(bundledFilePath, stringified, "utf-8");
    wroteToBundled = true;
  } catch (err: any) {
    // EROFS di serverless (Vercel / AWS Lambda / cloud)
    console.warn("Tidak dapat menulis ke bundled file (read-only filesystem):", err?.message);
  }

  // 2. Jika di serverless (read-only), fallback tulis ke /tmp (selalu writable)
  if (!wroteToBundled) {
    try {
      fs.writeFileSync(tmpFilePath, stringified, "utf-8");
    } catch (tmpErr: any) {
      console.warn("Tidak dapat menulis ke /tmp path:", tmpErr?.message);
    }
  }
}

async function getAllLocations(): Promise<CctvLocation[]> {
  // 1. Cek Supabase jika sudah dikonfigurasi
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("cctv_locations")
        .select("*")
        .order("id_lokasi", { ascending: true });

      if (!error && data && data.length > 0) {
        const mapped = data as unknown as CctvLocation[];
        memoryLocationsCache = mapped;
        return mapped;
      }
    } catch (e) {
      console.warn("Supabase fetch fallback:", e);
    }
  }

  // 2. Fallback ke file JSON lokal / /tmp / memory
  return getLocalCctvData();
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const paginate = parseInt(searchParams.get("paginate") || "0", 10);
    const query = (searchParams.get("q") || "").toLowerCase().trim();
    const idlok = searchParams.get("idlok");
    const spbuOnly = searchParams.get("spbu") === "true";
    const sumberParam = (searchParams.get("sumber") || "").toLowerCase().trim();

    let locations = await getAllLocations();

    const totalSpbu = locations.filter((loc) => loc.dekat_spbu).length;
    const totalAtcs = locations.filter((loc) => (loc.sumber || "").toLowerCase().includes("atcs")).length;
    const totalBaliSatuData = locations.filter((loc) => (loc.sumber || "").toLowerCase().includes("bali")).length;

    // Filter berdasarkan idlok
    if (idlok) {
      const idNum = parseInt(idlok, 10);
      locations = locations.filter((loc) => loc.id_lokasi === idNum);
    }

    // Filter SPBU
    if (spbuOnly) {
      locations = locations.filter((loc) => loc.dekat_spbu === true);
    }

    // Filter Kategori Sumber (ATCS Denpasar / Bali Satu Data)
    if (sumberParam) {
      if (sumberParam === "atcs" || sumberParam.includes("atcs")) {
        locations = locations.filter((loc) => (loc.sumber || "").toLowerCase().includes("atcs"));
      } else if (sumberParam === "bali" || sumberParam.includes("bali")) {
        locations = locations.filter((loc) => (loc.sumber || "").toLowerCase().includes("bali"));
      }
    }

    // Filter pencarian teks
    if (query) {
      locations = locations.filter((loc) => {
        const nameMatch = loc.nama_lokasi.toLowerCase().includes(query);
        const descMatch = (loc.ket_lokasi || "").toLowerCase().includes(query);
        const spbuMatch = (loc.nama_spbu || "").toLowerCase().includes(query);
        const cityMatch = (loc.tb_lokasi_kota?.nama_kota || "").toLowerCase().includes(query);
        const sourceMatch = (loc.sumber || "").toLowerCase().includes(query);
        const devMatch = loc.tb_device_lokasi?.some(
          (d) =>
            (d.nama && d.nama.toLowerCase().includes(query)) ||
            (d.nama_alias && d.nama_alias.toLowerCase().includes(query))
        );
        return nameMatch || descMatch || spbuMatch || cityMatch || sourceMatch || devMatch;
      });
    }

    const total = locations.length;
    let paginatedData = locations;
    let totalPages = 1;

    if (paginate > 0) {
      totalPages = Math.max(1, Math.ceil(total / paginate));
      const startIndex = (page - 1) * paginate;
      paginatedData = locations.slice(startIndex, startIndex + paginate);
    }

    const response: CctvApiResponse = {
      success: true,
      message: "Req. Success",
      data: paginatedData,
      meta: {
        pages: totalPages,
        paginate: paginate > 0 ? paginate : total,
        total: total,
        total_spbu: totalSpbu,
        total_atcs: totalAtcs,
        total_bali_satu_data: totalBaliSatuData,
      },
    };

    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Internal error", data: [] },
      { status: 500 }
    );
  }
}

// POST: Tambah CCTV baru
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const locations = await getAllLocations();

    const maxId = locations.reduce((max, l) => Math.max(max, l.id_lokasi || 0), 0);
    const newId = body.id_lokasi ? Number(body.id_lokasi) : maxId + 1;

    const newLocation: CctvLocation = {
      id_lokasi: newId,
      id_kota: 1,
      nomor_urut: locations.length + 1,
      nama_lokasi: body.nama_lokasi?.trim() || "LOKASI BARU",
      ket_lokasi: body.ket_lokasi?.trim() || "",
      lat_lokasi: parseFloat(body.lat_lokasi) || -8.67268,
      lon_lokasi: parseFloat(body.lon_lokasi) || 115.22427,
      is_active: body.is_active !== false,
      dekat_spbu: Boolean(body.dekat_spbu),
      nama_spbu: body.dekat_spbu ? (body.nama_spbu?.trim() || "SPBU Terdekat") : undefined,
      jarak_spbu_meter: body.dekat_spbu ? (parseInt(body.jarak_spbu_meter, 10) || 100) : undefined,
      tb_device_lokasi: [
        {
          id_lokasi: newId,
          nama: body.nama_lokasi || "KAMERA BARU",
          nama_alias: body.nama_alias || body.nama_lokasi,
          deskripsi: `Kamera CCTV ${body.nama_lokasi}`,
          url_proxy_hls: body.url_proxy_hls?.trim() || "",
          poster: null,
          capture_url: null,
          type_cam: 1,
          cam_mp: 1,
          tipe_merk: 1,
        },
      ],
      tb_lokasi_kota: {
        kode_kota: "5171",
        nama_kota: "KOTA DENPASAR",
        lat_kota: "-8.6726833",
        lon_kota: "115.2242733",
        tb_kota_provinsi: { kode_provinsi: "57", nama_provinsi: "BALI" },
      },
    };

    locations.unshift(newLocation);
    saveLocalCctvData(locations);

    // Sync ke Supabase jika terhubung
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from("cctv_locations").upsert([
          {
            id_lokasi: newLocation.id_lokasi,
            nama_lokasi: newLocation.nama_lokasi,
            ket_lokasi: newLocation.ket_lokasi,
            lat_lokasi: newLocation.lat_lokasi,
            lon_lokasi: newLocation.lon_lokasi,
            is_active: newLocation.is_active,
            dekat_spbu: newLocation.dekat_spbu,
            nama_spbu: newLocation.nama_spbu,
            jarak_spbu_meter: newLocation.jarak_spbu_meter,
            status_streaming: "READY",
            tb_device_lokasi: newLocation.tb_device_lokasi,
            tb_lokasi_kota: newLocation.tb_lokasi_kota,
          },
        ]);
      } catch (sbErr) {
        console.warn("Supabase upsert warning:", sbErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil menambahkan CCTV ${newLocation.nama_lokasi}`,
      data: newLocation,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// PUT: Modifikasi data CCTV
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const id = Number(body.id_lokasi);
    if (!id) {
      return NextResponse.json({ success: false, message: "ID Lokasi wajib diisi" }, { status: 400 });
    }

    const locations = await getAllLocations();
    const index = locations.findIndex((l) => l.id_lokasi === id);

    if (index === -1) {
      return NextResponse.json({ success: false, message: "Lokasi tidak ditemukan" }, { status: 404 });
    }

    const current = locations[index];
    const updatedLocation: CctvLocation = {
      ...current,
      nama_lokasi: body.nama_lokasi !== undefined ? body.nama_lokasi : current.nama_lokasi,
      ket_lokasi: body.ket_lokasi !== undefined ? body.ket_lokasi : current.ket_lokasi,
      lat_lokasi: body.lat_lokasi !== undefined ? parseFloat(body.lat_lokasi) : current.lat_lokasi,
      lon_lokasi: body.lon_lokasi !== undefined ? parseFloat(body.lon_lokasi) : current.lon_lokasi,
      is_active: body.is_active !== undefined ? Boolean(body.is_active) : current.is_active,
      dekat_spbu: body.dekat_spbu !== undefined ? Boolean(body.dekat_spbu) : current.dekat_spbu,
      nama_spbu: body.dekat_spbu ? (body.nama_spbu || current.nama_spbu || "SPBU Terdekat") : undefined,
      jarak_spbu_meter: body.dekat_spbu ? (parseInt(body.jarak_spbu_meter, 10) || current.jarak_spbu_meter || 100) : undefined,
    };

    // Update url stream atau nama alias jika dikirimkan
    if (body.url_proxy_hls !== undefined || body.nama_alias !== undefined) {
      const devices = [...(updatedLocation.tb_device_lokasi || [])];
      if (devices.length > 0) {
        devices[0] = {
          ...devices[0],
          url_proxy_hls: body.url_proxy_hls !== undefined ? body.url_proxy_hls : devices[0].url_proxy_hls,
          nama_alias: body.nama_alias !== undefined ? body.nama_alias : devices[0].nama_alias,
        };
      } else {
        devices.push({
          id_lokasi: id,
          nama: updatedLocation.nama_lokasi,
          nama_alias: body.nama_alias || updatedLocation.nama_lokasi,
          url_proxy_hls: body.url_proxy_hls || "",
        });
      }
      updatedLocation.tb_device_lokasi = devices;
    }

    locations[index] = updatedLocation;
    saveLocalCctvData(locations);

    // Sync ke Supabase jika terhubung
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from("cctv_locations").upsert([
          {
            id_lokasi: updatedLocation.id_lokasi,
            nama_lokasi: updatedLocation.nama_lokasi,
            ket_lokasi: updatedLocation.ket_lokasi,
            lat_lokasi: updatedLocation.lat_lokasi,
            lon_lokasi: updatedLocation.lon_lokasi,
            is_active: updatedLocation.is_active,
            dekat_spbu: updatedLocation.dekat_spbu,
            nama_spbu: updatedLocation.nama_spbu,
            jarak_spbu_meter: updatedLocation.jarak_spbu_meter,
            tb_device_lokasi: updatedLocation.tb_device_lokasi,
          },
        ]);
      } catch (sbErr) {
        console.warn("Supabase upsert warning:", sbErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Data CCTV #${id} (${updatedLocation.nama_lokasi}) berhasil diperbarui`,
      data: updatedLocation,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// DELETE: Hapus CCTV
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = parseInt(searchParams.get("id") || "0", 10);

    if (!id) {
      return NextResponse.json({ success: false, message: "ID Lokasi wajib diisi" }, { status: 400 });
    }

    let locations = await getAllLocations();
    const target = locations.find((l) => l.id_lokasi === id);
    if (!target) {
      return NextResponse.json({ success: false, message: "CCTV tidak ditemukan" }, { status: 404 });
    }

    locations = locations.filter((l) => l.id_lokasi !== id);
    saveLocalCctvData(locations);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from("cctv_locations").delete().eq("id_lokasi", id);
      } catch (sbErr) {
        console.warn("Supabase delete warning:", sbErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: `CCTV #${id} (${target.nama_lokasi}) berhasil dihapus`,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
