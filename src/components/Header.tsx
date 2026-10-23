import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';

export default function Header() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { path: '/', label: 'الرئيسية', icon: 'fa-home' },
    { path: '/library', label: 'المكتبة', icon: 'fa-book' },
    { path: '/latest', label: 'آخر الإضافات', icon: 'fa-clock' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-[#2a2a2a] border-b border-[#4a4a4a] sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-[#c99649] rounded-lg flex items-center justify-center">
              <i className="fa-solid fa-book-open text-white text-lg"></i>
            </div>
            <span className="text-xl font-bold text-[#c99649]">كوم روايات</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 ${
                  isActive(link.path)
                    ? 'bg-[#c99649] text-white'
                    : 'text-gray-300 hover:bg-[#3a3a3a] hover:text-[#c99649]'
                }`}
              >
                <i className={`fa-solid ${link.icon} text-sm`}></i>
                <span className="font-medium">{link.label}</span>
              </Link>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-gray-300 hover:text-[#c99649] p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <i className={`fa-solid ${mobileMenuOpen ? 'fa-xmark' : 'fa-bars'} text-xl`}></i>
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden pb-4 border-t border-[#4a4a4a] pt-4">
            {navLinks.map(link => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-3 rounded-lg flex items-center gap-3 transition-all duration-200 ${
                  isActive(link.path)
                    ? 'bg-[#c99649] text-white'
                    : 'text-gray-300 hover:bg-[#3a3a3a] hover:text-[#c99649]'
                }`}
              >
                <i className={`fa-solid ${link.icon}`}></i>
                <span className="font-medium">{link.label}</span>
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
