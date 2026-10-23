import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';

export default function Header() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { to: '/', label: 'الرئيسية', icon: 'fa-house' },
    { to: '/library', label: 'المكتبة', icon: 'fa-book' },
    { to: '/latest', label: 'آخر الإضافات', icon: 'fa-clock-rotate-left' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 glass border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#c99649] to-[#a67a35] flex items-center justify-center shadow-lg shadow-[#c99649]/20 group-hover:shadow-[#c99649]/40 transition-shadow">
                <i className="fa-solid fa-book-open text-white text-sm"></i>
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[#1a1a1a]"></div>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-tight">كوم روايات</h1>
              <p className="text-[10px] text-[#c99649] font-medium -mt-0.5">KOOM NOVELS</p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {links.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  isActive(link.to)
                    ? 'bg-[#c99649]/15 text-[#c99649] border border-[#c99649]/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <i className={`fa-solid ${link.icon} text-xs`}></i>
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Mobile Toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-300 hover:text-white transition-colors"
          >
            <i className={`fa-solid ${menuOpen ? 'fa-xmark' : 'fa-bars'} text-lg`}></i>
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <nav className="md:hidden pb-4 pt-2 border-t border-white/5 animate-fadeIn">
            {links.map(link => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive(link.to)
                    ? 'bg-[#c99649]/15 text-[#c99649]'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <i className={`fa-solid ${link.icon} w-5 text-center`}></i>
                {link.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
