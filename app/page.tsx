import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MemoViewer } from '@/components/memo-viewer'
import { TrippRequests } from '@/components/tripp-requests'

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
      <main className="max-w-4xl mx-auto space-y-8">
        <MemoViewer />
        <TrippRequests />
      </main>
    </div>
  )
}
