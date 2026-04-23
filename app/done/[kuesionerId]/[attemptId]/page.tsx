import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function DonePage(
  props: PageProps<'/done/[kuesionerId]/[attemptId]'>
) {
  const { kuesionerId, attemptId } = await props.params
  const supabase = await createClient()

  const { data: attempt } = await supabase
    .from('guest_quiz_attempt')
    .select('id, guest_name, score, completed_at')
    .eq('id', attemptId)
    .eq('kuesioner_id', kuesionerId)
    .single()

  const { data: kuesioner } = await supabase
    .from('kuesioner')
    .select('id, title, question_type')
    .eq('id', kuesionerId)
    .single()

  const isAnnotation = kuesioner?.question_type === 'Open Ended'

  // Only load rank for scored question types
  let rank = 0
  if (!isAnnotation) {
    const { data: allAttempts } = await supabase
      .from('guest_quiz_attempt')
      .select('id, score')
      .eq('kuesioner_id', kuesionerId)
      .not('completed_at', 'is', null)
      .order('score', { ascending: false })
    rank = (allAttempts ?? []).findIndex(a => a.id === attemptId) + 1
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16 bg-gradient-to-b from-indigo-600 to-purple-700">
      <div className="w-full max-w-sm text-center">
        <div className="text-6xl mb-4">
          {isAnnotation ? '✅' : rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '🎉'}
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">
          {isAnnotation ? 'Annotation Submitted!' : 'Quiz Complete!'}
        </h1>
        <p className="text-white/70 mb-8">{kuesioner?.title}</p>

        <div className="bg-white/10 backdrop-blur rounded-2xl p-8 mb-6 space-y-4">
          <div>
            <div className="text-white/60 text-sm">Your name</div>
            <div className="text-xl font-bold text-white">{attempt?.guest_name ?? 'Guest'}</div>
          </div>

          {isAnnotation && (
            <div className="pt-2 border-t border-white/10 text-white/60 text-sm leading-relaxed">
              Your annotation has been saved. Thank you for your contribution.
            </div>
          )}

          {kuesioner?.question_type === 'Multiple Choice' && (
            <>
              <div>
                <div className="text-white/60 text-sm">Score</div>
                <div className="text-4xl font-bold text-white">{attempt?.score ?? 0}</div>
              </div>
              {rank > 0 && (
                <div>
                  <div className="text-white/60 text-sm">Rank</div>
                  <div className="text-2xl font-bold text-white">#{rank}</div>
                </div>
              )}
            </>
          )}

          {kuesioner?.question_type === 'Polling' && (
            <div className="pt-2 border-t border-white/10 text-white/60 text-sm">
              Your response has been recorded.
            </div>
          )}
        </div>

        <Link
          href="/"
          className="inline-block px-6 py-3 bg-white text-indigo-700 font-bold rounded-xl hover:bg-white/90 transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </div>
  )
}
