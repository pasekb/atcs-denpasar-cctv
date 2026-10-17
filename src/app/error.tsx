"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center">
      <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-2">
        Terjadi Kesalahan
      </h2>
      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mb-4">
        {error?.message || "Gagal memuat komponen halaman."}
      </p>
      <button
        onClick={() => reset()}
        className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition"
      >
        Coba Lagi
      </button>
    </div>
  );
}

