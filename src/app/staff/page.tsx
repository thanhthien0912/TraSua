import type { Metadata } from 'next'
import StationView from '@/components/staff/StationView'

export const metadata: Metadata = {
  title: 'TraSua - Tổng quan',
  description: 'Tổng quan đơn hàng — Tất cả trạm',
}

export default function OverviewPage() {
  return <StationView station="all" />
}
