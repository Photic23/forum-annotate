import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

/**
 * GET /api/download
 *
 * Returns a summaries.json file compatible with evaluate.py in temp-skripsi.
 * Format per entry:
 *   { id, title, course, generated_summary: "", reference_summary: "..." }
 *
 * Only includes forums that have at least one annotation.
 * When a forum has multiple annotations, the most recently updated one is used.
 */
export async function GET() {
  // Auth check — must be logged in
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()

  // Fetch all forums
  const { data: forums, error: forumsError } = await admin
    .from('forum')
    .select('id, title, course')
    .order('course')
    .order('title')

  if (forumsError) {
    return NextResponse.json({ error: forumsError.message }, { status: 500 })
  }

  // Fetch all annotations (most recent per forum via updated_at desc)
  const { data: annotations, error: annotationsError } = await admin
    .from('annotation')
    .select('forum_id, text, updated_at')
    .order('updated_at', { ascending: false })

  if (annotationsError) {
    return NextResponse.json({ error: annotationsError.message }, { status: 500 })
  }

  // Keep only the latest annotation per forum
  const latestByForum = new Map<string, string>()
  for (const a of annotations ?? []) {
    if (!latestByForum.has(a.forum_id)) {
      latestByForum.set(a.forum_id, a.text)
    }
  }

  // Build output — only forums with at least one annotation
  const summaries = (forums ?? [])
    .filter(f => latestByForum.has(f.id))
    .map(f => ({
      id: f.id,
      title: f.title,
      course: f.course,
      generated_summary: '',
      reference_summary: latestByForum.get(f.id) ?? '',
    }))

  const json = JSON.stringify(summaries, null, 2)

  return new NextResponse(json, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="summaries.json"',
    },
  })
}
