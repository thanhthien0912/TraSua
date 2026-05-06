import type { Metadata } from 'next'
import StationView from '@/components/staff/StationView'

export const metadata: Metadata = {
  title: 'TraSua - Bếp',
  description: 'Quản lý đơn hàng đồ ăn — Bếp',
}

export default function KitchenStationPage() {
  return <StationView station="kitchen" />
}
