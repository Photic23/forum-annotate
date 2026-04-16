import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Kuesioner } from '@/lib/types'
import DeleteKuesionerButton from './_components/DeleteKuesionerButton'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: kuesionerList } = await supabase
    .from('kuesioner')
    .select('*')
    .eq('created_by', user!.id)
    .order('created_at', { ascending: false })

  const list = (kuesionerList ?? []) as Kuesioner[]

  function statusBadge(k: Kuesioner) {
    if (k.if_finished) return { label: 'Finished', cls: 'bg-slate-100 text-slate-600' }
    if (k.is_started) return { label: 'Live', cls: 'bg-green-100 text-green-700' }
    if (k.is_lobby) return { label: 'Lobby', cls: 'bg-yellow-100 text-yellow-700' }
    return { label: 'Ready', cls: 'bg-blue-100 text-blue-700' }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Questionnaires</h1>
          <p className="text-slate-500 mt-1">Manage your live quizzes for forum annotation</p>
        </div>
        <Link
          href="/dashboard/kuesioner/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Quiz
        </Link>
      </div>

      {list.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
          <div className="text-4xl mb-3">📋</div>
          <h2 className="text-lg font-semibold text-slate-700">No quizzes yet</h2>
          <p className="text-slate-500 mt-1 mb-6">Create your first questionnaire to get started.</p>
          <Link
            href="/dashboard/kuesioner/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors"
          >
            Create Quiz
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {list.map(k => {
            const { label, cls } = statusBadge(k)
            return (
              <div
                key={k.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 flex items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-slate-900 truncate">{k.title}</h3>
                    <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${cls}`}>
                      {label}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <span>{k.question_type}</span>
                    <span>•</span>
                    <span className="font-mono font-medium text-slate-700">PIN: {k.pin}</span>
                    <span>•</span>
                    <span>{k.visibility}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {k.if_finished && (
                    <Link
                      href={`/dashboard/kuesioner/${k.id}/recap`}
                      className="px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      Results
                    </Link>
                  )}
                  <Link
                    href={`/dashboard/kuesioner/${k.id}`}
                    className="px-3 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                  >
                    {k.if_finished ? 'View' : 'Manage'}
                  </Link>
                  <DeleteKuesionerButton id={k.id} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
