import type { Metadata } from 'next'
import StationView from '@/components/staff/StationView'

export const metadata: Metadata = {
  title: 'TraSua - Quầy Bar',
  description: 'Quản lý đơn hàng đồ uống — Quầy Bar',
}

export default function BarStationPage() {
  return <StationView station="bar" />
}
