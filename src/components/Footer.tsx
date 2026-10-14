import React from "react";

export default function Footer() {
  return (
    <footer className="w-full py-3.5 px-4 border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md text-center text-xs text-slate-500 dark:text-slate-400">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2">
        <span>
          build by <strong className="font-semibold text-slate-700 dark:text-slate-200">@pasekberatha</strong>
        </span>
      </div>
    </footer>
  );
}
