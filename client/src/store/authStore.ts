import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthUser {
  id: string
  email: string
  companyName: string
  ownerName: string
  onboardingComplete: boolean
}

interface AuthStore {
  token: string | null
  user: AuthUser | null
  setAuth: (token: string, user: AuthUser) => void
  logout: () => void
  markOnboardingDone: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
      markOnboardingDone: () => set(s => ({
        user: s.user ? { ...s.user, onboardingComplete: true } : null
      })),
    }),
    { name: 'mv-auth' }
  )
)
