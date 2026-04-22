'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ArrowRightLeft,
  FileUp,
  PieChart,
  Target,
  BarChart3,
  Settings,
  LogOut,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { signOut } from '@/app/actions/auth'

const NAV_ITEMS = [
  { href: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/app/transactions', label: 'Transactions', icon: ArrowRightLeft },
  { href: '/app/import', label: 'Import', icon: FileUp },
  { href: '/app/budgets', label: 'Budgets', icon: PieChart },
  { href: '/app/goals', label: 'Goals', icon: Target },
  { href: '/app/insights', label: 'Insights', icon: BarChart3 },
  { href: '/app/settings', label: 'Settings', icon: Settings },
] as const

interface AppSidebarProps {
  householdName: string
}

export function AppSidebar({ householdName }: AppSidebarProps) {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon" className="hidden md:flex">
      <SidebarHeader className="px-4 py-3">
        <span className="font-semibold text-sm truncate">{householdName}</span>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(`${href}/`)
            return (
              <SidebarMenuItem key={href}>
                <SidebarMenuButton render={<Link href={href} />} isActive={isActive}>
                  <Icon className="h-5 w-5" />
                  <span>{label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <form action={signOut}>
              <SidebarMenuButton type="submit">
                <LogOut className="h-5 w-5" />
                <span>Sign out</span>
              </SidebarMenuButton>
            </form>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
