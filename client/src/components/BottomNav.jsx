import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, FileText, Users, Box, Menu, X, CheckSquare, Settings, Activity, Sparkles, Package, Tag, ShieldAlert } from 'lucide-react';

export default function BottomNav() {
  const [showMore, setShowMore] = useState(false);

  const mainLinks = [
    { name: 'Dashboard', path: '/', icon: Home },
    { name: 'Sales', path: '/sales', icon: FileText },
    { name: 'Customers', path: '/customers', icon: Users },
    { name: 'Products', path: '/products', icon: Box },
  ];

  const moreLinks = [
    { name: 'Risk Scores', path: '/customers/scores', icon: ShieldAlert },
    { name: 'Pricing', path: '/pricing', icon: Tag },
    { name: 'Stock', path: '/stock', icon: Package },
    { name: 'Reports', path: '/reports', icon: Activity },
    { name: 'Batches', path: '/batches', icon: CheckSquare },
    { name: 'AI Assistant', path: '/ai', icon: Sparkles },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 flex justify-between items-center px-2 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] text-xs">
        {mainLinks.map(link => (
          <NavLink
            key={link.name}
            to={link.path}
            onClick={() => setShowMore(false)}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full min-h-[56px] space-y-1 transition-colors ${
                isActive ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-indigo-500'
              }`
            }
          >
            <link.icon className="w-5 h-5" />
            <span>{link.name}</span>
          </NavLink>
        ))}
        <button
          onClick={() => setShowMore(!showMore)}
          className={`flex flex-col items-center justify-center w-full min-h-[56px] space-y-1 transition-colors ${
            showMore ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-indigo-500'
          }`}
        >
          {showMore ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          <span>More</span>
        </button>
      </nav>

      {/* Slide UP Drawer */}
      {showMore && (
        <div className="md:hidden fixed inset-0 z-40 bg-slate-900/40" onClick={() => setShowMore(false)}>
          <div className="absolute bottom-[56px] left-0 right-0 bg-white rounded-t-2xl p-4 shadow-xl border-t border-slate-100" onClick={e => e.stopPropagation()}>
            <div className="grid grid-cols-4 gap-4 pb-safe text-xs">
              {moreLinks.map(link => (
                <NavLink
                  key={link.name}
                  to={link.path}
                  onClick={() => setShowMore(false)}
                  className={({ isActive }) =>
                    `flex flex-col items-center justify-center p-3 rounded-xl transition-colors min-h-[64px] ${
                      isActive ? 'bg-indigo-50 text-indigo-600 font-bold' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`
                  }
                >
                  <link.icon className="w-5 h-5 mb-1" />
                  <span className="text-center">{link.name}</span>
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
