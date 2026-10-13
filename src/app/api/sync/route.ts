import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export async function POST() {
  if (!isSupabaseConfigured || !supabase) {
    return NextResponse.json(
      { success: false, message: "Supabase belum dikonfigurasi di file .env.local" },
      { status: 400 }
    );
  }

  try {
    const filePath = path.join(process.cwd(), "src/data/cctv-locations.json");
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { success: false, message: "File cctv-locations.json tidak ditemukan" },
        { status: 404 }
      );
    }

    const fileContent = fs.readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(fileContent);
    const locations = parsed.data || [];

    // Upsert ke tabel cctv_locations di Supabase
    const rows = locations.map((loc: any) => ({
      id_lokasi: loc.id_lokasi,
      nama_lokasi: loc.nama_lokasi,
      ket_lokasi: loc.ket_lokasi,
      lat_lokasi: loc.lat_lokasi,
      lon_lokasi: loc.lon_lokasi,
      is_active: loc.is_active,
      status_streaming: "READY",
      tb_device_lokasi: loc.tb_device_lokasi || [],
      tb_lokasi_kota: loc.tb_lokasi_kota || {},
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from("cctv_locations").upsert(rows, {
      onConflict: "id_lokasi",
    });

    if (error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil mensinkronkan ${rows.length} lokasi CCTV ke Supabase.`,
      count: rows.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
