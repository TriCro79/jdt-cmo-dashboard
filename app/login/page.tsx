'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setStatus('sending')
    setErrorMsg('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setStatus('error')
      setErrorMsg(error.message)
    } else {
      setStatus('sent')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-100 px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold mb-2">JDT CMO Dashboard</h1>
        <p className="text-zinc-400 text-sm mb-8">Sign in to continue.</p>

        {status === 'sent' ? (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <p className="text-sm">Check your email for a sign-in link.</p>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full px-3 py-2 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-600"
            />
            <button
              type="submit"
              disabled={status === 'sending'}
              className="w-full px-3 py-2 rounded-md bg-zinc-100 text-zinc-900 font-medium disabled:opacity-50"
            >
              {status === 'sending' ? 'Sending...' : 'Send sign-in link'}
            </button>
            {errorMsg && (
              <p className="text-sm text-red-400">{errorMsg}</p>
            )}
          </form>
        )}
      </div>
    </div>
  )
}
