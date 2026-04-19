import { useState, useRef } from 'react';
import { useStore } from '../store/useStore';
import { Settings as SettingsIcon, Save, Eye, EyeOff, KeyRound, CheckCircle2, XCircle, Loader2, Database, DownloadCloud, UploadCloud, Trash2 } from 'lucide-react';

export default function Settings() {
  const { data, setItem, overrideData, wipeData } = useStore();
  const [apiKey, setApiKey] = useState(data.settings?.geminiApiKey || '');
  const [companyName, setCompanyName] = useState(data.settings?.companyName || '');
  const [ownerName, setOwnerName] = useState(data.settings?.ownerName || '');
  
  const [showKey, setShowKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [testState, setTestState] = useState('idle'); // idle | testing | success | error

  const [deleteInput, setDeleteInput] = useState('');
  const fileInputRef = useRef(null);

  const handleSave = () => {
    setIsSaving(true);
    const updatedSettings = {
      ...data.settings,
      companyName,
      ownerName,
      geminiApiKey: apiKey.trim(),
      geminiModel: data.settings?.geminiModel || ''
    };
    setItem('settings', updatedSettings);
    
    setTimeout(() => {
      setIsSaving(false);
      setToast('Settings saved successfully!');
      setTimeout(() => setToast(''), 3000);
    }, 500);
  };

  const testApiKey = async () => {
    const keyToTest = apiKey.trim();
    if (!keyToTest) {
      setTestState('error');
      return;
    }
    
    setTestState('testing');
    try {
      const modelsResp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${keyToTest}`);
      if (!modelsResp.ok) {
        const errJson = await modelsResp.json();
        setTestState('error');
        setToast(`Key Error: ${errJson.error?.message || 'Invalid API Key'}`);
        setTimeout(() => setToast(''), 5000);
        return;
      }
      
      const modelsJson = await modelsResp.json();
      const validModels = modelsJson.models.filter(m => m.supportedGenerationMethods?.includes('generateContent'));
      
      if (validModels.length === 0) {
        setTestState('error');
        setToast('No valid models found for this API Key.');
        return;
      }

      let selectedModel = validModels.find(m => m.name.includes('flash'))?.name;
      if (!selectedModel) {
        selectedModel = validModels[0].name;
      }

      const modelId = selectedModel.replace('models/', '');

      const updatedSettings = {
        ...data.settings,
        companyName,
        ownerName,
        geminiApiKey: keyToTest,
        geminiModel: modelId
      };
      setItem('settings', updatedSettings);

      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${keyToTest}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: "Respond with the word SUCCESS" }] }] })
      });
      
      if (resp.ok) {
        setTestState('success');
        setToast(`Connected! Auto-configured model: ${modelId}`);
        setTimeout(() => setToast(''), 5000);
      } else {
        const errJson = await resp.json();
        setTestState('error');
        setToast(`Connection Failed: ${errJson.error?.message || 'Invalid API Key'}`);
        setTimeout(() => setToast(''), 5000);
      }
    } catch (error) {
      console.error(error);
      setTestState('error');
      setToast(`Network Error: ${error.message}`);
      setTimeout(() => setToast(''), 4000);
    }
  };

  const handleExportData = () => {
    // We export the entire 'data' store securely.
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mera-vyapaar-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setToast("Backup Exported Successfully");
    setTimeout(() => setToast(''), 3000);
  };

  const handleImportFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (parsed.settings && parsed.products && parsed.customers) {
           overrideData(parsed);
           setToast("Data Restored Successfully!");
           setTimeout(() => setToast(''), 3000);
        } else {
           setToast("Invalid Vyapaar Backup File");
        }
      } catch (err) {
        setToast("Error reading file format.");
      }
    };
    reader.readAsText(file);
    e.target.value = null; 
  };

  const handleDeleteData = () => {
    if (deleteInput === 'HAAN DELETE') {
      wipeData();
      setDeleteInput('');
      setToast("All data wiped to defaults.");
      setTimeout(() => setToast(''), 3000);
    } else {
      setToast("Type HAAN DELETE exactly to confirm.");
      setTimeout(() => setToast(''), 3000);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div className="flex items-center space-x-3 mb-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="bg-indigo-100 p-3 rounded-xl text-indigo-600">
          <SettingsIcon className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Application Settings</h1>
          <p className="text-slate-500 text-sm">Manage configuration keys and business profiling.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-amber-500" />
            AI Assistant Configuration
          </h2>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Google Gemini API Key</label>
              <div className="relative flex">
                <input 
                  type={showKey ? 'text' : 'password'} 
                  value={apiKey} 
                  onChange={(e) => { setApiKey(e.target.value); setTestState('idle'); }}
                  className="w-full pl-4 pr-12 py-3 border border-slate-300 rounded-l-lg bg-slate-50 focus:ring-2 focus:ring-indigo-600 outline-none font-mono text-sm tracking-widest text-slate-800" 
                  placeholder="AIzaSy..."
                />
                <button 
                  type="button" 
                  onClick={() => setShowKey(!showKey)} 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showKey ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2 font-medium">Free API key milega: <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">aistudio.google.com/app/apikey</a>. Safely stored strictly in LocalStorage.</p>
            </div>
            
            <div className="pt-2 flex items-center gap-4">
              <button 
                onClick={testApiKey}
                disabled={testState === 'testing' || !apiKey}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {testState === 'testing' ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Test Connection'}
              </button>
              
              {testState === 'success' && (
                <span className="flex items-center text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-md border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 mr-1.5" /> API Key Verified
                </span>
              )}
              {testState === 'error' && (
                <span className="flex items-center text-sm font-bold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-md border border-rose-200">
                  <XCircle className="w-4 h-4 mr-1.5" /> Invalid Key or Network Error
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800">Business Profile Data</h2>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Company Name</label>
              <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Owner Name</label>
              <input type="text" value={ownerName} onChange={e => setOwnerName(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none" />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6">
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-md shadow-indigo-600/20 active:scale-[0.98] flex items-center gap-2"
            >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Save All Settings
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-500" />
            Data Management (Offline DB)
          </h2>
        </div>
        
        <div className="p-6 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-indigo-50 p-5 rounded-xl border border-indigo-100 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-indigo-900 flex flex-row items-center gap-2">
                  <DownloadCloud className="w-5 h-5" /> Export DB JSON
                </h3>
                <p className="text-sm text-indigo-700/70 mt-1">Saves all records natively directly to your device.</p>
              </div>
              <button onClick={handleExportData} className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg font-bold shadow-sm transition-colors text-sm w-full">
                Download Offline Backup
              </button>
            </div>
            
            <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-100 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-emerald-900 flex flex-row items-center gap-2">
                  <UploadCloud className="w-5 h-5" /> Restore Backup
                </h3>
                <p className="text-sm text-emerald-700/70 mt-1">Overwrite current state using a prior JSON.</p>
              </div>
              <input type="file" accept=".json" className="hidden" ref={fileInputRef} onChange={handleImportFile} />
              <button onClick={() => fileInputRef.current?.click()} className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-lg font-bold shadow-sm transition-colors text-sm w-full">
                Import JSON File
              </button>
            </div>
          </div>

          <div className="border border-rose-200 bg-rose-50 rounded-xl p-5">
            <h3 className="font-bold text-rose-900 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-rose-600" /> Danger: Reset Application
            </h3>
            <p className="text-sm text-rose-700/80 mt-1 mb-4">This drops immediately, wiping products, customers, and history. Please export primarily before clicking.</p>
            
            <div className="flex gap-3">
              <input 
                type="text" 
                value={deleteInput} 
                onChange={(e) => setDeleteInput(e.target.value)} 
                placeholder="Type 'HAAN DELETE'"
                className="flex-1 px-4 py-2 border border-rose-300 bg-white rounded-lg focus:ring-2 focus:ring-rose-500 outline-none text-rose-900 font-mono tracking-widest text-sm"
              />
              <button 
                onClick={handleDeleteData}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-6 py-2 rounded-lg transition-colors"
              >
                Execute
              </button>
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 z-[100] animate-fade-in flex items-center space-x-3 bg-slate-800 text-white px-6 py-4 rounded-xl shadow-2xl border border-slate-700">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="font-bold">{toast}</span>
        </div>
      )}
    </div>
  );
}
