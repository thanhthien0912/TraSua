import type { Metadata } from 'next'
import StationView from '@/components/staff/StationView'

export const metadata: Metadata = {
  title: 'TraSua - Đồ ăn',
  description: 'Quản lý đơn hàng đồ ăn — Đồ ăn',
}

export default function KitchenStationPage() {
  return <StationView station="kitchen" />
}
