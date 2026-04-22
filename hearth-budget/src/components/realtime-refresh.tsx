'use client'

import { useRealtimeTable } from '@/hooks/use-realtime-table'

interface Props {
  table: string
  householdId: string
}

export function RealtimeRefresh({ table, householdId }: Props) {
  useRealtimeTable({ table, householdId })
  return null
}
