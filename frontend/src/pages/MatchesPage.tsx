import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getMatches } from '../api/matches'

function formatWhen(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  if (sameDay) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function previewText(body: string | null, imageUrl: string | null): string {
  if (body?.trim()) return body.trim()
  if (imageUrl) return '📷 Photo'
  return 'Say hello!'
}

export default function MatchesPage() {
  const [search, setSearch] = useState('')
  const { data: matches = [], isLoading, isError } = useQuery({
    queryKey: ['matches'],
    queryFn: getMatches,
    refetchInterval: 5000,
  })

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return matches
    return matches.filter(m =>
      (m.other_display_name ?? '').toLowerCase().includes(q),
    )
  }, [matches, search])

  return (
    <div className="max-w-lg mx-auto flex flex-col h-[calc(100vh-7rem)]">
      <div className="mb-4 shrink-0">
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Matches</h1>
        <input
          type="search"
          placeholder="Search matches…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white"
        />
      </div>

      {isLoading && (
        <p className="text-gray-400 text-center py-12">Loading matches…</p>
      )}

      {isError && (
        <p className="text-red-400 text-center py-12">Failed to load matches.</p>
      )}

      {!isLoading && !isError && filtered.length === 0 && (
        <div className="flex flex-col items-center gap-3 text-center py-16">
          <span className="text-5xl">💬</span>
          <h3 className="text-lg font-semibold text-gray-700">
            {search ? 'No matches found' : 'No matches yet'}
          </h3>
          <p className="text-gray-400 text-sm max-w-xs">
            {search
              ? 'Try a different name.'
              : 'Smash someone who smashes you back — they will show up here.'}
          </p>
          {!search && (
            <Link
              to="/discovery"
              className="mt-2 text-sm font-medium text-rose-500 hover:underline"
            >
              Go to Discovery
            </Link>
          )}
        </div>
      )}

      <ul className="flex-1 overflow-y-auto space-y-2 pr-1">
        {filtered.map(m => (
          <li key={m.id}>
            <Link
              to={`/matches/${m.id}`}
              className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 hover:border-rose-200 hover:shadow-sm transition-all"
            >
              <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden shrink-0 flex items-center justify-center text-gray-400 text-lg font-semibold">
                {m.other_photo_url ? (
                  <img
                    src={m.other_photo_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  (m.other_display_name?.[0] ?? '?').toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">
                  {m.other_display_name ?? 'Unknown'}
                </p>
                <p className="text-sm text-gray-500 truncate">
                  {previewText(m.last_message_body, m.last_message_image_url)}
                </p>
              </div>
              <span className="text-xs text-gray-400 shrink-0">
                {formatWhen(m.last_message_at ?? m.created_at)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
