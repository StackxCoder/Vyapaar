import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { authApi } from '../api/auth'
import { settingsApi } from '../api/settings'
import { api } from '../api/client'
import { CheckCircle2, Building, Package, Users, Map, Sparkles, ArrowRight, ArrowLeft, ShoppingCart, Banknote } from 'lucide-react'
import './Onboarding.css'

export default function OnboardingTour() {
  const { user, markOnboardingDone } = useAuthStore()
  const navigate = useNavigate()
  
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Forms
  const [companyForm, setCompanyForm] = useState({ companyName: user?.companyName || '', gstin: '', address: '', invoicePrefix: 'INV' })
  const [productForm, setProductForm] = useState({ name: '', labelSpec: '', actualSpec: '', purchasePrice: '', sellingPrice: '' })
  const [customerForm, setCustomerForm] = useState({ companyName: '', contactPerson: '', phone: '', city: '', creditLimit: '' })

  const nextStep = () => { setStep(s => Math.min(s + 1, 6)); setError('') }
  const prevStep = () => { setStep(s => Math.max(s - 1, 0)); setError('') }

  const handleCompanySave = async () => {
    try {
      setLoading(true); setError('');
      await settingsApi.update(companyForm);
      nextStep();
    } catch (e) {
      setError(e.message || 'Error saving company info');
    } finally { setLoading(false) }
  }

  const handleProductSave = async (skip = false) => {
    if (skip) return nextStep()
    try {
      setLoading(true); setError('');
      await api.post('/products', {
        name: productForm.name,
        category: 'Wire',
        labelSpec: productForm.labelSpec,
        actualSpec: productForm.actualSpec,
        unit: 'coil',
        purchasePrice: Number(productForm.purchasePrice) || 0,
        sellingPrice: Number(productForm.sellingPrice) || 0,
        batchStatus: 'active'
      });
      nextStep();
    } catch (e) {
      setError(e.message || 'Error saving product');
    } finally { setLoading(false) }
  }

  const handleCustomerSave = async (skip = false) => {
    if (skip) return nextStep()
    try {
      setLoading(true); setError('');
      await api.post('/customers', {
        companyName: customerForm.companyName,
        contactPerson: customerForm.contactPerson || '',
        phone: customerForm.phone || '',
        city: customerForm.city || '',
        creditLimit: Number(customerForm.creditLimit) || 0
      });
      nextStep();
    } catch (e) {
      setError(e.message || 'Error saving customer');
    } finally { setLoading(false) }
  }

  const completeTour = async () => {
    try {
      setLoading(true); setError('');
      await authApi.completeOnboarding();
      markOnboardingDone();
      navigate('/');
    } catch (e) {
      setError(e.message || 'Error completing onboarding');
    } finally { setLoading(false) }
  }

  const steps = [
    { title: 'Welcome', icon: <CheckCircle2 className="text-green-500 w-12 h-12 mb-4" /> },
    { title: 'Company Details', icon: <Building className="text-indigo-500 w-8 h-8 mb-4" /> },
    { title: 'First Product', icon: <Package className="text-indigo-500 w-8 h-8 mb-4" /> },
    { title: 'First Customer', icon: <Users className="text-indigo-500 w-8 h-8 mb-4" /> },
    { title: 'Feature Tour', icon: <Map className="text-indigo-500 w-8 h-8 mb-4" /> },
    { title: 'AI Assistant', icon: <Sparkles className="text-amber-500 w-8 h-8 mb-4" /> },
    { title: 'Ready', icon: <div className="done-animation w-16 h-16 mx-auto mb-4 border-4 border-green-500 rounded-full flex items-center justify-center"><CheckCircle2 className="text-green-500 w-8 h-8" /></div> }
  ]

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-card">
        {/* PROGRESS DOTS */}
        <div className="flex gap-2 justify-center mb-8">
          {steps.map((_, i) => (
            <div key={i} className={`h-2 rounded-full transition-all duration-300 ${i === step ? 'w-6 bg-indigo-600' : i < step ? 'w-2 bg-indigo-300' : 'w-2 bg-slate-200'}`} />
          ))}
        </div>

        {/* STEP CONTENT */}
        <div className="flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[360px]">
          {steps[step].icon}

          {step === 0 && (
            <div className="w-full max-w-sm">
              <h1 className="text-2xl font-bold text-slate-800 mb-2">Mera Vyapaar mein swagat hai!</h1>
              <p className="text-slate-500 mb-8">Sirf 2 minute mein apna business setup karein. Hum aapko step-by-step guide karenge.</p>
              <button onClick={nextStep} className="btn-primary w-full justify-center py-3 text-lg">Shuru karein <ArrowRight size={18}/></button>
            </div>
          )}

          {step === 1 && (
            <div className="text-left w-full max-w-sm flex flex-col gap-4">
              <div className="text-center">
                <h1 className="text-xl font-bold text-slate-800">Aapki dukaan ki jaankari</h1>
              </div>
              <div className="field mb-0">
                <label>Company Name</label>
                <input value={companyForm.companyName} onChange={e=>setCompanyForm({...companyForm, companyName: e.target.value})} />
              </div>
              <div className="field mb-0">
                <label>GSTIN (Optional)</label>
                <input value={companyForm.gstin} onChange={e=>setCompanyForm({...companyForm, gstin: e.target.value})} />
              </div>
              <div className="field mb-0">
                <label>Full Address</label>
                <input value={companyForm.address} onChange={e=>setCompanyForm({...companyForm, address: e.target.value})} />
              </div>
              <div className="field mb-0">
                <label>Invoice Prefix (Default: INV)</label>
                <input value={companyForm.invoicePrefix} onChange={e=>setCompanyForm({...companyForm, invoicePrefix: e.target.value})} />
              </div>
              {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100">
                <button onClick={prevStep} className="text-slate-400 font-bold text-sm flex items-center"><ArrowLeft size={16} className="mr-1"/> Back</button>
                <button onClick={handleCompanySave} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg shadow flex items-center transition-colors" disabled={loading}>{loading ? 'Saving...' : 'Save aur aage'} <ArrowRight size={16} className="ml-1"/></button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="text-left w-full max-w-sm flex flex-col gap-4">
              <div className="text-center">
                <h1 className="text-xl font-bold text-slate-800">Pehla product add karein</h1>
                <p className="text-xs text-slate-500 mb-2">Invoice label aur actual spec alag rakh sakte hain.</p>
              </div>
              <div className="field mb-0">
                <label>Product Name</label>
                <input value={productForm.name} onChange={e=>setProductForm({...productForm, name: e.target.value})} placeholder="Standard Wire 1.0mm" />
              </div>
              <div className="field mb-0">
                <label>Label Spec (Invoice pe print hone wala)</label>
                <input value={productForm.labelSpec} onChange={e=>setProductForm({...productForm, labelSpec: e.target.value})} placeholder="90M" />
              </div>
              <div className="field mb-0 relative group">
                <label>Actual Spec (Private)</label>
                <input value={productForm.actualSpec} onChange={e=>setProductForm({...productForm, actualSpec: e.target.value})} className="bg-amber-50" placeholder="87M" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="field mb-0"><label>Purchase (₹)</label><input type="number" value={productForm.purchasePrice} onChange={e=>setProductForm({...productForm, purchasePrice: e.target.value})} /></div>
                <div className="field mb-0"><label>Selling (₹)</label><input type="number" value={productForm.sellingPrice} onChange={e=>setProductForm({...productForm, sellingPrice: e.target.value})} /></div>
              </div>
              {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100">
                <button onClick={() => handleProductSave(true)} className="text-slate-400 font-bold text-sm">Skip</button>
                <button onClick={() => handleProductSave(false)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg shadow flex items-center" disabled={loading}>{loading ? 'Saving...' : 'Save product'} <ArrowRight size={16} className="ml-1"/></button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-left w-full max-w-sm flex flex-col gap-4">
              <div className="text-center">
                <h1 className="text-xl font-bold text-slate-800">Pehla B2B customer</h1>
              </div>
              <div className="field mb-0"><label>Company Name</label><input value={customerForm.companyName} onChange={e=>setCustomerForm({...customerForm, companyName: e.target.value})} placeholder="Shree Enterprises" /></div>
              <div className="field mb-0"><label>Contact Person</label><input value={customerForm.contactPerson} onChange={e=>setCustomerForm({...customerForm, contactPerson: e.target.value})} placeholder="Raju Bhai" /></div>
              <div className="field mb-0"><label>Phone</label><input type="tel" value={customerForm.phone} onChange={e=>setCustomerForm({...customerForm, phone: e.target.value})} placeholder="9988776655" /></div>
              <div className="field mb-0"><label>City</label><input value={customerForm.city} onChange={e=>setCustomerForm({...customerForm, city: e.target.value})} placeholder="Kanpur" /></div>
              <div className="field mb-0"><label>Credit Limit (₹)</label><input type="number" value={customerForm.creditLimit} onChange={e=>setCustomerForm({...customerForm, creditLimit: e.target.value})} placeholder="100000" /></div>
              {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100">
                <button onClick={() => handleCustomerSave(true)} className="text-slate-400 font-bold text-sm">Skip</button>
                <button onClick={() => handleCustomerSave(false)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg shadow flex items-center" disabled={loading}>{loading ? 'Saving...' : 'Save customer'} <ArrowRight size={16} className="ml-1"/></button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="w-full max-w-md text-left">
              <div className="text-center mb-6">
                <h1 className="text-xl font-bold text-slate-800">App ki jaan-pehchaan</h1>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <ShoppingCart className="text-indigo-500 mb-2 w-5 h-5"/>
                  <div className="font-bold text-sm text-slate-800">Bech-bikri</div>
                  <div className="text-xs text-slate-500 mt-1">Pukka aur kachcha bills dono support karta hai</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <Banknote className="text-indigo-500 mb-2 w-5 h-5"/>
                  <div className="font-bold text-sm text-slate-800">Udhaar Ledger</div>
                  <div className="text-xs text-slate-500 mt-1">Customer-wise udhaar track karna asaan banaye</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <Package className="text-indigo-500 mb-2 w-5 h-5"/>
                  <div className="font-bold text-sm text-slate-800">Manufacturing Batches</div>
                  <div className="text-xs text-slate-500 mt-1">Wire roll length aur raw material stock</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <Sparkles className="text-amber-500 mb-2 w-5 h-5"/>
                  <div className="font-bold text-sm text-slate-800">AI Saathi</div>
                  <div className="text-xs text-slate-500 mt-1">Chat karke direct business ki reporting dekhein</div>
                </div>
              </div>
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-100">
                <button onClick={prevStep} className="text-slate-400 font-bold text-sm flex items-center"><ArrowLeft size={16} className="mr-1"/> Back</button>
                <button onClick={nextStep} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg shadow flex items-center">Samajh gaya <ArrowRight size={16} className="ml-1"/></button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="w-full max-w-sm text-center">
              <h1 className="text-xl font-bold text-slate-800 mb-4">AI Saathi — aapka munshi</h1>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-left mb-6 relative shadow-inner">
                <div className="mb-3">
                  <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Aap:</div>
                  <div className="bg-indigo-600 text-white p-2 rounded-lg rounded-tl-none inline-block text-sm shadow-sm font-medium">Is mahine kitni udhaar chadhi?</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1"><Sparkles size={10} className="text-amber-500"/> AI Saathi:</div>
                  <div className="bg-white border border-slate-200 text-slate-700 p-2 rounded-lg rounded-tr-none inline-block text-sm shadow-sm font-medium">Is mahine total ₹1,40,000 ka udhaar baki hai. Sabse zyada 'Shree Enterprises' ka (₹60k) pending hai.</div>
                </div>
              </div>
              <p className="text-xs text-slate-500 mb-6">Apne data se baatein karein. Ekdum safe aur private.</p>
              <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                 <button onClick={prevStep} className="text-slate-400 font-bold text-sm flex items-center"><ArrowLeft size={16} className="mr-1"/> Back</button>
                 <button onClick={nextStep} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg shadow flex items-center">Perfect! <ArrowRight size={16} className="ml-1"/></button>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="w-full max-w-sm text-center mt-4">
              <h1 className="text-3xl font-black text-slate-800 mb-2">Sab tayyar hai!</h1>
              <p className="text-slate-500 mb-8 font-medium">Aapka account bilkul ready hai. Dashboard pe jaayein aur kaam shuru karein.</p>
              {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
              <button onClick={completeTour} className="bg-green-500 hover:bg-green-600 active:scale-95 transition-all text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-green-500/30 text-lg w-full flex justify-center items-center gap-2" disabled={loading}>
                {loading ? 'Khul raha hai...' : 'Dashboard kholein'} 
                {!loading && <ArrowRight />}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
