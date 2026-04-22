'use client'

import { useEffect, useRef } from 'react'
import { useRealtimeSync } from './use-realtime-sync'
import type { TransactionWithRelations } from '@/components/transaction-row'

interface UseRealtimeTransactionsOptions {
  householdId: string
  onInsert: (tx: TransactionWithRelations) => void
  onUpdate: (tx: TransactionWithRelations) => void
  onDelete: (id: string) => void
  onRefetch: () => void | Promise<void>
}

/**
 * Subscribes to Supabase Realtime INSERT/UPDATE/DELETE events on the
 * transactions table, filtered by household_id.
 *
 * Design decisions:
 * - INSERT and UPDATE trigger a full refetch because Realtime postgres_changes
 *   events only return the raw row columns, NOT the joined relations
 *   (categories.name, accounts.name). We cannot display a transaction row
 *   without this data.
 * - DELETE uses the old.id directly to remove from local state (no joins
 *   needed for removal).
 * - The filter parameter uses household_id=eq.{id} so only events for this
 *   household are received. Combined with RLS, this is double-gated.
 * - The visibilitychange fallback in useRealtimeSync ensures data freshness
 *   even if Realtime drops (SHAR-06).
 */
export function useRealtimeTransactions({
  householdId,
  onInsert,
  onUpdate,
  onDelete,
  onRefetch,
}: UseRealtimeTransactionsOptions) {
  const { supabase, status, updateStatus, channelRef } = useRealtimeSync({
    channelName: `transactions:${householdId}`,
    onRefetch,
  })

  // Store latest callbacks in refs to avoid resubscribing on every render
  const callbacksRef = useRef({ onInsert, onUpdate, onDelete, onRefetch })
  callbacksRef.current = { onInsert, onUpdate, onDelete, onRefetch }

  useEffect(() => {
    const channel = supabase
      .channel(`transactions:${householdId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions',
          filter: `household_id=eq.${householdId}`,
        },
        () => {
          // Realtime INSERT only gives us the raw row, not the joined data
          // (no categories/accounts). We need to refetch to get full data.
          callbacksRef.current.onRefetch()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'transactions',
          filter: `household_id=eq.${householdId}`,
        },
        () => {
          // Same -- refetch for full joined data
          callbacksRef.current.onRefetch()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'transactions',
          filter: `household_id=eq.${householdId}`,
        },
        (payload) => {
          // DELETE gives us old.id -- we can remove it directly
          const oldId = (payload.old as { id?: string })?.id
          if (oldId) {
            callbacksRef.current.onDelete(oldId)
          }
        }
      )
      .subscribe((subscribeStatus) => {
        if (subscribeStatus === 'SUBSCRIBED') {
          updateStatus('connected')
        } else if (subscribeStatus === 'CHANNEL_ERROR' || subscribeStatus === 'TIMED_OUT') {
          updateStatus('disconnected')
        } else {
          updateStatus('connecting')
        }
      })

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, householdId, updateStatus, channelRef])

  return { status }
}
