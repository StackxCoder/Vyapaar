import { useState, useMemo } from 'react';
import { useCustomers } from '../../api/customers';
import { useUdhaarAging } from '../../api/reports';
import { LoadingSpinner, ErrorMessage } from '../../components/ui/ApiState';
import { Link } from 'react-router-dom';
import { Search, Plus, MapPin, Phone, Building2, HandCoins, UserPlus, AlertOctagon } from 'lucide-react';
import PaymentDrawer from '../../components/PaymentDrawer';

export default function CustomersList() {
  const { data: customers = [], isLoading: custLoad, error: custErr, refetch: custRefetch } = useCustomers();
  const { data: agingData = [], isLoading: ageLoad } = useUdhaarAging();

  const [search, setSearch] = useState('');
  const [sortSelect, setSortSelect] = useState('highest_udhaar'); // 'highest_udhaar' | 'name' | 'city'
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);

  const enhancedCustomers = useMemo(() => {
    return customers.map(c => {
      const bal = Number(c.udhaar) || 0;
      const ageBucket = agingData.find(a => a.customer === c.companyName);
      const aging = { buckets: { urgent: ageBucket ? ageBucket.bucket60 : 0 } };
      return { ...c, balance: bal, aging };
    });
  }, [customers, agingData]);

  // Global Summaries
  const totalUdhaar = enhancedCustomers.reduce((acc, c) => acc + c.balance, 0);
  const overdueCustomers = enhancedCustomers.filter(c => c.aging.buckets.urgent > 0);
  const totalOverdue60 = overdueCustomers.reduce((acc, c) => acc + c.aging.buckets.urgent, 0);

  const sortedAndFiltered = useMemo(() => {
    let res = enhancedCustomers.filter(c => {
      const str = search.toLowerCase();
      return c.companyName.toLowerCase().includes(str) || 
             c.contactPerson.toLowerCase().includes(str) || 
             c.city.toLowerCase().includes(str);
    });

    if (sortSelect === 'highest_udhaar') res.sort((a, b) => b.balance - a.balance);
    if (sortSelect === 'name') res.sort((a, b) => a.companyName.localeCompare(b.companyName));
    if (sortSelect === 'city') res.sort((a, b) => a.city.localeCompare(b.city));

    return res;
  }, [enhancedCustomers, search, sortSelect]);

  const formatCurrency = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN')}`;

  const openPayment = (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedCustomerId(id);
    setIsPaymentOpen(true);
  };

  if (custLoad || ageLoad) return <LoadingSpinner />;
  if (custErr) return <ErrorMessage error={custErr} onRetry={custRefetch} />;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Customer Directory</h1>
          <p className="text-slate-500 mt-1 text-sm">Manage client relationships and Udhaar collection.</p>
        </div>
        <button 
          onClick={() => { /* Not fully spec'd out sliding drawer for Add Customer, using a simple alert for now as per minimal stubs */ alert('Add Customer Form Pending'); }}
          className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm"
        >
          <UserPlus className="w-5 h-5" />
          <span>Add Customer</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 border-l-4 border-l-slate-800">
          <p className="text-slate-500 font-bold text-sm uppercase tracking-wider mb-1">Total Market Udhaar</p>
          <h3 className="text-3xl font-black text-slate-800">{formatCurrency(totalUdhaar)}</h3>
        </div>
        <div className="bg-rose-50 p-6 rounded-2xl shadow-sm border border-rose-100 border-l-4 border-l-rose-500 relative overflow-hidden">
          <AlertOctagon className="w-20 h-20 text-rose-100 absolute -right-2 -bottom-2 opacity-50" />
          <p className="text-rose-700 font-bold text-sm uppercase tracking-wider mb-1">60+ Days Overdue (Amount)</p>
          <h3 className="text-3xl font-black text-rose-600 relative z-10">{formatCurrency(totalOverdue60)}</h3>
        </div>
        <div className="bg-amber-50 p-6 rounded-2xl shadow-sm border border-amber-100 border-l-4 border-l-amber-500">
          <p className="text-amber-700 font-bold text-sm uppercase tracking-wider mb-1">Defaulter Count</p>
          <div className="flex items-baseline space-x-2">
             <h3 className="text-3xl font-black text-amber-600">{overdueCustomers.length}</h3>
             <span className="text-amber-800 font-semibold text-sm">Customers</span>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by company, person or city..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none font-medium"
          />
        </div>
        <div className="flex gap-2 min-w-[200px]">
          <select 
            value={sortSelect} 
            onChange={(e) => setSortSelect(e.target.value)}
            className="w-full px-4 py-3 border border-slate-200 rounded-lg outline-none font-bold bg-slate-50 hover:bg-slate-100 transition-colors text-slate-700"
          >
            <option value="highest_udhaar">Sort: Highest Udhaar</option>
            <option value="name">Sort: Name (A-Z)</option>
            <option value="city">Sort: City</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {sortedAndFiltered.map(c => {
          let balColor = 'text-emerald-500';
          if (c.balance > 0) balColor = 'text-amber-600';
          if (c.balance > c.creditLimit) balColor = 'text-rose-600';

          return (
            <Link key={c.id} to={`/customers/${c.id}`} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col group overflow-hidden">
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <Building2 className="w-6 h-6 text-indigo-600 group-hover:text-white transition-colors" />
                  </div>
                  {c.aging.buckets.urgent > 0 && (
                     <span className="px-2 py-1 bg-rose-100 text-rose-700 text-[10px] font-black uppercase tracking-wider rounded border border-rose-200">
                       Urgent Overdue
                     </span>
                  )}
                </div>
                
                <h3 className="text-xl font-bold text-slate-800 mb-1">{c.companyName}</h3>
                <p className="text-slate-500 font-medium text-sm mb-4">{c.contactPerson}</p>

                <div className="space-y-2 mt-auto">
                  <div className="flex items-center text-sm text-slate-600">
                    <Phone className="w-4 h-4 mr-3 text-slate-400" /> {c.phone}
                  </div>
                  <div className="flex items-center text-sm text-slate-600">
                    <MapPin className="w-4 h-4 mr-3 text-slate-400" /> {c.city}
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border-t border-slate-100 p-6">
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Udhaar</p>
                    <p className={`text-2xl font-black ${balColor}`}>{formatCurrency(c.balance)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Credit Limit</p>
                    <p className="text-sm font-semibold text-slate-600">{formatCurrency(c.creditLimit)}</p>
                  </div>
                </div>

                <button 
                  onClick={(e) => openPayment(c.id, e)}
                  disabled={c.balance === 0}
                  className={`w-full flex justify-center items-center space-x-2 py-3 rounded-xl font-bold transition-all ${
                    c.balance > 0 
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 shadow-md' 
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <HandCoins className="w-5 h-5" />
                  <span>Collect Payment</span>
                </button>
              </div>
            </Link>
          );
        })}

        {sortedAndFiltered.length === 0 && (
          <div className="col-span-full py-16 text-center text-slate-500 bg-white border border-slate-100 border-dashed rounded-2xl">
            <UserPlus className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="text-lg font-medium text-slate-600">No customers found</p>
            <p className="text-sm">Try genericizing your exact search.</p>
          </div>
        )}
      </div>

      <PaymentDrawer 
        isOpen={isPaymentOpen} 
        onClose={() => setIsPaymentOpen(false)} 
        customerId={selectedCustomerId} 
      />
    </div>
  );
}
