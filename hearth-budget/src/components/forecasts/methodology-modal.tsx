'use client'

import { useState } from 'react'
import { Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface Props {
  title: string
  formula: string
  inputs: { label: string; value: string }[]
  note?: string
}

export function MethodologyModal({ title, formula, inputs, note }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button variant="ghost" size="sm" className="h-6 px-1.5 text-xs text-muted-foreground gap-1" />}
      >
        <Info className="h-3 w-3" />
        How?
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">{title}</DialogTitle>
          <DialogDescription>Deterministic calculation — no ML or AI.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <div>
            <p className="font-medium mb-1">Formula</p>
            <code className="block rounded bg-muted px-3 py-2 text-xs whitespace-pre-wrap">
              {formula}
            </code>
          </div>
          <div>
            <p className="font-medium mb-1">Inputs</p>
            <dl className="space-y-1">
              {inputs.map((input) => (
                <div key={input.label} className="flex justify-between text-xs">
                  <dt className="text-muted-foreground">{input.label}</dt>
                  <dd className="font-mono">{input.value}</dd>
                </div>
              ))}
            </dl>
          </div>
          {note && (
            <p className="text-xs text-muted-foreground border-t pt-2">{note}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
