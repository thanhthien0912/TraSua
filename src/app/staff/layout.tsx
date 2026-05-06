import StaffNav from './StaffNav'

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {/* Page content — padded at bottom to clear fixed nav */}
      <div className="pb-20">{children}</div>

      {/* Fixed bottom navigation */}
      <StaffNav />
    </>
  )
}
