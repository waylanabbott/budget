'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

import {
  householdNameSchema,
  locationSchema,
  incomeBracketSchema,
  INCOME_BRACKETS,
} from '@/lib/schemas/onboarding'
import type {
  HouseholdNameInput,
  LocationInput,
  IncomeBracketInput,
} from '@/lib/schemas/onboarding'

import { zipToMetro } from '@/lib/zip-to-metro'
import { createHousehold } from '@/app/actions/household'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'

type Step = 1 | 2 | 3

const STEP_LABELS = ['Household', 'Location', 'Income']

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  // Accumulated form data across steps
  const [accumulated, setAccumulated] = useState({
    name: '',
    zip: '',
    metro: '',
    income_bracket: '',
  })

  // Step 1 form
  const step1Form = useForm<HouseholdNameInput>({
    resolver: zodResolver(householdNameSchema),
    defaultValues: { name: '' },
  })

  // Step 2 form
  const step2Form = useForm<LocationInput>({
    resolver: zodResolver(locationSchema),
    defaultValues: { zip: '', metro: '' },
  })

  // Step 3 form
  const step3Form = useForm<IncomeBracketInput>({
    resolver: zodResolver(incomeBracketSchema),
    defaultValues: { income_bracket: '' as IncomeBracketInput['income_bracket'] },
  })

  // Auto-detect metro when ZIP changes (Step 2)
  const zipValue = step2Form.watch('zip')
  useEffect(() => {
    if (zipValue && /^\d{5}$/.test(zipValue)) {
      const metro = zipToMetro(zipValue)
      step2Form.setValue('metro', metro)
    }
  }, [zipValue, step2Form])

  async function handleStep1(data: HouseholdNameInput) {
    setAccumulated((prev) => ({ ...prev, name: data.name }))
    setStep(2)
  }

  async function handleStep2(data: LocationInput) {
    setAccumulated((prev) => ({ ...prev, zip: data.zip, metro: data.metro }))
    setStep(3)
  }

  async function handleStep3(data: IncomeBracketInput) {
    setIsSubmitting(true)
    setServerError(null)
    const result = await createHousehold({
      name: accumulated.name,
      zip: accumulated.zip,
      metro: accumulated.metro,
      income_bracket: data.income_bracket,
    })
    setIsSubmitting(false)
    if (result?.error) {
      setServerError(result.error)
    }
    // On success, server action redirects to /app/dashboard
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Set up your household</CardTitle>
          <CardDescription>
            Step {step} of 3 — {STEP_LABELS[step - 1]}
          </CardDescription>

          {/* Horizontal stepper */}
          <div className="flex items-center gap-0 mt-4">
            {([1, 2, 3] as Step[]).map((s, idx) => (
              <div key={s} className="flex items-center flex-1 last:flex-none">
                <div
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium border-2 transition-colors',
                    step > s
                      ? 'bg-primary border-primary text-primary-foreground'
                      : step === s
                        ? 'border-primary text-primary bg-primary/10'
                        : 'border-muted-foreground/30 text-muted-foreground'
                  )}
                >
                  {step > s ? <Check className="h-4 w-4" /> : s}
                </div>
                {idx < 2 && (
                  <div
                    className={cn(
                      'h-0.5 flex-1 mx-1 transition-colors',
                      step > s ? 'bg-primary' : 'bg-muted-foreground/20'
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </CardHeader>

        <CardContent>
          {/* Step 1: Household Name */}
          {step === 1 && (
            <Form {...step1Form}>
              <form onSubmit={step1Form.handleSubmit(handleStep1)} className="space-y-4">
                <FormField
                  control={step1Form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Household name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. The Johnsons" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">
                  Next
                </Button>
              </form>
            </Form>
          )}

          {/* Step 2: ZIP + Metro */}
          {step === 2 && (
            <Form {...step2Form}>
              <form onSubmit={step2Form.handleSubmit(handleStep2)} className="space-y-4">
                <FormField
                  control={step2Form.control}
                  name="zip"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ZIP code</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="84101"
                          maxLength={5}
                          inputMode="numeric"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={step2Form.control}
                  name="metro"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Metro area</FormLabel>
                      <FormControl>
                        <Input placeholder="Auto-detected from ZIP" {...field} />
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-muted-foreground">
                        Auto-detected from your ZIP. Edit if incorrect.
                      </p>
                    </FormItem>
                  )}
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setStep(1)}
                  >
                    Back
                  </Button>
                  <Button type="submit" className="flex-1">
                    Next
                  </Button>
                </div>
              </form>
            </Form>
          )}

          {/* Step 3: Income Bracket */}
          {step === 3 && (
            <Form {...step3Form}>
              <form onSubmit={step3Form.handleSubmit(handleStep3)} className="space-y-4">
                <FormField
                  control={step3Form.control}
                  name="income_bracket"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Annual household income</FormLabel>
                      <p className="text-xs text-muted-foreground -mt-1">
                        Used for benchmark comparisons — not stored beyond your household.
                      </p>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="grid grid-cols-2 gap-2 pt-2"
                        >
                          {INCOME_BRACKETS.map((bracket) => (
                            <div key={bracket} className="flex items-center space-x-2">
                              <RadioGroupItem value={bracket} id={bracket} />
                              <Label htmlFor={bracket} className="font-normal cursor-pointer">
                                {bracket}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {serverError && (
                  <p className="text-sm text-destructive">{serverError}</p>
                )}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setStep(2)}
                    disabled={isSubmitting}
                  >
                    Back
                  </Button>
                  <Button type="submit" className="flex-1" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Finish setup
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
