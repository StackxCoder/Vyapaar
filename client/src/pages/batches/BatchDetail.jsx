import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { ArrowLeft, PackagePlus, Factory, FileText, CheckCircle2 } from 'lucide-react';
import BatchDrawer from '../../components/BatchDrawer';

export default function BatchDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, processBatchStatusUpdate } = useStore();

  const [marketResponse, setMarketResponse] = useState('');
  const [showStockDialog, setShowStockDialog] = useState(false);
  const [stockPushed, setStockPushed] = useState(false);
  
  const [drawerData, setDrawerData] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Quick toast state
  const [toastMessage, setToastMessage] = useState('');

  const batch = data.batches?.find(b => b.id === id);

  useEffect(() => {
    if (batch) {
      setActiveStatus(batch.status);
      setMarketResponse(batch.marketResponse || '');
      
      // Check if stock has already been pushed (simplistic check using global ledger)
      const mappedMovements = data.stockMovements?.filter(m => m.referenceId === batch.id) || [];
      if (mappedMovements.length > 0) {
        setStockPushed(true);
      }
    }
  }, [batch, data.stockMovements]);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  if (!batch) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-slate-800">Batch Not Found</h2>
        <button onClick={() => navigate('/batches')} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded font-bold">Back to Batches</button>
      </div>
    );
  }

  const handleUpdateStatus = () => {
    processBatchStatusUpdate(batch.id, activeStatus, marketResponse);
    if (activeStatus === 'active') {
      setToastMessage('Product catalog successfully updated to active!');
      if (!stockPushed) setShowStockDialog(true);
    } else {
      setToastMessage('Batch status saved.');
    }
  };

  const handlePushToStock = () => {
    batch.items.forEach(item => {
      // Find the main product item to pass name
      const prod = data.products.find(p => p.id === item.productId);
      if (prod && prod.trackStock) {
        data.processStockMovement({
          productId: item.productId,
          productName: item.productName,
          type: "batch_in",
          direction: "in",
          quantity: item.quantity,
          referenceId: batch.id,
          referenceType: "batch",
          notes: `Batch Mfg: ${batch.batchNumber}`
        });
      }
    });

    setStockPushed(true);
    setShowStockDialog(false);
    setToastMessage('Stock ledger updated with batch units!');
  };

  const handleRepeatBatch = () => {
    setDrawerData({
      ...batch,
      mode: 'repeat',
      date: new Date().toISOString(), // New date
      status: 'trial', // Reset status
      marketResponse: '', // Reset response
      nextAction: 'pending',
      notes: 'Repeated from: ' + batch.batchNumber
    });
    setIsDrawerOpen(true);
  };

  const handleModifyBatch = () => {
    setDrawerData({
      ...batch,
      mode: 'modify',
      date: new Date().toISOString(),
      status: 'modified'
    });
    setIsDrawerOpen(true);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'trial': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'active': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'discontinued': return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'modified': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const formatCurrency = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN')}`;

  return (
    <div className="space-y-6 pb-[100px] relative">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate('/batches')} className="p-2 hover:bg-slate-200 rounded-full transition-colors bg-slate-100">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{batch.batchNumber}</h1>
          <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider border ${getStatusColor(batch.status)}`}>
            {batch.status}
          </span>
        </div>
        <div className="flex gap-2">
          <button onClick={handleModifyBatch} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg transition-colors text-sm">
            Modify Base Batch
          </button>
          <button onClick={handleRepeatBatch} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors text-sm">
            Clone & Repeat Batch
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">Batch Details</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Manufacturer</p>
            <p className="font-semibold text-slate-800 flex items-center gap-2"><Factory className="w-4 h-4 text-indigo-400"/> {batch.manufacturerName}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Date Logged</p>
            <p className="font-semibold text-slate-800">{new Date(batch.date).toLocaleDateString('en-IN')}</p>
          </div>
          <div>
             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Cost (Basis)</p>
             <p className="font-black text-rose-600">{formatCurrency(batch.totalCost)}</p>
          </div>
          <div className="col-span-full">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Internal Notes</p>
            <p className="text-sm font-medium text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">{batch.notes || 'None provided'}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><PackagePlus className="w-5 h-5 text-indigo-500" /> Manufacturing Yield Items</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
             <thead>
               <tr className="bg-white text-slate-400 text-[10px] uppercase tracking-widest border-b border-slate-200 font-bold">
                 <th className="p-4 pl-6">Product Item</th>
                 <th className="p-4">Label Spec</th>
                 <th className="p-4">Exact Mfg Spec (Override)</th>
                 <th className="p-4 text-right">Yield Qty</th>
                 <th className="p-4 text-right bg-rose-50/50">Unit Mfg Cost</th>
                 <th className="p-4 text-right font-black bg-indigo-50/50 text-indigo-800">C. Market Price</th>
                 <th className="p-4 text-right pr-6">Batch ROI (Margin)</th>
               </tr>
             </thead>
             <tbody className="text-sm divide-y divide-slate-100">
               {batch.items.map((item, idx) => {
                 const catProd = data.products.find(p => p.id === item.productId);
                 const currentSellingPrice = catProd?.sellingPrice || 0;
                 
                 let marginPercent = 0;
                 if (currentSellingPrice > 0) {
                   marginPercent = ((currentSellingPrice - item.costPerUnit) / currentSellingPrice) * 100;
                 }

                 return (
                   <tr key={idx} className="hover:bg-slate-50 transition-colors">
                     <td className="p-4 pl-6 font-bold text-slate-800">{item.productName}</td>
                     <td className="p-4 text-slate-500 max-w-[200px] truncate">{item.labelSpec}</td>
                     <td className="p-4 font-mono text-xs text-amber-700 bg-amber-50 rounded-lg">{item.actualSpec}</td>
                     <td className="p-4 text-right font-medium text-slate-700">{item.quantity}</td>
                     <td className="p-4 text-right font-bold text-rose-600 bg-rose-50/30">{formatCurrency(item.costPerUnit)}</td>
                     <td className="p-4 text-right font-bold text-indigo-600 bg-indigo-50/30">{formatCurrency(currentSellingPrice)}</td>
                     <td className="p-4 text-right pr-6">
                        {marginPercent > 0 ? (
                          <span className="px-2 py-1 bg-emerald-100 text-emerald-800 font-bold rounded">{marginPercent.toFixed(1)}%</span>
                        ) : marginPercent < 0 ? (
                          <span className="px-2 py-1 bg-rose-100 text-rose-800 font-bold rounded">{marginPercent.toFixed(1)}%</span>
                        ) : (
                          <span className="text-slate-400">0%</span>
                        )}
                     </td>
                   </tr>
                 );
               })}
             </tbody>
          </table>
        </div>
      </div>

      <div className="bg-indigo-900 rounded-2xl shadow-sm border border-indigo-800 text-white p-6">
         <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><FileText className="w-5 h-5 text-indigo-400"/> Administrative Resolution</h2>
         
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div>
             <label className="block text-sm font-bold text-indigo-300 mb-2">Market Response / Physical Tests</label>
             <textarea 
                value={marketResponse} 
                onChange={(e) => setMarketResponse(e.target.value)}
                rows="4" 
                className="w-full px-4 py-3 bg-indigo-950/50 border border-indigo-700 rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none resize-none placeholder-indigo-700 text-indigo-100" 
                placeholder="How did the coil break load run? Any feedback?..."
             />
           </div>
           
           <div className="flex flex-col justify-between">
              <div>
                <label className="block text-sm font-bold text-indigo-300 mb-2">Update Stage (Cascade Catalog)</label>
                <select 
                  value={activeStatus} 
                  onChange={(e) => setActiveStatus(e.target.value)} 
                  className="w-full px-4 py-3 bg-indigo-950/50 border border-indigo-700 rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none text-white font-bold"
                >
                  <option value="trial">Trial (No external changes)</option>
                  <option value="active">Active (Cascades "active" to Catalog variants)</option>
                  <option value="discontinued">Discontinued Run</option>
                  <option value="modified">Modified Target</option>
                </select>
                {activeStatus === 'active' && (
                  <p className="text-xs text-amber-400 mt-2 font-semibold">⚠️ Saving as "Active" will automatically flag all {batch.items.length} items in your global product catalog as approved runs!</p>
                )}
              </div>
              
              <button 
                onClick={handleUpdateStatus}
                className="mt-6 w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-white font-black text-lg rounded-xl shadow-lg transition-all active:scale-[0.98]"
              >
                Save Resolution
              </button>
           </div>
         </div>
      </div>

      {activeStatus === 'active' && stockPushed && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2 text-emerald-800 font-bold">
            <CheckCircle2 className="w-5 h-5" /> Yield has been permanently pushed to Warehouse Stock.
          </div>
        </div>
      )}
      
      {activeStatus === 'active' && !stockPushed && (
        <button onClick={() => setShowStockDialog(true)} className="w-full py-4 bg-slate-800 hover:bg-slate-900 text-white font-black text-lg rounded-xl shadow-lg transition-all active:scale-[0.98] mt-4">
          Push Yield to Warehouse Stock
        </button>
      )}

      {showStockDialog && (
         <div className="fixed inset-0 z-50 bg-slate-900/50 flex flex-col items-center justify-end md:justify-center p-4">
           <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 md:slide-in-from-bottom-0">
             <div className="p-6 border-b border-slate-100">
               <h3 className="text-xl font-bold text-slate-800">Stock mein add karein?</h3>
               <p className="text-sm text-slate-500 mt-2">The following manufactured units will be pushed directly into your tracked physical stock ledgers.</p>
             </div>
             
             <div className="bg-slate-50 p-6 space-y-3 max-h-[40vh] overflow-y-auto">
               {batch.items.map(item => {
                 const prod = data.products.find(p => p.id === item.productId);
                 return (
                   <div key={item.productId} className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                     <div>
                       <div className="font-bold text-slate-800">{item.productName}</div>
                       <div className="text-[10px] text-slate-400 capitalize">{prod?.trackStock ? 'Tracked Model' : 'Untracked (Ignored)'}</div>
                     </div>
                     <div className={`font-black text-lg ${prod?.trackStock ? 'text-emerald-600' : 'text-slate-300'}`}>+{item.quantity}</div>
                   </div>
                 );
               })}
             </div>

             <div className="p-6 bg-white flex gap-3">
                <button onClick={() => setShowStockDialog(false)} className="flex-1 py-3 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Cancel</button>
                <button onClick={handlePushToStock} className="flex-1 py-3 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow transition-all">Confirm Push</button>
             </div>
           </div>
         </div>
      )}

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[100] animate-fade-in flex items-center space-x-3 bg-emerald-600 text-white px-6 py-4 rounded-xl shadow-2xl">
          <CheckCircle2 className="w-6 h-6" />
          <span className="font-bold text-lg">{toastMessage}</span>
        </div>
      )}

      {/* Render Drawer solely when called */}
      {isDrawerOpen && <BatchDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} initialData={drawerData} />}
    </div>
  );
}
