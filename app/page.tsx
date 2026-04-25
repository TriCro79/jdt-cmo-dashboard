import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <header className="max-w-4xl mx-auto mb-8">
        <h1 className="text-2xl font-semibold">JDT CMO Dashboard</h1>
        <p className="text-zinc-400 text-sm mt-1">Signed in as {user.email}</p>
      </header>
      <main className="max-w-4xl mx-auto">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-zinc-300">Auth works. Dashboard sections coming next.</p>
        </div>
      </main>
    </div>
  )
}
