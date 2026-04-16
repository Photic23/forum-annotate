import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import ForumThread from './_components/ForumThread'
import AnnotationEditor from './_components/AnnotationEditor'
import type { Annotation } from '@/lib/types'

export default async function ForumDetailPage(
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params
  const forumId = decodeURIComponent(id)
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: forum } = await supabase
    .from('forum')
    .select('*')
    .eq('id', forumId)
    .single()

  if (!forum) notFound()

  const { data: annotation } = await supabase
    .from('annotation')
    .select('*')
    .eq('forum_id', forumId)
    .eq('user_id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href="/forums"
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-indigo-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            All forums
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-sm text-slate-600 truncate">{forum.title}</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Forum info */}
        <div className="mb-4">
          <p className="text-xs font-medium text-indigo-600 uppercase tracking-wider mb-1">
            {forum.course}
          </p>
          <h1 className="text-xl font-bold text-slate-900">{forum.title}</h1>
        </div>

        {/* Two-column layout on wide screens */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: forum thread */}
          <section>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Forum Thread
            </h2>
            {forum.description ? (
              <ForumThread description={forum.description} />
            ) : (
              <p className="text-sm text-slate-400">No thread content.</p>
            )}
          </section>

          {/* Right: annotation editor */}
          <section className="lg:sticky lg:top-20 self-start">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Your Annotation
            </h2>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <AnnotationEditor
                forumId={forumId}
                initial={annotation as Annotation | null}
              />
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
