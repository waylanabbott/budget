'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected'

interface UseRealtimeSyncOptions {
  channelName: string
  onRefetch: () => void | Promise<void>
}

/**
 * Generic Realtime connection hook with fallback to visibilitychange refetch.
 *
 * When the tab regains focus (after being backgrounded), it triggers a refetch
 * regardless of Realtime connection status. This ensures data freshness even
 * when Supabase Realtime is unavailable (SHAR-06 requirement).
 */
export function useRealtimeSync({ channelName, onRefetch }: UseRealtimeSyncOptions) {
  const [status, setStatus] = useState<ConnectionStatus>('connecting')
  const channelRef = useRef<RealtimeChannel | null>(null)
  const supabaseRef = useRef(createClient())
  const onRefetchRef = useRef(onRefetch)
  onRefetchRef.current = onRefetch

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        onRefetchRef.current()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  // Track connection status
  const updateStatus = useCallback((newStatus: ConnectionStatus) => {
    setStatus(newStatus)
  }, [])

  // Provide supabase client and status for consumers
  return {
    supabase: supabaseRef.current,
    status,
    updateStatus,
    channelRef,
  }
}
