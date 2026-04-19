import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { ArrowLeft, ArrowDownRight, ArrowUpRight, Clock, Box } from 'lucide-react';

export default function StockHistory() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data } = useStore();

  const product = useMemo(() => data.products.find(p => p.id === id), [data.products, id]);
  
  const movements = useMemo(() => {
    return (data.stockMovements || [])
      .filter(m => m.productId === id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [data.stockMovements, id]);

  if (!product) return <div className="p-8 text-center">Product not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/stock')} className="p-2 hover:bg-slate-200 rounded-full transition-colors min-h-[48px] min-w-[48px] flex items-center justify-center">
          <ArrowLeft className="w-6 h-6 text-slate-700" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            Ledger: {product.name}
          </h1>
          <p className="text-slate-500 text-sm">Strict append-only stock audit history</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-indigo-600 text-white p-6 rounded-2xl shadow-md min-h-[120px] flex flex-col justify-center">
           <div className="text-indigo-200 text-sm font-semibold uppercase tracking-widest flex items-center gap-2 mb-1"><Box className="w-4 h-4"/> Current Balance</div>
           <div className="text-4xl font-black">{product.currentStock || 0} <span className="text-lg font-medium opacity-80">{product.unit}</span></div>
        </div>
        
        <div className="md:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
             <Clock className="w-5 h-5 text-slate-500"/> <span className="font-bold text-slate-700">Movement History</span>
          </div>
          
          <div className="flex-1 overflow-auto max-h-[60vh] hide-scrollbar">
            {movements.length > 0 ? (
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead className="sticky top-0 bg-white/95 backdrop-blur-sm shadow-sm ring-1 ring-slate-100">
                  <tr className="text-slate-500 text-xs uppercase tracking-wider">
                    <th className="p-4 font-bold text-slate-400">Date/Time</th>
                    <th className="p-4 font-bold text-slate-400">Type</th>
                    <th className="p-4 font-bold text-slate-400">Ref</th>
                    <th className="p-4 font-bold text-slate-400 text-center">Movement</th>
                    <th className="p-4 font-bold text-slate-400 text-right">Balance After</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {movements.map(m => {
                    const isOut = m.direction === 'out';
                    const Icon = isOut ? ArrowDownRight : ArrowUpRight;
                    const color = isOut ? 'text-rose-600' : 'text-emerald-600';
                    const bg = isOut ? 'bg-rose-50' : 'bg-emerald-50';
                    
                    return (
                      <tr key={m.id} className="hover:bg-slate-50 transition-colors text-sm">
                        <td className="p-4">
                          <div className="font-semibold text-slate-700">{new Date(m.date).toLocaleDateString()}</div>
                          <div className="text-[11px] text-slate-400">{new Date(m.date).toLocaleTimeString()}</div>
                        </td>
                        <td className="p-4">
                          <div className="font-medium capitalize text-slate-700">{m.type.replace('_', ' ')}</div>
                          <div className="text-xs text-slate-500 max-w-[200px] truncate" title={m.notes}>{m.notes}</div>
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[11px] font-mono font-bold tracking-widest">{m.referenceId || '-'}</span>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-black text-sm border border-transparent shadow-sm ${bg} ${color}`}>
                             <Icon className="w-4 h-4"/>
                             {isOut ? '-' : '+'}{m.quantity}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <span className="text-base font-black text-slate-800">{m.stockAfter}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-slate-400">
                <Box className="w-12 h-12 mb-3 opacity-20" />
                <p>No recorded ledger movements</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
