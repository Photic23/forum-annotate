/**
 * seed-forums.mjs
 * Seeds annotation.json (53 forum threads) into the `forum` table in Supabase.
 *
 * Usage:
 *   node scripts/seed-forums.mjs
 *
 * Requires .env.local with:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// --- Load env ---
const envPath = resolve(__dirname, '../.env.local')
const envText = readFileSync(envPath, 'utf-8')
const env = Object.fromEntries(
  envText.split('\n')
    .filter(l => l.trim() && !l.startsWith('#'))
    .map(l => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()])
    .filter(([k]) => k)
)

const SUPABASE_URL = env['NEXT_PUBLIC_SUPABASE_URL']
const SERVICE_KEY = env['SUPABASE_SERVICE_ROLE_KEY']

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  console.error('Add SUPABASE_SERVICE_ROLE_KEY from Supabase Dashboard → Settings → API → service_role key')
  process.exit(1)
}

const headers = {
  'Content-Type': 'application/json',
  'apikey': SERVICE_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'Prefer': 'return=representation',
}

// --- Load annotation data ---
const annotationPath = resolve(__dirname, '../../../temp-skripsi/annotation.json')
const forums = JSON.parse(readFileSync(annotationPath, 'utf-8'))
console.log(`Loaded ${forums.length} forums from annotation.json`)

// --- Helpers ---
function formatThread(thread, indent = 0) {
  if (!thread || thread.length === 0) return ''
  return thread.map(post => {
    const prefix = '  '.repeat(indent)
    const header = `${prefix}[${post.author} — ${post.date}]`
    const body = post.content.split('\n').map(l => `${prefix}${l}`).join('\n')
    const replies = post.replies && post.replies.length > 0
      ? '\n' + formatThread(post.replies, indent + 1)
      : ''
    return `${header}\n${body}${replies}`
  }).join('\n\n')
}

async function rest(method, path, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${text}`)
  return text ? JSON.parse(text) : null
}

// --- Main ---
async function main() {
  let created = 0
  let skipped = 0

  for (const forum of forums) {
    // Check if forum already exists
    const existing = await rest('GET', `/forum?id=eq.${encodeURIComponent(forum.id)}&select=id`)
    if (existing && existing.length > 0) {
      skipped++
      continue
    }

    const threadText = formatThread(forum.thread)
    const description = `Course: ${forum.course}\nPosts: ${forum.total_posts}\n\n${threadText}`

    await rest('POST', '/forum', {
      id: forum.id,
      title: forum.title,
      course: forum.course,
      total_posts: forum.total_posts,
      description,
      reference_summary: forum.reference_summary ?? null,
    })

    created++
    process.stdout.write(`  [${created + skipped}/${forums.length}] ${forum.title.slice(0, 70)}\n`)
  }

  console.log(`\nDone! Created: ${created}, Already existed: ${skipped}`)
}

main().catch(e => { console.error(e); process.exit(1) })
