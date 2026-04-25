'use client'

import { useCallback, useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { createClient } from '@/lib/supabase/client'

type Memo = {
  id: string
  title: string
  body: string
  created_at: string
  status: 'unread' | 'read'
  read_at: string | null
}

const markdownComponents = {
  h1: ({ children }: { children?: React.ReactNode }) => (
    <h1 className="text-xl font-semibold text-zinc-100 mt-4 mb-2">{children}</h1>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 className="text-lg font-semibold text-zinc-100 mt-4 mb-2">{children}</h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="text-base font-semibold text-zinc-100 mt-3 mb-2">{children}</h3>
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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function MemoViewer() {
  const [memo, setMemo] = useState<Memo | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(true)
  const [marking, setMarking] = useState(false)

  const fetchMemo = useCallback(async () => {
    const supabase = createClient()

    const { data: unread } = await supabase
      .from('memos')
      .select('id, title, body, created_at, status, read_at')
      .eq('status', 'unread')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (unread) {
      setMemo(unread as Memo)
      setExpanded(true)
      setLoading(false)
      return
    }

    const { data: read } = await supabase
      .from('memos')
      .select('id, title, body, created_at, status, read_at')
      .eq('status', 'read')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    setMemo((read as Memo) ?? null)
    setExpanded(false)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchMemo()
    const interval = setInterval(fetchMemo, 30_000)
    return () => clearInterval(interval)
  }, [fetchMemo])

  const markAsRead = async () => {
    if (!memo) return
    setMarking(true)
    const supabase = createClient()
    await supabase
      .from('memos')
      .update({ status: 'read', read_at: new Date().toISOString() })
      .eq('id', memo.id)
    setMarking(false)
    fetchMemo()
  }

  if (loading) {
    return (
      <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
        <p className="text-zinc-500 text-sm">Loading memo…</p>
      </section>
    )
  }

  if (!memo) {
    return (
      <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="text-lg font-semibold text-zinc-100">Latest memo</h2>
        <p className="text-zinc-500 text-sm mt-2">No memos yet.</p>
      </section>
    )
  }

  const isUnread = memo.status === 'unread'

  return (
    <section className="rounded-lg border border-zinc-800 bg-zinc-900">
      <div className="flex items-start justify-between gap-4 p-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-semibold text-zinc-100">{memo.title}</h2>
            {isUnread && (
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-400">
                Unread
              </span>
            )}
          </div>
          <p className="text-zinc-500 text-sm mt-1">{formatDate(memo.created_at)}</p>
        </div>
        {!isUnread && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="shrink-0 text-sm text-zinc-400 hover:text-zinc-200"
          >
            {expanded ? 'Collapse' : 'Expand'}
          </button>
        )}
      </div>

      {expanded && (
        <div className="border-t border-zinc-800 px-6 py-5">
          <ReactMarkdown components={markdownComponents}>{memo.body}</ReactMarkdown>

          {isUnread && (
            <div className="mt-6 flex justify-end">
              <button
                onClick={markAsRead}
                disabled={marking}
                className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm font-medium text-zinc-100 hover:bg-zinc-700 disabled:opacity-50"
              >
                {marking ? 'Marking…' : 'Mark as read'}
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
