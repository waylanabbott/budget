'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface UseRealtimeTableOptions {
  table: string
  householdId: string
}

export function useRealtimeTable({ table, householdId }: UseRealtimeTableOptions) {
  const router = useRouter()
  const supabaseRef = useRef(createClient())

  useEffect(() => {
    const channel = supabaseRef.current
      .channel(`${table}:${householdId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter: `household_id=eq.${householdId}`,
        },
        () => {
          router.refresh()
        }
      )
      .subscribe()

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        router.refresh()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      supabaseRef.current.removeChannel(channel)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [table, householdId, router])
}
