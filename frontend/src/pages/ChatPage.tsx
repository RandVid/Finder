import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getMatches } from '../api/matches'
import { getMessages, sendMessage, sendMessagePhoto } from '../api/messages'
import { getMyProfile } from '../api/profiles'

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function ChatPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const matchId = Number(id)
  const queryClient = useQueryClient()
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { data: me } = useQuery({
    queryKey: ['profile', 'me'],
    queryFn: getMyProfile,
  })

  const { data: matches = [] } = useQuery({
    queryKey: ['matches'],
    queryFn: getMatches,
  })

  const match = matches.find(m => m.id === matchId)

  const {
    data: messages = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['messages', matchId],
    queryFn: () => getMessages(matchId),
    enabled: Number.isFinite(matchId) && matchId > 0,
    refetchInterval: 3000,
    retry: false,
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['messages', matchId] })
    queryClient.invalidateQueries({ queryKey: ['matches'] })
  }

  const { mutate: sendText, isPending: sendingText } = useMutation({
    mutationFn: (body: string) => sendMessage(matchId, body),
    onSuccess: () => {
      setText('')
      setError(null)
      invalidate()
    },
    onError: (err: Error) => setError(err.message),
  })

  const { mutate: sendPhoto, isPending: sendingPhoto } = useMutation({
    mutationFn: ({ file, caption }: { file: File; caption: string }) =>
      sendMessagePhoto(matchId, file, caption),
    onSuccess: () => {
      setError(null)
      invalidate()
    },
    onError: (err: Error) => setError(err.message),
  })

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed || sendingText || sendingPhoto) return
    sendText(trimmed)
  }

  function handlePhotoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    sendPhoto({ file, caption: text.trim() })
    setText('')
    e.target.value = ''
  }

  if (!Number.isFinite(matchId) || matchId <= 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        Invalid match.{' '}
        <Link to="/matches" className="text-rose-500 hover:underline">
          Back to matches
        </Link>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-7rem)] gap-4 text-center px-6">
        <div className="text-6xl">🕵️</div>
        <h2 className="text-2xl font-bold text-gray-800">Lol nice try bozo</h2>
        <p className="text-gray-500 text-sm max-w-xs">
          This chat doesn't exist, or you weren't invited. We have people watching.
        </p>
        <Link
          to="/matches"
          className="mt-2 px-5 py-2 bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          Back to my actual matches
        </Link>
      </div>
    )
  }

  const sending = sendingText || sendingPhoto
  const title = match?.other_display_name ?? 'Chat'

  return (
    <div className="max-w-lg mx-auto flex flex-col h-[calc(100vh-7rem)] bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      <header className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white">
        <Link
          to="/matches"
          className="text-gray-500 hover:text-gray-800 text-sm font-medium"
        >
          ← Back
        </Link>
        <button
          type="button"
          onClick={() => navigate(`/matches/${matchId}/profile`)}
          className="flex items-center gap-3 flex-1 min-w-0 text-left hover:opacity-80 transition-opacity"
          title="View profile"
        >
          <div className="w-9 h-9 rounded-full bg-gray-200 overflow-hidden shrink-0 flex items-center justify-center text-sm font-semibold text-gray-500">
            {match?.other_photo_url ? (
              <img src={match.other_photo_url} alt="" className="w-full h-full object-cover" />
            ) : (
              (title[0] ?? '?').toUpperCase()
            )}
          </div>
          <h2 className="font-semibold text-gray-900 truncate">{title}</h2>
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50">
        {isLoading && (
          <p className="text-center text-gray-400 text-sm">Loading messages…</p>
        )}
{!isLoading && messages.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-8">
            No messages yet. Say hi!
          </p>
        )}
        {messages.map(msg => {
          const mine = me?.user_id === msg.sender_user_id
          return (
            <div
              key={msg.id}
              className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                  mine
                    ? 'bg-rose-500 text-white rounded-br-md'
                    : 'bg-white text-gray-900 border border-gray-200 rounded-bl-md'
                }`}
              >
                {msg.image_url && (
                  <a href={msg.image_url} target="_blank" rel="noreferrer">
                    <img
                      src={msg.image_url}
                      alt="Shared"
                      className="rounded-lg max-h-56 mb-1 object-cover"
                    />
                  </a>
                )}
                {msg.body.trim() && <p className="whitespace-pre-wrap break-words">{msg.body}</p>}
                <p
                  className={`text-[10px] mt-1 ${mine ? 'text-rose-100' : 'text-gray-400'}`}
                >
                  {formatTime(msg.created_at)}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {error && (
        <p className="px-4 py-1 text-xs text-red-500 bg-red-50 shrink-0">{error}</p>
      )}

      <form
        onSubmit={handleSubmit}
        className="shrink-0 flex items-end gap-2 p-3 border-t border-gray-200 bg-white"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handlePhotoChange}
        />
        <button
          type="button"
          disabled={sending}
          onClick={() => fileInputRef.current?.click()}
          className="shrink-0 w-10 h-10 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 flex items-center justify-center"
          title="Send photo"
        >
          📷
        </button>
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Type a message…"
          className="flex-1 border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="shrink-0 px-4 py-2.5 rounded-xl bg-rose-500 text-white text-sm font-semibold hover:bg-rose-600 disabled:opacity-50 transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  )
}
