'use client'

import { useState } from 'react'
import { createInvite } from '@/app/actions/invites'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Copy, Link2, Loader2 } from 'lucide-react'

export function InviteSection() {
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copying, setCopying] = useState(false)

  async function handleGenerate() {
    setLoading(true)
    try {
      const result = await createInvite()
      if (result.error) {
        toast.error(result.error)
        return
      }
      if (result.data) {
        const url = `${window.location.origin}/invite/${result.data.token}`
        setInviteUrl(url)
        toast.success('Invite link generated!')
      }
    } catch {
      toast.error('Failed to generate invite link.')
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    if (!inviteUrl) return
    setCopying(true)
    try {
      await navigator.clipboard.writeText(inviteUrl)
      toast.success('Link copied to clipboard!')
    } catch {
      toast.error('Failed to copy link.')
    } finally {
      setCopying(false)
    }
  }

  return (
    <div className="space-y-3">
      {!inviteUrl ? (
        <Button onClick={handleGenerate} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Link2 className="mr-2 h-4 w-4" />
              Generate Invite Link
            </>
          )}
        </Button>
      ) : (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              value={inviteUrl}
              readOnly
              className="text-xs"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopy}
              disabled={copying}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Expires in 7 days. One-time use only.
          </p>
        </div>
      )}
    </div>
  )
}
