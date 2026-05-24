import { api } from './client'
import type { TokenResponse } from '../types'

export const register = (display_name: string, email: string, password: string, gender: string, birth_date: string) =>
  api.post<TokenResponse>('/auth/register', { display_name, email, password, gender, birth_date })

export const login = (email: string, password: string) =>
  api.post<TokenResponse>('/auth/login', { email, password })
