'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

// ─── Navigation Config ──────────────────────────────────────────────

const NAV_ITEMS = [
  { href: '/staff/bar', label: 'Nước', emoji: '🧋' },
  { href: '/staff/kitchen', label: 'Đồ ăn', emoji: '🍳' },
  { href: '/staff/add-order', label: 'Thêm đơn', emoji: '➕' },
  { href: '/staff/checkout', label: 'Tính tiền', emoji: '💰' },
  { href: '/staff', label: 'Tổng quan', emoji: '📋', exact: true },
  { href: '/', label: 'Trang chủ', emoji: '🏠', exact: true },
] as const

// ─── Staff Navigation ───────────────────────────────────────────────

export default function StaffNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-safe"
      aria-label="Điều hướng trạm"
    >
      <div className="max-w-7xl mx-auto flex items-stretch justify-start sm:justify-around overflow-x-auto hide-scrollbar">
        {NAV_ITEMS.map(({ href, label, emoji, ...rest }) => {
          const exact = 'exact' in rest && rest.exact
          const isActive = exact ? pathname === href : pathname.startsWith(href)

          return (
            <Link
              key={href}
              href={href}
              className={`
                relative flex flex-col items-center justify-center gap-1
                min-h-[64px] min-w-[70px] px-3 shrink-0 flex-1 sm:flex-none
                text-[10px] font-black uppercase tracking-tighter
                transition-all duration-200
                ${isActive ? 'text-primary' : 'text-foreground/30'}
              `}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="text-2xl mb-0.5" aria-hidden="true">{emoji}</span>
              <span>{label}</span>
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