'use client'

import { useCallback, useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { createClient } from '@/lib/supabase/client'

type ContentItem = {
  id: string
  channel: string
  format: string
  hook: string
  draft: string
  rationale: string
  created_at: string
  status: string
  edited_draft: string | null
  tripp_notes: string | null
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

function formatFormat(f: string) {
  return f.charAt(0).toUpperCase() + f.slice(1)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const markdownComponents = {
  h1: ({ children }: { children?: React.ReactNode }) => (
    <h1 className="text-xl font-semibold text-zinc-100 mt-3 mb-2">{children}</h1>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 className="text-lg font-semibold text-zinc-100 mt-3 mb-2">{children}</h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="text-base font-semibold text-zinc-100 mt-2 mb-2">{children}</h3>
  ),
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="text-zinc-300 leading-relaxed mb-3">{children}</p>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="list-disc pl-5 text-zinc-300 mb-3 space-y-1">{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="list-decimal pl-5 text-zinc-300 mb-3 space-y-1">{children}</ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="text-zinc-300">{children}</li>
  ),
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
    <a href={href} className="text-emerald-400 hover:underline" target="_blank" rel="noreferrer">
      {children}
    </a>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-semibold text-zinc-100">{children}</strong>
  ),
  em: ({ children }: { children?: React.ReactNode }) => <em className="italic">{children}</em>,
  code: ({ children }: { children?: React.ReactNode }) => (
    <code className="bg-zinc-800 px-1 py-0.5 rounded text-sm text-zinc-200">{children}</code>
  ),
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote className="border-l-2 border-zinc-700 pl-4 italic text-zinc-400 my-3">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="border-zinc-800 my-4" />,
}

export function ContentQueue() {
  const [items, setItems] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [pendingId, setPendingId] = useState<string | null>(null)

  const fetchItems = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('content_queue')
      .select(
        'id, channel, format, hook, draft, rationale, created_at, status, edited_draft, tripp_notes'
      )
      .eq('status', 'awaiting_approval')
      .order('created_at', { ascending: true })
    setItems((data as ContentItem[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchItems()
    const interval = setInterval(fetchItems, 30_000)
    return () => clearInterval(interval)
  }, [fetchItems])

  const approve = async (id: string) => {
    setPendingId(id)
    const supabase = createClient()
    await supabase.from('content_queue').update({ status: 'approved' }).eq('id', id)
    setPendingId(null)
    fetchItems()
  }

  const startEdit = (item: ContentItem) => {
    setEditingId(item.id)
    setEditText(item.edited_draft ?? item.draft)
    setRejectingId(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditText('')
  }

  const saveEdit = async (id: string) => {
    setPendingId(id)
    const supabase = createClient()
    await supabase
      .from('content_queue')
      .update({ status: 'edited', edited_draft: editText })
      .eq('id', id)
    setPendingId(null)
    setEditingId(null)
    setEditText('')
    fetchItems()
  }

  const startReject = (id: string) => {
    setRejectingId(id)
    setRejectReason('')
    setEditingId(null)
  }

  const cancelReject = () => {
    setRejectingId(null)
    setRejectReason('')
  }

  const submitReject = async (id: string) => {
    setPendingId(id)
    const supabase = createClient()
    await supabase
      .from('content_queue')
      .update({ status: 'rejected', tripp_notes: rejectReason.trim() })
      .eq('id', id)
    setPendingId(null)
    setRejectingId(null)
    setRejectReason('')
    fetchItems()
  }

  return (
    <section>
      <h2 className="text-lg font-semibold text-zinc-100 mb-3">Content queue</h2>

      {loading ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-zinc-500 text-sm">Loading…</p>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-zinc-500 text-sm">No content waiting.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const isEditing = editingId === item.id
            const isRejecting = rejectingId === item.id
            const isPending = pendingId === item.id

            return (
              <article
                key={item.id}
                className="rounded-lg border border-zinc-800 bg-zinc-900 p-5"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-300">
                      {formatChannel(item.channel)}
                    </span>
                    <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-xs font-medium text-zinc-400">
                      {formatFormat(item.format)}
                    </span>
                  </div>
                  <span className="text-xs text-zinc-500">{formatDate(item.created_at)}</span>
                </div>

                <div className="rounded-md border-l-2 border-emerald-500/50 bg-zinc-950/50 px-4 py-3 mb-4">
                  <div className="text-xs uppercase tracking-wide text-zinc-500 mb-1">Hook</div>
                  <p className="text-base font-medium text-zinc-100 leading-snug">{item.hook}</p>
                </div>

                {isEditing ? (
                  <div className="space-y-2">
                    <textarea
                      autoFocus
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={12}
                      className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 font-mono placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={cancelEdit}
                        disabled={isPending}
                        className="rounded-md border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => saveEdit(item.id)}
                        disabled={isPending || !editText.trim()}
                        className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm font-medium text-zinc-100 hover:bg-zinc-700 disabled:opacity-50"
                      >
                        {isPending ? 'Saving…' : 'Save'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="max-h-80 overflow-y-auto rounded-md border border-zinc-800 bg-zinc-950/50 px-4 py-3">
                    <ReactMarkdown components={markdownComponents}>{item.draft}</ReactMarkdown>
                  </div>
                )}

                <p className="text-xs text-zinc-500 mt-3 leading-relaxed">
                  <span className="text-zinc-600">Rationale: </span>
                  {item.rationale}
                </p>

                {isRejecting ? (
                  <div className="mt-4 space-y-2">
                    <textarea
                      autoFocus
                      placeholder="Why?"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      rows={2}
                      className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={cancelReject}
                        disabled={isPending}
                        className="rounded-md border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => submitReject(item.id)}
                        disabled={isPending || !rejectReason.trim()}
                        className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm font-medium text-zinc-100 hover:bg-zinc-700 disabled:opacity-50"
                      >
                        {isPending ? 'Saving…' : 'Submit'}
                      </button>
                    </div>
                  </div>
                ) : (
                  !isEditing && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      <button
                        onClick={() => approve(item.id)}
                        disabled={isPending}
                        className="rounded-md border border-emerald-500/30 bg-emerald-500/15 px-3 py-1.5 text-sm font-medium text-emerald-400 hover:bg-emerald-500/25 disabled:opacity-50"
                      >
                        {isPending ? 'Saving…' : 'Approve'}
                      </button>
                      <button
                        onClick={() => startEdit(item)}
                        className="rounded-md border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => startReject(item.id)}
                        className="rounded-md border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800"
                      >
                        Reject
                      </button>
                    </div>
                  )
                )}
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
