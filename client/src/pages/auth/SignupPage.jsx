import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authApi } from '../../api/auth'
import { useAuthStore } from '../../store/authStore'
import { Mail, Eye, EyeOff, Loader2, Building, User, Phone, MapPin } from 'lucide-react'
import './Auth.css'

export default function SignupPage() {
  const [form, setForm] = useState({ companyName: '', ownerName: '', phone: '', city: '', email: '', password: '', confirm: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  const handleSignup = async (e) => {
    e.preventDefault()
    const newErrors = {}
    if (!form.companyName) newErrors.companyName = 'Company name zaroori hai'
    if (!form.ownerName) newErrors.ownerName = 'Owner name zaroori hai'
    if (!form.email || !form.email.includes('@')) newErrors.email = 'Sahi email daalein'
    if (form.password.length < 6) newErrors.password = 'Password 6 chars ka hona chahiye'
    if (form.password !== form.confirm) newErrors.confirm = 'Passwords match nahi kar rahe'
    if (!agreed) newErrors.agreed = 'Terms se agree karna zaroori hai'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true); setErrors({})
    try {
      const { token, user } = await authApi.signup({
        email: form.email,
        password: form.password,
        companyName: form.companyName,
        ownerName: form.ownerName,
        phone: form.phone,
        city: form.city
      })
      setAuth(token, user)
      navigate('/onboarding')
    } catch (e) {
      setErrors({ global: e.message || 'Signup fail hua' })
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
        <div className="auth-card signup-card">
          <div className="mobile-logo">मेरा व्यापार</div>
          <h2>Account banayein</h2>
          <p className="auth-subtitle">Sirf 1 minute mein apna business shuru karein</p>
          
          <form onSubmit={handleSignup} className="auth-form">
            <div className="field full-width">
              <label>Aapki dukaan ka naam</label>
              <div className="input-with-icon">
                <Building className="field-icon" size={18} />
                <input type="text" value={form.companyName} onChange={e=>setForm({...form, companyName: e.target.value})} placeholder="Mera Vyapaar Traders" />
              </div>
              {errors.companyName && <span className="inline-error">{errors.companyName}</span>}
            </div>

            <div className="form-grid">
              <div className="field">
                <label>Aapka naam</label>
                <div className="input-with-icon">
                  <User className="field-icon" size={18} />
                  <input type="text" value={form.ownerName} onChange={e=>setForm({...form, ownerName: e.target.value})} placeholder="Rahul Kumar" />
                </div>
                {errors.ownerName && <span className="inline-error">{errors.ownerName}</span>}
              </div>
              <div className="field">
                <label>Phone (optional)</label>
                <div className="input-with-icon">
                  <Phone className="field-icon" size={18} />
                  <input type="tel" value={form.phone} onChange={e=>setForm({...form, phone: e.target.value})} placeholder="9876543210" />
                </div>
              </div>
            </div>

            <div className="field full-width">
              <label>City (optional)</label>
              <div className="input-with-icon">
                <MapPin className="field-icon" size={18} />
                <input type="text" value={form.city} onChange={e=>setForm({...form, city: e.target.value})} placeholder="Delhi" />
              </div>
            </div>

            <div className="field full-width">
              <label>Email ID</label>
              <div className="input-with-icon">
                <Mail className="field-icon" size={18} />
                <input type="email" value={form.email} onChange={e=>setForm({...form, email: e.target.value})} placeholder="rahul@business.com" />
              </div>
              {errors.email && <span className="inline-error">{errors.email}</span>}
            </div>

            <div className="form-grid">
              <div className="field">
                <label>Password</label>
                <div className="input-with-icon">
                  <input type={showPwd ? "text" : "password"} value={form.password} onChange={e=>setForm({...form, password: e.target.value})} placeholder="******" />
                  <button type="button" className="pwd-toggle" onClick={() => setShowPwd(!showPwd)}>
                    {showPwd ? <EyeOff size={18}/> : <Eye size={18}/>}
                  </button>
                </div>
                {errors.password && <span className="inline-error">{errors.password}</span>}
              </div>
              <div className="field">
                <label>Confirm Password</label>
                <div className="input-with-icon">
                  <input type={showPwd ? "text" : "password"} value={form.confirm} onChange={e=>setForm({...form, confirm: e.target.value})} placeholder="******" />
                </div>
                {errors.confirm && <span className="inline-error">{errors.confirm}</span>}
              </div>
            </div>

            <div className="checkbox-field">
              <label className="checkbox-label">
                <input type="checkbox" checked={agreed} onChange={e=>setAgreed(e.target.checked)} />
                <span className="cb-text">Main terms se agree karta/karti hoon</span>
              </label>
              {errors.agreed && <span className="inline-error">{errors.agreed}</span>}
            </div>

            {errors.global && <div className="auth-error">{errors.global}</div>}

            <button type="submit" className="btn-primary auth-submit" disabled={loading} style={{ marginTop: '10px' }}>
              {loading ? <Loader2 className="spin" size={18} /> : 'Account banayein'}
            </button>
          </form>

          <div className="auth-divider"><span>Pehle se account hai?</span></div>
          
          <Link to="/login" className="btn-secondary auth-link-btn">
            Login karein
          </Link>
        </div>
      </div>
    </div>
  )
}
