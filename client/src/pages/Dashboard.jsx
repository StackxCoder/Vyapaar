import { useStore } from '../store/useStore';
import { useSales } from '../api/sales';
import { useCustomers } from '../api/customers';
import { usePayments } from '../api/payments';
import { useProducts } from '../api/products';
import { useBatches } from '../api/batches';
import { useUdhaarAging } from '../api/reports';
import { LoadingSpinner, ErrorMessage } from '../components/ui/ApiState';
import { 
  TrendingUp, 
  Wallet, 
  Activity,
  PlusCircle,
  UserPlus,
  CreditCard,
  PackagePlus,
  AlertTriangle,
  X,
  ShoppingCart,
  Database,
  ShieldAlert
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { isToday } from '../utils/dateUtils';

export default function Dashboard() {
  const { data: storeData } = useStore();
  const { settings } = storeData;
  const navigate = useNavigate();

  const { data: sales = [], isLoading: l1, error: e1 } = useSales();
  const { data: customers = [], isLoading: l2, error: e2 } = useCustomers();
  const { data: payments = [], isLoading: l3, error: e3 } = usePayments();
  const { data: products = [], isLoading: l4, error: e4 } = useProducts();
  const { data: batches = [], isLoading: l5, error: e5 } = useBatches();
  const { data: agingData = [], isLoading: l6, error: e6 } = useUdhaarAging();

  const isLoading = l1 || l2 || l3 || l4 || l5 || l6;
  const error = e1 || e2 || e3 || e4 || e5 || e6;

  const getCustomerBalance = (id) => {
    const c = customers.find(x => x.id === id);
    return c ? Number(c.udhaar) || 0 : 0;
  };
  
  const getCustomerAging = (id) => {
    const c = customers.find(x => x.id === id);
    if (!c) return { buckets: { urgent: 0 } };
    const ageBucket = agingData.find(a => a.customer === c.companyName);
    return { buckets: { urgent: ageBucket ? ageBucket.bucket60 : 0 } };
  };

  const [dismissedAlerts, setDismissedAlerts] = useState(new Set());

  const todaySales = sales
    .filter(s => s && s.date && isToday(s.date))
    .reduce((acc, sale) => acc + (sale.total || 0), 0);
  
  const monthSales = sales.reduce((acc, sale) => acc + sale.total, 0);

  const totalUdhaar = customers.reduce((acc, c) => acc + getCustomerBalance(c.id), 0);
  const estimatedProfit = monthSales * 0.15;

  const formatCurrency = (amount) => {
    return `₹${Number(amount || 0).toLocaleString('en-IN')}`;
  };

  const metrics = [
    { title: "Today's Sale", value: formatCurrency(todaySales), icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { title: "This Month Sale", value: formatCurrency(monthSales), icon: Activity, color: 'text-blue-600', bg: 'bg-blue-100' },
    { title: "Total Udhaar Pending", value: formatCurrency(totalUdhaar), icon: Wallet, color: 'text-rose-600', bg: 'bg-rose-100' },
    { title: "This Month Profit (Est.)", value: formatCurrency(estimatedProfit), icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-100' },
  ];

  const quickActions = [
    { label: 'New Sale', path: '/sales/new', icon: PlusCircle, color: 'bg-emerald-600 hover:bg-emerald-700' },
    { label: 'New Customer', path: '/customers', icon: UserPlus, color: 'bg-blue-600 hover:bg-blue-700' },
    { label: 'Collect Payment', path: '/customers', icon: CreditCard, color: 'bg-indigo-600 hover:bg-indigo-700' },
    { label: 'New Batch', path: '/batches', icon: PackagePlus, color: 'bg-slate-800 hover:bg-slate-900' },
  ];

  // Merge recent sales and payments to show mixed recent transactions
  const recentTransactions = [...sales.map(s => ({...s, type: 'sale'})), ...payments.map(p => ({...p, type: 'payment'}))]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  // Smart Alerts Resolution
  const smartAlerts = useMemo(() => {
    let alerts = [];
    const now = Date.now();

    // 1. Defaulters > 60 days
    customers.forEach(c => {
      const aging = getCustomerAging(c.id);
      if (aging.buckets.urgent > 0) {
        alerts.push({
          id: `alert_c_${c.id}`,
          type: 'danger',
          message: `⚠️ ${c.companyName} ka ₹${aging.buckets.urgent.toLocaleString('en-IN')}, 60+ din se pending`
        });
      }
    });

    // 2. Trial batches > 30 days pending
    batches.forEach(b => {
      if (b.status === 'trial') {
        const daysOld = Math.floor((now - new Date(b.date).getTime()) / (1000 * 60 * 60 * 24));
        if (daysOld > 30) {
          alerts.push({
            id: `alert_b_${b.id}`,
            type: 'warning',
            message: `📦 ${b.batchNumber} ka decision pending (>30 days)`
          });
        }
      }
    });

    // 3. Margin limits < 10%
    products.forEach(p => {
      if (p.sellingPrice < p.purchasePrice * 1.1) {
        alerts.push({
          id: `alert_p_${p.id}`,
          type: 'margin',
          message: `📉 ${p.name} pe margin bahut kam hai (Check Pricing)`
        });
      }
    });

    return alerts.filter(a => !dismissedAlerts.has(a.id));
  }, [customers, batches, products, getCustomerAging, dismissedAlerts]);

  const dismissAlert = (id) => {
    setDismissedAlerts(prev => new Set(prev).add(id));
  };

  const lowStockProducts = useMemo(() => {
    return products
      .filter(p => p.trackStock && p.currentStock <= p.reorderLevel)
      .sort((a, b) => a.currentStock - b.currentStock)
      .slice(0, 5);
  }, [products]);

  const handleOrderWhatsapp = (product) => {
    const qty = product.reorderQuantity || 10;
    const msg = `Manufacturer naam: \nProduct: ${product.name} (${product.labelSpec})\nQuantity needed: ${qty}\n\nPlease confirm availability and rate.`;
    window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank');
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Namaste <span className="text-indigo-600">{settings.ownerName}</span>!</h1>
          <p className="text-slate-500 mt-1 text-sm">Here is what's happening in your business today.</p>
        </div>
      </div>

      {smartAlerts.length > 0 && (
        <div className="space-y-3">
          {smartAlerts.map(alert => (
            <div key={alert.id} className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-xl shadow-sm flex items-center justify-between">
               <span className="font-bold text-orange-800">{alert.message}</span>
               <button onClick={() => dismissAlert(alert.id)} className="text-orange-500 hover:text-orange-800 transition-colors p-1">
                 <X className="w-5 h-5" />
               </button>
            </div>
          ))}
        </div>
      )}

      {/* RISK ALERTS */}
      {(() => {
        const riskAlertCustomers = customers.filter(c => storeData.scoreCache?.scores?.[c.id]?.grade === 'D' && getCustomerBalance(c.id) > 0);
        if(riskAlertCustomers.length === 0) return null;
        const totalRisk = riskAlertCustomers.reduce((acc, c) => acc + getCustomerBalance(c.id), 0);
        
        return (
          <div className="bg-rose-600 rounded-2xl shadow-xl overflow-hidden animate-fade-in text-white border border-rose-700">
             <div className="p-6 border-b border-rose-500/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-rose-700">
               <div className="flex items-center gap-3">
                 <ShieldAlert className="w-8 h-8 text-rose-200" />
                 <div>
                   <h2 className="text-xl font-black">Immediate Risk Alert</h2>
                   <p className="text-rose-200 text-sm font-bold mt-0.5">{riskAlertCustomers.length} Customers have D-Grade Rating Payment Behaviors.</p>
                 </div>
               </div>
               <div className="text-right">
                 <div className="text-rose-200 text-xs font-bold uppercase tracking-widest">Total at Risk</div>
                 <div className="text-3xl font-black tracking-tight">{formatCurrency(totalRisk)}</div>
               </div>
             </div>
             <div className="p-4 bg-rose-50/10">
               <div className="flex flex-wrap gap-2">
                 {riskAlertCustomers.map(c => (
                   <button 
                     key={c.id} 
                     onClick={() => navigate(`/customers/${c.id}`)}
                     className="bg-white/10 hover:bg-white/20 transition-colors px-4 py-2 rounded-lg font-bold text-sm border border-white/10 flex items-center gap-2"
                   >
                     {c.companyName} <span className="opacity-60 font-medium">({formatCurrency(getCustomerBalance(c.id))})</span>
                   </button>
                 ))}
               </div>
             </div>
          </div>
        );
      })()}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((m, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium">{m.title}</p>
                <h3 className="text-2xl font-bold text-slate-800 mt-2">{m.value}</h3>
              </div>
              <div className={`p-3 rounded-full ${m.bg} ${m.color}`}>
                <m.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickActions.map((action, idx) => (
          <Link to={action.path} key={idx} className={`flex items-center justify-center space-x-2 ${action.color} text-white p-4 rounded-xl shadow-sm transition-transform hover:scale-[1.02] active:scale-95`}>
            <action.icon className="w-5 h-5" />
            <span className="font-semibold text-sm">{action.label}</span>
          </Link>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/3 bg-slate-900 rounded-2xl shadow-sm p-6 text-white border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <PackagePlus className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold">Manufacturing</h2>
            </div>
            <p className="text-slate-400 text-sm mb-6">Track production batch yields.</p>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <span className="text-slate-300">Active Pipeline</span>
                <span className="text-xl font-bold text-emerald-400">{batches.filter(b => b.status === 'active').length}</span>
              </div>
              <div className="flex justify-between items-center pb-2">
                <span className="text-slate-300">Trial (Awaiting Decision)</span>
                <span className="text-xl font-bold text-amber-400">
                  {batches.filter(b => b.status === 'trial').length}
                </span>
              </div>
            </div>
          </div>
          
          <Link to="/batches" className="mt-6 w-full py-3 bg-slate-800 hover:bg-slate-700 text-center rounded-xl font-bold transition-colors border border-slate-700">
            View All Batches
          </Link>
        </div>

        <div className="md:w-2/3 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800">Recent Transactions</h2>
          </div>
          <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-100">
                <th className="p-4 font-medium whitespace-nowrap">Date</th>
                <th className="p-4 font-medium whitespace-nowrap">Customer Name</th>
                <th className="p-4 font-medium whitespace-nowrap">Type</th>
                <th className="p-4 text-right font-medium whitespace-nowrap">Amount</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100">
              {recentTransactions.map((t, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 text-slate-500 whitespace-nowrap">{new Date(t.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  <td className="p-4 font-medium text-slate-800 whitespace-nowrap">{t.customerName}</td>
                  <td className="p-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      t.type === 'payment' ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'
                    }`}>
                      {t.type === 'payment' ? 'Payment RVCD' : 'Sale'}
                    </span>
                  </td>
                  <td className={`p-4 text-right font-bold whitespace-nowrap ${t.type === 'payment' ? 'text-emerald-600' : 'text-slate-800'}`}>
                    {t.type === 'payment' ? '+' : ''}{formatCurrency(t.amount || t.total)}
                  </td>
                </tr>
              ))}
              {recentTransactions.length === 0 && (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-slate-500">No recent transactions found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        </div>
      </div>

      {lowStockProducts.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
           <div className="p-6 border-b border-slate-100 bg-rose-50/30 flex items-center gap-2 text-rose-700">
             <AlertTriangle className="w-5 h-5"/>
             <h2 className="text-lg font-bold">Maal Khatam Ho Raha Hai (Low Stock)</h2>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 p-6">
             {lowStockProducts.map(p => (
               <div key={p.id} className="bg-white border text-center border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between">
                 <div>
                   <h3 className="font-bold text-slate-800 line-clamp-2" title={p.name}>{p.name}</h3>
                   <div className="mt-2 flex items-center justify-center gap-2">
                     <span className={`text-xl font-black ${p.currentStock === 0 ? 'text-rose-600' : 'text-amber-600'}`}>{p.currentStock}</span>
                     <span className="text-xs text-slate-500 uppercase">/ Min {p.reorderLevel}</span>
                   </div>
                 </div>
                 <button onClick={() => handleOrderWhatsapp(p)} className="mt-4 w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 text-sm">
                   <ShoppingCart className="w-4 h-4"/> Order Karo
                 </button>
               </div>
             ))}
           </div>
        </div>
      )}
    </div>
  );
}
