import { NextResponse } from "next/server";
import { validateAdminPassword, buildAdminCookie } from "@/lib/auth";

/**
 * POST /api/admin/login
 * Accepts JSON { password: string }. On success, sets httpOnly admin cookie.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const password = body?.password;

    if (typeof password !== "string" || !password) {
      return NextResponse.json(
        { success: false, error: "Thiếu mật khẩu" },
        { status: 400 },
      );
    }

    if (!validateAdminPassword(password)) {
      return NextResponse.json(
        { success: false, error: "Sai mật khẩu" },
        { status: 401 },
      );
    }

    // Success: set httpOnly cookie (no secure flag — HTTP local network)
    const response = NextResponse.json({ success: true });
    response.headers.set("Set-Cookie", buildAdminCookie());
    return response;
  } catch {
    return NextResponse.json(
      { success: false, error: "Yêu cầu không hợp lệ" },
      { status: 400 },
    );
  }
}
