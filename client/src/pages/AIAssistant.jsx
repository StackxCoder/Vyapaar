import { useState, useRef, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Link } from 'react-router-dom';
import { Sparkles, Send, Trash2, KeyRound, Loader2, Bot, User } from 'lucide-react';

export default function AIAssistant() {
  const { data, getCustomerAging, getCustomerBalance } = useStore();
  const apiKey = data.settings?.geminiApiKey;

  const [messages, setMessages] = useState([
    { role: 'model', text: `Namaste ${data.settings?.ownerName || ''}! I am your Vyapaar AI Assistant. Ask me anything about your sales, margins, batches, or pending Udhaar.` }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const bottomRef = useRef(null);

  // Auto scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const quickPrompts = [
    "Is mahine profit kitna hua?",
    "Kiski udhaar 60 din se zyada hai?",
    "Sabse zyada kaun sa product bika?",
    "Kaunsa batch repeat karna chahiye?",
    "Cash flow kaisa hai?",
    "Mujhe kya karna chahiye aaj?"
  ];

  // System Context Construction
  const buildBusinessContext = () => {
    const products = data.products || [];
    const customers = data.customers || [];
    const sales = data.sales || [];
    const payments = data.payments || [];
    const batches = data.batches || [];
    const settings = data.settings || {};

    const today = new Date();
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    // This month sales
    const thisMonthSales = sales.filter(s => new Date(s.date) >= thisMonthStart);
    const thisMonthRevenue = thisMonthSales.reduce((s, sale) => s + sale.total, 0);
    const thisMonthCash = thisMonthSales.reduce((s, sale) => s + (sale.cashReceived || 0), 0);
    const thisMonthCredit = thisMonthSales.reduce((s, sale) => s + (sale.creditAmount || 0), 0);

    // Customer udhaar
    const customerUdhaars = customers.map(c => {
      const creditSales = sales.filter(s => s.customerId === c.id)
        .reduce((s, sale) => s + (sale.creditAmount || 0), 0);
      const totalPaid = payments.filter(p => p.customerId === c.id)
        .reduce((s, p) => s + p.amount, 0);
      const udhaar = creditSales - totalPaid;
      const oldestUnpaid = sales
        .filter(s => s.customerId === c.id && s.creditAmount > 0)
        .sort((a, b) => new Date(a.date) - new Date(b.date))[0];
      const daysPending = oldestUnpaid
        ? Math.floor((today - new Date(oldestUnpaid.date)) / 86400000) : 0;
      return { name: c.companyName || c.name || 'Unknown', udhaar, daysPending };
    }).filter(c => c.udhaar > 0);

    // Top products this month
    const productRevenue = {};
    thisMonthSales.forEach(sale => {
      sale.items?.forEach(item => {
        productRevenue[item.productName] = (productRevenue[item.productName] || 0) + item.amount;
      });
    });
    const topProducts = Object.entries(productRevenue)
      .sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([name, rev]) => ({ name, revenue: rev }));

    return {
      businessName: settings.companyName || 'Business',
      ownerName: settings.ownerName || 'Owner',
      summary: {
        thisMonthRevenue,
        thisMonthCash,
        thisMonthCredit,
        totalSalesCount: thisMonthSales.length,
        totalCustomers: customers.length,
        activeProducts: products.filter(p => p.batchStatus === 'active').length,
        trialBatches: batches.filter(b => b.status === 'trial').length,
      },
      udhaar: {
        totalPending: customerUdhaars.reduce((s, c) => s + c.udhaar, 0),
        customersWithUdhaar: customerUdhaars.length,
        overdue60Days: customerUdhaars.filter(c => c.daysPending > 60),
        details: customerUdhaars.slice(0, 10)
      },
      topProducts,
      recentSales: sales.slice(-5).reverse().map(s => ({
        date: s.date,
        customer: s.customerName,
        amount: s.total,
        type: s.saleMode
      }))
    };
  };

  const buildSystemPrompt = () => {
    const ctx = buildBusinessContext();
    return `You are a smart business assistant for ${ctx.businessName}, an electrical wires and cables wholesale (B2B) business in India owned by ${ctx.ownerName}.

Current business data (real, live):
- This month revenue: ₹${ctx.summary.thisMonthRevenue.toLocaleString('en-IN')}
- Cash received this month: ₹${ctx.summary.thisMonthCash.toLocaleString('en-IN')}
- Credit given this month: ₹${ctx.summary.thisMonthCredit.toLocaleString('en-IN')}
- Total customers: ${ctx.summary.totalCustomers}
- Active products: ${ctx.summary.activeProducts}
- Trial batches pending decision: ${ctx.summary.trialBatches}
- Total udhaar pending: ₹${ctx.udhaar.totalPending.toLocaleString('en-IN')}
- Customers with 60+ day udhaar: ${JSON.stringify(ctx.udhaar.overdue60Days)}
- Top 5 products this month: ${JSON.stringify(ctx.topProducts)}
- Recent sales: ${JSON.stringify(ctx.recentSales)}

Instructions:
- Reply in Hindi if user writes Hindi, English if user writes English
- Be direct, give specific numbers from the data above
- For udhaar questions, name the specific customers
- For profit questions, note that these are revenue numbers (expenses not tracked automatically)
- Keep answers under 5-6 lines unless user asks for detail
- Never make up data — only use what is provided above`;
  };

  const callGemini = async (userMessage) => {
    if (!apiKey) throw new Error('NO_API_KEY');

    const activeModelId = data.settings?.geminiModel || 'gemini-1.5-flash';
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${activeModelId}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { role: 'user', parts: [{ text: buildSystemPrompt() }] },
            { role: 'model', parts: [{ text: 'Samjh gaya. Main is business ka assistant hoon. Poochho kya janna hai.' }] },
            { role: 'user', parts: [{ text: userMessage }] }
          ],
          generationConfig: { maxOutputTokens: 500, temperature: 0.3 }
        })
      }
    );

    if (!response.ok) {
      const err = await response.json();
      if (err.error?.code === 429) throw new Error('RATE_LIMIT');
      if (err.error?.code === 400) throw new Error('BAD_KEY');
      throw new Error('API_ERROR');
    }

    const resData = await response.json();
    return resData.candidates?.[0]?.content?.parts?.[0]?.text || 'Koi jawab nahi mila';
  };

  const handleSend = async (userText) => {
    if (!userText.trim()) return;

    if (!apiKey) {
      setErrorMsg("API key nahi hai. Settings mein jao aur Gemini API key daalo.");
      return;
    }

    const newMsgs = [...messages, { role: 'user', text: userText }];
    setMessages(newMsgs);
    setInput('');
    setIsTyping(true);
    setErrorMsg('');

    try {
      const reply = await callGemini(userText);
      setMessages([...newMsgs, { role: 'model', text: reply }]);
    } catch (err) {
      console.error(err);
      if (err.message === 'NO_API_KEY') setErrorMsg("API key nahi hai. Settings mein jao aur Gemini API key daalo.");
      else if (err.message === 'RATE_LIMIT') setErrorMsg("Bahut saare requests ek saath ho gaye. 1 minute baad try karo.");
      else if (err.message === 'BAD_KEY') setErrorMsg("API key galat hai. Settings mein check karo.");
      else setErrorMsg("AI se connect nahi ho paa raha. Internet check karo.");
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[85vh] flex flex-col bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden relative">
      
      {/* Header */}
      <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-500 p-2.5 rounded-xl shadow-inner text-white">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 leading-tight">Vyapaar AI Assistant</h1>
            <p className="text-xs text-slate-500 font-medium">Powered by Gemini Data Engine</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {!apiKey && (
            <Link to="/settings" className="flex items-center gap-1.5 bg-rose-100 text-rose-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-rose-200 transition-colors">
              <KeyRound className="w-3.5 h-3.5"/> Connect Key
            </Link>
          )}
          <button onClick={() => setMessages([])} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors" title="Clear Chat">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex items-end gap-2 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm
                ${msg.role === 'user' ? 'bg-indigo-100 text-indigo-600' : 'bg-white border border-slate-200 text-slate-600'}
              `}>
                {msg.role === 'user' ? <User className="w-4 h-4"/> : <Bot className="w-4 h-4"/>}
              </div>
              
              <div className={`px-5 py-3.5 rounded-2xl shadow-sm text-sm whitespace-pre-wrap leading-relaxed
                ${msg.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-br-sm' 
                  : 'bg-white text-slate-700 border border-slate-100 rounded-bl-sm'}
              `}>
                {msg.text}
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
             <div className="flex items-end gap-2 max-w-[80%]">
               <div className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                 <Bot className="w-4 h-4"/>
               </div>
               <div className="px-5 py-4 bg-white text-slate-700 border border-slate-100 rounded-2xl rounded-bl-sm shadow-sm flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0.1s'}}></div>
                 <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s'}}></div>
               </div>
             </div>
          </div>
        )}
        <div ref={bottomRef} className="h-1" />
      </div>

      {/* Inputs Configuration */}
      <div className="p-4 bg-white border-t border-slate-100">
        {errorMsg && (
          <div className="mb-3 px-4 py-2 bg-rose-50 border border-rose-200 text-rose-700 text-sm font-bold rounded-lg flex items-center justify-between">
            <span>{errorMsg}</span>
            {errorMsg.includes('API Key') && <Link to="/settings" className="text-xs bg-rose-600 text-white px-2 py-1 rounded">Settings</Link>}
          </div>
        )}

        {messages.length < 3 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {quickPrompts.map((q, idx) => (
              <button 
                key={idx} 
                onClick={() => handleSend(q)}
                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[13px] font-semibold transition-colors border border-indigo-100/50"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); handleSend(input); }} className="relative flex items-center shadow-sm rounded-xl overflow-hidden border border-slate-300 bg-slate-50 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-shadow">
          <input 
            type="text" 
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={isTyping}
            placeholder="Ask AI about profit, overdue udhaar, or pending batches..."
            className="w-full px-5 py-4 bg-transparent outline-none text-slate-800 disabled:opacity-50"
          />
          <button 
            type="submit" 
            disabled={!input.trim() || isTyping}
            className="absolute right-2 p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-lg transition-colors flex items-center justify-center transform active:scale-95 disabled:active:scale-100"
          >
            {isTyping ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5"/>}
          </button>
        </form>
      </div>

    </div>
  );
}
