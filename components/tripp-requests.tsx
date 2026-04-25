'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type TrippRequest = {
  id: string
  channel: string
  ask: string
  why_it_helps: string
  suggested_angle: string | null
  created_at: string
  status: string
  tripp_response: string | null
}

const CHANNEL_LABELS: Record<string, string> = {
  linkedin: 'LinkedIn',
  twitter: 'Twitter',
  x: 'X',
  youtube: 'YouTube',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  threads: 'Threads',
  bluesky: 'Bluesky',
  email: 'Email',
  newsletter: 'Newsletter',
  podcast: 'Podcast',
}

function formatChannel(c: string) {
  const key = c.toLowerCase()
  return CHANNEL_LABELS[key] ?? c.charAt(0).toUpperCase() + c.slice(1)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function TrippRequests() {
  const [requests, setRequests] = useState<TrippRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [snoozed, setSnoozed] = useState<Set<string>>(new Set())
  const [decliningId, setDecliningId] = useState<string | null>(null)
  const [declineReason, setDeclineReason] = useState('')
  const [pendingId, setPendingId] = useState<string | null>(null)

  const fetchRequests = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('tripp_requests')
      .select('id, channel, ask, why_it_helps, suggested_angle, created_at, status, tripp_response')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
    setRequests((data as TrippRequest[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchRequests()
    const interval = setInterval(fetchRequests, 30_000)
    return () => clearInterval(interval)
  }, [fetchRequests])

  const accept = async (id: string) => {
    setPendingId(id)
    const supabase = createClient()
    await supabase.from('tripp_requests').update({ status: 'drafting' }).eq('id', id)
    setPendingId(null)
    fetchRequests()
  }

  const startDecline = (id: string) => {
    setDecliningId(id)
    setDeclineReason('')
  }

  const cancelDecline = () => {
    setDecliningId(null)
    setDeclineReason('')
  }

  const submitDecline = async (id: string) => {
    setPendingId(id)
    const supabase = createClient()
    await supabase
      .from('tripp_requests')
      .update({ status: 'declined', tripp_response: declineReason.trim() })
      .eq('id', id)
    setPendingId(null)
    setDecliningId(null)
    setDeclineReason('')
    fetchRequests()
  }

  const snooze = (id: string) => {
    setSnoozed((s) => {
      const next = new Set(s)
      next.add(id)
      return next
    })
  }

  const visible = requests.filter((r) => !snoozed.has(r.id))

  return (
    <section>
      <h2 className="text-lg font-semibold text-zinc-100 mb-3">Asks for Tripp</h2>

      {loading ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-zinc-500 text-sm">Loading…</p>
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-zinc-500 text-sm">No asks this week.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((r) => {
            const isDeclining = decliningId === r.id
            const isPending = pendingId === r.id

            return (
              <article
                key={r.id}
                className="rounded-lg border border-zinc-800 bg-zinc-900 p-5"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-300">
                    {formatChannel(r.channel)}
                  </span>
                  <span className="text-xs text-zinc-500">{formatDate(r.created_at)}</span>
                </div>

                <p className="text-zinc-100 leading-relaxed mb-3">{r.ask}</p>

                <div className="text-sm text-zinc-400 mb-2">
                  <span className="text-zinc-500">Why it helps: </span>
                  {r.why_it_helps}
                </div>

                {r.suggested_angle && (
                  <div className="text-sm text-zinc-400">
                    <span className="text-zinc-500">Suggested angle: </span>
                    {r.suggested_angle}
                  </div>
                )}

                {isDeclining ? (
                  <div className="mt-4 space-y-2">
                    <textarea
                      autoFocus
                      placeholder="Why?"
                      value={declineReason}
                      onChange={(e) => setDeclineReason(e.target.value)}
                      rows={2}
                      className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={cancelDecline}
                        disabled={isPending}
                        className="rounded-md border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => submitDecline(r.id)}
                        disabled={isPending || !declineReason.trim()}
                        className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm font-medium text-zinc-100 hover:bg-zinc-700 disabled:opacity-50"
                      >
                        {isPending ? 'Saving…' : 'Submit'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 mt-4">
                    <button
                      onClick={() => accept(r.id)}
                      disabled={isPending}
                      className="rounded-md border border-emerald-500/30 bg-emerald-500/15 px-3 py-1.5 text-sm font-medium text-emerald-400 hover:bg-emerald-500/25 disabled:opacity-50"
                    >
                      {isPending ? 'Saving…' : 'Accept'}
                    </button>
                    <button
                      onClick={() => startDecline(r.id)}
                      className="rounded-md border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => snooze(r.id)}
                      className="rounded-md border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800"
                    >
                      Snooze
                    </button>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
