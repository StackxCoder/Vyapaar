import { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Search, RefreshCw, BarChart3, AlertTriangle, ArrowRight } from 'lucide-react';

export default function CustomerScores() {
  const { data, refreshAllCustomerScores } = useStore();
  const navigate = useNavigate();
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'risky'

  useEffect(() => {
    // Auto-refresh scores if > 24 hours old
    const now = new Date().getTime();
    if (now - (data.scoreCache?.lastUpdated || 0) > 86400000) {
      refreshAllCustomerScores();
    }
  }, []);

  const cachedScores = data.scoreCache?.scores || {};
  let scoredCustomers = data.customers.map(c => ({
    ...c,
    scoreData: cachedScores[c.id] || { score: 50, grade: 'B', avgPaymentDays: 0, paymentRatio: 0, suggestedCreditLimit: 0 }
  })).sort((a, b) => a.scoreData.grade.localeCompare(b.scoreData.grade) || b.scoreData.score - a.scoreData.score);

  if (filterMode === 'risky') {
    scoredCustomers = scoredCustomers.filter(c => ['C', 'D'].includes(c.scoreData.grade));
  }

  const gradeCounts = scoredCustomers.reduce((acc, c) => {
    acc[c.scoreData.grade] = (acc[c.scoreData.grade] || 0) + 1;
    return acc;
  }, {A: 0, B: 0, C: 0, D: 0});

  const getGradeStyle = (grade) => {
    if (grade === 'A') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (grade === 'B') return 'bg-blue-100 text-blue-800 border-blue-200';
    if (grade === 'C') return 'bg-amber-100 text-amber-800 border-amber-200';
    return 'bg-rose-100 text-rose-800 border-rose-200 shadow-[0_0_15px_rgba(225,29,72,0.6)]';
  };

  const getGradeLabel = (grade) => {
    if (grade === 'A') return 'Vishwasniya';
    if (grade === 'B') return 'Theek hai';
    if (grade === 'C') return 'Dhyan Rakho';
    return 'Khatarnak';
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 text-white p-6 rounded-2xl shadow-sm border border-slate-800">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-rose-500" /> B2B Risk Intelligence
          </h1>
          <p className="text-slate-400 mt-1 text-sm font-medium">Algorithmic scoring checking payment speed, ratio, and recency.</p>
        </div>
        <div className="flex flex-col md:items-end w-full md:w-auto">
          <button 
            onClick={() => refreshAllCustomerScores()}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl font-bold shadow-lg transition-colors border border-slate-700 text-sm"
          >
            <RefreshCw className="w-4 h-4" /> Recalculate Now
          </button>
          <span className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-widest">
             Cache Last Updated: {data.scoreCache?.lastUpdated ? new Date(data.scoreCache.lastUpdated).toLocaleString() : 'Never'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { g: 'A', count: gradeCounts.A, l: 'Vishwasniya', c: 'text-emerald-500', bg: 'bg-emerald-50' },
          { g: 'B', count: gradeCounts.B, l: 'Theek hai', c: 'text-blue-500', bg: 'bg-blue-50' },
          { g: 'C', count: gradeCounts.C, l: 'Dhyan Rakho', c: 'text-amber-500', bg: 'bg-amber-50' },
          { g: 'D', count: gradeCounts.D, l: 'Khatarnak', c: 'text-rose-500', bg: 'bg-rose-50 border border-rose-200' },
        ].map(item => (
          <div key={item.g} className={`p-4 rounded-2xl shadow-sm bg-white border border-slate-100 flex flex-col items-center justify-center`}>
             <div className={`text-4xl font-black ${item.c}`}>{item.g}</div>
             <div className="text-xl font-bold text-slate-800 mt-1">{item.count} Customers</div>
             <div className={`text-xs mt-1 px-2 py-0.5 rounded font-bold uppercase tracking-widest ${item.bg} ${item.c}`}>{item.l}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50">
           <div className="flex bg-slate-200/50 rounded-lg p-1">
             <button 
               onClick={() => setFilterMode('all')}
               className={`px-4 py-1.5 rounded-md font-bold text-sm transition-all ${filterMode === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
             >
               All Profiles
             </button>
             <button 
               onClick={() => setFilterMode('risky')}
               className={`px-4 py-1.5 rounded-md font-bold text-sm transition-all flex items-center gap-1 ${filterMode === 'risky' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
             >
               <AlertTriangle className="w-4 h-4"/> Risky (C & D)
             </button>
           </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
             <thead>
               <tr className="bg-white text-slate-400 text-xs uppercase tracking-widest border-b border-slate-100">
                 <th className="p-4 pl-6 font-bold">Risk Grade</th>
                 <th className="p-4 font-bold">Customer Name</th>
                 <th className="p-4 text-center font-bold">Algorithm Score</th>
                 <th className="p-4 text-center font-bold">Avg Payment</th>
                 <th className="p-4 text-right font-bold text-indigo-600">Suggested Limit</th>
                 <th className="p-4 text-center font-bold pr-6">Detailed Audit</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-50 text-sm">
               {scoredCustomers.map(c => {
                 const isDanger = c.scoreData.grade === 'D';
                 return (
                   <tr key={c.id} className={`transition-colors ${isDanger ? 'bg-rose-50/50 hover:bg-rose-50' : 'hover:bg-slate-50'}`}>
                     <td className="p-4 pl-6 w-32">
                        <span className={`px-3 py-1.5 rounded border font-black text-center block ${getGradeStyle(c.scoreData.grade)}`}>
                           {c.scoreData.grade} Rating
                        </span>
                     </td>
                     <td className="p-4 font-bold text-slate-800">
                        {c.companyName}
                        {isDanger && <div className="text-[10px] text-rose-500 uppercase tracking-widest mt-0.5 font-bold flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> SEVERE RISK</div>}
                     </td>
                     <td className="p-4 text-center">
                        <span className="font-mono font-black text-slate-600 text-lg">{c.scoreData.score}/100</span>
                     </td>
                     <td className="p-4 text-center">
                        <span className="font-bold text-slate-600">{c.scoreData.avgPaymentDays} Days</span>
                     </td>
                     <td className="p-4 text-right">
                        <span className="font-mono font-black text-indigo-600 tracking-tight">₹{(c.scoreData.suggestedCreditLimit || 0).toLocaleString('en-IN')}</span>
                        {c.creditLimit > c.scoreData.suggestedCreditLimit && (
                           <div className="text-[10px] text-amber-600 uppercase tracking-widest font-bold mt-0.5">Limit Exceeds Logic</div>
                        )}
                     </td>
                     <td className="p-4 text-center pr-6">
                        <button 
                          onClick={() => navigate(`/customers/${c.id}`)}
                          className={`w-full py-2 rounded-lg font-bold flex justify-center items-center gap-2 transition-colors ${
                            isDanger ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          Audit <ArrowRight className="w-4 h-4"/>
                        </button>
                     </td>
                   </tr>
                 )
               })}
               {scoredCustomers.length === 0 && (
                 <tr><td colSpan="6" className="p-8 text-center text-slate-500 font-medium">No scored records match this filter.</td></tr>
               )}
             </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
