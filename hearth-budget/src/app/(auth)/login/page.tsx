'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

import { signUpSchema, signInSchema, magicLinkSchema } from '@/lib/schemas/auth'
import type { SignUpInput, SignInInput, MagicLinkInput } from '@/lib/schemas/auth'
import { signUpWithPassword, signInWithPassword, signInWithMagicLink } from '@/app/actions/auth'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'

export default function LoginPage() {
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [isMagicLinkLoading, setIsMagicLinkLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin')

  // Sign In form
  const signInForm = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  })

  // Sign Up form
  const signUpForm = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: '', password: '' },
  })

  // Magic link form
  const magicLinkForm = useForm<MagicLinkInput>({
    resolver: zodResolver(magicLinkSchema),
    defaultValues: { email: '' },
  })

  async function handleSignIn(data: SignInInput) {
    const result = await signInWithPassword(data)
    if (result?.error) {
      signInForm.setError('root', { message: result.error })
    }
  }

  async function handleSignUp(data: SignUpInput) {
    const result = await signUpWithPassword(data)
    if (result?.error) {
      signUpForm.setError('root', { message: result.error })
    }
  }

  async function handleMagicLink(data: MagicLinkInput) {
    setIsMagicLinkLoading(true)
    const result = await signInWithMagicLink(data.email)
    setIsMagicLinkLoading(false)
    if (result?.error) {
      toast.error(result.error)
    } else {
      setMagicLinkSent(true)
      toast.success('Check your email for a magic link!')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Hearth Budget</CardTitle>
          <CardDescription>Track every dollar together</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'signin' | 'signup')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="space-y-4 pt-4">
              <Form {...signInForm}>
                <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-4">
                  <FormField
                    control={signInForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="you@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={signInForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {signInForm.formState.errors.root && (
                    <p className="text-sm text-destructive">
                      {signInForm.formState.errors.root.message}
                    </p>
                  )}
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={signInForm.formState.isSubmitting}
                  >
                    {signInForm.formState.isSubmitting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Sign In
                  </Button>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4 pt-4">
              <Form {...signUpForm}>
                <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4">
                  <FormField
                    control={signUpForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="you@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={signUpForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="At least 8 characters" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {signUpForm.formState.errors.root && (
                    <p className="text-sm text-destructive">
                      {signUpForm.formState.errors.root.message}
                    </p>
                  )}
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={signUpForm.formState.isSubmitting}
                  >
                    {signUpForm.formState.isSubmitting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Create Account
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>

          <div className="relative">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
              or
            </span>
          </div>

          {magicLinkSent ? (
            <p className="text-center text-sm text-muted-foreground">
              Check your email for a magic link. You can close this tab.
            </p>
          ) : (
            <Form {...magicLinkForm}>
              <form onSubmit={magicLinkForm.handleSubmit(handleMagicLink)} className="space-y-3">
                <FormField
                  control={magicLinkForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input type="email" placeholder="Magic link — enter email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  variant="outline"
                  className="w-full"
                  disabled={isMagicLinkLoading}
                >
                  {isMagicLinkLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send magic link
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
