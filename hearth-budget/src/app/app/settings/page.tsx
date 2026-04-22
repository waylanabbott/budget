import { signOut } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export default function SettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Settings</h1>
      <p className="text-muted-foreground mb-6">Household settings coming in Phase 4.</p>

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
