import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function DashboardForumPage(
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params
  const forumId = decodeURIComponent(id)
  const supabase = await createClient()

  const { data: forum } = await supabase
    .from('forum')
    .select('id, title, course, total_posts, description')
    .eq('id', forumId)
    .single()

  if (!forum) notFound()

  const { data: annotations } = await supabase
    .from('annotation')
    .select('id, user_id, text, created_at, updated_at')
    .eq('forum_id', forumId)
    .order('updated_at', { ascending: false })

  const list = annotations ?? []

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link href="/dashboard" className="hover:text-indigo-600 transition-colors">
          Dashboard
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-slate-700 truncate">{forum.title}</span>
      </div>

      {/* Header */}
      <div className="mb-6">
        <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
          {forum.course}
        </p>
        <h1 className="text-xl font-bold text-slate-900 mb-1">{forum.title}</h1>
        <p className="text-sm text-slate-500">
          {forum.total_posts} posts ·{' '}
          <span className="font-medium text-slate-700">{list.length}</span> annotation{list.length !== 1 ? 's' : ''} submitted
        </p>
      </div>

      {list.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 py-16 text-center">
          <p className="text-slate-400 text-sm">No annotations submitted for this forum yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {list.map((a, i) => (
            <div key={a.id} className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-600">
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-xs font-mono text-slate-500">{a.user_id}</p>
                    <p className="text-xs text-slate-400">
                      Saved {new Date(a.updated_at as string).toLocaleString()}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-slate-400 shrink-0">
                  {(a.text as string).length} chars
                </span>
              </div>
              <div className="bg-slate-50 rounded-xl px-4 py-3 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap border border-slate-100">
                {a.text as string}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
