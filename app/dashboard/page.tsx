import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { count: totalForums } = await supabase
    .from('forum')
    .select('*', { count: 'exact', head: true })

  const { count: totalAnnotations } = await supabase
    .from('annotation')
    .select('*', { count: 'exact', head: true })

  // Annotators who have submitted at least one annotation
  const { data: annotatorRows } = await supabase
    .from('annotation')
    .select('user_id')

  const uniqueAnnotators = new Set((annotatorRows ?? []).map(r => r.user_id)).size

  // Forums with at least one annotation
  const { data: annotatedForumRows } = await supabase
    .from('annotation')
    .select('forum_id')

  const annotatedForums = new Set((annotatedForumRows ?? []).map(r => r.forum_id)).size

  // Recent annotations
  const { data: recent } = await supabase
    .from('annotation')
    .select('id, forum_id, user_id, updated_at, forum:forum_id(title)')
    .order('updated_at', { ascending: false })
    .limit(10)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Annotation Overview</h1>
        <p className="text-slate-500 mt-1">Admin view — all annotators and submissions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        {[
          { label: 'Total Forums', value: totalForums ?? 0 },
          { label: 'Forums Annotated', value: annotatedForums },
          { label: 'Total Annotations', value: totalAnnotations ?? 0 },
          { label: 'Annotators', value: uniqueAnnotators },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="text-3xl font-bold text-indigo-600">{stat.value}</div>
            <div className="text-sm text-slate-500 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Progress */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">Forum coverage</span>
          <span className="text-sm text-slate-500">
            {annotatedForums} / {totalForums ?? 0} forums have at least one annotation
          </span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all"
            style={{ width: totalForums ? `${(annotatedForums / totalForums) * 100}%` : '0%' }}
          />
        </div>
      </div>

      {/* Recent activity */}
      <div className="bg-white rounded-2xl border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Recent Annotations</h2>
        </div>
        {(recent ?? []).length === 0 ? (
          <p className="px-6 py-8 text-sm text-slate-400 text-center">No annotations yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {(recent ?? []).map(a => {
              const forum = Array.isArray(a.forum) ? a.forum[0] : a.forum
              return (
                <li key={a.id} className="px-6 py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {(forum as { title?: string })?.title ?? a.forum_id}
                    </p>
                    <p className="text-xs text-slate-400 font-mono">{a.user_id}</p>
                  </div>
                  <span className="text-xs text-slate-400 shrink-0">
                    {new Date(a.updated_at as string).toLocaleString()}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="mt-6">
        <Link href="/forums" className="text-sm text-indigo-600 hover:underline">
          ← Go to annotation view
        </Link>
      </div>
    </div>
  )
}
