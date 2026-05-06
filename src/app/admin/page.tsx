import Link from "next/link";

export default function AdminPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md text-center">
        <div className="mb-4 text-4xl">🧋</div>
        <h1
          className="mb-2 text-2xl font-bold tracking-tight"
          style={{ color: "#78350f", textWrap: "balance" }}
        >
          Quản lý TraSua
        </h1>
        <p className="mb-8 text-sm" style={{ color: "#92400e", opacity: 0.7 }}>
          Trang quản trị quán trà sữa
        </p>

        <nav className="space-y-3">
          <Link
            href="/admin/qr"
            className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-base font-semibold text-white"
            style={{
              background: "linear-gradient(145deg, #f59e0b, #d97706)",
              boxShadow:
                "0 4px 14px rgba(217, 119, 6, 0.3), 0 1px 3px rgba(0, 0, 0, 0.08)",
              minHeight: "48px",
            }}
          >
            📱 Tạo QR Code cho bàn
          </Link>
        </nav>
      </div>
    </main>
  );
}
