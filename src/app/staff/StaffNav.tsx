'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

// ─── Navigation Config ──────────────────────────────────────────────

const NAV_ITEMS = [
  { href: '/staff/bar', label: 'Quầy Bar', emoji: '🧋' },
  { href: '/staff/kitchen', label: 'Bếp', emoji: '🍳' },
  { href: '/staff', label: 'Tổng quan', emoji: '📋', exact: true },
] as const

// ─── Staff Navigation ───────────────────────────────────────────────

export default function StaffNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-t border-amber-200/60 shadow-[0_-2px_16px_rgba(180,120,40,0.08)]"
      aria-label="Điều hướng trạm"
    >
      <div className="max-w-7xl mx-auto flex items-stretch justify-around">
        {NAV_ITEMS.map(({ href, label, emoji, ...rest }) => {
          const exact = 'exact' in rest && rest.exact
          const isActive = exact
            ? pathname === href
            : pathname.startsWith(href)

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
                    ? 'text-amber-900'
                    : 'text-amber-600/60 hover:text-amber-800 active:scale-95'
                }
              `}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Active indicator pill */}
              {isActive && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-[3px] rounded-full bg-amber-500"
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
