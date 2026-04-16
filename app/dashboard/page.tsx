import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: forums } = await supabase
    .from('forum')
    .select('id, title, course, total_posts')
    .order('course')
    .order('title')

  const { data: annotationCounts } = await supabase
    .from('annotation')
    .select('forum_id')

  const countMap = (annotationCounts ?? []).reduce<Record<string, number>>((acc, a) => {
    acc[a.forum_id] = (acc[a.forum_id] ?? 0) + 1
    return acc
  }, {})

  const totalForums = (forums ?? []).length
  const totalAnnotations = (annotationCounts ?? []).length
  const forumsWithAnnotations = Object.keys(countMap).length
  const uniqueAnnotators = new Set((annotationCounts ?? []).map(a => a.forum_id)).size

  // Group by course
  const grouped = (forums ?? []).reduce<Record<string, typeof forums>>((acc, f) => {
    if (!acc[f!.course]) acc[f!.course] = []
    acc[f!.course]!.push(f)
    return acc
  }, {})

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Annotation Overview</h1>
        <p className="text-slate-500 mt-1">Click any forum to read submitted annotations</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Forums', value: totalForums },
          { label: 'Forums Covered', value: forumsWithAnnotations },
          { label: 'Total Annotations', value: totalAnnotations },
          { label: 'Avg per Forum', value: totalForums ? (totalAnnotations / totalForums).toFixed(1) : '0' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="text-3xl font-bold text-indigo-600">{stat.value}</div>
            <div className="text-sm text-slate-500 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-8">
        <div className="flex justify-between text-sm mb-2">
          <span className="font-medium text-slate-700">Forum coverage</span>
          <span className="text-slate-500">{forumsWithAnnotations} / {totalForums} forums annotated</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full"
            style={{ width: totalForums ? `${(forumsWithAnnotations / totalForums) * 100}%` : '0%' }}
          />
        </div>
      </div>

      {/* Forums grouped by course */}
      {Object.entries(grouped).map(([course, courseForums]) => (
        <section key={course} className="mb-8">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            {course}
          </h2>
          <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
            {(courseForums ?? []).map(f => {
              if (!f) return null
              const count = countMap[f.id] ?? 0
              return (
                <Link
                  key={f.id}
                  href={`/dashboard/forums/${encodeURIComponent(f.id)}`}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{f.title}</p>
                    <p className="text-xs text-slate-400">{f.total_posts} posts</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {count > 0 ? (
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        {count} annotation{count !== 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                        none yet
                      </span>
                    )}
                    <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
