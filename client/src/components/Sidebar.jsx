import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { 
  Home, 
  Package, 
  Users, 
  ShoppingCart, 
  Banknote, 
  Factory, 
  BarChart3, 
  Sparkles, 
  Settings,
  CheckCircle2,
  Tag,
  PackageSearch,
  ShieldAlert
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: Home },
  { path: '/stock', label: 'Stock / भंडार', icon: PackageSearch },
  { path: '/products', label: 'Products / सूची', icon: Package },
  { path: '/customers', label: 'Customers / ग्राहक', icon: Users },
  { path: '/customers/scores', label: 'Risk Scores', icon: ShieldAlert },
  { path: '/pricing', label: 'Pricing Engine / मूल्य निर्धारण', icon: Tag },
  { path: '/sales', label: 'Sales / बिक्री', icon: ShoppingCart },
  { path: '/payments', label: 'Payments / भुगतान', icon: Banknote },
  { path: '/batches', label: 'Batches / बैच', icon: Factory },
  { path: '/reports', label: 'Reports / रिपोर्ट', icon: BarChart3 },
  { path: '/ai', label: 'AI Assistant / AI सहायक', icon: Sparkles },
];

export default function Sidebar() {
  const { data } = useStore();
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    setShowSaved(true);
    const timer = setTimeout(() => setShowSaved(false), 1500);
    return () => clearTimeout(timer);
  }, [data]);
  return (
    <aside className="w-20 md:w-64 transition-all duration-300 bg-slate-900 text-slate-300 flex flex-col h-screen fixed top-0 left-0 z-50">
      <div className="p-4 md:p-6 text-center md:text-left">
        <h1 className="text-xl md:text-2xl font-bold text-white tracking-wider flex justify-center md:justify-start">
          <span className="hidden md:inline">VYAPAAR</span>
          <span className="inline md:hidden border border-white rounded px-2">V</span>
        </h1>
        <p className="text-[10px] md:text-xs text-slate-400 mt-1 hidden md:block">Management System</p>
      </div>
      
      <nav className="flex-1 px-2 md:px-4 space-y-2 mt-4 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => 
              `flex items-center justify-center md:justify-start px-2 md:px-4 py-3 rounded-lg transition-colors ${
                isActive ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 hover:text-white'
              }`
            }
            title={item.label}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium text-sm ml-3 hidden md:block whitespace-nowrap">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-2 md:p-4 border-t border-slate-800">
        <NavLink
            to="/settings"
            className={({ isActive }) => 
              `flex items-center justify-center md:justify-start px-2 md:px-4 py-3 rounded-lg transition-colors ${
                isActive ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 hover:text-white'
              }`
            }
            title="Settings"
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium text-sm ml-3 hidden md:block whitespace-nowrap">Settings / सेटिंग</span>
        </NavLink>
        <div className={`mt-3 flex items-center justify-center md:justify-start px-2 md:px-4 gap-2 text-xs font-bold text-emerald-500 transition-opacity duration-300 ${showSaved ? 'opacity-100' : 'opacity-0'}`}>
          <CheckCircle2 className="w-4 h-4" />
          <span className="hidden md:inline">Saved ✓</span>
        </div>
      </div>
    </aside>
  );
}
