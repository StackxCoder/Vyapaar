import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { 
  Home, Package, Users, ShoppingCart, Banknote, Factory, 
  BarChart3, Sparkles, Settings, PackageSearch, ShieldAlert,
  LogOut
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: Home },
  { path: '/stock', label: 'Stock / भंडार', icon: PackageSearch },
  { path: '/products', label: 'Products / सूची', icon: Package },
  { path: '/customers', label: 'Customers / ग्राहक', icon: Users },
  { path: '/customers/scores', label: 'Risk Scores', icon: ShieldAlert },
  { path: '/pricing', label: 'Pricing / मूल्य', icon: PackageSearch },
  { path: '/sales', label: 'Sales / बिक्री', icon: ShoppingCart },
  { path: '/payments', label: 'Payments', icon: Banknote },
  { path: '/batches', label: 'Batches / बैच', icon: Factory },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
  { path: '/ai', label: 'AI Saathi', icon: Sparkles },
];

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="w-20 md:w-64 transition-all duration-300 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col h-screen fixed top-0 left-0 z-50">
      <div className="p-4 md:p-6 text-center md:text-left flex items-center justify-center md:justify-start gap-3">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-bold text-white uppercase shadow-lg shadow-indigo-600/20">
          {user?.companyName?.charAt(0) || 'M'}
        </div>
        <div className="hidden md:block overflow-hidden">
          <h1 className="text-[15px] font-bold text-slate-100 truncate w-full tracking-tight leading-tight">
            {user?.companyName || 'Mera Vyapaar'}
          </h1>
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-widest mt-0.5">Management</p>
        </div>
      </div>
      
      <nav className="flex-1 px-3 space-y-1 mt-2 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => 
              `flex items-center justify-center md:justify-start px-2 md:px-3 py-2.5 rounded-[10px] transition-all duration-200 group ${
                isActive 
                ? 'bg-indigo-600/10 text-indigo-400 font-semibold' 
                : 'hover:bg-slate-800 hover:text-slate-200 text-slate-400 font-medium'
              }`
            }
            title={item.label}
          >
            <item.icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110`} />
            <span className="text-[14px] ml-3 hidden md:block whitespace-nowrap">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-slate-800/50">
        <NavLink
            to="/settings"
            className={({ isActive }) => 
              `flex items-center justify-center md:justify-start px-2 md:px-3 py-2.5 rounded-[10px] transition-all duration-200 group ${
                isActive ? 'bg-slate-800 text-white font-semibold' : 'hover:bg-slate-800/50 hover:text-slate-200 text-slate-400 font-medium'
              }`
            }
            title="Settings"
          >
            <Settings className="w-5 h-5 flex-shrink-0 group-hover:rotate-45 transition-transform duration-300" />
            <span className="text-[14px] ml-3 hidden md:block whitespace-nowrap">Settings</span>
        </NavLink>
        
        {/* User Card */}
        <div className="mt-4 p-3 bg-slate-800/40 rounded-xl hidden md:flex items-center justify-between group hover:bg-slate-800/60 transition-colors border border-slate-700/50">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 uppercase shrink-0">
              {user?.ownerName?.charAt(0) || 'O'}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-slate-200 truncate">{user?.ownerName || 'Owner'}</span>
              <span className="text-[10px] text-slate-500 truncate">{user?.email || 'email@example.com'}</span>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="p-1.5 text-slate-400 hover:text-pink-500 hover:bg-pink-500/10 rounded-lg transition-colors shrink-0"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
        
        {/* Mobile Logout (Icon Only) */}
        <button 
            onClick={handleLogout}
            className="mt-2 w-full flex md:hidden items-center justify-center p-2.5 text-slate-500 hover:text-pink-500 hover:bg-pink-500/10 rounded-lg transition-colors"
            title="Logout"
          >
            <LogOut size={20} />
        </button>
      </div>
    </aside>
  );
}
