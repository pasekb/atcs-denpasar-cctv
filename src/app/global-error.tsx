"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="id">
      <body className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center min-h-screen p-4 font-sans">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-md text-center">
          <h2 className="text-lg font-bold mb-2">Terjadi Kesalahan Sistem</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            {error?.message || "Gagal memuat komponen sistem"}
          </p>
          <button
            onClick={() => reset()}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition"
          >
            Muat Ulang
          </button>
        </div>
      </body>
    </html>
  );
}

