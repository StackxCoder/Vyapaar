import { api } from './client'

export interface AuthUser {
  id: string
  email: string
  companyName: string
  ownerName: string
  onboardingComplete: boolean
}

export const authApi = {
  signup: (data: { email: string; password: string; companyName: string; ownerName: string; phone?: string; city?: string }) =>
    api.post<{ token: string; user: AuthUser }>('/auth/signup', data),
  login: (email: string, password: string) =>
    api.post<{ token: string; user: AuthUser }>('/auth/login', { email, password }),
  me: () => api.get<AuthUser>('/auth/me'),
  completeOnboarding: () => api.patch('/auth/onboarding-complete', {}),
}
