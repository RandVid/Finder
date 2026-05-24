import { api, getToken } from './client'
import type {
  ProfileOut,
  ProfileUpdateRequest,
  DatingPreferencesOut,
  DatingPreferencesUpdateRequest,
} from '../types'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

export const getMyProfile = () => api.get<ProfileOut>('/profiles/me')

export const updateMyProfile = (body: ProfileUpdateRequest) =>
  api.patch<ProfileOut>('/profiles/me', body)

export const getMyPreferences = () =>
  api.get<DatingPreferencesOut>('/profiles/me/preferences')

export const updateMyPreferences = (body: DatingPreferencesUpdateRequest) =>
  api.patch<DatingPreferencesOut>('/profiles/me/preferences', body)

export async function uploadPhoto(file: File): Promise<string> {
  const form = new FormData()
  form.append('file', file)
  const token = getToken()
  const res = await fetch(`${BASE_URL}/profiles/me/photo`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body?.detail ?? `Upload failed: ${res.status}`)
  }
  const data = await res.json()
  return data.photo_url as string
}
