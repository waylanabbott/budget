'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

async function getHouseholdId() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: member } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', user.id)
    .single()

  if (!member) redirect('/onboarding')

  return { supabase, user, householdId: member.household_id }
}

/**
 * Check which hashes already exist in the database for a given account.
 * Used to flag duplicate rows before import so the UI can mark them.
 */
export async function checkDuplicates(
  accountId: string,
  hashes: string[]
): Promise<{ duplicateHashes: string[]; error?: string }> {
  if (!hashes.length) return { duplicateHashes: [] }

  try {
    const { supabase } = await getHouseholdId()

    const { data, error } = await supabase
      .from('transactions')
      .select('external_hash')
      .eq('account_id', accountId)
      .in('external_hash', hashes)

    if (error) return { duplicateHashes: [], error: error.message }

    const duplicateHashes = (data ?? [])
      .map((row) => row.external_hash)
      .filter((h): h is string => h !== null)

    return { duplicateHashes }
  } catch {
    return { duplicateHashes: [], error: 'Failed to check duplicates.' }
  }
}

/**
 * Suggest categories for merchants based on the most recent categorized
 * transaction in the household for each merchant.
 *
 * Limits to 50 unique merchants to prevent abuse.
 */
export async function suggestCategories(
  merchants: string[]
): Promise<{
  suggestions: Record<
    string,
    { category_id: string; category_name: string } | null
  >
  error?: string
}> {
  if (!merchants.length) return { suggestions: {} }

  try {
    const { supabase, householdId } = await getHouseholdId()

    const uniqueMerchants = [
      ...new Set(
        merchants
          .map((m) => m.toLowerCase().trim())
          .filter(Boolean)
      ),
    ].slice(0, 50)

    const suggestions: Record<
      string,
      { category_id: string; category_name: string } | null
    > = {}

    for (const merchant of uniqueMerchants) {
      const { data } = await supabase
        .from('transactions')
        .select('category_id, merchant, categories(name)')
        .eq('household_id', householdId)
        .ilike('merchant', merchant)
        .not('category_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)

      if (data && data[0] && data[0].category_id) {
        const cat = data[0].categories as { name: string } | null
        suggestions[merchant] = {
          category_id: data[0].category_id,
          category_name: cat?.name ?? 'Unknown',
        }
      } else {
        suggestions[merchant] = null
      }
    }

    return { suggestions }
  } catch {
    return { suggestions: {}, error: 'Failed to suggest categories.' }
  }
}

/**
 * Execute a CSV import: create import log entry, batch-insert transactions,
 * and update import status.
 *
 * Receives pre-transformed rows (already hashed by the client-side transform).
 * Does NOT call transformCsvRows — the transform happens in the preview step.
 */
export async function executeImport(params: {
  filename: string
  rows: Array<{
    occurred_on: string
    amount: number
    merchant: string | null
    category_id: string | null
    notes: string | null
    external_hash: string
  }>
  account_id: string
  skip_duplicate_hashes: string[]
}): Promise<{
  import_id: string
  imported_count: number
  skipped_count: number
  errors: Array<{ row: number; error: string }>
  error?: string
}> {
  try {
    const { supabase, user, householdId } = await getHouseholdId()

    // Filter out duplicates
    const skipSet = new Set(params.skip_duplicate_hashes)
    const filteredRows = params.rows.filter(
      (row) => !skipSet.has(row.external_hash)
    )
    const skippedCount = params.rows.length - filteredRows.length

    // Create import log entry
    const { data: importRow, error: importError } = await supabase
      .from('imports')
      .insert({
        household_id: householdId,
        user_id: user.id,
        filename: params.filename,
        row_count: filteredRows.length,
        status: 'pending',
      })
      .select('id')
      .single()

    if (importError || !importRow) {
      return {
        import_id: '',
        imported_count: 0,
        skipped_count: skippedCount,
        errors: [],
        error: importError?.message ?? 'Failed to create import record.',
      }
    }

    const importId = importRow.id

    if (filteredRows.length === 0) {
      // No rows to import after filtering — mark as complete
      await supabase
        .from('imports')
        .update({ status: 'complete', row_count: 0 })
        .eq('id', importId)

      revalidatePath('/app/transactions')
      revalidatePath('/app/import')

      return {
        import_id: importId,
        imported_count: 0,
        skipped_count: skippedCount,
        errors: [],
      }
    }

    // Build transaction insert objects
    const transactionInserts = filteredRows.map((row) => ({
      household_id: householdId,
      account_id: params.account_id,
      category_id: row.category_id,
      entered_by: user.id,
      amount: row.amount,
      occurred_on: row.occurred_on,
      merchant: row.merchant,
      notes: row.notes,
      source: 'csv' as const,
      external_hash: row.external_hash,
      import_id: importId,
    }))

    // Batch insert transactions
    const { error: insertError } = await supabase
      .from('transactions')
      .insert(transactionInserts)

    if (insertError) {
      // Check how many rows were actually inserted (partial success scenario)
      const { count } = await supabase
        .from('transactions')
        .select('id', { count: 'exact', head: true })
        .eq('import_id', importId)

      const actualCount = count ?? 0

      await supabase
        .from('imports')
        .update({
          status: 'error',
          row_count: actualCount,
          errors: { message: insertError.message } as unknown as undefined,
        })
        .eq('id', importId)

      revalidatePath('/app/transactions')
      revalidatePath('/app/import')

      return {
        import_id: importId,
        imported_count: actualCount,
        skipped_count: skippedCount,
        errors: [{ row: -1, error: insertError.message }],
      }
    }

    // Success — update import status
    await supabase
      .from('imports')
      .update({ status: 'complete', row_count: filteredRows.length })
      .eq('id', importId)

    revalidatePath('/app/transactions')
    revalidatePath('/app/import')

    return {
      import_id: importId,
      imported_count: filteredRows.length,
      skipped_count: skippedCount,
      errors: [],
    }
  } catch {
    return {
      import_id: '',
      imported_count: 0,
      skipped_count: 0,
      errors: [],
      error: 'Failed to execute import.',
    }
  }
}

/**
 * List import history for the current household, ordered by date descending.
 */
export async function getImports(): Promise<{
  data: Array<{
    id: string
    filename: string
    row_count: number
    status: string
    errors: unknown
    created_at: string
  }>
  error?: string
}> {
  try {
    const { supabase, householdId } = await getHouseholdId()

    const { data, error } = await supabase
      .from('imports')
      .select('id, filename, row_count, status, errors, created_at')
      .eq('household_id', householdId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) return { data: [], error: error.message }

    return { data: data ?? [] }
  } catch {
    return { data: [], error: 'Failed to fetch imports.' }
  }
}

/**
 * Get details for a single import, including its associated transactions.
 */
export async function getImportDetail(importId: string): Promise<{
  import_row: {
    id: string
    filename: string
    row_count: number
    status: string
    errors: unknown
    created_at: string
  } | null
  transactions: Array<{
    id: string
    occurred_on: string
    amount: number
    merchant: string | null
    category_id: string | null
    categories: { name: string } | null
  }>
  error?: string
}> {
  try {
    const { supabase, householdId } = await getHouseholdId()

    // Fetch the import row
    const { data: importRow, error: importError } = await supabase
      .from('imports')
      .select('id, filename, row_count, status, errors, created_at')
      .eq('id', importId)
      .eq('household_id', householdId)
      .single()

    if (importError || !importRow) {
      return {
        import_row: null,
        transactions: [],
        error: importError?.message ?? 'Import not found.',
      }
    }

    // Fetch associated transactions
    const { data: txns, error: txnError } = await supabase
      .from('transactions')
      .select('id, occurred_on, amount, merchant, category_id, categories(name)')
      .eq('import_id', importId)
      .order('occurred_on', { ascending: false })

    if (txnError) {
      return {
        import_row: importRow,
        transactions: [],
        error: txnError.message,
      }
    }

    return {
      import_row: importRow,
      transactions: (txns ?? []) as Array<{
        id: string
        occurred_on: string
        amount: number
        merchant: string | null
        category_id: string | null
        categories: { name: string } | null
      }>,
    }
  } catch {
    return {
      import_row: null,
      transactions: [],
      error: 'Failed to fetch import detail.',
    }
  }
}

/**
 * Delete an import and all its associated transactions (via ON DELETE CASCADE).
 * Verifies the import belongs to the current household before deletion.
 */
export async function undoImport(
  importId: string
): Promise<{ error?: string }> {
  try {
    const { supabase, householdId } = await getHouseholdId()

    // Verify import belongs to this household
    const { data: existing, error: findError } = await supabase
      .from('imports')
      .select('id')
      .eq('id', importId)
      .eq('household_id', householdId)
      .single()

    if (findError || !existing) {
      return { error: 'Import not found.' }
    }

    // Delete the import — CASCADE deletes associated transactions
    const { error: deleteError } = await supabase
      .from('imports')
      .delete()
      .eq('id', importId)

    if (deleteError) return { error: deleteError.message }

    revalidatePath('/app/transactions')
    revalidatePath('/app/import')

    return {}
  } catch {
    return { error: 'Failed to undo import.' }
  }
}
