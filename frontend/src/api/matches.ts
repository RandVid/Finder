import { api } from './client'
import type { MatchOut, ProfileOut, StatsOut } from '../types'

export const getMatches = () => api.get<MatchOut[]>('/matches')

export const getMatchProfile = (matchId: number) =>
  api.get<ProfileOut>(`/matches/${matchId}/profile`)

export const getMatchStats = (matchId: number) =>
  api.get<StatsOut>(`/matches/${matchId}/stats`)
