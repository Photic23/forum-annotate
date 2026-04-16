import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Forum } from '@/lib/types'
import SignOutButton from './_components/SignOutButton'

export default async function ForumsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: forums } = await supabase
    .from('forum')
    .select('id, title, course, total_posts')
    .order('course')
    .order('title')

  const { data: annotations } = await supabase
    .from('annotation')
    .select('forum_id, updated_at')
    .eq('user_id', user.id)

  const annotatedIds = new Set((annotations ?? []).map(a => a.forum_id))
  const annotationMap = Object.fromEntries(
    (annotations ?? []).map(a => [a.forum_id, a.updated_at as string])
  )

  const done = annotatedIds.size
  const total = (forums ?? []).length

  const grouped = (forums ?? []).reduce<Record<string, Forum[]>>((acc, forum) => {
    const course = forum.course
    if (!acc[course]) acc[course] = []
    acc[course].push(forum as Forum)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900">Forum Annotation</h1>
              <p className="text-xs text-slate-500">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">
              <span className="font-semibold text-indigo-600">{done}</span>
              <span className="text-slate-400"> / {total} annotated</span>
            </span>
            <SignOutButton />
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-slate-100">
          <div
            className="h-full bg-indigo-500 transition-all"
            style={{ width: total > 0 ? `${(done / total) * 100}%` : '0%' }}
          />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {Object.entries(grouped).map(([course, courseForums]) => {
          const courseDone = courseForums.filter(f => annotatedIds.has(f.id)).length
          return (
            <section key={course} className="mb-10">
              <div className="flex items-baseline justify-between mb-3">
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                  {course}
                </h2>
                <span className="text-xs text-slate-400">{courseDone} / {courseForums.length}</span>
              </div>
              <div className="space-y-2">
                {courseForums.map(forum => {
                  const isDone = annotatedIds.has(forum.id)
                  const updatedAt = annotationMap[forum.id]
                  return (
                    <Link
                      key={forum.id}
                      href={`/forums/${encodeURIComponent(forum.id)}`}
                      className={`flex items-center gap-4 p-4 rounded-xl border transition-all hover:shadow-sm ${
                        isDone
                          ? 'bg-white border-emerald-200 hover:border-emerald-300'
                          : 'bg-white border-slate-200 hover:border-indigo-300'
                      }`}
                    >
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        isDone ? 'bg-emerald-100' : 'bg-slate-100'
                      }`}>
                        {isDone ? (
                          <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{forum.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {forum.total_posts} posts
                          {isDone && updatedAt && (
                            <span className="ml-2 text-emerald-600">
                              · saved {new Date(updatedAt).toLocaleDateString()}
                            </span>
                          )}
                        </p>
                      </div>

                      <svg className="w-4 h-4 text-slate-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  )
                })}
              </div>
            </section>
          )
        })}
      </main>
    </div>
  )
}
