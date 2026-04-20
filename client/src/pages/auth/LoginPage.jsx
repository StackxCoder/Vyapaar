import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authApi } from '../../api/auth'
import { useAuthStore } from '../../store/authStore'
import { Mail, Eye, EyeOff, Loader2 } from 'lucide-react'
import './Auth.css'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!email || !password) { setError('Dono fields zaroori hain'); return }
    setLoading(true); setError('')
    try {
      const { token, user } = await authApi.login(email, password)
      setAuth(token, user)
      navigate(user.onboardingComplete ? '/' : '/onboarding')
    } catch (e) {
      setError(e.message || 'Login fail hua')
    } finally { 
      setLoading(false) 
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-left">
        <div className="auth-logo-large">मेरा व्यापार</div>
        <div className="auth-tagline">Aapke business ka smart saathi</div>
        <div className="auth-pills">
          <div className="pill">Sales Track</div>
          <div className="pill">Udhaar Management</div>
          <div className="pill">AI Assistant</div>
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-card">
          <div className="mobile-logo">मेरा व्यापार</div>
          <h2>Wapas swagat hai</h2>
          <p className="auth-subtitle">Apne account mein login karein</p>
          
          <form onSubmit={handleLogin} className="auth-form">
            <div className="field">
              <label>Email ID</label>
              <div className="input-with-icon">
                <Mail className="field-icon" size={18} />
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="shop@email.com" 
                />
              </div>
            </div>
            
            <div className="field">
              <label>Password</label>
              <div className="input-with-icon">
                <input 
                  type={showPwd ? "text" : "password"} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="******" 
                />
                <button type="button" className="pwd-toggle" onClick={() => setShowPwd(!showPwd)}>
                  {showPwd ? <EyeOff size={18}/> : <Eye size={18}/>}
                </button>
              </div>
            </div>

            {error && <div className="auth-error">{error}</div>}

            <button type="submit" className="btn-primary auth-submit" disabled={loading}>
              {loading ? <Loader2 className="spin" size={18} /> : 'Login karein'}
            </button>
          </form>

          <div className="auth-divider"><span>Naya account?</span></div>
          
          <Link to="/signup" className="btn-secondary auth-link-btn">
            Register karein
          </Link>
        </div>
      </div>
    </div>
  )
}
