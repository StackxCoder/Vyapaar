import { useState, useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { 
  Tag, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  RefreshCw, 
  Search, 
  ShieldAlert, 
  Activity,
  Bot,
  Printer,
  ChevronRight
} from 'lucide-react';

export default function PricingDashboard() {
  const { data, getEffectiveRate, updateEntity } = useStore();
  const [activeTab, setActiveTab] = useState('margins'); // margins | customers | bulk | competitors
  const [searchTerm, setSearchTerm] = useState('');
  
  // Custom Customer Pricing State
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Bulk Price Update State
  const [bulkPercent, setBulkPercent] = useState(0);
  const [bulkCategory, setBulkCategory] = useState('All');
  const [bulkPreview, setBulkPreview] = useState([]);

  // Competitor Tracking State
  const [compProductId, setCompProductId] = useState('');
  const [compName, setCompName] = useState('');
  const [compPrice, setCompPrice] = useState('');
  const [compNotes, setCompNotes] = useState('');

  // Search logic for margins tab
  const products = data.products || [];
  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const getMarginColor = (marginPercent) => {
    if (marginPercent < 5) return 'bg-rose-100 text-rose-800 border-rose-200';
    if (marginPercent < 10) return 'bg-amber-100 text-amber-800 border-amber-200';
    if (marginPercent < 20) return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  };

  const getMarginStyle = (marginPercent) => {
    if (marginPercent < 5) return 'text-rose-600 font-black';
    if (marginPercent < 10) return 'text-amber-600 font-bold';
    if (marginPercent < 20) return 'text-blue-600 font-semibold';
    return 'text-emerald-600 font-bold';
  };

  const formatCurrency = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN')}`;

  const renderTabs = () => (
    <div className="flex overflow-x-auto space-x-2 bg-slate-100 p-1.5 rounded-xl w-max mb-6">
      {[
        { id: 'margins', label: 'Margin Overview', icon: Activity },
        { id: 'customers', label: 'Customer Tiers', icon: Users },
        { id: 'bulk', label: 'Price Updates', icon: RefreshCw },
        { id: 'competitors', label: 'Market Tracking', icon: ShieldAlert }
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
  );

  return (
    <div className="space-y-6 pb-[100px] max-w-7xl mx-auto print:p-0 print:m-0 print:block">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-indigo-900 text-white p-6 rounded-2xl shadow-sm border border-indigo-800 print:hidden">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <Tag className="w-8 h-8 text-indigo-400" /> Smart Pricing Engine
          </h1>
          <p className="text-indigo-200 mt-1 text-sm font-medium">Algorithmic margin defense, custom B2B tiers, and bulk overrides.</p>
        </div>
        <button 
          onClick={() => {
            const compiledPrompt = `Here are my products with margins: ${JSON.stringify(data.products.map(p => ({ n: p.name, c: p.purchasePrice, s: p.sellingPrice })))}\nHere are competitor prices: ${JSON.stringify(data.competitorNotes)}\nHere are my best customers and what they pay: ${JSON.stringify(data.customers.map(c => ({ n: c.companyName, d: c.customDiscountPercent, t: c.pricingTier, o: c.specialPrices })))}\n\nSuggest: (1) Which products' margins are dangerously low? (2) Where can I safely increase price? (3) Which customers are getting too much discount? Give specific ₹ recommendations.`;
            localStorage.setItem('vyapaar_ai_prompt_inject', compiledPrompt);
            window.location.href = '/ai';
          }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 rounded-xl font-bold shadow-lg transition-colors border border-indigo-500"
        >
          <Bot className="w-5 h-5" /> AI se pricing advice lo
        </button>
      </div>

      <div className="print:hidden">
        {renderTabs()}
      </div>

      {activeTab === 'margins' && (
        <div className="space-y-6 animate-fade-in print:hidden">
          
          <div className="flex items-center bg-white p-2 rounded-xl shadow-sm border border-slate-100 max-w-md">
            <Search className="w-5 h-5 text-slate-400 ml-2" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-3 py-2 outline-none text-slate-700 bg-transparent font-medium"
            />
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100">
               <h2 className="text-lg font-bold text-slate-800">Margin Breakdown (Standard Rate)</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-widest border-b border-slate-200">
                    <th className="p-4 pl-6 font-bold">Product</th>
                    <th className="p-4 font-bold text-center border-l border-slate-100">Base Cost</th>
                    <th className="p-4 font-bold text-center text-indigo-600 bg-indigo-50/30">Selling Price</th>
                    <th className="p-4 font-black text-right border-l border-slate-100">Margin (₹)</th>
                    <th className="p-4 font-black text-right pr-6">Margin (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredProducts.map(product => {
                    const cost = product.purchasePrice || 0;
                    const price = product.sellingPrice || 0;
                    const marginValue = price - cost;
                    const marginPercent = price > 0 ? (marginValue / price) * 100 : 0;
                    
                    return (
                      <tr key={product.id} className="hover:bg-slate-50 transition-colors cursor-pointer active:bg-slate-100">
                        <td className="p-4 pl-6">
                           <div className="font-bold text-slate-800">{product.name}</div>
                           <div className="text-xs text-slate-400">{product.labelSpec}</div>
                        </td>
                        <td className="p-4 text-center font-bold text-slate-600 border-l border-slate-100">{formatCurrency(cost)}</td>
                        <td className="p-4 text-center font-black text-indigo-700 bg-indigo-50/10 text-lg shadow-[inset_0_0_10px_rgba(79,70,229,0.02)]">
                           {formatCurrency(price)}
                        </td>
                        <td className={`p-4 text-right font-bold border-l border-slate-100 ${marginValue > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                           {marginValue > 0 ? '+' : ''}{formatCurrency(marginValue)}
                        </td>
                        <td className="p-4 text-right pr-6">
                          <span className={`px-2.5 py-1 rounded inline-block font-bold min-w-[70px] text-center text-xs tracking-wider border ${getMarginColor(marginPercent)}`}>
                            {marginPercent.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                  {filteredProducts.length === 0 && (
                    <tr><td colSpan="5" className="p-8 text-center text-slate-500 font-medium">No products found for your search.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-slate-900 rounded-2xl shadow-lg border border-slate-800 overflow-hidden mt-8 text-slate-300">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
               <h2 className="text-lg font-bold text-white flex items-center gap-2"><Activity className="w-5 h-5 text-indigo-400"/> Tiering Heatmap</h2>
               <div className="text-xs text-slate-400 flex gap-4">
                 <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-rose-500"></span>&lt;5% (Danger)</span>
                 <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-500"></span>&gt;=20% (Healthy)</span>
               </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/50">
                     <th className="p-4 font-bold text-slate-400 w-[40%]">Analysis Target</th>
                     <th className="p-4 font-bold text-center text-slate-300 border-l border-slate-800 w-[20%]">Standard (Base)</th>
                     <th className="p-4 font-bold text-center text-indigo-300 bg-indigo-900/20 border-l border-slate-800 w-[20%]">Premium (5% OFF)</th>
                     <th className="p-4 font-bold text-center text-amber-300 bg-amber-900/20 border-l border-slate-800 w-[20%]">Bulk (10% OFF)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {filteredProducts.slice(0, 10).map(p => {
                    const cost = p.purchasePrice || 0;
                    const basePrice = p.sellingPrice || 0;
                    const premPrice = basePrice * 0.95;
                    const bulkPrice = basePrice * 0.90;

                    const getCell = (sellPrice) => {
                      const mP = sellPrice > 0 ? ((sellPrice - cost) / sellPrice) * 100 : 0;
                      let color = 'text-slate-400';
                      let bg = '';
                      if (mP < 5) { color = 'text-rose-100 font-bold'; bg = 'bg-rose-900/40'; }
                      else if (mP < 10) { color = 'text-amber-200'; }
                      else if (mP >= 20) { color = 'text-emerald-300 font-bold'; bg = 'bg-emerald-900/20'; }
                      
                      return (
                        <td className={`p-4 text-center border-l w-[20%] border-slate-800 ${bg} ${color}`}>
                          <div className="text-sm">{formatCurrency(sellPrice)}</div>
                          <div className="text-[10px] uppercase tracking-widest mt-0.5">{mP.toFixed(1)}%</div>
                        </td>
                      )
                    };

                    return (
                      <tr key={p.id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="p-4 font-medium text-slate-200 w-[40%] truncate">{p.name}</td>
                        {getCell(basePrice)}
                        {getCell(premPrice)}
                        {getCell(bulkPrice)}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Placeholders for remaining tabs to be implemented */}
      {activeTab === 'customers' && (
        <div className="space-y-6 animate-fade-in">
          {!selectedCustomer ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
               <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                 <h2 className="text-lg font-bold text-slate-800">Select Customer to Configure Pricing</h2>
               </div>
               <div className="divide-y divide-slate-100">
                 {data.customers?.map(c => (
                   <div key={c.id} onClick={() => setSelectedCustomer(c)} className="p-6 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors">
                     <div>
                       <div className="font-bold text-slate-800">{c.companyName}</div>
                       <div className="text-sm text-slate-500 mt-1">{c.city} • {c.contactPerson}</div>
                     </div>
                     <div className="flex items-center gap-4">
                       <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${
                         c.pricingTier === 'premium' ? 'bg-indigo-100 text-indigo-800' :
                         c.pricingTier === 'bulk' ? 'bg-amber-100 text-amber-800' :
                         'bg-slate-100 text-slate-600'
                       }`}>
                         {c.pricingTier || 'standard'} Tier
                       </span>
                       {c.customDiscountPercent > 0 && (
                         <span className="text-emerald-600 font-black text-sm">{c.customDiscountPercent}% OFF</span>
                       )}
                       <ChevronRight className="w-5 h-5 text-slate-400" />
                     </div>
                   </div>
                 ))}
               </div>
            </div>
          ) : (
            <div className="space-y-6">
              <button 
                onClick={() => setSelectedCustomer(null)} 
                className="text-indigo-600 font-bold flex items-center gap-2 hover:text-indigo-800"
              >
                ← Back to Customers
              </button>
              
              <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm p-6 text-white flex justify-between items-start">
                 <div>
                   <h2 className="text-2xl font-black">{selectedCustomer.companyName}</h2>
                   <div className="flex gap-3 mt-3">
                     <select 
                       value={selectedCustomer.pricingTier || 'standard'}
                       onChange={(e) => {
                         const t = e.target.value;
                         updateEntity('customers', selectedCustomer.id, { pricingTier: t });
                         setSelectedCustomer({...selectedCustomer, pricingTier: t});
                       }}
                       className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm font-bold outline-none"
                     >
                       <option value="standard">Standard Tier</option>
                       <option value="premium">Premium Tier</option>
                       <option value="bulk">Bulk Buyer</option>
                     </select>
                     <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm">
                        <span className="text-slate-400 mr-2 font-bold">Global Discount %:</span>
                        <input 
                          type="number" 
                          className="w-16 bg-transparent outline-none font-black text-emerald-400" 
                          value={selectedCustomer.customDiscountPercent || 0}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            updateEntity('customers', selectedCustomer.id, { customDiscountPercent: val });
                            setSelectedCustomer({...selectedCustomer, customDiscountPercent: val});
                          }}
                        />
                     </div>
                   </div>
                 </div>
                 <button onClick={() => window.print()} className="bg-white text-slate-900 px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow hover:bg-slate-100 transition-colors">
                    <Printer className="w-4 h-4"/> Export Price List
                 </button>
              </div>

              {/* PRINT ONLY HEADER */}
              <div className="hidden print:block mb-8">
                <h1 className="text-3xl font-black text-slate-900 border-b-2 border-slate-900 pb-2 mb-2">Vyapaar Admin - Official Price List</h1>
                <div className="text-slate-600 font-bold text-lg mb-2">Customer: {selectedCustomer.companyName}</div>
                <div className="text-sm font-semibold text-slate-500">Generated: {new Date().toLocaleDateString('en-IN')}</div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden print:border-none print:shadow-none">
                <div className="p-6 border-b border-slate-100 bg-slate-50 print:hidden">
                   <h3 className="font-bold text-slate-800">Product Line Custom Overrides</h3>
                   <p className="text-sm text-slate-500 mt-1">Specify absolute rate values here to bypass all Tier rules.</p>
                </div>
                <table className="w-full text-left print:border-collapse print:border print:border-slate-300">
                   <thead>
                     <tr className="bg-white text-slate-400 text-xs uppercase tracking-widest border-b border-slate-200 print:text-slate-800 print:border-b-2 print:border-slate-800">
                        <th className="p-4 pl-6 font-bold print:border print:border-slate-300">Product</th>
                        <th className="p-4 font-bold print:border print:border-slate-300">Specification</th>
                        <th className="p-4 text-center font-bold print:border print:border-slate-300 print:hidden">Catalog Base</th>
                        <th className="p-4 text-center font-bold text-indigo-600 print:text-slate-800 print:border print:border-slate-300">Effective Rate</th>
                        <th className="p-4 text-center font-bold print:hidden">Custom Override (₹)</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100 text-sm">
                     {data.products?.map(p => {
                       const eff = getEffectiveRate(p.id, selectedCustomer.id);
                       const specialPrices = selectedCustomer.specialPrices || [];
                       const currCustom = specialPrices.find(sp => sp.productId === p.id)?.customRate || '';

                       const handleOverride = (val) => {
                         let newSP = [...specialPrices];
                         const existingIdx = newSP.findIndex(sp => sp.productId === p.id);
                         const numVal = Number(val);
                         if (numVal > 0) {
                           if (existingIdx >= 0) newSP[existingIdx].customRate = numVal;
                           else newSP.push({ productId: p.id, customRate: numVal });
                         } else {
                           if (existingIdx >= 0) newSP.splice(existingIdx, 1);
                         }
                         updateEntity('customers', selectedCustomer.id, { specialPrices: newSP });
                         setSelectedCustomer({...selectedCustomer, specialPrices: newSP});
                       };

                       return (
                         <tr key={p.id} className="hover:bg-slate-50 print:break-inside-avoid print:border-b print:border-slate-300">
                           <td className="p-4 pl-6 font-bold text-slate-700 print:text-slate-900 print:border-r print:border-slate-300">{p.name}</td>
                           <td className="p-4 text-slate-500 font-medium print:text-slate-800 print:border-r print:border-slate-300">{p.labelSpec}</td>
                           <td className="p-4 text-center text-slate-500 print:hidden">{formatCurrency(p.sellingPrice)}</td>
                           <td className="p-4 text-center font-black text-indigo-600 print:text-slate-900 print:border-r print:border-slate-300">{formatCurrency(eff.rate)} / {p.unit}</td>
                           <td className="p-4 text-center print:hidden">
                             <input 
                               type="number" 
                               placeholder="Set override..."
                               className="px-3 py-1.5 border border-slate-200 rounded-lg text-center outline-none focus:border-indigo-400 font-bold"
                               value={currCustom}
                               onChange={(e) => handleOverride(e.target.value)}
                             />
                           </td>
                         </tr>
                       )
                     })}
                   </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
      
      {activeTab === 'bulk' && (
        <div className="space-y-6 animate-fade-in print:hidden">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-4">
              <h2 className="text-lg font-bold text-slate-800">Generate Bulk Adjustment</h2>
              <div className="flex gap-4 items-center">
                <div className="flex-1">
                   <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Target Category</label>
                   <select 
                     value={bulkCategory} 
                     onChange={e => setBulkCategory(e.target.value)} 
                     className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none font-bold text-slate-700"
                   >
                     <option value="All">All Categories</option>
                     {Array.from(new Set(data.products.map(p => p.category))).map(c => (
                        <option key={c} value={c}>{c}</option>
                     ))}
                   </select>
                </div>
                <div className="flex-1">
                   <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Adjustment (+ / - %)</label>
                   <input 
                     type="number" 
                     value={bulkPercent} 
                     onChange={e => setBulkPercent(Number(e.target.value))}
                     className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none font-bold text-slate-700 text-center"
                   />
                </div>
              </div>
              <button 
                onClick={() => {
                  const targets = bulkCategory === 'All' ? data.products : data.products.filter(p => p.category === bulkCategory);
                  const preview = targets.map(p => ({
                    id: p.id,
                    name: p.name,
                    oldPrice: p.sellingPrice,
                    newPrice: Math.round(p.sellingPrice * (1 + (bulkPercent / 100)))
                  })).filter(x => x.oldPrice !== x.newPrice);
                  setBulkPreview(preview);
                }}
                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 rounded-xl transition-colors"
                disabled={bulkPercent === 0}
              >
                Preview Changes
              </button>
            </div>
            
            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col">
              <h3 className="font-bold text-slate-800 mb-2">Change Preview ({bulkPreview.length} Items)</h3>
              <div className="flex-1 overflow-y-auto max-h-[150px] space-y-1">
                 {bulkPreview.length === 0 ? (
                   <div className="text-slate-400 text-sm h-full flex items-center justify-center">Generate a preview to see calculations.</div>
                 ) : bulkPreview.map(prev => (
                   <div key={prev.id} className="flex justify-between items-center text-sm py-1 border-b border-slate-200/50 last:border-0">
                     <span className="font-medium text-slate-700 truncate">{prev.name}</span>
                     <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                       <span className="text-slate-400 line-through">{prev.oldPrice}</span>
                       <span className="mx-2 text-slate-300">→</span>
                       <span className={prev.newPrice > prev.oldPrice ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>{prev.newPrice}</span>
                     </span>
                   </div>
                 ))}
              </div>
              {bulkPreview.length > 0 && (
                <button 
                  onClick={() => {
                     const payload = {};
                     bulkPreview.forEach(p => { payload[p.id] = { sellingPrice: p.newPrice, notes: `Bulk adjustment ${bulkPercent > 0 ? '+' : ''}${bulkPercent}%` } });
                     data.processBulkPriceUpdate(payload, 'bulk_update');
                     setBulkPreview([]);
                     setBulkPercent(0);
                     alert("Prices updated successfully in catalog and ledger!");
                  }}
                  className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 rounded-lg flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-5 h-5"/> Commit Prices to Ledger
                </button>
              )}
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100">
               <h2 className="text-lg font-bold text-slate-800">Price Change History Log</h2>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white text-slate-400 text-xs uppercase tracking-widest border-b border-slate-200">
                  <th className="p-4 pl-6 font-bold">Date & Time</th>
                  <th className="p-4 font-bold">Product</th>
                  <th className="p-4 text-right font-bold">Old Price</th>
                  <th className="p-4 text-right font-bold text-indigo-600">New Price</th>
                  <th className="p-4 pl-6 font-bold">Method</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                 {(data.priceHistory || []).map((log, idx) => {
                   const product = data.products.find(p => p.id === log.productId);
                   return (
                     <tr key={idx} className="hover:bg-slate-50">
                       <td className="p-4 pl-6 text-slate-500">{new Date(log.date).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</td>
                       <td className="p-4 font-bold text-slate-700">{product?.name || log.productId}</td>
                       <td className="p-4 text-right text-slate-400 font-mono line-through">{formatCurrency(log.oldSellingPrice)}</td>
                       <td className={`p-4 text-right font-black font-mono ${log.sellingPrice > log.oldSellingPrice ? 'text-emerald-500' : 'text-rose-500'}`}>
                         {formatCurrency(log.sellingPrice)}
                       </td>
                       <td className="p-4 pl-6">
                         <span className="text-[10px] uppercase font-bold tracking-widest bg-slate-100 px-2 py-1 rounded text-slate-500">{log.changedBy}</span>
                         {log.notes && <div className="text-xs text-slate-400 mt-1">{log.notes}</div>}
                       </td>
                     </tr>
                   )
                 })}
                 {(!data.priceHistory || data.priceHistory.length === 0) && (
                   <tr><td colSpan="5" className="p-8 text-center text-slate-400">No bulk price shifts recorded.</td></tr>
                 )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {activeTab === 'competitors' && (
        <div className="space-y-6 animate-fade-in print:hidden">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm p-6 text-white flex flex-col md:flex-row gap-6">
             <div className="w-full md:w-1/3">
                <h2 className="text-lg font-bold flex items-center gap-2 mb-4"><ShieldAlert className="w-5 h-5 text-amber-400"/> Log Competitor Intel</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Target Product</label>
                    <select value={compProductId} onChange={e => setCompProductId(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 outline-none font-bold text-white">
                      <option value="">Select Product...</option>
                      {data.products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Competitor Name (Brand/Seller)</label>
                    <input type="text" value={compName} onChange={e => setCompName(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 outline-none font-bold text-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Their Quoted Rate (₹)</label>
                    <input type="number" value={compPrice} onChange={e => setCompPrice(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 outline-none font-bold text-emerald-400 text-lg" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Context / Notes</label>
                    <input type="text" placeholder="e.g. Rate valid for 100+ coils" value={compNotes} onChange={e => setCompNotes(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 outline-none text-slate-300 text-sm" />
                  </div>
                  <button 
                    onClick={() => {
                      if (!compProductId || !compName || !compPrice) return alert("Fill all fields");
                      const pn = data.products.find(p => p.id === compProductId).name;
                      data.addCompetitorNote({ productId: compProductId, productName: pn, competitorName: compName, competitorPrice: Number(compPrice), notes: compNotes });
                      setCompProductId(''); setCompName(''); setCompPrice(''); setCompNotes('');
                    }}
                    className="w-full bg-amber-500 hover:bg-amber-400 text-amber-950 font-black py-3 rounded-lg mt-2"
                  >
                    Save Intel Record
                  </button>
                </div>
             </div>
             
             <div className="w-full md:w-2/3 bg-white rounded-xl overflow-hidden shadow-inner text-slate-800 flex flex-col">
                <div className="p-4 bg-slate-50 border-b border-slate-100 font-bold">Recent Market Intel</div>
                <div className="flex-1 overflow-y-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-white text-slate-400 text-[10px] uppercase tracking-widest border-b border-slate-100">
                        <th className="p-3 pl-6">Date</th>
                        <th className="p-3">Product</th>
                        <th className="p-3">Competitor</th>
                        <th className="p-3 text-right">Their Price</th>
                        <th className="p-3 text-right pr-6">Vs Our Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {(data.competitorNotes || []).map(note => {
                         const ourProd = data.products.find(p => p.id === note.productId);
                         const diff = ourProd ? (ourProd.sellingPrice - note.competitorPrice) : null;
                         return (
                           <tr key={note.id} className="hover:bg-slate-50">
                             <td className="p-3 pl-6 text-slate-400">{new Date(note.date).toLocaleDateString()}</td>
                             <td className="p-3 font-bold text-slate-700">{note.productName}</td>
                             <td className="p-3 text-slate-600">
                               <div className="font-bold">{note.competitorName}</div>
                               <div className="text-[10px] text-slate-400">{note.notes}</div>
                             </td>
                             <td className="p-3 text-right font-black text-rose-600">{formatCurrency(note.competitorPrice)}</td>
                             <td className="p-3 text-right pr-6">
                               {diff === null ? '-' : diff > 0 ? (
                                 <span className="text-rose-500 font-bold text-xs bg-rose-50 px-2 py-1 rounded border border-rose-100">We are +{diff} higher</span>
                               ) : diff < 0 ? (
                                 <span className="text-emerald-600 font-bold text-xs bg-emerald-50 px-2 py-1 rounded border border-emerald-100">We are {diff} cheaper</span>
                               ) : (
                                 <span className="text-slate-500 font-bold text-xs">Matching Exactly</span>
                               )}
                             </td>
                           </tr>
                         )
                      })}
                      {(!data.competitorNotes || data.competitorNotes.length === 0) && (
                        <tr><td colSpan="5" className="p-8 text-center text-slate-400 font-medium">No competitor pricing logged yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
             </div>
          </div>
        </div>
      )}

    </div>
  );
}
