import { useState, useEffect } from 'react';
import { X, HandCoins, AlertCircle } from 'lucide-react';
import { useCustomer } from '../api/customers';
import { useCreatePayment } from '../api/payments';

export default function PaymentDrawer({ isOpen, onClose, customerId }) {
  const { data: customer } = useCustomer(customerId);
  const createPayment = useCreatePayment();

  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState('cash');
  const [reference, setReference] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    setAmount('');
    setMode('cash');
    setReference('');
    setDate(new Date().toISOString().split('T')[0]);
    setNotes('');
  }, [customerId, isOpen]);

  if (!isOpen || !customer) return null;

  const currentBalance = Number(customer.udhaar) || 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return alert('Enter valid amount');
    
    createPayment.mutate({
      customerId: customer.id,
      customerName: customer.companyName,
      date: new Date(date).toISOString(),
      amount: Number(amount),
      mode,
      reference,
      notes
    });

    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] transition-opacity" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-[60] flex flex-col transform border-l border-slate-100">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-100 text-emerald-600 p-2 rounded-full">
              <HandCoins className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Receive Payment</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Customer Balance Banner */}
          <div className="bg-slate-900 rounded-xl p-5 text-indigo-50 border border-slate-800 shadow-inner">
            <p className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-1">Customer</p>
            <h3 className="text-xl font-bold text-white leading-tight">{customer.companyName}</h3>
            <div className="mt-4 flex justify-between items-end border-t border-slate-800 pt-3">
              <span className="text-sm text-slate-400">Total Pending Udhaar</span>
              <span className="text-2xl font-black text-rose-400">₹{currentBalance.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Receive Amount (₹)</label>
              <input required type="text" inputMode="numeric" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full px-4 py-3 text-lg font-bold border border-emerald-200 bg-emerald-50 text-emerald-800 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="0.00" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Date</label>
                <input required type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Payment Mode</label>
                <select value={mode} onChange={(e) => setMode(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none bg-white">
                  <option value="cash">Cash</option>
                  <option value="neft">NEFT / RTGS</option>
                  <option value="upi">UPI</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>
            </div>

            {mode !== 'cash' && (
              <div className="animate-fade-in">
                <label className="block text-sm font-bold text-slate-700 mb-1">Reference / UTR / Cheque No.</label>
                <input required type="text" value={reference} onChange={(e) => setReference(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none" placeholder="Enter reference number..." />
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Internal Notes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows="2" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none resize-none" placeholder="Add any private notes..."></textarea>
            </div>
          </div>
          
          <div className="bg-amber-50 rounded-lg p-3 flex items-start space-x-2 border border-amber-200">
            <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-800 leading-snug">Collecting this payment will immediately deduce the matching amount from the oldest pending invoices utilizing automated FIFO matching.</p>
          </div>
        </form>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex space-x-3">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-colors shadow-sm">
            Cancel
          </button>
          <button onClick={handleSubmit} className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg rounded-xl transition-colors shadow-md shadow-emerald-600/20">
            Record Payment
          </button>
        </div>
      </div>
    </>
  );
}
