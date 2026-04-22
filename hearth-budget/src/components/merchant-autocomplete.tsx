'use client'

import * as React from 'react'
import { useTransition } from 'react'
import { Input } from '@/components/ui/input'
import { searchMerchants } from '@/app/actions/transactions'
import { cn } from '@/lib/utils'

interface MerchantAutocompleteProps {
  value: string
  onChange: (value: string) => void
}

export function MerchantAutocomplete({ value, onChange }: MerchantAutocompleteProps) {
  const [suggestions, setSuggestions] = React.useState<string[]>([])
  const [showDropdown, setShowDropdown] = React.useState(false)
  const [isPending, startTransition] = useTransition()
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)

  // Cleanup debounce on unmount
  React.useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  function handleInputChange(newValue: string) {
    onChange(newValue)

    // Clear previous debounce
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!newValue || newValue.length < 2) {
      setSuggestions([])
      setShowDropdown(false)
      return
    }

    // Debounce 300ms
    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        const result = await searchMerchants(newValue)
        if (result.data.length > 0) {
          setSuggestions(result.data.slice(0, 5))
          setShowDropdown(true)
        } else {
          setSuggestions([])
          setShowDropdown(false)
        }
      })
    }, 300)
  }

  function handleSelect(merchant: string) {
    onChange(merchant)
    setSuggestions([])
    setShowDropdown(false)
  }

  function handleBlur() {
    // Small timeout to allow click registration on dropdown items
    setTimeout(() => {
      setShowDropdown(false)
    }, 150)
  }

  return (
    <div className="relative" ref={containerRef}>
      <Input
        type="text"
        placeholder="Merchant name (optional)"
        value={value}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={() => {
          if (suggestions.length > 0) setShowDropdown(true)
        }}
        onBlur={handleBlur}
        autoComplete="off"
      />

      {/* Autocomplete dropdown */}
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-md border bg-popover shadow-md">
          {suggestions.map((merchant) => (
            <button
              key={merchant}
              type="button"
              className={cn(
                'w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors',
                'first:rounded-t-md last:rounded-b-md'
              )}
              onMouseDown={(e) => {
                // Prevent blur from firing before click
                e.preventDefault()
                handleSelect(merchant)
              }}
            >
              {merchant}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
