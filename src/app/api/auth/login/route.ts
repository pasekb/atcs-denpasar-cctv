import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    const validUsername = process.env.ADMIN_USERNAME || "admin";
    const validPassword = process.env.ADMIN_PASSWORD || "adminatcs2025";

    if (username === validUsername && password === validPassword) {
      const token = Buffer.from(`${username}:${Date.now()}`).toString("base64");
      
      const response = NextResponse.json({
        success: true,
        message: "Login berhasil",
        user: { username: "admin", name: "Administrator ATCS" },
      });

      response.cookies.set("admin_session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24, // 24 hours
        path: "/",
      });

      return response;
    }

    return NextResponse.json(
      { success: false, message: "Username atau password salah!" },
      { status: 401 }
    );
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
