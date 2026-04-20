import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

export function ProtectedRoute({ children }) {
  const { token, user } = useAuthStore()
  if (!token) {
    return <Navigate to="/login" replace />
  }
  // If the user hasn't completed onboarding and they aren't ON the onboarding phase, trap them there
  if (user && !user.onboardingComplete && window.location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }
  // Conversely, if completed, they cannot see onboarding anymore
  if (user && user.onboardingComplete && window.location.pathname === '/onboarding') {
    return <Navigate to="/" replace />
  }
  
  return <>{children}</>
}
