import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured || !supabase) {
    return NextResponse.json({ success: true, data: [] });
  }

  const { data, error } = await supabase
    .from("cctv_bookmarks")
    .select("*, cctv_locations(*)")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured || !supabase) {
    return NextResponse.json(
      { success: false, message: "Supabase belum dihubungkan" },
      { status: 400 }
    );
  }

  const body = await request.json();
  const { id_lokasi, notes, user_identifier = "guest" } = body;

  const { data, error } = await supabase
    .from("cctv_bookmarks")
    .insert([{ id_lokasi, notes, user_identifier }])
    .select();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}
