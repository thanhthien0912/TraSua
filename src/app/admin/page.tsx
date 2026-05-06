import Link from "next/link";

export default function AdminPage() {
  /* ── Server-side env var reading ──────────────────────── */
  const tableCount = process.env.TABLE_COUNT || "15";
  const shopIp = process.env.SHOP_IP || "";
  const shopPort = process.env.SHOP_PORT || "3000";
  const hasIp = shopIp.length > 0;
  const baseUrl = hasIp
    ? `http://${shopIp}:${shopPort}`
    : null;

  return (
    <main className="flex min-h-dvh flex-col items-center px-4 py-8 sm:py-12">
      <div
        className="w-full max-w-lg"
        style={{
          animation: "fadeSlideUp 0.5s cubic-bezier(0.2, 0, 0, 1) both",
        }}
      >
        {/* ── Header ──────────────────────────────────────── */}
        <div className="mb-8 text-center">
          <div
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl text-3xl"
            style={{
              background: "linear-gradient(145deg, #f59e0b, #d97706)",
              boxShadow:
                "0 4px 14px rgba(217, 119, 6, 0.3), 0 1px 3px rgba(0, 0, 0, 0.08)",
            }}
          >
            🧋
          </div>
          <h1
            className="text-2xl font-bold tracking-tight sm:text-3xl"
            style={{ textWrap: "balance", color: "#78350f" }}
          >
            Quản lý QR Code
          </h1>
          <p
            className="mt-1 text-sm sm:text-base"
            style={{ textWrap: "pretty", color: "#92400e", opacity: 0.7 }}
          >
            Tạo và in mã QR cho từng bàn trong quán
          </p>
        </div>

        {/* ── Configuration Card ──────────────────────────── */}
        <div
          className="mb-6 rounded-2xl p-5 sm:p-6"
          style={{
            background: "rgba(255, 255, 255, 0.7)",
            boxShadow:
              "0 1px 3px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(120, 53, 15, 0.06)",
            backdropFilter: "blur(8px)",
          }}
        >
          <h2
            className="mb-4 text-sm font-semibold uppercase tracking-wider"
            style={{ color: "#92400e", opacity: 0.6 }}
          >
            Cấu hình hiện tại
          </h2>

          <div className="space-y-3">
            {/* Table count */}
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: "#92400e" }}>
                Số bàn
              </span>
              <span
                className="text-sm font-semibold"
                style={{
                  color: "#78350f",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {tableCount}
              </span>
            </div>

            {/* Separator */}
            <div
              style={{
                height: "1px",
                background:
                  "linear-gradient(to right, transparent, rgba(120, 53, 15, 0.1), transparent)",
              }}
            />

            {/* Shop address */}
            <div className="flex items-center justify-between gap-4">
              <span className="shrink-0 text-sm" style={{ color: "#92400e" }}>
                Địa chỉ
              </span>
              <span
                className="truncate text-sm font-semibold"
                style={{ color: hasIp ? "#78350f" : "#dc2626" }}
              >
                {baseUrl || "Chưa cấu hình"}
              </span>
            </div>

            {/* Separator */}
            <div
              style={{
                height: "1px",
                background:
                  "linear-gradient(to right, transparent, rgba(120, 53, 15, 0.1), transparent)",
              }}
            />

            {/* Example URL */}
            <div className="flex flex-col gap-1">
              <span className="text-sm" style={{ color: "#92400e" }}>
                Mẫu URL
              </span>
              <code
                className="rounded-lg px-3 py-1.5 text-xs sm:text-sm"
                style={{
                  background: "rgba(120, 53, 15, 0.05)",
                  color: "#78350f",
                  wordBreak: "break-all",
                }}
              >
                {baseUrl
                  ? `${baseUrl}/order?table=N`
                  : "http://SHOP_IP:SHOP_PORT/order?table=N"}
              </code>
            </div>
          </div>
        </div>

        {/* ── Primary CTA — Download PDF ─────────────────── */}
        <a
          href="/api/admin/qr-pdf"
          className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl px-4 text-base font-semibold text-white no-underline"
          style={{
            background: "linear-gradient(145deg, #f59e0b, #d97706)",
            boxShadow:
              "0 4px 14px rgba(217, 119, 6, 0.3), 0 1px 3px rgba(0, 0, 0, 0.08)",
            minHeight: "48px",
            height: "48px",
            transition:
              "transform 0.15s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.15s cubic-bezier(0.2, 0, 0, 1)",
          }}
          onMouseDown={undefined}
        >
          📄 Tạo QR Code (PDF)
        </a>

        {/* ── Logout ─────────────────────────────────────── */}
        <Link
          href="/admin/login"
          className="flex w-full items-center justify-center rounded-xl px-4 text-sm font-medium no-underline"
          style={{
            color: "#92400e",
            opacity: 0.7,
            minHeight: "40px",
            height: "40px",
            transition:
              "opacity 0.15s cubic-bezier(0.2, 0, 0, 1)",
          }}
        >
          Đăng xuất
        </Link>
      </div>

      {/* ── Keyframe animations ──────────────────────────── */}
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
      `}</style>
    </main>
  );
}
