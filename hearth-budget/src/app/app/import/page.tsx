import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAccounts } from '@/app/actions/accounts'
import { getCategories } from '@/app/actions/categories'
import { getImports } from '@/app/actions/imports'
import { CsvUpload } from '@/components/csv-upload'
import { ImportHistory } from '@/components/import-history'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default async function ImportPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', user.id)
    .single()

  if (!membership) redirect('/onboarding')

  const [acctResult, catResult, importResult] = await Promise.all([
    getAccounts(),
    getCategories(),
    getImports(),
  ])

  const activeAccounts = (acctResult.data ?? [])
    .filter((a) => !a.is_archived)
    .map((a) => ({ id: a.id, name: a.name }))

  const categories = (catResult.data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    parent_id: c.parent_id,
  }))

  const imports = importResult.data ?? []

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Import Transactions</h1>
      <Tabs defaultValue="import">
        <TabsList>
          <TabsTrigger value="import">Import CSV</TabsTrigger>
          <TabsTrigger value="history">Import History</TabsTrigger>
        </TabsList>
        <TabsContent value="import">
          <CsvUpload accounts={activeAccounts} categories={categories} />
        </TabsContent>
        <TabsContent value="history">
          <ImportHistory imports={imports} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
