'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function DeleteKuesionerButton({ id }: { id: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirming) {
      setConfirming(true)
      setTimeout(() => setConfirming(false), 3000)
      return
    }
    setLoading(true)
    await fetch(`/api/kuesioner/${id}`, { method: 'DELETE' })
    router.refresh()
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
        confirming
          ? 'bg-red-600 text-white hover:bg-red-700'
          : 'text-red-600 bg-red-50 hover:bg-red-100'
      }`}
    >
      {loading ? '…' : confirming ? 'Confirm?' : 'Delete'}
    </button>
  )
}
