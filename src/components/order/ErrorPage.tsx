/**
 * Full-screen Vietnamese error page for invalid/missing table QR codes.
 * Dead-end by design — no navigation to ordering.
 */
export default function ErrorPage({
  message,
}: {
  message: string
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-amber-50 px-6 py-12">
      {/* Icon */}
      <div
        className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-100 text-4xl shadow-sm"
        aria-hidden="true"
      >
        ⚠️
      </div>

      {/* Heading */}
      <h1
        className="mb-3 text-center text-2xl font-bold tracking-tight text-amber-950"
        style={{ textWrap: 'balance' }}
      >
        Không tìm thấy bàn
      </h1>

      {/* Message */}
      <p
        className="mx-auto max-w-xs text-center text-base leading-relaxed text-amber-800/80"
        style={{ textWrap: 'pretty' }}
      >
        {message}
      </p>

      {/* Subtle branding footer */}
      <div className="mt-12 flex items-center gap-2 text-amber-700/40">
        <span className="text-lg" aria-hidden="true">🧋</span>
        <span className="text-xs font-medium tracking-wide">TraSua</span>
      </div>
    </div>
  )
}
