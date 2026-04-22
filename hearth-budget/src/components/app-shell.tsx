import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { AppSidebar } from '@/components/app-sidebar'
import { BottomNav } from '@/components/bottom-nav'

interface AppShellProps {
  children: React.ReactNode
  householdName: string
  userInitial: string
}

export function AppShell({ children, householdName, userInitial }: AppShellProps) {
  return (
    <SidebarProvider>
      <AppSidebar householdName={householdName} />
      <SidebarInset>
        {/* Header */}
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          {/* Sidebar toggle — desktop only */}
          <SidebarTrigger className="-ml-1 hidden md:flex" />
          <Separator orientation="vertical" className="mr-2 hidden h-4 md:flex" />

          {/* Household name */}
          <span className="flex-1 text-sm font-semibold truncate">{householdName}</span>

          {/* Avatar initial — right side */}
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
              {userInitial}
            </AvatarFallback>
          </Avatar>
        </header>

        {/* Main content — padded bottom on mobile for bottom nav clearance */}
        <main className="flex-1 overflow-auto p-4 pb-20 md:pb-4">
          {children}
        </main>

        {/* Bottom nav — mobile only */}
        <BottomNav />
      </SidebarInset>
    </SidebarProvider>
  )
}
