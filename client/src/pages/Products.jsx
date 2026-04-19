import { useState, useMemo } from 'react';
import { useProducts, useCreateProduct, useUpdateProduct } from '../api/products';
import { LoadingSpinner, ErrorMessage } from '../components/ui/ApiState';
import ProductDrawer from '../components/ProductDrawer';
import { Search, Plus } from 'lucide-react';

export default function Products() {
  const { data: products = [], isLoading, error, refetch } = useProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const categories = ['All', 'Wire', 'Cable', 'Accessories', 'Other'];
  const statuses = ['All', 'active', 'trial', 'discontinued'];

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const searchLower = search.toLowerCase();
      const matchesSearch = 
        p.name.toLowerCase().includes(searchLower) ||
        p.category.toLowerCase().includes(searchLower) ||
        p.labelSpec.toLowerCase().includes(searchLower);
      
      const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
      const matchesStatus = statusFilter === 'All' || p.batchStatus === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, search, categoryFilter, statusFilter]);

  const handleSave = (productData) => {
    if (editingProduct) {
      updateProduct.mutate(productData);
    } else {
      createProduct.mutate(productData);
    }
    setIsDrawerOpen(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-emerald-100 text-emerald-700';
      case 'trial': return 'bg-amber-100 text-amber-700';
      case 'discontinued': return 'bg-slate-100 text-slate-600';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const formatCurrency = (amount) => {
    return `₹${Number(amount).toLocaleString('en-IN')}`;
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} onRetry={refetch} />;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Products Catalog</h1>
          <p className="text-slate-500 mt-1 text-sm">Manage inventory specifications and pricing.</p>
        </div>
        <button 
          onClick={() => { setEditingProduct(null); setIsDrawerOpen(true); }}
          className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          <span>Add Product</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by name, category or spec..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none text-sm"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
          <select 
            value={categoryFilter} 
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2.5 border border-slate-200 rounded-lg outline-none text-sm bg-slate-50 hover:bg-slate-100 transition-colors font-medium text-slate-700 min-w-[120px]"
          >
            {categories.map(c => (
              <option key={c} value={c}>Category: {c}</option>
            ))}
          </select>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 border border-slate-200 rounded-lg outline-none text-sm bg-slate-50 hover:bg-slate-100 transition-colors font-medium text-slate-700 min-w-[120px]"
          >
            {statuses.map(s => (
              <option key={s} value={s}>Status: {s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredProducts.map(product => (
          <div 
            key={product.id} 
            onClick={() => { setEditingProduct(product); setIsDrawerOpen(true); }}
            className="bg-white group rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden flex flex-col"
          >
            <div className="p-5 flex-1">
              <div className="flex justify-between items-start mb-3">
                <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded flex-shrink-0">
                  {product.category}
                </span>
                <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${getStatusColor(product.batchStatus)} capitalize`}>
                  {product.batchStatus}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors">{product.name}</h3>
              <p className="text-sm text-slate-500 mt-2 line-clamp-2" title={product.labelSpec}>Spec: {product.labelSpec}</p>
            </div>
            <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Selling Price</p>
                <p className="text-lg font-extrabold text-slate-800">{formatCurrency(product.sellingPrice)} <span className="text-sm font-normal text-slate-500">/{product.unit}</span></p>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Margin</p>
                <p className="text-sm font-bold text-emerald-600">
                  {(((product.sellingPrice - product.purchasePrice) / product.sellingPrice) * 100).toFixed(0)}%
                </p>
              </div>
            </div>
          </div>
        ))}

        {filteredProducts.length === 0 && (
          <div className="col-span-full py-16 text-center text-slate-500 bg-white border border-slate-100 border-dashed rounded-2xl">
            <p className="text-lg font-medium text-slate-600">No products found</p>
            <p className="mt-1">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>

      <ProductDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        product={editingProduct} 
        onSave={handleSave} 
      />
    </div>
  );
}
