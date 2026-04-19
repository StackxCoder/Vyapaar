import { useState, useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { useSales, useCreateSale } from '../../api/sales';
import { useCustomers } from '../../api/customers';
import { useProducts } from '../../api/products';
import { useNavigate } from 'react-router-dom';
import { Trash2, Plus, ArrowLeft, Printer, AlertTriangle, ShieldAlert } from 'lucide-react';

export default function NewSale() {
  const { data: storeData } = useStore();
  const navigate = useNavigate();

  const { data: sales = [] } = useSales();
  const { data: customers = [] } = useCustomers();
  const { data: products = [] } = useProducts();
  
  const createSale = useCreateSale();

  const getCustomerBalance = (id) => Number(customers.find(c => c.id === id)?.udhaar) || 0;
  const getEffectiveRate = (pid, cid) => ({ rate: products.find(p=>p.id===pid)?.sellingPrice, source: 'base' });
  const getLastSoldPrice = () => null;
  const calculateCustomerScore = () => ({ grade: 'B' });

  const data = { customers, products, sales };

  const [showCreditWarning, setShowCreditWarning] = useState(false);
  const [creditWarningDetails, setCreditWarningDetails] = useState(null);

  const [saleMode, setSaleMode] = useState('pukka'); // pukka | kachcha
  const [customerId, setCustomerId] = useState('');
  const [items, setItems] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [paymentType, setPaymentType] = useState('cash'); // cash | credit | partial
  const [cashReceived, setCashReceived] = useState(0);
  const [notes, setNotes] = useState('');
  const [printAfterSave, setPrintAfterSave] = useState(true);

  // New Item State
  const [selectedProductId, setSelectedProductId] = useState('');
  const [qty, setQty] = useState('');
  const [rateOverride, setRateOverride] = useState('');
  
  // Rate Hint State
  const [activeRateHint, setActiveRateHint] = useState(null);

  const handleAddItem = () => {
    if (!selectedProductId) return;
    const prod = data.products.find(p => p.id === selectedProductId);
    if (!prod) return;

    const rate = rateOverride !== '' ? Number(rateOverride) : prod.sellingPrice;
    
    setItems(prev => [
      ...prev,
      {
        id: Math.random().toString(36).substr(2, 9),
        productId: prod.id,
        productName: prod.name,
        labelSpec: prod.labelSpec,
        unit: prod.unit,
        quantity: Number(qty),
        rate: rate,
        amount: Number(qty) * rate,
        source: activeRateHint?.effective?.source
      }
    ]);

    // Reset item form
    setSelectedProductId('');
    setQty(1);
    setRateOverride('');
    setActiveRateHint(null);
  };

  const removeItem = (id) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  // Calculations
  const subtotal = items.reduce((acc, item) => acc + item.amount, 0);
  const total = Math.max(0, subtotal - Number(discount));
  
  let computedCredit = 0;
  let computedCash = 0;

  if (paymentType === 'cash') {
    computedCash = total;
    computedCredit = 0;
  } else if (paymentType === 'credit') {
    computedCash = 0;
    computedCredit = total;
  } else if (paymentType === 'partial') {
    computedCash = Number(cashReceived);
    computedCredit = Math.max(0, total - computedCash);
  }

  // Effect: Force walk-in rule
  if (customerId === 'walk-in' && paymentType !== 'cash') {
    setPaymentType('cash');
  }

  const handleSave = () => {
    if (items.length === 0) return alert('Add at least one item');
    if (!customerId) return alert('Select customer');

    const cName = customerId === 'walk-in' ? 'Walk-in Customer' : data.customers.find(c => c.id === customerId)?.name || data.customers.find(c => c.id === customerId)?.companyName;

    const salePayload = {
      customerId,
      customerName: cName,
      saleMode,
      items,
      subtotal,
      discount: Number(discount),
      total,
      paymentType,
      cashReceived: computedCash,
      creditAmount: computedCredit,
      notes,
    };

    if (computedCredit > 0 && customerId !== 'walk-in') {
      const cust = data.customers.find(c => c.id === customerId);
      const currentBalance = getCustomerBalance(customerId);
      const limit = cust?.creditLimit || 0;
      
      if (currentBalance + computedCredit > limit) {
        const scoreData = calculateCustomerScore(customerId);
        setCreditWarningDetails({
          currentUdhaar: currentBalance,
          limit,
          newCredit: computedCredit,
          grade: scoreData.grade,
          salePayload
        });
        setShowCreditWarning(true);
        return;
      }
    }

    commitSale(salePayload);
  };

  const commitSale = async (payload) => {
    try {
      const savedSale = await createSale.mutateAsync(payload);
      if (saleMode === 'pukka' && printAfterSave && savedSale.id) {
        window.open(`/sales/print/${savedSale.id}`, '_blank');
      }
      navigate('/sales');
    } catch (e) {
      alert("Failed to create sale");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Credit Warning Modal */}
      {showCreditWarning && creditWarningDetails && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-rose-100">
            <div className="p-6 bg-rose-50 border-b border-rose-100 flex items-start gap-4">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-rose-600 shadow-sm flex-shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-rose-800">⚠️ Credit limit paar ho raha hai!</h3>
                <p className="text-sm font-bold text-rose-600 mt-1 uppercase tracking-widest">Customer Risk Protocol</p>
              </div>
            </div>
            <div className="p-6 space-y-4 text-slate-700">
               <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                 <div className="flex justify-between font-medium"><span>Customer Limit:</span> <span className="font-bold">₹{creditWarningDetails.limit.toLocaleString()}</span></div>
                 <div className="flex justify-between font-medium"><span>Current Udhaar:</span> <span className="font-bold text-rose-600">₹{creditWarningDetails.currentUdhaar.toLocaleString()}</span></div>
                 <div className="flex justify-between font-medium"><span>New Sale Credit:</span> <span className="font-bold text-amber-600">₹{creditWarningDetails.newCredit.toLocaleString()}</span></div>
                 <div className="pt-2 mt-2 border-t border-slate-200 flex justify-between font-black text-lg">
                   <span>Projected Udhaar:</span> 
                   <span className="text-rose-600">₹{(creditWarningDetails.currentUdhaar + creditWarningDetails.newCredit).toLocaleString()}</span>
                 </div>
               </div>
               
               {creditWarningDetails.grade === 'D' && (
                 <div className="p-4 bg-rose-600 text-white rounded-xl font-bold flex gap-3 shadow-inner">
                   <ShieldAlert className="w-6 h-6 flex-shrink-0" />
                   <div>
                     <div className="text-sm uppercase tracking-widest text-rose-200">System Block Recommendation</div>
                     <div>D-GRADE CUSTOMER (Khatarnak) — Pehle purana udhaar collect karo. No new credit.</div>
                   </div>
                 </div>
               )}
               {creditWarningDetails.grade === 'C' && (
                 <div className="p-4 bg-amber-500 text-amber-950 rounded-xl font-bold shadow-inner">
                   C-GRADE CUSTOMER (Dhyan Rakho). Be careful extending further limit.
                 </div>
               )}
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button 
                onClick={() => setShowCreditWarning(false)}
                className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-100"
              >
                Roko, naya nahi (Cancel)
              </button>
              <button 
                onClick={() => {
                  commitSale({...creditWarningDetails.salePayload, notes: `${creditWarningDetails.salePayload.notes}\n[OVERRIDE: Limit breached. D-Grade warning bypassed.]`});
                }}
                className={`px-6 py-2.5 font-bold rounded-xl shadow-lg transition-colors ${creditWarningDetails.grade === 'D' ? 'bg-slate-900 hover:bg-slate-800 text-white' : 'bg-rose-600 hover:bg-rose-700 text-white'}`}
              >
                Phir bhi aage badho (Override)
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center space-x-4 mb-4">
        <button onClick={() => navigate('/sales')} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <h1 className="text-2xl font-bold text-slate-800">Create New Sale</h1>
      </div>

      {/* Step 1: Mode & Customer */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Step 1: Configuration</h2>
          </div>
          <div className="flex bg-slate-100 rounded-lg p-1">
            <button 
              onClick={() => setSaleMode('pukka')}
              className={`px-6 py-2 rounded-md font-bold text-sm transition-all ${
                saleMode === 'pukka' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Pukka (With Bill) {saleMode === 'pukka' && '✓'}
            </button>
            <button 
              onClick={() => setSaleMode('kachcha')}
              className={`px-6 py-2 rounded-md font-bold text-sm transition-all ${
                saleMode === 'kachcha' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Kachcha (Internal) {saleMode === 'kachcha' && '✓'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">Customer Selection</label>
            <select 
              value={customerId} 
              onChange={e => setCustomerId(e.target.value)}
              className="w-full px-3 py-2 min-h-[48px] border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none"
            >
              <option value="" disabled>Select Customer...</option>
              <option value="walk-in">Walk-in Customer</option>
              {(() => {
                // Determine recent 5 customers based on recent sales
                const recentCustIds = [...new Set(data.sales.map(s => s.customerId))].filter(id => id !== 'walk-in').slice(0, 5);
                const recentCusts = data.customers.filter(c => recentCustIds.includes(c.id));
                const otherCusts = data.customers.filter(c => !recentCustIds.includes(c.id));
                return (
                  <>
                    {recentCusts.length > 0 && (
                      <optgroup label="Recent Customers">
                        {recentCusts.map(c => (
                          <option key={`rec-${c.id}`} value={c.id}>⭐ {c.name || c.companyName} (Bal: ₹{getCustomerBalance(c.id).toLocaleString('en-IN')})</option>
                        ))}
                      </optgroup>
                    )}
                    {otherCusts.length > 0 && (
                      <optgroup label="All Customers">
                        {otherCusts.map(c => (
                          <option key={c.id} value={c.id}>{c.name || c.companyName} (Bal: ₹{getCustomerBalance(c.id).toLocaleString('en-IN')})</option>
                        ))}
                      </optgroup>
                    )}
                  </>
                );
              })()}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
            <input type="date" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none bg-slate-50 text-slate-600" value={new Date().toISOString().split('T')[0]} readOnly />
          </div>
        </div>
      </div>

      {/* Step 2: Items */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
         <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">Step 2: Line Items</h2>
         
         <div className="flex flex-col md:flex-row items-stretch md:items-end gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
           <div className="flex-1">
             <label className="block text-sm font-medium text-slate-700 mb-1">Product</label>
             <select 
               value={selectedProductId}
               onChange={e => {
                 const pid = e.target.value;
                 setSelectedProductId(pid);
                 const p = data.products.find(x => x.id === pid);
                 if(p) {
                   const eff = getEffectiveRate(pid, customerId);
                   setRateOverride(eff.rate);
                   setActiveRateHint({
                     base: p.sellingPrice,
                     effective: eff,
                     last: getLastSoldPrice(pid, customerId)
                   });
                 } else {
                   setRateOverride('');
                   setActiveRateHint(null);
                 }
               }}
               className="w-full px-3 py-2 min-h-[48px] border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none"
             >
               <option value="">Search Product...</option>
               {data.products.map(p => (
                 <option key={p.id} value={p.id}>{p.name} - {p.labelSpec}</option>
               ))}
             </select>
           </div>
           <div className="flex gap-3">
             <div className="w-full md:w-24">
               <label className="block text-sm font-medium text-slate-700 mb-1">Rate (₹)</label>
               <input type="text" inputMode="numeric" value={rateOverride} onChange={e => setRateOverride(e.target.value)} className="w-full min-h-[48px] px-3 py-2 border border-slate-300 rounded-lg" />
             </div>
             <div className="w-full md:w-24">
               <label className="block text-sm font-medium text-slate-700 mb-1">Qty</label>
               <input type="text" inputMode="numeric" value={qty} onChange={e => setQty(e.target.value)} className="w-full min-h-[48px] px-3 py-2 border border-slate-300 rounded-lg" />
             </div>
           </div>
           <button onClick={handleAddItem} className="px-4 py-2 min-h-[48px] bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold flex items-center justify-center space-x-1 w-full md:w-auto mt-2 md:mt-0">
             <Plus className="w-4 h-4"/> <span>Add</span>
           </button>
         </div>
          
          {activeRateHint && (
            <div className="text-xs font-bold px-2 py-1 bg-indigo-50 text-indigo-800 rounded inline-block mt-2 border border-indigo-100">
               Standard: <span className="text-slate-500 line-through mr-2">₹{activeRateHint.base}</span>|
               <span className={`mx-2 ${
                 activeRateHint.effective.source === 'tier_discount' ? 'text-emerald-600' : 
                 activeRateHint.effective.source === 'custom' ? 'text-blue-600' : 'text-indigo-800'
               }`}>
                 {activeRateHint.effective.source === 'tier_discount' ? `This customer's rate (Tier): ₹${activeRateHint.effective.rate}` : 
                  activeRateHint.effective.source === 'custom' ? `This customer's rate (Custom Override): ₹${activeRateHint.effective.rate}` : 
                  `Standard Rate: ₹${activeRateHint.base}`}
               </span>
               |
               <span className="ml-2 text-slate-500">
                 Last sold to them at: {activeRateHint.last ? `₹${activeRateHint.last}` : "Never"}
               </span>
            </div>
          )}

         {items.length > 0 && (
           <table className="w-full text-left mt-4 border-collapse">
             <thead>
               <tr className="text-slate-500 text-sm border-b border-slate-200">
                 <th className="pb-2">Item</th>
                 <th className="pb-2">Spec</th>
                 <th className="pb-2 text-right">Rate</th>
                 <th className="pb-2 text-right">Qty</th>
                 <th className="pb-2 text-right">Amount</th>
                 <th className="pb-2"></th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
               {items.map(item => (
                 <tr key={item.id} className="text-sm">
                   <td className="py-3 font-semibold text-slate-800">{item.productName}</td>
                   <td className="py-3 text-slate-500">{item.labelSpec}</td>
                    <td className="py-3 text-right">
                       <div>₹{item.rate}</div>
                       {item.source === 'tier_discount' && <div className="text-[10px] uppercase text-emerald-600 font-bold tracking-widest mt-0.5">Tier Discount</div>}
                       {item.source === 'custom' && <div className="text-[10px] uppercase text-blue-600 font-bold tracking-widest mt-0.5">Custom Override</div>}
                    </td>
                   <td className="py-3 text-right">{item.quantity} {item.unit}</td>
                   <td className="py-3 text-right font-bold">₹{item.amount}</td>
                   <td className="py-3 text-right">
                     <button onClick={() => removeItem(item.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4 inline"/></button>
                   </td>
                 </tr>
               ))}
               <tr className="border-t border-slate-200 text-base font-bold text-slate-800">
                 <td colSpan="4" className="pt-4 text-right">Subtotal:</td>
                 <td className="pt-4 text-right leading-none">₹{subtotal.toLocaleString('en-IN')}</td>
                 <td></td>
               </tr>
             </tbody>
           </table>
         )}
      </div>

      {/* Step 3 & 4: Payment and Execution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
          <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">Step 3: Payment</h2>
          
          <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
             <span className="font-semibold text-slate-700">Subtotal</span>
             <span className="font-bold">₹{subtotal.toLocaleString('en-IN')}</span>
          </div>

          <div className="flex justify-between items-center px-4">
             <span className="text-slate-500">Discount (₹)</span>
             <input type="text" inputMode="numeric" value={discount} onChange={e => setDiscount(e.target.value)} className="w-24 px-2 min-h-[48px] py-1 border border-slate-300 rounded text-right" min="0" />
          </div>

          <div className="flex justify-between items-center px-4 py-4 bg-indigo-50 text-indigo-900 rounded-xl">
             <span className="text-lg font-bold tracking-wider">TOTAL</span>
             <span className="text-2xl font-black">₹{total.toLocaleString('en-IN')}</span>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <label className="block text-sm font-medium text-slate-700 mb-2">Payment Type</label>
            <select 
              value={paymentType} 
              onChange={e => setPaymentType(e.target.value)}
              className="w-full px-3 min-h-[48px] py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none"
              disabled={customerId === 'walk-in'}
            >
              <option value="cash">Fully Paid (Cash)</option>
              {customerId !== 'walk-in' && <option value="credit">Full Credit (Udhaar)</option>}
              {customerId !== 'walk-in' && <option value="partial">Partial Payment</option>}
            </select>
            {customerId === 'walk-in' && <p className="text-xs text-orange-500 mt-1">Walk-ins only support Cash.</p>}
          </div>

          {paymentType === 'partial' && (
            <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4 bg-rose-50 p-4 rounded-xl border border-rose-100 mt-2">
              <div className="flex-1">
                <label className="block text-xs font-bold text-rose-800 mb-1">CASH RECEIVED</label>
                <input type="text" inputMode="numeric" value={cashReceived} onChange={e => setCashReceived(e.target.value)} className="w-full min-h-[48px] px-2 py-1 border border-rose-200 rounded text-xl font-bold" />
              </div>
              <div className="flex-1 text-right">
                <label className="block text-xs font-bold text-rose-800 mb-1">CREDIT MOUNT</label>
                <span className="font-bold text-rose-600 text-lg">₹{computedCredit.toLocaleString('en-IN')}</span>
              </div>
            </div>
          )}

          <div>
             <label className="block text-sm font-medium text-slate-700 mb-1 mt-4">Transaction Notes</label>
             <input type="text" value={notes} onChange={e=>setNotes(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" placeholder="Optional notes..."/>
          </div>
        </div>

        <div className="bg-slate-900 p-6 rounded-2xl shadow-sm text-white flex flex-col justify-center">
           <h2 className="text-2xl font-bold mb-2">Complete Sale</h2>
           <p className="text-slate-400 text-sm mb-8">Review the configuration before saving. Once generated, Udhaar flows automatically to the customer profile.</p>
           
           {saleMode === 'pukka' && (
             <label className="flex items-center space-x-3 bg-slate-800 p-4 rounded-xl mb-6 cursor-pointer hover:bg-slate-700 transition-colors">
               <input type="checkbox" checked={printAfterSave} onChange={e => setPrintAfterSave(e.target.checked)} className="w-5 h-5 text-indigo-500 rounded focus:ring-0 accent-indigo-500" />
               <span className="font-semibold flex items-center gap-2"><Printer className="w-4 h-4"/> Print Invoice Automatically</span>
             </label>
           )}

           <button 
             onClick={handleSave}
             className="w-full py-4 bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-lg rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all active:scale-[0.98]"
           >
             Save Transaction
           </button>
        </div>
      </div>
    </div>
  );
}
