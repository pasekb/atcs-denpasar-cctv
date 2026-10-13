import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function cleanStreamUrl(url?: string | null): string {
  if (!url) return "";
  return url.trim().replace(/[\r\n]/g, "");
}
