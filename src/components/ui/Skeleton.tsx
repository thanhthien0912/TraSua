// ─── Skeleton Loading Components ────────────────────────────────────
// CSS-based skeleton animations for loading states
// Uses amber/cream palette matching the app's warm design

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-gradient-to-r from-amber-100 via-amber-50 to-amber-100 bg-[length:200%_100%] ${className}`}
      style={{ animation: 'shimmer 1.5s ease-in-out infinite' }}
    />
  )
}

export function SkeletonMenuCard() {
  return (
    <div
      className="rounded-2xl bg-white p-4"
      style={{
        boxShadow: '0 1px 3px rgba(120, 53, 15, 0.06), 0 4px 12px rgba(120, 53, 15, 0.04)',
      }}
    >
      {/* Image placeholder */}
      <div className="mb-3 flex items-center justify-center rounded-xl bg-amber-100 aspect-square">
        <span className="text-3xl opacity-30">🧋</span>
      </div>
      {/* Name skeleton */}
      <SkeletonCard className="h-5 w-3/4 mb-2" />
      {/* Price skeleton */}
      <SkeletonCard className="h-4 w-1/2 mb-3" />
      {/* Button skeleton */}
      <SkeletonCard className="h-10 w-full rounded-xl" />
    </div>
  )
}

export function SkeletonOrderCard() {
  return (
    <div
      className="rounded-2xl bg-white p-4"
      style={{
        boxShadow: '0 1px 3px rgba(120, 53, 15, 0.06), 0 4px 12px rgba(120, 53, 15, 0.04)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <SkeletonCard className="h-5 w-24" />
        <SkeletonCard className="h-6 w-16 rounded-lg" />
      </div>
      {/* Items */}
      <div className="space-y-2 mb-3">
        <SkeletonCard className="h-4 w-full" />
        <SkeletonCard className="h-4 w-3/4" />
      </div>
      {/* Footer */}
      <div className="flex items-center justify-between">
        <SkeletonCard className="h-5 w-20" />
        <SkeletonCard className="h-8 w-16 rounded-lg" />
      </div>
    </div>
  )
}

export function SkeletonTableCard() {
  return (
    <div
      className="rounded-2xl bg-white p-4"
      style={{
        boxShadow: '0 1px 3px rgba(120, 53, 15, 0.06), 0 4px 12px rgba(120, 53, 15, 0.04)',
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <SkeletonCard className="h-5 w-28 mb-2" />
          <SkeletonCard className="h-4 w-40" />
        </div>
        <SkeletonCard className="h-6 w-12 rounded-lg" />
      </div>
      <div className="flex gap-2">
        <SkeletonCard className="h-9 w-20 rounded-xl" />
        <SkeletonCard className="h-9 w-16 rounded-xl" />
      </div>
    </div>
  )
}

export function SkeletonMenuRow() {
  return (
    <div className="flex items-center gap-4 p-4 bg-white rounded-xl" style={{ boxShadow: '0 1px 3px rgba(120, 53, 15, 0.06)' }}>
      <SkeletonCard className="w-12 h-12 rounded-xl" />
      <div className="flex-1">
        <SkeletonCard className="h-5 w-3/4 mb-2" />
        <SkeletonCard className="h-4 w-1/3" />
      </div>
      <div className="flex gap-2">
        <SkeletonCard className="h-9 w-24 rounded-xl" />
        <SkeletonCard className="h-9 w-20 rounded-xl" />
      </div>
    </div>
  )
}

export function SkeletonCheckoutRow() {
  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-xl" style={{ boxShadow: '0 1px 3px rgba(120, 53, 15, 0.06)' }}>
      <div>
        <SkeletonCard className="h-5 w-32 mb-2" />
        <SkeletonCard className="h-4 w-24" />
      </div>
      <SkeletonCard className="h-8 w-20 rounded-lg" />
    </div>
  )
}

// Grid wrapper for skeleton cards
export function SkeletonGrid({ children, className = '' }: { children?: React.ReactNode; className?: string }) {
  return (
    <div className={`grid gap-4 ${className}`}>
      {children ?? <SkeletonCard className="h-32 w-full rounded-2xl" />}
    </div>
  )
}

// List wrapper for skeleton rows
export function SkeletonList({ count = 5, RowComponent }: { count?: number; RowComponent?: React.ComponentType }) {
  const Row = RowComponent ?? SkeletonMenuRow
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <Row key={i} />
      ))}
    </div>
  )
}