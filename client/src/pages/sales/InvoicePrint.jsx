import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { getSaleDisplayProduct } from '../../utils/productUtils';

export default function InvoicePrint() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data } = useStore();
  
  const sale = data.sales.find(s => s.id === id);

  useEffect(() => {
    // Adding a short timeout to ensure fonts/css loaded before triggering print dialog
    if (sale) {
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [sale]);

  if (!sale) {
    return (
      <div className="p-10 text-center">
        <h2>Invoice Not Found</h2>
        <button onClick={() => navigate('/sales')} className="text-indigo-600 underline mt-4">Back to Sales</button>
      </div>
    );
  }

  if (sale.saleMode === 'kachcha') {
    return (
      <div className="p-10 text-center">
        <h2>Kachcha sale — invoice print not available</h2>
        <button onClick={() => navigate('/sales')} className="text-indigo-600 underline mt-4">Back to Sales</button>
      </div>
    );
  }

  const formatCurrency = (amount) => `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  return (
    <div className="bg-white min-h-screen invoice-print-container">
      {/* Hide everything else via a global CSS class added in index.css if needed, or rely on routing to hide Sidebar */}
      <div className="max-w-4xl mx-auto p-10 bg-white" style={{ width: '210mm', minHeight: '297mm' }}>
        
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-8">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-wider uppercase">{data.settings.companyName || 'MERA VYAPAAR'}</h1>
            <p className="text-slate-600 mt-2 font-medium">Wholesale Electrical Cables & Wires</p>
          </div>
          <div className="text-right">
            <h2 className="text-3xl font-bold text-slate-300 uppercase tracking-widest mb-2">INVOICE</h2>
            <p className="text-slate-800 font-bold">No. {sale.saleNumber}</p>
            <p className="text-slate-600">Date: {new Date(sale.date).toLocaleDateString('en-IN')}</p>
          </div>
        </div>

        {/* Customer Details */}
        <div className="mb-10">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Billed To:</h3>
          <p className="text-xl font-bold text-slate-800">{sale.customerName}</p>
          {/* Mock address/phone if applicable, skipping since DB doesn't have it explicitly mapped yet */}
        </div>

        {/* Items Table */}
        <table className="w-full text-left border-collapse mb-10">
          <thead>
            <tr className="bg-slate-100 border-y-2 border-slate-800">
              <th className="py-3 px-4 font-bold text-slate-800">Item Description</th>
              <th className="py-3 px-4 font-bold text-slate-800 text-right w-24">Qty</th>
              <th className="py-3 px-4 font-bold text-slate-800 text-right w-32">Rate</th>
              <th className="py-3 px-4 font-bold text-slate-800 text-right w-36">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {sale.items.map((rawItem, idx) => {
              const item = getSaleDisplayProduct(rawItem);
              return (
              <tr key={idx}>
                <td className="py-4 px-4">
                  <p className="font-bold text-slate-800">{item.name}</p>
                  <p className="text-sm text-slate-500 mt-0.5">{item.spec}</p>
                  {/* PRIVACY: actualSpec is intentionally excluded here */}
                </td>
                <td className="py-4 px-4 text-right font-medium text-slate-800">{item.quantity} <span className="text-xs text-slate-500">{item.unit}</span></td>
                <td className="py-4 px-4 text-right font-medium text-slate-800">{formatCurrency(item.rate)}</td>
                <td className="py-4 px-4 text-right font-bold text-slate-800">{formatCurrency(item.amount)}</td>
              </tr>
              );
            })}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mb-16">
          <div className="w-80">
            <div className="flex justify-between py-2 text-slate-600 font-medium">
              <span>Subtotal</span>
              <span>{formatCurrency(sale.subtotal)}</span>
            </div>
            {sale.discount > 0 && (
              <div className="flex justify-between py-2 text-rose-600 font-medium border-t border-slate-100">
                <span>Discount</span>
                <span>- {formatCurrency(sale.discount)}</span>
              </div>
            )}
            <div className="flex justify-between py-4 text-xl font-black text-slate-900 border-t-2 border-slate-800 mt-2">
              <span>TOTAL</span>
              <span>{formatCurrency(sale.total)}</span>
            </div>
          </div>
        </div>

        {/* Payment Logic info footer */}
        <div className="border-t border-slate-200 pt-6 flex justify-between items-end">
          <div>
            <p className="text-sm font-bold text-slate-800 uppercase mb-1">Payment Method</p>
            <p className="text-sm text-slate-600 capitalize">{sale.paymentType}</p>
            {sale.paymentType === 'partial' && (
               <div className="mt-2 text-sm text-slate-500">
                 Paid exactly: <strong className="text-slate-800">{formatCurrency(sale.cashReceived)}</strong>
               </div>
            )}
          </div>
          <div className="text-right text-sm text-slate-400">
            <p>Thank you for doing business with us.</p>
            <p className="mt-1">Generated by <strong>Vyapaar App</strong></p>
          </div>
        </div>
      </div>
      
      {/* 
        This style block forces browsers to print nicely
        It hides Sidebar if rendered alongside it, though we will route it differently to avoid Sidebar wrapper 
      */}
      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; background: transparent; }
          .invoice-print-container { box-shadow: none !important; }
          @page { size: A4; margin: 0; }
        }
      `}</style>
    </div>
  );
}
