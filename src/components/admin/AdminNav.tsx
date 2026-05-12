'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

// ─── Navigation Config ──────────────────────────────────────────────

const NAV_ITEMS = [
  { href: '/admin/menu', label: 'Thực đơn', emoji: '📋' },
  { href: '/admin/tables', label: 'Bàn', emoji: '🪑' },
  { href: '/admin/qr', label: 'QR Code', emoji: '📱' },
  { href: '/admin/history', label: 'Lịch sử', emoji: '📈' },
  { href: '/', label: 'Trang chủ', emoji: '🏠' },
] as const

// ─── Admin Navigation ───────────────────────────────────────────────

export default function AdminNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-safe"
      aria-label="Điều hướng quản trị"
    >
      <div className="max-w-7xl mx-auto flex items-stretch justify-start sm:justify-around overflow-x-auto hide-scrollbar">
        {NAV_ITEMS.map(({ href, label, emoji }) => {
          const isActive = pathname.startsWith(href)

          return (
            <Link
              key={href}
              href={href}
              className={`
                relative flex flex-col items-center justify-center
                min-h-[60px] min-w-[60px] shrink-0 flex-1 sm:flex-none
                transition-all duration-200
                ${
                  isActive
                    ? 'text-primary scale-110'
                    : 'text-foreground/40 hover:text-foreground/60'
                }
              `}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="text-3xl" aria-hidden="true" title={label}>
                {emoji}
              </span>
              {isActive && (
                <div className="absolute top-0 w-8 h-1 bg-primary rounded-b-full" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}