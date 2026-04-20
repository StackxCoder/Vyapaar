import { useState, useEffect } from 'react';
import { X, Lock } from 'lucide-react';

export default function ProductDrawer({ isOpen, onClose, product, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    category: 'Wire',
    labelSpec: '',
    actualSpec: '',
    unit: 'coil',
    purchasePrice: '',
    sellingPrice: '',
    batchStatus: 'trial',
    notes: '',
    trackStock: false,
    reorderLevel: '',
    reorderQuantity: ''
  });

  useEffect(() => {
    if (product) {
      setFormData(product);
    } else {
      setFormData({
        name: '',
        category: 'Wire',
        labelSpec: '',
        actualSpec: '',
        unit: 'coil',
        purchasePrice: '',
        sellingPrice: '',
        batchStatus: 'trial',
        notes: '',
        trackStock: false,
        reorderLevel: '',
        reorderQuantity: ''
      });
    }
  }, [product, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      purchasePrice: Number(formData.purchasePrice),
      sellingPrice: Number(formData.sellingPrice),
      reorderLevel: Number(formData.reorderLevel) || 0,
      reorderQuantity: Number(formData.reorderQuantity) || 0
    });
  };

  const purchase = Number(formData.purchasePrice) || 0;
  const selling = Number(formData.sellingPrice) || 0;
  let marginText = "Margin: 0%";
  if (selling > 0) {
    const margin = ((selling - purchase) / selling) * 100;
    marginText = `Margin: ${margin.toFixed(2)}%`;
  }

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 transition-opacity" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 overflow-y-auto flex flex-col transform transition-transform border-l border-slate-100">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">
            {product ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Product Name</label>
              <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none" placeholder="e.g. House Wire 1.5mm" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                <select name="category" value={formData.category} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none bg-white">
                  <option value="Wire">Wire</option>
                  <option value="Cable">Cable</option>
                  <option value="Accessories">Accessories</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Unit</label>
                <select name="unit" value={formData.unit} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none bg-white">
                  <option value="meter">meter</option>
                  <option value="coil">coil</option>
                  <option value="piece">piece</option>
                  <option value="kg">kg</option>
                  <option value="box">box</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Label Spec (Visible to Customer)</label>
              <input required type="text" name="labelSpec" value={formData.labelSpec} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none" placeholder="e.g. FR PVC Wire 1.5 sq mm ISI" />
            </div>

            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
              <label className="flex items-center text-sm font-bold text-amber-800 mb-2">
                <Lock className="w-4 h-4 mr-1.5" />
                Actual Spec (Internal Only)
              </label>
              <input required type="text" name="actualSpec" value={formData.actualSpec} onChange={handleChange} className="w-full px-3 py-2 border border-amber-300 bg-white rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none placeholder-amber-200" placeholder="e.g. 1.3 sq mm FR" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Purchase Price</label>
                <input required type="text" inputMode="numeric" step="0.01" name="purchasePrice" value={formData.purchasePrice} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none" min="0" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Selling Price</label>
                <input required type="text" inputMode="numeric" step="0.01" name="sellingPrice" value={formData.sellingPrice} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none" min="0" />
              </div>
            </div>

            <div className={`text-sm font-semibold p-2 rounded ${selling > purchase ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
              {marginText}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Batch Status</label>
              <select name="batchStatus" value={formData.batchStatus} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none bg-white">
                <option value="trial">Trial</option>
                <option value="active">Active</option>
                <option value="discontinued">Discontinued</option>
              </select>
            </div>

            {/* Stock Settings */}
            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl space-y-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  name="trackStock"
                  checked={formData.trackStock} 
                  onChange={e => setFormData(p => ({ ...p, trackStock: e.target.checked }))} 
                  className="w-5 h-5 text-indigo-600 rounded focus:ring-0 accent-indigo-600" 
                />
                <span className="font-bold text-indigo-900 border-b border-dashed border-indigo-300">Track Physical Stock?</span>
              </label>

              {formData.trackStock && (
                <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                  <div>
                    <label className="block text-xs font-bold text-indigo-800 mb-1">Reorder Level</label>
                    <input type="text" inputMode="numeric" name="reorderLevel" value={formData.reorderLevel} onChange={handleChange} className="w-full px-3 py-2 min-h-[48px] border border-indigo-200 bg-white rounded-lg outline-none" placeholder="Min Stock" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-indigo-800 mb-1">Reorder Qty</label>
                    <input type="text" inputMode="numeric" name="reorderQuantity" value={formData.reorderQuantity} onChange={handleChange} className="w-full px-3 py-2 min-h-[48px] border border-indigo-200 bg-white rounded-lg outline-none" placeholder="Order bulk" />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Internal Notes</label>
              <textarea name="notes" value={formData.notes} onChange={handleChange} rows="3" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none resize-none" placeholder="Add any private notes here..."></textarea>
            </div>
          </div>

          <div className="mt-auto pt-6 flex space-x-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors">
              Cancel
            </button>
            <button type="submit" className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors">
              {product ? 'Save Changes' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
