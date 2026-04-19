import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { Package, AlertTriangle, XCircle, Search, Plus, Filter, Database, TrendingDown, History } from 'lucide-react';

export default function StockOverview() {
  const { data, processStockMovement } = useStore();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // all, low, out, untracked
  
  // Kitna Aaya Dialog state
  const [addStockProduct, setAddStockProduct] = useState(null);
  const [addQty, setAddQty] = useState('');
  const [addNotes, setAddNotes] = useState('');

  // Computations
  const metrics = useMemo(() => {
    let totalValue = 0;
    let lowCount = 0;
    let outCount = 0;
    let untrackedCount = 0;

    data.products.forEach(p => {
      if (!p.trackStock) {
        untrackedCount++;
        return;
      }
      
      const stock = p.currentStock || 0;
      totalValue += stock * (p.purchasePrice || 0);
      
      if (stock === 0) outCount++;
      else if (stock <= (p.reorderLevel || 0)) lowCount++;
    });

    return { totalValue, lowCount, outCount, untrackedCount };
  }, [data.products]);

  const filteredProducts = useMemo(() => {
    let result = [...data.products];
    
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(lower) || p.category.toLowerCase().includes(lower));
    }
    
    if (filter === 'low') {
      result = result.filter(p => p.trackStock && p.currentStock > 0 && p.currentStock <= p.reorderLevel);
    } else if (filter === 'out') {
      result = result.filter(p => p.trackStock && p.currentStock === 0);
    } else if (filter === 'untracked') {
      result = result.filter(p => !p.trackStock);
    }
    
    return result.sort((a, b) => {
      if (!a.trackStock && b.trackStock) return 1;
      if (a.trackStock && !b.trackStock) return -1;
      return (a.currentStock || 0) - (b.currentStock || 0);
    });
  }, [data.products, searchTerm, filter]);

  const handleStockSubmit = (e) => {
    e.preventDefault();
    if (!addStockProduct || !addQty) return;
    
    processStockMovement({
      productId: addStockProduct.id,
      productName: addStockProduct.name,
      type: "manual_in",
      direction: "in",
      quantity: Number(addQty),
      referenceId: "MANUAL",
      referenceType: "manual",
      notes: addNotes || "Manual stock addition"
    });
    
    setAddStockProduct(null);
    setAddQty('');
    setAddNotes('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Inventory Management</h1>
          <p className="text-slate-500 text-sm">Real-time ledger and physical stock tracking</p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
            <div className="flex items-center text-slate-500 mb-2 gap-2"><Database className="w-4 h-4"/> <span>Stock Value</span></div>
            <div className="text-2xl font-black text-slate-800">₹{metrics.totalValue.toLocaleString('en-IN')}</div>
         </div>
         <div onClick={() => setFilter('low')} className="bg-amber-50 cursor-pointer p-4 rounded-2xl shadow-sm border border-amber-100 flex flex-col active:scale-95 transition-transform">
            <div className="flex items-center text-amber-700 mb-2 gap-2"><AlertTriangle className="w-4 h-4"/> <span>Low Stock</span></div>
            <div className="text-2xl font-black text-amber-600">{metrics.lowCount}</div>
         </div>
         <div onClick={() => setFilter('out')} className="bg-rose-50 cursor-pointer p-4 rounded-2xl shadow-sm border border-rose-100 flex flex-col active:scale-95 transition-transform">
            <div className="flex items-center text-rose-700 mb-2 gap-2"><XCircle className="w-4 h-4"/> <span>Out of Stock</span></div>
            <div className="text-2xl font-black text-rose-600">{metrics.outCount}</div>
         </div>
         <div onClick={() => setFilter('untracked')} className="bg-slate-100 cursor-pointer p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col active:scale-95 transition-transform">
            <div className="flex items-center text-slate-500 mb-2 gap-2"><Package className="w-4 h-4"/> <span>Not Tracked</span></div>
            <div className="text-2xl font-black text-slate-600">{metrics.untrackedCount}</div>
         </div>
      </div>

      {/* Main Table Area */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 bg-slate-50/50">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3 top-2.5 text-slate-400" />
            <input 
              type="text"
              placeholder="Search inventory..."
              className="w-full pl-10 pr-4 py-2 min-h-[48px] bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
            {['all', 'low', 'out', 'untracked'].map(f => (
              <button 
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 min-h-[48px] rounded-xl whitespace-nowrap font-medium transition-colors ${
                  filter === f ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-100">
                <th className="p-4 font-medium">Product Name</th>
                <th className="p-4 font-medium">Category</th>
                <th className="p-4 font-medium text-right">In Stock</th>
                <th className="p-4 font-medium">Status / Reorder</th>
                <th className="p-4 font-medium text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map(product => {
                const isTracked = product.trackStock;
                const stock = product.currentStock || 0;
                const reorder = product.reorderLevel || 0;
                
                let StatusBadge = <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-medium">Untracked</span>;
                if (isTracked) {
                  if (stock === 0) StatusBadge = <span className="px-2 py-1 bg-rose-100 text-rose-700 rounded-md text-xs font-bold w-full inline-block text-center shadow-sm border border-rose-200">OUT OF STOCK</span>;
                  else if (stock <= reorder) StatusBadge = <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-md text-xs font-bold shadow-sm border border-amber-200">LOW (min {reorder})</span>;
                  else StatusBadge = <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md text-xs font-semibold">Healthy</span>;
                }

                return (
                  <tr key={product.id} className="hover:bg-slate-50 text-sm">
                    <td className="p-4">
                      <div className="font-bold text-slate-800">{product.name}</div>
                      <div className="text-xs text-slate-500">{product.labelSpec}</div>
                    </td>
                    <td className="p-4 text-slate-600">{product.category}</td>
                    <td className="p-4 text-right">
                      {isTracked ? (
                        <span className={`text-lg font-black ${stock === 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                          {stock} <span className="text-xs font-normal text-slate-500">{product.unit}</span>
                        </span>
                      ) : (
                         <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="p-4">{StatusBadge}</td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => setAddStockProduct(product)}
                          className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center font-bold"
                          title="Add Stock Quickly"
                        >
                          <Plus className="w-5 h-5"/>
                        </button>
                        <button 
                          onClick={() => navigate(`/stock/${product.id}`)}
                          className="p-2 bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center"
                          title="View Ledger History"
                        >
                          <History className="w-5 h-5"/>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-500">No products match your filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Kitna Aaya (Quick Add Stock) Dialog */}
      {addStockProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800">Add Physical Stock</h3>
              <button onClick={() => setAddStockProduct(null)} className="p-1 hover:bg-slate-200 rounded-full text-slate-500">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleStockSubmit} className="p-6 space-y-4">
              <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-widest mb-1">Product</p>
                <p className="text-lg font-bold text-slate-800">{addStockProduct.name}</p>
                <p className="text-xs text-slate-500 mt-1">Current Balance: <span className="font-bold text-slate-700">{addStockProduct.currentStock} {addStockProduct.unit}</span></p>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Kitna Aaya? (Quantity)</label>
                <input 
                  type="text" 
                  inputMode="numeric"
                  autoFocus
                  required
                  value={addQty}
                  onChange={e => setAddQty(e.target.value)}
                  className="w-full px-4 py-3 min-h-[48px] border-2 border-indigo-100 focus:border-indigo-600 rounded-xl outline-none text-xl font-bold"
                  placeholder={`e.g. ${addStockProduct.reorderQuantity || 10}`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Reference Notes (Optional)</label>
                <input 
                  type="text" 
                  value={addNotes}
                  onChange={e => setAddNotes(e.target.value)}
                  className="w-full px-4 py-2 min-h-[48px] border border-slate-300 rounded-xl outline-none text-sm bg-slate-50 focus:bg-white"
                  placeholder="Challan # / Worker name"
                />
              </div>

              <div className="pt-2">
                <button type="submit" className="w-full py-4 min-h-[48px] bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-lg">
                  <Database className="w-5 h-5"/> Post into Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
