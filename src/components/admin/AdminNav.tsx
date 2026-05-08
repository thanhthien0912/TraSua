'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

// ─── Navigation Config ──────────────────────────────────────────────

const NAV_ITEMS = [
  { href: '/admin/menu', label: 'Thực đơn', emoji: '📋' },
  { href: '/admin/tables', label: 'Bàn', emoji: '🪑' },
  { href: '/admin/qr', label: 'QR Code', emoji: '📱' },
] as const

// ─── Admin Navigation ───────────────────────────────────────────────

export default function AdminNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-emerald-200 shadow-lg shadow-emerald-100/50"
      aria-label="Điều hướng quản trị"
    >
      <div className="max-w-7xl mx-auto flex items-stretch justify-around">
        {NAV_ITEMS.map(({ href, label, emoji }) => {
          const isActive = pathname.startsWith(href)

          return (
            <Link
              key={href}
              href={href}
              className={`
                relative flex flex-col items-center justify-center gap-1
                min-h-[56px] min-w-[72px] px-4 py-2
                text-xs font-semibold tracking-wide
                transition-all duration-200 ease-out
                ${
                  isActive
                    ? 'text-emerald-700'
                    : 'text-gray-500 hover:text-emerald-700 active:scale-95'
                }
              `}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Active indicator pill */}
              {isActive && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-[3px] rounded-full bg-emerald-500"
                  aria-hidden="true"
                />
              )}

              <span className="text-xl leading-none" aria-hidden="true">
                {emoji}
              </span>
              <span>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}