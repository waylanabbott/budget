'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  PieChart,
  Menu,
  Target,
  BarChart3,
  CalendarClock,
  Settings,
  Wallet,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const PRIMARY_ITEMS = [
  { href: '/app/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/app/budgets', label: 'Budgets', icon: PieChart },
  { href: '/app/goals', label: 'Goals', icon: Target },
  { href: '/app/recurring-bills', label: 'Bills', icon: CalendarClock },
] as const

const MORE_ITEMS = [
  { href: '/app/accounts', label: 'Accounts', icon: Wallet },
  { href: '/app/insights', label: 'Insights', icon: BarChart3 },
  { href: '/app/settings', label: 'Settings', icon: Settings },
] as const

export function BottomNav() {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)

  const isMoreActive = MORE_ITEMS.some(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  )

  return (
    <>
      {moreOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={() => setMoreOpen(false)}
        />
      )}

      {moreOpen && (
        <div className="fixed bottom-14 left-0 right-0 z-50 mx-3 mb-1 rounded-xl border bg-card shadow-lg md:hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b">
            <span className="text-sm font-medium">More</span>
            <button onClick={() => setMoreOpen(false)} className="p-1">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1 p-2">
            {MORE_ITEMS.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href || pathname.startsWith(`${href}/`)
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-lg py-3 text-xs transition-colors',
                    isActive
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground hover:bg-muted'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t bg-background md:hidden">
        {PRIMARY_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 py-2 text-xs transition-colors',
                isActive
                  ? 'text-primary border-t-2 border-primary -mt-px'
                  : 'text-muted-foreground'
              )}
            >
              <Icon
                className="h-5 w-5"
                strokeWidth={isActive ? 2.5 : 1.5}
              />
              <span>{label}</span>
            </Link>
          )
        })}

        <button
          onClick={() => setMoreOpen(!moreOpen)}
          className={cn(
            'flex flex-1 flex-col items-center gap-1 py-2 text-xs transition-colors',
            isMoreActive || moreOpen
              ? 'text-primary border-t-2 border-primary -mt-px'
              : 'text-muted-foreground'
          )}
        >
          <Menu
            className="h-5 w-5"
            strokeWidth={isMoreActive || moreOpen ? 2.5 : 1.5}
          />
          <span>More</span>
        </button>
      </nav>
    </>
  )
}
