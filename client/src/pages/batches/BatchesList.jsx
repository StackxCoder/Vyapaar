import { useState, useMemo } from 'react';
import { useBatches } from '../../api/batches';
import { LoadingSpinner, ErrorMessage } from '../../components/ui/ApiState';
import { Link } from 'react-router-dom';
import { Plus, PackagePlus, Calendar, Factory } from 'lucide-react';
import BatchDrawer from '../../components/BatchDrawer';

export default function BatchesList() {
  const { data: batches = [], isLoading, error, refetch } = useBatches();

  const [activeTab, setActiveTab] = useState('All'); // All | Trial | Active | Discontinued | Modified
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const filteredBatches = useMemo(() => {
    if (activeTab === 'All') return batches;
    return batches.filter(b => b.status === activeTab.toLowerCase());
  }, [batches, activeTab]);

  const tabs = ['All', 'Trial', 'Active', 'Discontinued', 'Modified'];

  const formatCurrency = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN')}`;

  const getStatusColor = (status) => {
    switch(status) {
      case 'trial': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'active': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'discontinued': return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'modified': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} onRetry={refetch} />;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Manufacturing Batches</h1>
          <p className="text-slate-500 mt-1 text-sm">Track OEM runs, cost basis margins, and product yields.</p>
        </div>
        <button 
          onClick={() => setIsDrawerOpen(true)}
          className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm"
        >
          <PackagePlus className="w-5 h-5" />
          <span>New Batch</span>
        </button>
      </div>

      <div className="flex overflow-x-auto space-x-2 bg-slate-100 p-1.5 rounded-xl self-start w-max">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === tab 
                ? 'bg-white text-slate-800 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {filteredBatches.map(batch => (
           <Link key={batch.id} to={`/batches/${batch.id}`} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col overflow-hidden">
             
             <div className="p-5 border-b border-slate-100 flex justify-between items-start bg-slate-50">
               <div>
                 <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider border ${getStatusColor(batch.status)}`}>
                   {batch.status}
                 </span>
                 <h3 className="text-lg font-black text-slate-800 mt-3 tracking-tight">{batch.batchNumber}</h3>
               </div>
               <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm text-slate-400">
                 <PackagePlus className="w-5 h-5" />
               </div>
             </div>

             <div className="p-5 flex-1 space-y-4">
               <div className="flex items-center text-sm font-medium text-slate-700">
                 <Factory className="w-4 h-4 mr-3 text-slate-400" /> {batch.manufacturerName}
               </div>
               <div className="flex items-center text-sm font-medium text-slate-700">
                 <Calendar className="w-4 h-4 mr-3 text-slate-400" /> {new Date(batch.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
               </div>

               <div className="pt-4 border-t border-slate-100 flex justify-between items-end">
                 <div>
                   <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">Items</p>
                   <p className="text-sm font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">{batch.items.length} SKUs</p>
                 </div>
                 <div className="text-right">
                   <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">Total Cost</p>
                   <p className="text-xl font-black text-indigo-900">{formatCurrency(batch.totalCost)}</p>
                 </div>
               </div>
             </div>
           </Link>
         ))}

         {filteredBatches.length === 0 && (
           <div className="col-span-full py-16 text-center text-slate-500 bg-white border border-slate-100 border-dashed rounded-2xl">
              <PackagePlus className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="text-lg font-medium text-slate-600">No batches found</p>
              <p className="text-sm">Change your tab filter or create a new manufacturing run.</p>
           </div>
         )}
      </div>

      <BatchDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </div>
  );
}
