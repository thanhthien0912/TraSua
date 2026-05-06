"use client";

import { useState, type FormEvent } from "react";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (data.success) {
        window.location.href = "/admin";
      } else {
        setError(data.error || "Sai mật khẩu");
        setPassword("");
      }
    } catch {
      setError("Lỗi kết nối. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-8">
      <div
        className="w-full max-w-sm"
        style={{
          animation: "fadeSlideUp 0.5s cubic-bezier(0.2, 0, 0, 1) both",
        }}
      >
        {/* Header */}
        <div className="mb-8 text-center">
          <div
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl text-3xl"
            style={{
              background:
                "linear-gradient(145deg, #f59e0b, #d97706)",
              boxShadow:
                "0 4px 14px rgba(217, 119, 6, 0.3), 0 1px 3px rgba(0, 0, 0, 0.08)",
            }}
          >
            🧋
          </div>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{
              textWrap: "balance",
              color: "#78350f",
            }}
          >
            Đăng nhập Admin
          </h1>
          <p
            className="mt-1 text-sm"
            style={{ color: "#92400e", opacity: 0.7 }}
          >
            Quản lý quán trà sữa
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium"
              style={{ color: "#92400e" }}
            >
              Mật khẩu
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu admin"
              required
              autoFocus
              className="w-full rounded-xl border-0 px-4 py-3 text-base outline-none"
              style={{
                background: "rgba(255, 255, 255, 0.8)",
                color: "#451a03",
                boxShadow:
                  "0 0 0 1px rgba(120, 53, 15, 0.12), 0 1px 2px rgba(0, 0, 0, 0.05)",
                transition: "box-shadow 0.2s cubic-bezier(0.2, 0, 0, 1)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.boxShadow =
                  "0 0 0 2px rgba(217, 119, 6, 0.5), 0 1px 2px rgba(0, 0, 0, 0.05)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.boxShadow =
                  "0 0 0 1px rgba(120, 53, 15, 0.12), 0 1px 2px rgba(0, 0, 0, 0.05)";
              }}
            />
          </div>

          {/* Error message */}
          {error && (
            <div
              className="rounded-lg px-3 py-2 text-sm font-medium"
              style={{
                background: "rgba(220, 38, 38, 0.08)",
                color: "#dc2626",
                animation:
                  "shake 0.4s cubic-bezier(0.2, 0, 0, 1)",
              }}
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Submit button — min 48px height for hit area */}
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full cursor-pointer rounded-xl px-4 py-3 text-base font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              background: loading
                ? "#b45309"
                : "linear-gradient(145deg, #f59e0b, #d97706)",
              boxShadow: loading
                ? "none"
                : "0 4px 14px rgba(217, 119, 6, 0.3), 0 1px 3px rgba(0, 0, 0, 0.08)",
              minHeight: "48px",
              transition:
                "transform 0.15s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.15s cubic-bezier(0.2, 0, 0, 1), opacity 0.15s",
            }}
            onPointerDown={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = "scale(0.96)";
                e.currentTarget.style.boxShadow =
                  "0 2px 8px rgba(217, 119, 6, 0.2)";
              }
            }}
            onPointerUp={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow =
                "0 4px 14px rgba(217, 119, 6, 0.3), 0 1px 3px rgba(0, 0, 0, 0.08)";
            }}
            onPointerLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow =
                "0 4px 14px rgba(217, 119, 6, 0.3), 0 1px 3px rgba(0, 0, 0, 0.08)";
            }}
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Đang xác thực...
              </span>
            ) : (
              "Đăng nhập"
            )}
          </button>
        </form>
      </div>

      {/* Keyframe animations */}
      <style>{`
        @keyframes fadeSlideUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-4px); }
          40% { transform: translateX(4px); }
          60% { transform: translateX(-2px); }
          80% { transform: translateX(2px); }
        }
      `}</style>
    </main>
  );
}
