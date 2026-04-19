import { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { useSales } from '../api/sales';
import { useProducts } from '../api/products';
import { useCustomers } from '../api/customers';
import { useBatches } from '../api/batches';
import { useUdhaarAging } from '../api/reports';
import { LoadingSpinner } from '../components/ui/ApiState';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { BarChart3, TrendingUp, DollarSign, Wallet, PackagePlus, AlertCircle, TrendingDown, Printer, Database } from 'lucide-react';

export default function Reports() {
  const { data: storeData, setItem } = useStore();
  
  const { data: sales = [], isLoading: l1 } = useSales();
  const { data: products = [], isLoading: l2 } = useProducts();
  const { data: customers = [], isLoading: l3 } = useCustomers();
  const { data: batches = [], isLoading: l4 } = useBatches();
  const { data: agingData = [], isLoading: l5 } = useUdhaarAging();

  const isLoading = l1 || l2 || l3 || l4 || l5;

  const data = {
    settings: storeData.settings,
    sales, products, customers, batches
  };

  const getCustomerAging = (id) => {
    const c = customers.find(x => x.id === id);
    if (!c) return { buckets: { current: 0, approaching: 0, urgent: 0 } };
    const a = agingData.find(x => x.customer === c.companyName);
    return { buckets: { current: a?.bucket0 || 0, approaching: a?.bucket30 || 0, urgent: a?.bucket60 || 0 } };
  };

  const getCustomerBalance = (id) => {
    const c = customers.find(x => x.id === id);
    return c ? Number(c.udhaar) || 0 : 0;
  };

  const [activeTab, setActiveTab] = useState('pnl'); // pnl | sales | aging | batches | stock
  
  // -- TAB 1: P&L STATE --
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const currentExpenses = useMemo(() => {
    return data.settings?.expenses?.[selectedMonth] || { salaries: '', rent: '', emi: '', misc: '' };
  }, [data.settings?.expenses, selectedMonth]);

  const handleExpenseUpdate = (field, value) => {
    const updatedExpenses = {
      ...data.settings?.expenses,
      [selectedMonth]: {
        ...currentExpenses,
        [field]: value
      }
    };
    setItem('settings', { ...data.settings, expenses: updatedExpenses });
  };

  // Helper formatting
  const formatCurrency = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN')}`;

  // -------------
  // P&L ALGORITHM
  // -------------
  const pnlData = useMemo(() => {
    // 1. Filter sales exactly to YYYY-MM safely
    const targetSales = data.sales.filter(s => s.date && typeof s.date === 'string' && s.date.startsWith(selectedMonth));
    
    // Revenue is the total subtotal minus discount or the formal total
    const totalRevenue = targetSales.reduce((acc, s) => acc + s.total, 0);

    // COGS: Iterating items dynamically picking up batch or catalog cost.
    let totalCogs = 0;
    targetSales.forEach(sale => {
      sale.items.forEach(item => {
        // Find base cost
        const prod = data.products.find(p => p.id === item.productId);
        const rateBasis = item.rate || 0;
        const flexFallback = rateBasis * 0.7; // fallback
        const costBasis = prod ? (prod.purchasePrice || flexFallback) : flexFallback;
        totalCogs += (costBasis * (item.quantity || 0));
      });
    });

    const grossProfit = totalRevenue - totalCogs;
    const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    const opEx = (Number(currentExpenses.salaries) || 0) + 
                 (Number(currentExpenses.rent) || 0) + 
                 (Number(currentExpenses.emi) || 0) + 
                 (Number(currentExpenses.misc) || 0);

    const netProfit = grossProfit - opEx;
    const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return { totalRevenue, totalCogs, grossProfit, grossMargin, opEx, netProfit, netMargin };
  }, [data.sales, data.products, currentExpenses, selectedMonth]);

  // ---------------
  // SALES ALGORITHM
  // ---------------
  const salesData = useMemo(() => {
    const thisMonthStr = selectedMonth;
    let prevMonthD = new Date(selectedMonth + '-01');
    prevMonthD.setMonth(prevMonthD.getMonth() - 1);
    const lastMonthStr = `${prevMonthD.getFullYear()}-${String(prevMonthD.getMonth() + 1).padStart(2, '0')}`;

    const tmSales = data.sales.filter(s => s.date && typeof s.date === 'string' && s.date.startsWith(thisMonthStr));
    const lmSales = data.sales.filter(s => s.date && typeof s.date === 'string' && s.date.startsWith(lastMonthStr));

    const tmRevenue = tmSales.reduce((acc, s) => acc + s.total, 0);
    const lmRevenue = lmSales.reduce((acc, s) => acc + s.total, 0);

    // Daily distribution map
    const dailyMap = {};
    for (let i = 1; i <= 31; i++) dailyMap[i] = 0;
    tmSales.forEach(s => {
      try {
        const day = parseInt(s.date.split('T')[0].split('-')[2], 10);
        if (!isNaN(day)) {
          dailyMap[day] += (s.total || 0);
        }
      } catch(e) {}
    });
    const dailyChart = Object.keys(dailyMap).map(d => ({ day: d, revenue: dailyMap[d] }));

    // Items ranking
    const itemMap = {};
    tmSales.forEach(sale => {
      sale.items.forEach(i => {
        itemMap[i.productName] = (itemMap[i.productName] || 0) + i.amount;
      });
    });
    const topProducts = Object.entries(itemMap).map(([name, rev]) => ({ name, value: rev })).sort((a,b) => b.value - a.value).slice(0, 10);

    // Pukka vs Kachcha percentages
    const pukkaTotal = tmSales.filter(s => s.saleMode === 'pukka').reduce((acc,s) => acc + s.total, 0);
    const kachchaTotal = tmSales.filter(s => s.saleMode === 'kachcha').reduce((acc,s) => acc + s.total, 0);
    const splitTotal = pukkaTotal + kachchaTotal;
    const pukkaPer = splitTotal ? Math.round((pukkaTotal / splitTotal) * 100) : 0;
    const kachchaPer = splitTotal ? Math.round((kachchaTotal / splitTotal) * 100) : 0;

    return { tmRevenue, lmRevenue, dailyChart, topProducts, pukkaPer, kachchaPer };
  }, [data.sales, selectedMonth]);

  // ---------------
  // UDHAAR ALGORITHM
  // ---------------
  const udhaarData = useMemo(() => {
    let globalTotal = 0;
    let global0_30 = 0;
    let global31_60 = 0;
    let global60Plus = 0;
    let expectedCashBack = 0; // Sales from 25-35 days ago that are likely pending immediately

    const now = Date.now();

    const mapped = data.customers.map(c => {
      const metrics = getCustomerAging(c.id);
      const total = getCustomerBalance(c.id);

      globalTotal += total;
      global0_30 += metrics.buckets.current;
      global31_60 += metrics.buckets.approaching;
      global60Plus += metrics.buckets.urgent;

      return {
        company: c.companyName,
        total,
        b1: metrics.buckets.current,
        b2: metrics.buckets.approaching,
        b3: metrics.buckets.urgent
      };
    }).filter(x => x.total > 0).sort((a,b) => b.total - a.total);

    // Expected logic: Sales overlapping 25->35 days ago
    data.sales.forEach(s => {
       if (s.creditAmount > 0) {
         const days = (now - new Date(s.date).getTime()) / (1000 * 60 * 60 * 24);
         if (days >= 25 && days <= 35) {
           expectedCashBack += s.creditAmount; // Rough heuristic sum mapped to general billing cycler
         }
       }
    });

    return { mapped, globalTotal, global0_30, global31_60, global60Plus, expectedCashBack };
  }, [data.customers, data.sales, getCustomerAging, getCustomerBalance]);

  // ---------------
  // BATCH ALGORITHM
  // ---------------
  const batchData = useMemo(() => {
    const activeMapping = data.batches?.map(b => {
       // Estimate revenue generated explicitly by tracking product IDs in later sales
       let generatedRevenue = 0;
       
       // Note: Accurately mapping exactly what wire came from WHICH batch in local JSON involves extreme FIFO abstraction.
       // We'll estimate Revenue simply tracking how much of these base items sold POST batch date.
       data.sales.forEach(s => {
         if (new Date(s.date) >= new Date(b.date)) {
           s.items.forEach(i => {
             if (b.items.some(bx => bx.productId === i.productId)) {
                generatedRevenue += i.amount; // Add revenue scaling towards it
             }
           });
         }
       });

       return {
         ...b,
         generatedRevenue,
         margin: generatedRevenue > 0 ? ((generatedRevenue - b.totalCost) / generatedRevenue) * 100 : 0
       };
    }) || [];

    const trialCount = activeMapping.filter(x => x.status === 'trial').length;
    const convertedActive = activeMapping.filter(x => x.status === 'active').length;
    const conversionRate = (trialCount + convertedActive > 0) ? Math.round((convertedActive / (convertedActive + trialCount)) * 100) : 0;

    return { activeMapping, conversionRate };
  }, [data.batches, data.sales]);

  // ---------------
  // STOCK ALGORITHM
  // ---------------
  const stockData = useMemo(() => {
    // Valuation by category
    const categoryValues = {};
    let totalStockValue = 0;
    
    // Performance arrays
    const velocityList = [];
    const deadStockList = [];

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    data.products.forEach(p => {
      if (!p.trackStock) return;
      
      const stock = p.currentStock || 0;
      const value = stock * (p.purchasePrice || 0);
      
      totalStockValue += value;
      categoryValues[p.category] = (categoryValues[p.category] || 0) + value;

      // Extract historic sales for this specific item
      let unitsSold30d = 0;
      let lastSoldDate = null;
      let unitsSoldOverLifetime = 0;

      data.sales.forEach(sale => {
        const d = new Date(sale.date);
        
        sale.items.forEach(i => {
          if (i.productId === p.id) {
            unitsSoldOverLifetime += i.quantity;
            if (!lastSoldDate || d > lastSoldDate) lastSoldDate = d;
            if (d >= thirtyDaysAgo) unitsSold30d += i.quantity;
          }
        });
      });

      // Velocity: units per day over last 30 days
      const velocity = unitsSold30d / 30;
      
      // Stock coverage calculation
      const coverageDays = velocity > 0 ? Math.round(stock / velocity) : (stock > 0 ? 999 : 0);

      // Identify dead stock (tracked, >0, not sold in 60+ days)
      if (stock > 0 && (!lastSoldDate || lastSoldDate < sixtyDaysAgo)) {
        deadStockList.push({
          id: p.id,
          name: p.name,
          stock,
          value,
          lastSoldText: lastSoldDate ? Math.floor((now - lastSoldDate) / (1000 * 60 * 60 * 24)) + ' days ago' : 'Never'
        });
      }

      if (velocity > 0) {
        velocityList.push({
          id: p.id,
          name: p.name,
          velocity,
          coverageDays,
          stock
        });
      }
    });

    const categoryChart = Object.keys(categoryValues).map(c => ({
      name: c,
      value: categoryValues[c]
    }));

    velocityList.sort((a, b) => b.velocity - a.velocity);
    deadStockList.sort((a, b) => b.value - a.value); // Sort biggest liability first

    return { totalStockValue, categoryChart, velocityList: velocityList.slice(0, 8), deadStockList };
  }, [data.products, data.sales]);

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 pb-20 max-w-6xl mx-auto print:max-w-none print:m-0 print:p-0">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 print:hidden">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Business Reports</h1>
          <p className="text-slate-500 mt-1 text-sm">Analyze margins, defaults, and manufacturing ROIs securely.</p>
        </div>
        <div className="flex items-center gap-2 relative bg-slate-100 p-1.5 rounded-xl">
          <input 
            type="month" 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-2 bg-white rounded-lg border border-slate-200 outline-none text-sm font-bold text-slate-700 shadow-sm"
          />
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="flex overflow-x-auto space-x-2 bg-slate-100 p-1.5 rounded-xl w-max print:hidden">
        {[
          { id: 'pnl', label: 'Monthly P&L', icon: DollarSign },
          { id: 'sales', label: 'Sales Analytics', icon: BarChart3 },
          { id: 'aging', label: 'Udhaar Aging', icon: AlertCircle },
          { id: 'batches', label: 'Batch ROI', icon: PackagePlus },
          { id: 'stock', label: 'Stock Analytics', icon: Database }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === tab.id 
                ? 'bg-white text-slate-800 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            <tab.icon className={`w-4 h-4 mr-2 ${activeTab === tab.id ? 'text-indigo-600' : ''}`} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: PNL */}
      {activeTab === 'pnl' && (
        <div className="space-y-6 animate-fade-in print:block">
          
          <button onClick={() => window.print()} className="mb-4 flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2 rounded-lg print:hidden transition-colors">
            <Printer className="w-4 h-4" /> Print Full Statement
          </button>

          <div className="flex flex-col lg:flex-row gap-6">
            <div className="lg:w-1/3 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 print:hidden">
              <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Manual Expenses ({selectedMonth})</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Salaries Paid</label>
                  <input type="number" placeholder="₹0" value={currentExpenses.salaries} onChange={(e) => handleExpenseUpdate('salaries', e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none font-medium" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Shop / Godown Rent</label>
                  <input type="number" placeholder="₹0" value={currentExpenses.rent} onChange={(e) => handleExpenseUpdate('rent', e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none font-medium" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Loan EMIs</label>
                  <input type="number" placeholder="₹0" value={currentExpenses.emi} onChange={(e) => handleExpenseUpdate('emi', e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none font-medium" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Misc / Transport</label>
                  <input type="number" placeholder="₹0" value={currentExpenses.misc} onChange={(e) => handleExpenseUpdate('misc', e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none font-medium" />
                </div>
              </div>
            </div>

            <div className="lg:w-2/3 bg-white p-8 rounded-2xl shadow-sm border border-slate-100 print:w-full print:border-none print:shadow-none print:p-0">
               <div className="flex justify-between items-end mb-6 border-b border-slate-200 pb-4">
                 <div>
                   <h2 className="text-2xl font-black text-slate-800">Profit & Loss Statement</h2>
                   <p className="text-slate-500 font-medium">{data.settings?.companyName} | Cycle: {selectedMonth}</p>
                 </div>
               </div>

               <div className="space-y-1 text-sm font-medium">
                 {/* Revenue Block */}
                 <div className="flex justify-between py-2 border-b border-slate-50">
                    <span className="text-slate-600">Total Sales Revenue</span>
                    <span className="font-bold text-slate-800">{formatCurrency(pnlData.totalRevenue)}</span>
                 </div>
                 <div className="flex justify-between py-2 border-b border-slate-200 bg-slate-50/50 px-2 rounded">
                    <span className="text-slate-600">Less: Cost of Goods Sold (COGS)</span>
                    <span className="font-bold text-rose-600">({formatCurrency(pnlData.totalCogs)})</span>
                 </div>
                 <div className="flex justify-between py-4 border-b border-slate-300">
                    <span className="font-bold text-slate-800 text-lg">Gross Profit</span>
                    <div className="text-right">
                      <span className="font-black text-emerald-600 text-xl">{formatCurrency(pnlData.grossProfit)}</span>
                      <p className="text-xs text-slate-500 mt-1">Margin: {pnlData.grossMargin.toFixed(1)}%</p>
                    </div>
                 </div>

                 {/* OpEx Block */}
                 <div className="pt-4 pb-2 text-xs font-bold tracking-widest text-slate-400 uppercase">Operating Expenses</div>
                 <div className="flex justify-between py-1.5"><span className="text-slate-600 pl-4">Salaries</span><span>{formatCurrency(currentExpenses.salaries)}</span></div>
                 <div className="flex justify-between py-1.5"><span className="text-slate-600 pl-4">Rent</span><span>{formatCurrency(currentExpenses.rent)}</span></div>
                 <div className="flex justify-between py-1.5"><span className="text-slate-600 pl-4">EMI</span><span>{formatCurrency(currentExpenses.emi)}</span></div>
                 <div className="flex justify-between py-1.5 border-b border-slate-200"><span className="text-slate-600 pl-4">Misc Expenses</span><span>{formatCurrency(currentExpenses.misc)}</span></div>
                 
                 <div className="flex justify-between py-2 bg-rose-50/50 px-2 rounded mb-6">
                    <span className="text-slate-700 font-bold">Total Operating Expenses</span>
                    <span className="font-bold text-rose-600">({formatCurrency(pnlData.opEx)})</span>
                 </div>

                 {/* Net Result */}
                 <div className="flex justify-between p-4 bg-slate-900 text-white rounded-xl shadow-inner print:bg-transparent print:text-black print:border-t-4 print:border-black print:rounded-none">
                    <span className="font-bold text-xl">Net Profit</span>
                    <div className="text-right">
                      <span className={`font-black text-2xl ${pnlData.netProfit >= 0 ? 'text-emerald-400 print:text-black' : 'text-rose-400 print:text-black'}`}>
                        {formatCurrency(pnlData.netProfit)}
                      </span>
                      <p className="text-sm text-slate-300 print:text-slate-600 mt-0.5">Net Margin: {pnlData.netMargin.toFixed(1)}%</p>
                    </div>
                 </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SALES ANALYTICS */}
      {activeTab === 'sales' && (
        <div className="space-y-6 animate-fade-in">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center">
               <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Revenue ({selectedMonth})</p>
               <h3 className="text-3xl font-black text-indigo-900">{formatCurrency(salesData.tmRevenue)}</h3>
               
               <div className="mt-4 flex items-center gap-2 text-sm font-bold">
                 {salesData.tmRevenue >= salesData.lmRevenue ? (
                   <span className="flex items-center text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                     <TrendingUp className="w-4 h-4 mr-1"/>
                     +{salesData.lmRevenue > 0 ? (((salesData.tmRevenue - salesData.lmRevenue) / salesData.lmRevenue) * 100).toFixed(1) : 100}%
                   </span>
                 ) : (
                   <span className="flex items-center text-rose-600 bg-rose-50 px-2 py-1 rounded">
                     <TrendingDown className="w-4 h-4 mr-1"/>
                     {(((salesData.tmRevenue - salesData.lmRevenue) / salesData.lmRevenue) * 100).toFixed(1)}%
                   </span>
                 )}
                 <span className="text-slate-400">vs Last Month</span>
               </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 col-span-1 md:col-span-2">
               <h3 className="text-sm font-bold text-slate-800 mb-4">Under-the-Table Sales Ratio (Privacy Preserved)</h3>
               <div className="flex h-8 rounded-lg overflow-hidden bg-slate-100 shadow-inner">
                 <div className="bg-indigo-600 flex items-center justify-center text-white text-xs font-bold" style={{ width: `${salesData.pukkaPer}%` }}>
                    {salesData.pukkaPer > 10 ? `Formal (${salesData.pukkaPer}%)` : ''}
                 </div>
                 <div className="bg-amber-400 flex items-center justify-center text-amber-900 text-xs font-bold" style={{ width: `${salesData.kachchaPer}%` }}>
                    {salesData.kachchaPer > 10 ? `Informal (${salesData.kachchaPer}%)` : ''}
                 </div>
               </div>
               <div className="flex justify-between mt-3 text-xs font-medium text-slate-500">
                 <span className="flex items-center gap-1.5"><div className="w-3 h-3 bg-indigo-600 rounded-sm"></div> Formal Invoicing (Pukka)</span>
                 <span className="flex items-center gap-1.5"><div className="w-3 h-3 bg-amber-400 rounded-sm"></div> Informal Ledger (Kachcha)</span>
               </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-80">
            <h3 className="text-sm font-bold text-slate-800 mb-6">Daily Revenue Distribution</h3>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={salesData.dailyChart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val>=1000 ? (val/1000)+'k' : val}`} tick={{ fontSize: 12, fill: '#64748b' }} />
                <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="revenue" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

        </div>
      )}

      {/* TAB 3: AGING */}
      {activeTab === 'aging' && (
        <div className="space-y-6 animate-fade-in">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bg-indigo-900 p-6 rounded-2xl shadow-sm border border-indigo-800 text-white relative overflow-hidden">
                <div className="relative z-10">
                  <p className="text-sm font-bold text-indigo-300 uppercase tracking-widest mb-1">Expected Incoming Cash (25-35 Day Window)</p>
                  <h3 className="text-4xl font-black">{formatCurrency(udhaarData.expectedCashBack)}</h3>
                  <p className="text-xs text-indigo-300 mt-3 pt-3 border-t border-indigo-800/50">Algorithm specifically tracks aging invoices approaching typical month-end collection borders.</p>
                </div>
                <TrendingUp className="absolute -right-4 -bottom-4 w-32 h-32 text-indigo-800/40" />
             </div>
             
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Total Market Defaulters</p>
                  <h3 className="text-3xl font-black text-rose-600">{formatCurrency(udhaarData.global60Plus)}</h3>
                  <p className="text-xs font-bold text-slate-500 mt-2">Locked entirely in &gt;60 day past-due buckets.</p>
                </div>
                <div className="p-4 bg-rose-50 text-rose-600 rounded-full">
                  <AlertCircle className="w-8 h-8" />
                </div>
             </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800">Udhaar Debt Aging Matrix</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-white text-slate-400 text-xs uppercase tracking-widest border-b border-slate-200">
                    <th className="p-4 pl-6 font-bold">Client Identity</th>
                    <th className="p-4 font-bold text-right">0-30 Days</th>
                    <th className="p-4 font-bold text-right text-amber-600 bg-amber-50/30">31-60 Days</th>
                    <th className="p-4 font-black text-right text-rose-600 bg-rose-50/50">60+ Days</th>
                    <th className="p-4 font-black text-right pr-6 bg-slate-50">Total Debt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-medium">
                  {udhaarData.mapped.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 pl-6 font-bold text-slate-800">{row.company}</td>
                      <td className="p-4 text-right text-emerald-700">{formatCurrency(row.b1)}</td>
                      <td className="p-4 text-right text-amber-700 bg-amber-50/10">{formatCurrency(row.b2)}</td>
                      <td className="p-4 text-right font-black text-rose-600 bg-rose-50/30">{row.b3 > 0 ? formatCurrency(row.b3) : '-'}</td>
                      <td className="p-4 text-right pr-6 font-black text-slate-900 bg-slate-50/50">{formatCurrency(row.total)}</td>
                    </tr>
                  ))}
                  
                  {/* Total Row */}
                  <tr className="bg-slate-900 text-white">
                    <td className="p-4 pl-6 font-black uppercase tracking-widest text-xs">Total Aggregate</td>
                    <td className="p-4 text-right font-bold text-emerald-400">{formatCurrency(udhaarData.global0_30)}</td>
                    <td className="p-4 text-right font-bold text-amber-400">{formatCurrency(udhaarData.global31_60)}</td>
                    <td className="p-4 text-right font-black text-rose-400">{formatCurrency(udhaarData.global60Plus)}</td>
                    <td className="p-4 text-right pr-6 font-black text-xl">{formatCurrency(udhaarData.globalTotal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* TAB 4: BATCH ROI */}
      {activeTab === 'batches' && (
        <div className="space-y-6 animate-fade-in">
          
          <div className="bg-indigo-50 border-l-4 border-indigo-500 p-5 rounded-r-xl shadow-sm flex items-center justify-between">
             <div>
               <h3 className="font-bold text-indigo-900 flex items-center gap-2"><Factory className="w-5 h-5"/> Trial Conversion Rate</h3>
               <p className="text-sm text-indigo-800 mt-1">Calculates how successfully you modify isolated trial runs into active mainstream catalog stock.</p>
             </div>
             <span className="text-4xl font-black text-indigo-600">{batchData.conversionRate}%</span>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800">Batch Yield vs Mapped Revenue</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-white text-slate-400 text-xs uppercase tracking-widest border-b border-slate-200">
                    <th className="p-4 pl-6 font-bold">Manufacturing Run</th>
                    <th className="p-4 font-bold text-right text-rose-600 bg-rose-50/50">Base Mfg Cost</th>
                    <th className="p-4 font-bold text-right text-emerald-600 bg-emerald-50/50">Mapped Revenue Tracking</th>
                    <th className="p-4 font-black text-right pr-6">Yield Est. ROI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {batchData.activeMapping.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 pl-6">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border mr-2 ${b.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>{b.status}</span>
                        <span className="font-bold text-slate-800">{b.batchNumber}</span>
                        <p className="text-xs text-slate-500 mt-1 truncate max-w-[200px]">{b.notes || 'No notes'}</p>
                      </td>
                      <td className="p-4 text-right font-bold text-rose-600 bg-rose-50/20">{formatCurrency(b.totalCost)}</td>
                      <td className="p-4 text-right font-bold text-emerald-600 bg-emerald-50/20">{formatCurrency(b.generatedRevenue)}</td>
                      <td className="p-4 text-right pr-6">
                        {b.margin > 0 ? (
                           <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 font-bold rounded-lg block w-max ml-auto">+{b.margin.toFixed(1)}%</span>
                        ) : (
                           <span className="text-slate-400 font-bold">Unproven</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {batchData.activeMapping.length === 0 && (
                    <tr><td colSpan="4" className="text-center p-8 text-slate-500">No batch runs available.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* TAB 5: STOCK ANALYTICS */}
      {activeTab === 'stock' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center">
              <h2 className="text-xl font-black text-slate-800 mb-2">Total Capital Locked in Stock</h2>
              <p className="text-4xl font-bold text-indigo-600">{formatCurrency(stockData.totalStockValue)}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {stockData.categoryChart.map(cat => (
                  <span key={cat.name} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">
                    {cat.name}: {formatCurrency(cat.value)}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-rose-50 border border-rose-100 p-6 rounded-2xl shadow-sm flex flex-col">
              <h2 className="text-lg font-bold text-rose-800 mb-4 flex items-center gap-2"><AlertCircle className="w-5 h-5"/> Dead Stock Warning (&gt;60 Days)</h2>
              <div className="flex-1 overflow-y-auto max-h-[150px] hide-scrollbar space-y-2">
                {stockData.deadStockList.length > 0 ? stockData.deadStockList.map(item => (
                  <div key={item.id} className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-rose-100">
                    <div>
                      <div className="font-bold text-sm text-slate-800">{item.name}</div>
                      <div className="text-[10px] text-rose-500 uppercase font-black tracking-widest">{item.lastSoldText}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-rose-700">{formatCurrency(item.value)}</div>
                      <div className="text-[10px] text-slate-500">{item.stock} in stock</div>
                    </div>
                  </div>
                )) : (
                  <div className="text-emerald-600 font-bold text-center py-4">Great! No dead stock dragging down capital.</div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800">High Velocity Items Coverage</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-white text-slate-400 text-xs uppercase tracking-widest border-b border-slate-200">
                    <th className="p-4 pl-6 font-bold">Product</th>
                    <th className="p-4 font-bold text-center">Velocity (30d)</th>
                    <th className="p-4 font-bold text-center">Current Stock</th>
                    <th className="p-4 font-black text-right pr-6">Runway Limit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {stockData.velocityList.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 pl-6 font-bold text-slate-800">{row.name}</td>
                      <td className="p-4 text-center text-slate-600 font-medium">~{row.velocity.toFixed(1)} / day</td>
                      <td className="p-4 text-center font-black text-slate-800">{row.stock}</td>
                      <td className="p-4 text-right pr-6">
                        <span className={`px-3 py-1 rounded inline-block font-bold min-w-[80px] text-center ${row.coverageDays < 7 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}`}>
                          {row.coverageDays >= 999 ? '∞' : `${row.coverageDays} Days`}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {stockData.velocityList.length === 0 && (
                     <tr><td colSpan="4" className="text-center p-8 text-slate-500">Not enough sales history to compute velocity.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
