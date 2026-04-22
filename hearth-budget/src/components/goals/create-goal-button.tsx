'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { computeTemplateTarget } from '@/lib/goal-templates'
import { createGoal, updateHouseholdProfile, type GoalTemplate } from '@/app/actions/goals'

interface CreateGoalButtonProps {
  templates: GoalTemplate[]
  accounts: Array<{ id: string; name: string; type: string; is_archived: boolean }>
  monthlyEssentialExpenses: number
  monthsOfData: number
  profile: { annual_gross_income: number | null; primary_age: number | null; partner_age: number | null }
}

type Step = 'choose' | 'template' | 'custom' | 'profile'

const CATEGORY_LABELS: Record<string, string> = {
  safety: 'Safety Net',
  housing: 'Housing',
  retirement: 'Retirement',
  liquidity: 'Liquidity',
  other: 'Other',
}

export function CreateGoalButton({
  templates,
  accounts,
  monthlyEssentialExpenses,
  monthsOfData,
  profile,
}: CreateGoalButtonProps) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>('choose')
  const [selectedTemplate, setSelectedTemplate] = useState<GoalTemplate | null>(null)
  const [isPending, startTransition] = useTransition()

  // Custom goal fields
  const [name, setName] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [targetDate, setTargetDate] = useState('')

  // Template extra inputs
  const [homePrice, setHomePrice] = useState('')

  // Profile completion fields
  const [incomeInput, setIncomeInput] = useState(profile.annual_gross_income?.toString() ?? '')
  const [ageInput, setAgeInput] = useState(profile.primary_age?.toString() ?? '')

  const resetForm = () => {
    setStep('choose')
    setSelectedTemplate(null)
    setName('')
    setTargetAmount('')
    setTargetDate('')
    setHomePrice('')
  }

  const handleSelectTemplate = (t: GoalTemplate) => {
    setSelectedTemplate(t)
    const computed = computeTemplateTarget(
      t.id,
      monthlyEssentialExpenses,
      profile.annual_gross_income,
      profile.primary_age,
      homePrice ? parseFloat(homePrice) : undefined
    )

    if (computed.missing_fields?.length) {
      setStep('profile')
      return
    }

    setName(t.name)
    if (computed.target) {
      setTargetAmount(computed.target.toString())
    }
    setStep('template')
  }

  const handleProfileSave = () => {
    startTransition(async () => {
      const updates: Record<string, number | null> = {}
      if (incomeInput) updates.annual_gross_income = parseFloat(incomeInput)
      if (ageInput) updates.primary_age = parseInt(ageInput, 10)

      const result = await updateHouseholdProfile(updates)
      if (result.error) {
        toast.error(result.error)
        return
      }

      // Re-compute with new profile data
      if (selectedTemplate) {
        const computed = computeTemplateTarget(
          selectedTemplate.id,
          monthlyEssentialExpenses,
          incomeInput ? parseFloat(incomeInput) : null,
          ageInput ? parseInt(ageInput, 10) : null,
          homePrice ? parseFloat(homePrice) : undefined
        )
        setName(selectedTemplate.name)
        if (computed.target) {
          setTargetAmount(computed.target.toString())
        }
      }
      setStep('template')
    })
  }

  const handleCreate = () => {
    const amount = parseFloat(targetAmount)
    if (!name.trim() || isNaN(amount) || amount <= 0) {
      toast.error('Enter a valid name and target amount.')
      return
    }

    startTransition(async () => {
      const result = await createGoal({
        name: name.trim(),
        target_amount: amount,
        target_date: targetDate || null,
        template_id: selectedTemplate?.id ?? null,
        computed_target: !!selectedTemplate,
        priority: selectedTemplate?.default_priority ?? 0,
      })
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Goal created')
        resetForm()
        setOpen(false)
      }
    })
  }

  const computed = selectedTemplate
    ? computeTemplateTarget(
        selectedTemplate.id,
        monthlyEssentialExpenses,
        profile.annual_gross_income,
        profile.primary_age,
        homePrice ? parseFloat(homePrice) : undefined
      )
    : null

  const categories = [...new Set(templates.map((t) => t.category))]

  return (
    <>
      <Button size="sm" onClick={() => { resetForm(); setOpen(true) }}>
        <Plus className="mr-1 h-4 w-4" />
        New goal
      </Button>

      <Dialog open={open} onOpenChange={(o) => { if (!o) resetForm(); setOpen(o) }}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {step === 'choose' && 'Create a goal'}
              {step === 'template' && (selectedTemplate?.name ?? 'From template')}
              {step === 'custom' && 'Custom goal'}
              {step === 'profile' && 'Complete your profile'}
            </DialogTitle>
          </DialogHeader>

          {step === 'choose' && (
            <div className="space-y-4">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setStep('custom')}
              >
                Custom goal — set your own target
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    or from a template
                  </span>
                </div>
              </div>

              {categories.map((cat) => (
                <div key={cat} className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {CATEGORY_LABELS[cat] ?? cat}
                  </p>
                  {templates
                    .filter((t) => t.category === cat)
                    .map((t) => (
                      <button
                        key={t.id}
                        onClick={() => handleSelectTemplate(t)}
                        className="flex w-full flex-col items-start rounded-md border px-3 py-2 text-left text-sm hover:bg-accent"
                      >
                        <span className="font-medium">{t.name}</span>
                        <span className="text-xs text-muted-foreground line-clamp-2">
                          {t.description}
                        </span>
                      </button>
                    ))}
                </div>
              ))}
            </div>
          )}

          {step === 'profile' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This template needs some household info to calculate your target.
              </p>
              {computed?.missing_fields?.includes('annual_gross_income') && (
                <div className="space-y-1">
                  <Label>Annual gross household income</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 120000"
                    value={incomeInput}
                    onChange={(e) => setIncomeInput(e.target.value)}
                  />
                </div>
              )}
              {computed?.missing_fields?.includes('primary_age') && (
                <div className="space-y-1">
                  <Label>Your age</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 32"
                    value={ageInput}
                    onChange={(e) => setAgeInput(e.target.value)}
                  />
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setStep('choose')}>
                  Back
                </Button>
                <Button onClick={handleProfileSave} disabled={isPending}>
                  {isPending ? 'Saving...' : 'Continue'}
                </Button>
              </DialogFooter>
            </div>
          )}

          {step === 'template' && selectedTemplate && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {selectedTemplate.description}
              </p>

              {computed?.needs_input === 'home_price' && (
                <div className="space-y-1">
                  <Label>Target home price</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 400000"
                    value={homePrice}
                    onChange={(e) => {
                      setHomePrice(e.target.value)
                      const hp = parseFloat(e.target.value)
                      if (!isNaN(hp) && hp > 0) {
                        const c = computeTemplateTarget(
                          selectedTemplate.id,
                          monthlyEssentialExpenses,
                          profile.annual_gross_income,
                          profile.primary_age,
                          hp
                        )
                        if (c.target) setTargetAmount(c.target.toString())
                      }
                    }}
                  />
                </div>
              )}

              {monthsOfData < 3 && monthsOfData > 0 && ['checking_buffer', 'emergency_fund_3mo', 'emergency_fund_6mo', 'hysa_balance'].includes(selectedTemplate.id) && (
                <p className="text-xs text-amber-600 rounded bg-amber-50 p-2">
                  Based on {monthsOfData.toFixed(1)} months of data. Need 3 months for full accuracy.
                </p>
              )}

              <div className="space-y-1">
                <Label>Goal name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>

              <div className="space-y-1">
                <Label>Target amount</Label>
                <Input
                  type="number"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                />
                {computed?.explanation && (
                  <p className="text-xs text-muted-foreground">{computed.explanation}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label>Target date (optional)</Label>
                <Input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                />
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setStep('choose')}>
                  Back
                </Button>
                <Button onClick={handleCreate} disabled={isPending}>
                  {isPending ? 'Creating...' : 'Create goal'}
                </Button>
              </DialogFooter>
            </div>
          )}

          {step === 'custom' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <Label>Goal name</Label>
                <Input
                  placeholder="e.g. Vacation fund"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label>Target amount</Label>
                <Input
                  type="number"
                  placeholder="e.g. 5000"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label>Target date (optional)</Label>
                <Input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                />
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setStep('choose')}>
                  Back
                </Button>
                <Button onClick={handleCreate} disabled={isPending}>
                  {isPending ? 'Creating...' : 'Create goal'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
