import { api, getToken } from './client'
import type { MessageOut } from '../types'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

export const getMessages = (matchId: number) =>
  api.get<MessageOut[]>(`/matches/${matchId}/messages`)

export const sendMessage = (matchId: number, body: string) =>
  api.post<MessageOut>(`/matches/${matchId}/messages`, { body })

export async function sendMessagePhoto(
  matchId: number,
  file: File,
  caption = '',
): Promise<MessageOut> {
  const form = new FormData()
  form.append('file', file)
  form.append('caption', caption)
  const token = getToken()
  const res = await fetch(`${BASE_URL}/matches/${matchId}/messages/photo`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body?.detail ?? `Upload failed: ${res.status}`)
  }
  return res.json() as Promise<MessageOut>
}
