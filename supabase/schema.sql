-- ========================================================
-- Schema Supabase untuk ATCS Denpasar CCTV Clone
-- ========================================================

CREATE TABLE IF NOT EXISTS public.cctv_locations (
  id_lokasi BIGINT PRIMARY KEY,
  nama_lokasi TEXT NOT NULL,
  ket_lokasi TEXT,
  lat_lokasi DOUBLE PRECISION NOT NULL,
  lon_lokasi DOUBLE PRECISION NOT NULL,
  is_active BOOLEAN DEFAULT true,
  status_streaming TEXT DEFAULT 'READY',
  tb_device_lokasi JSONB NOT NULL DEFAULT '[]'::jsonb,
  tb_lokasi_kota JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.cctv_bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  id_lokasi BIGINT REFERENCES public.cctv_locations(id_lokasi) ON DELETE CASCADE,
  user_identifier TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.traffic_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  id_lokasi BIGINT REFERENCES public.cctv_locations(id_lokasi) ON DELETE CASCADE,
  judul TEXT NOT NULL,
  deskripsi TEXT NOT NULL,
  tipe_kejadian TEXT NOT NULL,
  pelapor TEXT DEFAULT 'Masyarakat',
  status TEXT DEFAULT 'Pending',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.cctv_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cctv_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.traffic_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read cctv_locations" ON public.cctv_locations FOR SELECT USING (true);
CREATE POLICY "Public insert/read bookmarks" ON public.cctv_bookmarks FOR ALL USING (true);
CREATE POLICY "Public insert/read traffic_reports" ON public.traffic_reports FOR ALL USING (true);
