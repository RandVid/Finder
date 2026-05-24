import { api } from './client'
import type { MatchOut, ProfileOut } from '../types'

export const getMatches = () => api.get<MatchOut[]>('/matches')

export const getMatchProfile = (matchId: number) =>
  api.get<ProfileOut>(`/matches/${matchId}/profile`)
