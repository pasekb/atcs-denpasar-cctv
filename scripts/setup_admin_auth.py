import os

# 1. Update .env.local and .env.example
env_append = """
# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=adminatcs2025
ADMIN_SESSION_SECRET=atcs_denpasar_secret_session_key_2025
"""

with open(".env.example", "a") as f:
    f.write(env_append)

with open(".env.local", "a") as f:
    f.write(env_append)

# 2. Create API routes for auth
os.makedirs("src/app/api/auth/login", exist_ok=True)
os.makedirs("src/app/api/auth/logout", exist_ok=True)
os.makedirs("src/app/api/auth/session", exist_ok=True)
os.makedirs("src/app/admin/login", exist_ok=True)

# src/app/api/auth/login/route.ts
login_route = '''import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    const validUsername = process.env.ADMIN_USERNAME || "admin";
    const validPassword = process.env.ADMIN_PASSWORD || "adminatcs2025";

    if (username === validUsername && password === validPassword) {
      // Set secure auth cookie
      const token = Buffer.from(`${username}:${Date.now()}`).toString("base64");
      
      const cookieStore = cookies();
      cookieStore.set("admin_session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24, // 24 hours
        path: "/",
      });

      return NextResponse.json({
        success: true,
        message: "Login berhasil",
        user: { username: "admin", name: "Administrator ATCS" },
      });
    }

    return NextResponse.json(
      { success: false, message: "Username atau password salah!" },
      { status: 401 }
    );
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
'''

with open("src/app/api/auth/login/route.ts", "w") as f:
    f.write(login_route)

# src/app/api/auth/logout/route.ts
logout_route = '''import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = cookies();
  cookieStore.delete("admin_session");
  return NextResponse.json({ success: true, message: "Berhasil logout" });
}
'''

with open("src/app/api/auth/logout/route.ts", "w") as f:
    f.write(logout_route)

# src/app/api/auth/session/route.ts
session_route = '''import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = cookies();
  const session = cookieStore.get("admin_session");

  if (!session || !session.value) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: { username: "admin", name: "Administrator ATCS" },
  });
}
'''

with open("src/app/api/auth/session/route.ts", "w") as f:
    f.write(session_route)

# 3. Create Login Page src/app/admin/login/page.tsx
login_page = '''"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Video, Lock, User, ShieldCheck, ArrowLeft, Loader2, AlertCircle } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (data.success) {
        router.push("/admin");
        router.refresh();
      } else {
        setErrorMessage(data.message || "Username atau password salah");
      }
    } catch (err: any) {
      setErrorMessage("Terjadi kesalahan jaringan. Coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col justify-center items-center p-4">
      {/* Back to Live Stream Link */}
      <div className="w-full max-w-md mb-4">
        <Link
          href="/streaming"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Halaman Streaming</span>
        </Link>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-8 animate-fadeIn">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 mb-3">
            <Video className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
            Login Administrator
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            ATCS Kota Denpasar - Sistem Pemantauan CCTV
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                placeholder="Masukkan username admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                placeholder="Masukkan password admin"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs tracking-wide shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memverifikasi...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Masuk ke Panel Admin</span>
              </>
            )}
          </button>
        </form>

        {/* Demo Credentials Box */}
        <div className="mt-6 p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 text-[11px] text-slate-600 dark:text-slate-300">
          <div className="font-bold text-blue-900 dark:text-blue-300 mb-1 flex items-center gap-1.5">
            🔑 Akses Default Admin:
          </div>
          <div className="grid grid-cols-2 gap-1 font-mono text-[11px]">
            <div>Username: <strong className="text-slate-900 dark:text-white">admin</strong></div>
            <div>Password: <strong className="text-slate-900 dark:text-white">adminatcs2025</strong></div>
          </div>
        </div>
      </div>
    </div>
  );
}
'''

with open("src/app/admin/login/page.tsx", "w") as f:
    f.write(login_page)

print("Auth API and Login page created successfully!")
