interface ThreadPost {
  indent: number
  author: string
  date: string
  lines: string[]
}

function parseThreadText(text: string): ThreadPost[] {
  const rawLines = text.split('\n')
  const posts: ThreadPost[] = []
  let current: ThreadPost | null = null

  for (const rawLine of rawLines) {
    const indentMatch = rawLine.match(/^( *)/)
    const indent = indentMatch ? Math.floor(indentMatch[1].length / 2) : 0
    const trimmed = rawLine.trimStart()

    const headerMatch = trimmed.match(/^\[(.+?) — (.+?)\]$/)
    if (headerMatch) {
      if (current) posts.push(current)
      current = { indent, author: headerMatch[1], date: headerMatch[2], lines: [] }
    } else if (current && trimmed !== '') {
      current.lines.push(trimmed)
    }
  }
  if (current) posts.push(current)
  return posts
}

const INDENT_BORDER = [
  'border-indigo-300',
  'border-sky-300',
  'border-emerald-300',
  'border-amber-300',
]

const INDENT_BG = [
  'bg-white',
  'bg-sky-50',
  'bg-emerald-50',
  'bg-amber-50',
]

interface Props {
  description: string
}

export default function ForumThread({ description }: Props) {
  const metaEnd = description.indexOf('\n\n')
  const metaText = metaEnd !== -1 ? description.slice(0, metaEnd) : ''
  const threadText = metaEnd !== -1 ? description.slice(metaEnd + 2) : description
  const posts = parseThreadText(threadText)

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      {/* Meta bar */}
      {metaText && (
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex gap-4 text-xs text-slate-500">
          {metaText.split('\n').map((m, i) => <span key={i}>{m}</span>)}
        </div>
      )}

      {/* Thread posts */}
      <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
        {posts.map((post, i) => {
          const level = Math.min(post.indent, 3)
          return (
            <div
              key={i}
              className={`border-l-2 rounded-r-lg px-3 py-2 ${INDENT_BORDER[level]} ${INDENT_BG[level]}`}
              style={{ marginLeft: `${post.indent * 24}px` }}
            >
              <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                <span className="text-xs font-semibold text-slate-700">{post.author}</span>
                <span className="text-xs text-slate-400">{post.date}</span>
                {post.indent > 0 && (
                  <span className="text-[10px] text-slate-300 ml-auto">↩ reply</span>
                )}
              </div>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                {post.lines.join('\n')}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
