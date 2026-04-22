import Link from 'next/link'
import { Wallet, ChevronRight } from 'lucide-react'
import { signOut } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export default function SettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Settings</h1>
      <p className="text-muted-foreground mb-6">Household settings coming in Phase 4.</p>

      <Link
        href="/app/accounts"
        className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent"
      >
        <div className="flex items-center gap-3">
          <Wallet className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="font-medium">Accounts</p>
            <p className="text-sm text-muted-foreground">
              Manage checking, savings, credit cards
            </p>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </Link>

      <Separator className="my-6" />

      <div>
        <h2 className="text-lg font-semibold mb-1">Account</h2>
        <p className="text-sm text-muted-foreground mb-4">Sign out of Hearth Budget.</p>
        <form action={signOut}>
          <Button type="submit" variant="destructive">
            Sign out
          </Button>
        </form>
      </div>
    </div>
  )
}
