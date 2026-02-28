'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BackgroundRippleEffect } from '@/components/ui/background-ripple-effect'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Check if user is active and has web access
      const userCheckResponse = await fetch('/api/users/check-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const userData = await userCheckResponse.json()

      // Check if user status is ACTIVE
      if (!userCheckResponse.ok || userData.status !== 'ACTIVE') {
        await supabase.auth.signOut()
        throw new Error('Your account has been deactivated. Please contact an administrator.')
      }

      // Check if user role has web access (only ADMIN and SUPER_ADMIN)
      const webOnlyRoles = ['ADMIN', 'SUPER_ADMIN']
      if (!webOnlyRoles.includes(userData.role)) {
        await supabase.auth.signOut()
        throw new Error('This account is for mobile app only. Please use the AgentOps mobile application to log in.')
      }

      router.push('/dashboard')
      router.refresh()
    } catch (error: any) {
      setError(error.message || 'Failed to login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background p-4 overflow-hidden">
      <BackgroundRippleEffect rows={20} cols={40} cellSize={50} />
      <Card className="w-full max-w-md shadow-xl border-border relative z-10">
        <CardHeader className="space-y-4 text-center">
          <div className="flex flex-col items-center gap-4">
            <Image
              src="/logo.png"
              alt="Oracle Petroleum Corporation"
              width={80}
              height={80}
              className="rounded-xl"
            />
            <div>
              <CardTitle className="text-2xl font-bold text-foreground">
                Oracle Petroleum Corporation
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Sign in to access your dashboard
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="alex@agentops.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-12 px-4"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full h-12 px-4"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
