import { useState, useMemo } from 'react';
import { useSales } from '../../api/sales';
import { LoadingSpinner, ErrorMessage } from '../../components/ui/ApiState';
import { Link } from 'react-router-dom';
import { Plus, LayoutList } from 'lucide-react';

export default function SalesList() {
  const { data: sales = [], isLoading, error, refetch } = useSales();

  const [activeTab, setActiveTab] = useState('All');
  
  const filteredSales = useMemo(() => {
    const today = new Date();
    today.setHours(0,0,0,0);
    
    return sales.filter(s => {
      if (!s || !s.date) return false;
      const saleDate = new Date(s.date);
      if (activeTab === 'Today') {
        return saleDate >= today;
      }
      if (activeTab === 'This Week') {
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        return saleDate >= weekAgo;
      }
      if (activeTab === 'This Month') {
        return saleDate.getMonth() === today.getMonth() && saleDate.getFullYear() === today.getFullYear();
      }
      return true; // 'All'
    });
  }, [sales, activeTab]);

  const totalRevenue = filteredSales.reduce((acc, s) => acc + s.total, 0);
  const totalCash = filteredSales.reduce((acc, s) => acc + s.cashReceived, 0);
  const totalCredit = filteredSales.reduce((acc, s) => acc + s.creditAmount, 0);

  const formatCurrency = (amount) => `₹${Number(amount).toLocaleString('en-IN')}`;

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} onRetry={refetch} />;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Sales Book</h1>
          <p className="text-slate-500 mt-1 text-sm">Manage Pukka and Kachcha sales transactions and receipts.</p>
        </div>
        <Link 
          to="/sales/new"
          className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          <span>New Sale</span>
        </Link>
      </div>

      <div className="flex overflow-x-auto space-x-2 bg-slate-100 p-1.5 rounded-xl self-start w-max">
        {['Today', 'This Week', 'This Month', 'All'].map(tab => (
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-6 rounded-2xl shadow-sm text-white">
          <p className="text-indigo-100 font-medium text-sm">Total Revenue</p>
          <h3 className="text-3xl font-bold mt-1">{formatCurrency(totalRevenue)}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-slate-500 font-medium text-sm">Total Cash Received</p>
          <h3 className="text-3xl font-bold mt-1 text-emerald-600">{formatCurrency(totalCash)}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-slate-500 font-medium text-sm">Total Credit Given (Udhaar)</p>
          <h3 className="text-3xl font-bold mt-1 text-rose-600">{formatCurrency(totalCredit)}</h3>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-100">
                <th className="p-4 font-medium pl-6">Mode</th>
                <th className="p-4 font-medium">Date & ID</th>
                <th className="p-4 font-medium">Customer</th>
                <th className="p-4 font-medium">Payment Type</th>
                <th className="p-4 text-right font-medium pr-6">Total Amount</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100">
              {filteredSales.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => t.saleMode === 'pukka' && window.open(`/sales/print/${t.id}`, '_blank')}>
                   <td className="p-4 pl-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize inline-flex items-center gap-1 ${
                      t.saleMode === 'pukka' ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-800'
                    }`}>
                      {t.saleMode === 'pukka' ? 'Pukka ✅' : 'Kachcha'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-slate-800">{t.date ? new Date(t.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Unknown Date'}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{t.saleNumber || `#${t.id}`}</div>
                  </td>
                  <td className="p-4 font-medium text-slate-700">{t.customerName}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded capitalize ${
                      t.paymentType === 'cash' ? 'bg-slate-100 text-slate-600' :
                      t.paymentType === 'credit' ? 'bg-rose-100 text-rose-700' : 'bg-indigo-100 text-indigo-700'
                    }`}>
                      {t.paymentType}
                    </span>
                  </td>
                  <td className="p-4 text-right pr-6">
                    <div className="font-bold text-slate-800">{formatCurrency(t.total)}</div>
                    {t.paymentType !== 'cash' && (
                      <div className="text-xs text-rose-500 mt-0.5">Pend: {formatCurrency(t.creditAmount)}</div>
                    )}
                  </td>
                </tr>
              ))}
              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-12 text-center text-slate-500">
                    <LayoutList className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                    <p className="text-lg font-medium text-slate-600">No matching sales</p>
                    <p className="text-sm">Change your tab filter or clear standard search queries.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
