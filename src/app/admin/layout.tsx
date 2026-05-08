import AdminNav from '@/components/admin/AdminNav'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 pointer-events-none" />
      <div className="fixed top-20 -left-20 w-72 h-72 bg-emerald-200/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-40 right-10 w-64 h-64 bg-teal-200/10 rounded-full blur-3xl pointer-events-none" />

      {/* Page content — padded at bottom to clear fixed nav */}
      <div className="relative z-10 pb-20">{children}</div>

      {/* Fixed bottom navigation */}
      <AdminNav />
    </>
  )
}
