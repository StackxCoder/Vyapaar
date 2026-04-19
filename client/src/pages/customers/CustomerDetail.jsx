import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { useCustomer, useCustomerLedger } from '../../api/customers';
import { LoadingSpinner, ErrorMessage } from '../../components/ui/ApiState';
import { ArrowLeft, HandCoins, Phone, MapPin, Building2, Calendar, FileText, Send, Sparkles, ShieldAlert } from 'lucide-react';
import PaymentDrawer from '../../components/PaymentDrawer';

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: storeData } = useStore();
  const { data: customer, isLoading: custLoad, error: custErr } = useCustomer(id);
  const { data: ledgerData, isLoading: ledgLoad } = useCustomerLedger(id);

  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  // We map the properties natively now bypass useStore
  const transactions = ledgerData?.ledger || [];
  const runningBalanceLatest = ledgerData?.currentUdhaar || 0;
  
  // Dummy aging data mapping until backend fully ports aging block natively
  const aging = { buckets: { current: 0, followUp: 0, urgent: runningBalanceLatest > 0 ? runningBalanceLatest : 0 } };

  // Risk engine temporary stub post-migration
  const customerScore = { score: 50, grade: 'B', avgPaymentDays: 0, paymentRatio: 0, suggestedCreditLimit: customer?.creditLimit || 0, breakdown: { speedScore: 10, reliabilityScore: 20, recencyScore: 10, volumeScore: 10 } };
  
  const paymentSpeedsList = 'No recent matched data';

  const handleWhatsApp = () => {
    let msg = "";
    const pendingAmount = runningBalanceLatest;
    const daysOldBucket = aging.buckets.urgent > 0 ? "60+" : aging.buckets.followUp > 0 ? "30+" : "kuch";
    
    if (customerScore.grade === 'A' || customerScore.grade === 'B') {
      msg = `Namaste ${customer.contactPerson} ji, hope sab theek hai.\n${storeData.settings?.companyName || 'Vyapaar'} ki taraf se, ₹${pendingAmount} ka payment pending hai jo ${daysOldBucket} din se hai.\nConvenient time pe settle kar lena. Dhanyawad!`;
    } else if (customerScore.grade === 'C') {
      msg = `${customer.contactPerson} ji, humara ₹${pendingAmount} ka payment ${daysOldBucket} din se pending hai.\nPlease is hafte arrange karein.\n${storeData.settings?.ownerName || 'Admin'}, ${storeData.settings?.companyName || 'Company'}`;
    } else {
      msg = `${customer.contactPerson} ji, ₹${pendingAmount} URGENT hai, ${daysOldBucket} din se pending.\nAaj ya kal payment ka arrangement karein.\nAage credit band karna padega. - ${storeData.settings?.companyName || 'Company'}`;
    }
    window.open(`https://wa.me/91${customer.phone}?text=${encodeURIComponent(msg)}`);
  };

  const handleAIAdvice = () => {
    const prompt = `Customer ${customer.companyName} has payment history: Avg ${customerScore.avgPaymentDays} days. Score: ${customerScore.grade}. Total pending: ₹${runningBalanceLatest}, oldest bucket: ${aging.buckets.urgent > 0 ? '60+ days' : 'Current'}.\nSuggest 3 specific strategies to collect this payment in next 15 days. Be practical for Indian B2B context.`;
    localStorage.setItem('vyapaar_ai_prompt_inject', prompt);
    navigate('/ai');
  };

  if (custLoad || ledgLoad) return <LoadingSpinner />;
  if (custErr) return <ErrorMessage error={custErr} />;

  // If invalid ID
  if (!customer) {
    return (
      <div className="text-center py-20 flex flex-col items-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Customer Not Found</h2>
        <button onClick={() => navigate('/customers')} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700">Back to Directory</button>
      </div>
    );
  }

  const formatCurrency = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN')}`;

  const currentBalance = runningBalanceLatest;
  const usagePercentage = Math.min(100, Math.max(0, (currentBalance / customer.creditLimit) * 100)) || 0;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate('/customers')} className="p-2 hover:bg-slate-200 rounded-full transition-colors bg-slate-100">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h1 className="text-2xl font-bold text-slate-800">Customer Details</h1>
        </div>
        <button 
          onClick={() => { alert('Edit stub'); }}
          className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg transition-colors text-sm"
        >
          Edit Profile
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Col - Info */}
        <div className="lg:w-1/3 flex flex-col gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
             <div className="bg-indigo-50 w-24 h-24 rounded-full flex items-center justify-center border-4 border-indigo-100 mb-4 shadow-inner">
               <Building2 className="w-10 h-10 text-indigo-500" />
             </div>
             <h2 className="text-2xl font-bold text-slate-800 leading-tight mb-1">{customer.companyName}</h2>
             <p className="text-slate-500 font-medium mb-6">Contact: {customer.contactPerson}</p>

             <div className="w-full space-y-3">
               <div className="bg-slate-50 p-3 rounded-xl flex items-center text-sm font-medium text-slate-700 border border-slate-100">
                 <Phone className="w-4 h-4 mr-3 text-slate-400" /> {customer.phone}
               </div>
               <div className="bg-slate-50 p-3 rounded-xl flex items-center text-sm font-medium text-slate-700 border border-slate-100">
                 <MapPin className="w-4 h-4 mr-3 text-slate-400" /> {customer.city}
               </div>
               <div className="bg-slate-50 p-3 rounded-xl flex min-h-[80px] items-start text-sm font-medium text-slate-700 border border-slate-100 text-left">
                 <FileText className="w-4 h-4 mr-3 text-slate-400 mt-0.5 flex-shrink-0" /> {customer.address || 'No address provided'}
               </div>
             </div>
          </div>

          <button 
            onClick={() => setIsPaymentOpen(true)}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg rounded-2xl shadow-[0_8px_20px_rgba(16,185,129,0.3)] transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <HandCoins className="w-6 h-6" /> Receive Payment
          </button>
        </div>

        {/* Right Col - Stats & Aging */}
        <div className="lg:w-2/3 flex flex-col gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
             <div className="flex justify-between items-end mb-6 border-b border-slate-100 pb-6">
               <div>
                 <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Total Pending Udhaar</p>
                 <h3 className={`text-4xl font-black ${currentBalance > customer.creditLimit ? 'text-rose-600' : 'text-slate-800'}`}>
                   {formatCurrency(currentBalance)}
                 </h3>
               </div>
               <div className="text-right">
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Credit Limit</p>
                 <h3 className="text-xl font-bold text-slate-600">{formatCurrency(customer.creditLimit)}</h3>
               </div>
             </div>

             <div className="mb-2 flex justify-between items-center text-sm">
               <span className="font-bold text-slate-700">Limit Utilization</span>
               <span className="font-bold text-indigo-600">{usagePercentage.toFixed(1)}%</span>
             </div>
             <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner flex">
               <div 
                 className={`h-full transition-all duration-1000 ${usagePercentage > 100 ? 'bg-rose-500' : usagePercentage > 75 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                 style={{ width: `${Math.min(100, usagePercentage)}%` }} 
               />
               {usagePercentage > 100 && (
                 <div className="h-full bg-rose-600" style={{ width: `${usagePercentage - 100}%` }} />
               )}
             </div>
             <p className="text-xs font-semibold text-slate-400 mt-2 text-right">Payment Terms: {customer.paymentTerms}</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
             <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Aging Breakdown</h3>
             <div className="grid grid-cols-3 gap-4">
               <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                 <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2">0 - 30 Days <span className="opacity-60">(Safe)</span></p>
                 <h4 className="text-2xl font-black text-emerald-600">{formatCurrency(aging.buckets.current)}</h4>
               </div>
               <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                 <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2">31 - 60 Days <span className="opacity-60">(Follow up)</span></p>
                 <h4 className="text-2xl font-black text-amber-600">{formatCurrency(aging.buckets.followUp)}</h4>
               </div>
               <div className="bg-rose-50 p-4 rounded-xl border border-rose-200 shadow-sm">
                 <p className="text-xs font-bold text-rose-800 uppercase tracking-wider mb-2 animate-pulse">60+ Days <span className="opacity-80">(URGENT)</span></p>
                 <h4 className="text-3xl font-black text-rose-600 drop-shadow-sm">{formatCurrency(aging.buckets.urgent)}</h4>
               </div>
             </div>
          </div>

           {/* SCORECARD START */}
           <div className={`p-6 rounded-2xl shadow-sm border mt-6 ${
             customerScore.grade === 'D' ? 'bg-rose-50 border-rose-200' :
             customerScore.grade === 'C' ? 'bg-amber-50 border-amber-200' :
             'bg-white border-slate-100'
           }`}>
              <div className="flex justify-between items-start mb-6">
                <div className="flex gap-4 items-center">
                  <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-4xl font-black shadow-inner border ${
                    customerScore.grade === 'A' ? 'bg-emerald-100 text-emerald-600 border-emerald-200' :
                    customerScore.grade === 'B' ? 'bg-blue-100 text-blue-600 border-blue-200' :
                    customerScore.grade === 'C' ? 'bg-amber-100 text-amber-600 border-amber-300' :
                    'bg-rose-600 text-white border-rose-700 shadow-[0_0_20px_rgba(225,29,72,0.4)]'
                  }`}>
                    {customerScore.grade}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800 tracking-tight">Risk Score: {customerScore.score}/100</h3>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                       {customerScore.grade === 'D' ? 'Khatarnak (High Risk)' : 
                        customerScore.grade === 'C' ? 'Dhyan Rakho (Monitor)' : 
                        customerScore.grade === 'B' ? 'Theek hai (Reliable)' : 'Vishwasniya (Excellent)'}
                    </p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end">
                   <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Suggested Limit</div>
                   <div className="text-lg font-black text-indigo-600">₹{customerScore.suggestedCreditLimit.toLocaleString()}</div>
                   {customer.creditLimit > customerScore.suggestedCreditLimit && (
                     <div className="text-[10px] text-rose-600 uppercase font-black bg-rose-100 px-2 py-0.5 rounded mt-1">Exceeds Model</div>
                   )}
                </div>
              </div>

              <div className="space-y-3 mb-6 bg-white/50 p-4 rounded-xl border border-black/5">
                {[
                  { l: 'Payment Speed', s: customerScore.breakdown.speedScore, max: 40, c: 'bg-indigo-500' },
                  { l: 'Reliability Logic', s: customerScore.breakdown.reliabilityScore, max: 30, c: 'bg-blue-500' },
                  { l: 'Recency Action', s: customerScore.breakdown.recencyScore, max: 15, c: 'bg-emerald-500' },
                  { l: 'Volume Index', s: customerScore.breakdown.volumeScore, max: 15, c: 'bg-amber-500' },
                ].map(b => (
                   <div key={b.l} className="flex items-center gap-3 text-xs font-bold text-slate-600">
                     <span className="w-32">{b.l}</span>
                     <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className={`h-full ${b.c}`} style={{ width: `${(b.s/b.max)*100}%` }} />
                     </div>
                     <span className="w-10 text-right">{b.s}/{b.max}</span>
                   </div>
                ))}
              </div>

              <div className="text-xs font-bold text-slate-500 bg-black/5 px-3 py-2 rounded-lg mb-6 inline-flex items-center gap-2">
                 <Calendar className="w-3.5 h-3.5"/> Last 5 payments took: <span className="font-black text-slate-700">{paymentSpeedsList || 'No recent matched data'}</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                 <button 
                   onClick={handleWhatsApp}
                   className="flex-1 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold py-3 rounded-xl flex justify-center items-center gap-2 shadow-lg transition-colors"
                 >
                   <Send className="w-5 h-5"/> Send Payment Reminder
                 </button>
                 {['C', 'D'].includes(customerScore.grade) && (
                   <button 
                     onClick={handleAIAdvice}
                     className="sm:w-auto px-6 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl flex justify-center items-center gap-2 shadow-lg transition-colors"
                   >
                     <Sparkles className="w-4 h-4"/> AI Advice
                   </button>
                 )}
              </div>
           </div>
           {/* SCORECARD END */}

        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Calendar className="w-5 h-5 text-indigo-500" /> Transaction Ledger</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
             <thead>
               <tr className="bg-white text-slate-400 text-xs uppercase tracking-widest border-b border-slate-200 font-bold">
                 <th className="p-4 pl-6">Date</th>
                 <th className="p-4">Txn ID / Ref</th>
                 <th className="p-4">Notes</th>
                 <th className="p-4 text-center">Type</th>
                 <th className="p-4 text-right">Debit (Sale)</th>
                 <th className="p-4 text-right">Credit (Receipt)</th>
                 <th className="p-4 text-right pr-6 text-indigo-900 bg-indigo-50/30">Running Balance</th>
               </tr>
             </thead>
             <tbody className="text-sm divide-y divide-slate-100">
               {transactions.map((tx) => (
                 <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                   <td className="p-4 pl-6 font-medium text-slate-600">{new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                   <td className="p-4 text-slate-500 text-xs font-mono">{tx.saleNumber || tx.reference || `#${tx.id}`}</td>
                   <td className="p-4 text-slate-500 max-w-[200px] truncate" title={tx.notes}>{tx.notes || '-'}</td>
                   <td className="p-4 text-center">
                      <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider ${
                        tx.isSale ? 'bg-slate-100 text-slate-500' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {tx.isSale ? 'Credit Sale' : `Recpt: ${tx.mode}`}
                      </span>
                   </td>
                   <td className={`p-4 text-right font-bold text-slate-700`}>
                      {tx.isSale && tx.amountImpact > 0 ? formatCurrency(tx.amountImpact) : '-'}
                   </td>
                   <td className={`p-4 text-right font-bold text-emerald-600`}>
                      {!tx.isSale && tx.amountImpact > 0 ? formatCurrency(tx.amountImpact) : '-'}
                   </td>
                   <td className="p-4 text-right pr-6 font-black text-slate-800 bg-indigo-50/30 shadow-inner">
                      {formatCurrency(tx.runningBalance)}
                   </td>
                 </tr>
               ))}
               {transactions.length === 0 && (
                 <tr>
                   <td colSpan="7" className="p-12 text-center text-slate-400">No account history found.</td>
                 </tr>
               )}
             </tbody>
          </table>
        </div>
      </div>

      <PaymentDrawer 
        isOpen={isPaymentOpen} 
        onClose={() => setIsPaymentOpen(false)} 
        customerId={customer.id} 
      />
    </div>
  );
}
