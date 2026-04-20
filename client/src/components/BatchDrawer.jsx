import { useState, useEffect } from 'react';
import { X, PackagePlus, Plus, Trash2 } from 'lucide-react';
import { useBatches, useCreateBatch } from '../api/batches';
import { useProducts } from '../api/products';

export default function BatchDrawer({ isOpen, onClose, initialData = null }) {
  const { data: batches = [] } = useBatches();
  const { data: products = [] } = useProducts();
  const createBatch = useCreateBatch();
  const [manufacturerName, setManufacturerName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState([]);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('trial');

  // Item Form temporary state
  const [selectedProduct, setSelectedProduct] = useState('');
  const [actualSpecOverride, setActualSpecOverride] = useState('');
  const [qty, setQty] = useState('');
  const [costPerUnit, setCostPerUnit] = useState('');

  useEffect(() => {
    if (initialData) {
      setManufacturerName(initialData.manufacturerName || '');
      setDate(initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
      setItems(initialData.items || []);
      setNotes(initialData.notes || '');
      setStatus(initialData.status || 'trial');
    } else {
      setManufacturerName('');
      setDate(new Date().toISOString().split('T')[0]);
      setItems([]);
      setNotes('');
      setStatus('trial');
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleAddItem = () => {
    if (!selectedProduct || !qty || !costPerUnit) return alert("Fill all item details");
    const prod = products.find(p => p.id === selectedProduct);
    if (!prod) return;

    setItems(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      productId: prod.id,
      productName: prod.name,
      labelSpec: prod.labelSpec,
      actualSpec: actualSpecOverride || prod.actualSpec,
      quantity: Number(qty),
      costPerUnit: Number(costPerUnit),
      totalCost: Number(qty) * Number(costPerUnit)
    }]);

    // reset
    setSelectedProduct('');
    setActualSpecOverride('');
    setQty('');
    setCostPerUnit('');
  };

  const removeItem = (id) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const handleProductSelect = (e) => {
    const pId = e.target.value;
    setSelectedProduct(pId);
    const prod = products.find(p => p.id === pId);
    if (prod) {
      setActualSpecOverride(prod.actualSpec);
    } else {
      setActualSpecOverride('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!manufacturerName) return alert("Manufacturer name required");
    if (items.length === 0) return alert("Add at least one item");

    const totalBatchCost = items.reduce((acc, i) => acc + i.totalCost, 0);

    const newBatch = {
      id: Math.random().toString(36).substr(2, 9),
      batchNumber: `BATCH-${(data.batches.length + 1).toString().padStart(3, '0')}`,
      date: new Date(date).toISOString(),
      manufacturerName,
      items,
      totalCost: totalBatchCost,
      status, 
      marketResponse: initialData?.marketResponse || '',
      nextAction: 'pending',
      notes,
      createdAt: new Date().toISOString()
    };

    createBatch.mutate(newBatch);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] transition-opacity" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full max-w-xl bg-white shadow-2xl z-[60] flex flex-col transform border-l border-slate-100">
        
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="bg-amber-100 text-amber-600 p-2 rounded-lg">
              <PackagePlus className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">
              {initialData?.mode === 'modify' ? 'Modify Batch' : initialData?.mode === 'repeat' ? 'Repeat Batch' : 'New Manufacturing Batch'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Manufacturer / Factory Name</label>
              <input required type="text" value={manufacturerName} onChange={(e) => setManufacturerName(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none" placeholder="e.g. V-Guard OEM" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Date</label>
              <input required type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none" />
            </div>
          </div>

          {/* Add Item Block */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-800 mb-3 border-b border-slate-200 pb-2">Add Production Line Item</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Base Product</label>
                <select value={selectedProduct} onChange={handleProductSelect} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white outline-none">
                  <option value="">Select Catalog Product...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.labelSpec})</option>
                  ))}
                </select>
              </div>

              {selectedProduct && (
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg relative">
                  <label className="block text-xs font-bold text-amber-800 mb-1">Batch Explicit Actual Spec (Editable)</label>
                  <input type="text" value={actualSpecOverride} onChange={e => setActualSpecOverride(e.target.value)} className="w-full px-3 py-2 border border-amber-300 rounded bg-white text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500" />
                  <p className="text-[10px] text-amber-600 mt-1">This will be tracked strictly for this batch without altering global catalog defaults.</p>
                </div>
              )}

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-600 mb-1">Quantity</label>
                  <input type="text" inputMode="numeric" value={qty} onChange={e => setQty(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" placeholder="Qty" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-600 mb-1">Cost Per Unit (₹)</label>
                  <input type="text" inputMode="numeric" value={costPerUnit} onChange={e => setCostPerUnit(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" placeholder="Cost/Unit" />
                </div>
                <div className="flex items-end">
                  <button onClick={handleAddItem} className="h-[42px] px-4 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 flex items-center shadow-sm">
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {items.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-slate-800 mb-2">Production Items</h3>
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                {items.map(item => (
                  <div key={item.id} className="p-3 flex justify-between items-center bg-white hover:bg-slate-50 transition-colors">
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{item.productName}</p>
                      <p className="text-xs text-amber-600 font-semibold mt-0.5">Mkr Spec: {item.actualSpec}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{item.quantity} units @ ₹{item.costPerUnit}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-black text-slate-700">₹{item.totalCost.toLocaleString('en-IN')}</span>
                      <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600 p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
             <label className="block text-sm font-bold text-slate-700 mb-1">Initial Status</label>
             <select disabled={!!initialData && initialData.mode === 'repeat'} value={status} onChange={e => setStatus(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white outline-none">
                <option value="trial">Trial (Awaiting Decision)</option>
                <option value="active">Active (Production standard)</option>
                <option value="discontinued">Discontinued (Failed run)</option>
                <option value="modified">Modified (Alternative run)</option>
             </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Batch Context Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows="3" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none resize-none" placeholder="Provide context why this batch is being run..."></textarea>
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex space-x-3">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-colors shadow-sm">
            Cancel
          </button>
          <button onClick={handleSubmit} className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg rounded-xl transition-colors shadow-md shadow-indigo-600/20">
            Generate Batch
          </button>
        </div>

      </div>
    </>
  );
}
