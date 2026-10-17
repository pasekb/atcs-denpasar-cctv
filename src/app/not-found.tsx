import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
        404 - Halaman Tidak Ditemukan
      </h2>
      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-5">
        Halaman yang Anda tuju tidak tersedia atau telah dipindahkan.
      </p>
      <Link
        href="/"
        className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition"
      >
        Kembali ke Beranda
      </Link>
    </div>
  );
}

