import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50" />
      <div className="absolute top-20 -left-20 w-72 h-72 bg-emerald-200/20 rounded-full blur-3xl" />
      <div className="absolute top-40 right-10 w-48 h-48 bg-teal-200/20 rounded-full blur-2xl" />
      <div className="absolute bottom-40 -right-16 w-64 h-64 bg-cyan-200/20 rounded-full blur-3xl" />

      {/* Logo */}
      <div
        className="relative z-10 mb-8 flex h-32 w-32 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-600 text-7xl shadow-2xl shadow-emerald-500/30"
        aria-hidden="true"
      >
        🧋
      </div>

      {/* Heading */}
      <h1
        className="relative z-10 mb-3 text-center text-4xl font-bold tracking-tight text-gray-900"
        style={{ textWrap: 'balance' }}
      >
        TraSua
      </h1>

      {/* Subtitle */}
      <p
        className="relative z-10 mb-12 text-center text-lg text-emerald-700 max-w-md"
        style={{ textWrap: 'pretty' }}
      >
        Hệ thống quản lý quán trà sữa
      </p>

      {/* Role Selection Cards */}
      <div className="relative z-10 w-full max-w-md flex flex-col gap-4">
        {/* Admin Card */}
        <Link
          href="/admin"
          className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 p-8 shadow-xl shadow-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-500/40 transition-all duration-300 active:scale-[0.98]"
        >
          <div className="flex items-center gap-5">
            <div className="flex-shrink-0 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-4xl backdrop-blur-sm">
              👨‍💼
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-1">
                Quản lý
              </h2>
              <p className="text-emerald-100 text-sm">
                Thực đơn, bàn, QR code
              </p>
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={3}
              stroke="currentColor"
              className="w-6 h-6 text-white/80 group-hover:translate-x-1 transition-transform"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </div>
        </Link>

        {/* Staff Card */}
        <Link
          href="/staff"
          className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-500 to-cyan-600 p-8 shadow-xl shadow-teal-500/30 hover:shadow-2xl hover:shadow-teal-500/40 transition-all duration-300 active:scale-[0.98]"
        >
          <div className="flex items-center gap-5">
            <div className="flex-shrink-0 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-4xl backdrop-blur-sm">
              👨‍🍳
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-1">
                Nhân viên
              </h2>
              <p className="text-teal-100 text-sm">
                Pha chế, bếp, tổng quan
              </p>
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={3}
              stroke="currentColor"
              className="w-6 h-6 text-white/80 group-hover:translate-x-1 transition-transform"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </div>
        </Link>
      </div>

      {/* Footer hint */}
      <p className="relative z-10 mt-12 text-center text-sm text-emerald-600/60">
        Khách hàng quét QR code tại bàn để đặt món
      </p>
    </div>
  )
}
