import type { Metadata } from 'next'
import StationView from '@/components/staff/StationView'

export const metadata: Metadata = {
  title: 'TraSua - Nước',
  description: 'Quản lý đơn hàng đồ uống — Nước',
}

export default function BarStationPage() {
  return <StationView station="bar" />
}
