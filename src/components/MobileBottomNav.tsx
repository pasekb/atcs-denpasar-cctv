"use client";

import React from "react";
import { Map, List, Fuel } from "lucide-react";

export type MobileTab = "daftar" | "peta" | "balifuel";

interface MobileBottomNavProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
}

export default function MobileBottomNav({ activeTab, onTabChange }: MobileBottomNavProps) {
  const tabs: { id: MobileTab; label: string; icon: React.ReactNode }[] = [
    {
      id: "peta",
      label: "Peta",
      icon: <Map className="w-5 h-5" />,
    },
    {
      id: "daftar",
      label: "Daftar",
      icon: <List className="w-5 h-5" />,
    },
    {
      id: "balifuel",
      label: "BaliFuel",
      icon: <Fuel className="w-5 h-5" />,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-around pb-safe md:hidden">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center gap-0.5 px-6 py-2.5 cursor-pointer transition-colors ${
              isActive
                ? "text-blue-600 dark:text-blue-400"
                : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
            }`}
          >
            {tab.icon}
            <span className="text-[10px] font-bold">{tab.label}</span>
            {isActive && (
              <span className="w-1 h-1 rounded-full bg-blue-600 dark:bg-blue-400" />
            )}
          </button>
        );
      })}
    </nav>
  );
}
