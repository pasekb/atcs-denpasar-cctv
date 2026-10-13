export interface DeviceLokasi {
  id_lokasi: number;
  nama: string;
  url_video?: string;
  nama_alias?: string;
  deskripsi?: string;
  type_cam?: number;
  cam_mp?: number;
  name_proxy_cam?: string;
  url_proxy_cam?: string;
  url_proxy_hls?: string;
  poster?: string | null;
  capture_url?: string | null;
  tipe_merk?: number;
}

export interface LokasiKota {
  kode_kota: string;
  nama_kota: string;
  lat_kota: string;
  lon_kota: string;
  tb_kota_provinsi?: {
    kode_provinsi: string;
    nama_provinsi: string;
  };
}

export interface CctvLocation {
  id_lokasi: number;
  id_kota: number;
  nomor_urut: number;
  nama_lokasi: string;
  tahun?: number;
  anggaran?: string;
  ket_lokasi: string;
  lon_lokasi: number;
  lat_lokasi: number;
  no_sp?: number;
  is_active: boolean;
  dekat_spbu?: boolean;
  nama_spbu?: string;
  jarak_spbu_meter?: number;
  tb_device_lokasi: DeviceLokasi[];
  tb_lokasi_kota?: LokasiKota;
}

export interface CctvApiResponse {
  success: boolean;
  message: string;
  data: CctvLocation[];
  meta?: {
    pages: number;
    paginate: number;
    total: number;
    total_spbu?: number;
  };
}

export type CctvStatus = "LIVE" | "READY" | "MAINTENANCE" | "CHECKING";
