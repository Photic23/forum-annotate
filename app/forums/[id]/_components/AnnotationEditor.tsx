'use client'

import { useState, useRef, useEffect } from 'react'
import type { Annotation } from '@/lib/types'

interface Props {
  forumId: string
  initial: Annotation | null
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export default function AnnotationEditor({ forumId, initial }: Props) {
  const [text, setText] = useState(initial?.text ?? '')
  const [status, setStatus] = useState<SaveStatus>('idle')
  const savedTextRef = useRef(initial?.text ?? '')

  const isDirty = text !== savedTextRef.current

  async function handleSave() {
    if (status === 'saving') return
    setStatus('saving')

    try {
      const res = await fetch(`/api/forums/${encodeURIComponent(forumId)}/annotation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })

      if (!res.ok) throw new Error('Save failed')

      savedTextRef.current = text
      setStatus('saved')
      setTimeout(() => setStatus('idle'), 2000)
    } catch {
      setStatus('error')
      setTimeout(() => setStatus('idle'), 3000)
    }
  }

  // Keyboard shortcut: Ctrl+S / Cmd+S
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (isDirty) handleSave()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [text, isDirty])

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-700">
          Your annotation
        </label>
        <span className="text-xs text-slate-400">Ctrl+S to save</span>
      </div>

      <textarea
        value={text}
        onChange={e => {
          setText(e.target.value)
          setStatus('idle')
        }}
        placeholder="Tulis ringkasan dari forum ini…"
        rows={10}
        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent resize-y text-sm leading-relaxed"
      />

      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">{text.length} characters</span>

        <div className="flex items-center gap-3">
          {status === 'saved' && (
            <span className="text-xs text-emerald-600 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              Saved
            </span>
          )}
          {status === 'error' && (
            <span className="text-xs text-red-500">Failed to save, try again</span>
          )}

          <button
            onClick={handleSave}
            disabled={!text.trim() || status === 'saving' || !isDirty}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            {status === 'saving' ? 'Saving…' : initial ? 'Update' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
