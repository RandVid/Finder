import { api } from './client'
import type { StatsOut } from '../types'

export function getMyStats(): Promise<StatsOut> {
  return api.get<StatsOut>('/stats/me')
}