import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-[#111111] border-t border-white/5 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#c99649] to-[#a67a35] flex items-center justify-center">
                <i className="fa-solid fa-book-open text-white text-sm"></i>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">كوم روايات</h3>
                <p className="text-[10px] text-[#c99649]">KOOM NOVELS</p>
              </div>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed">
              وجهتك الأولى لقراءة أفضل الروايات الخفيفة المترجمة إلى العربية.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-bold mb-4 text-sm">روابط سريعة</h4>
            <div className="flex flex-col gap-2">
              <Link to="/" className="text-gray-500 hover:text-[#c99649] text-sm transition-colors">الرئيسية</Link>
              <Link to="/library" className="text-gray-500 hover:text-[#c99649] text-sm transition-colors">المكتبة</Link>
              <Link to="/latest" className="text-gray-500 hover:text-[#c99649] text-sm transition-colors">آخر الإضافات</Link>
            </div>
          </div>

          {/* Social */}
          <div>
            <h4 className="text-white font-bold mb-4 text-sm">تابعنا</h4>
            <div className="flex gap-3">
              <a href="#" className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 hover:text-[#c99649] hover:bg-[#c99649]/10 transition-all">
                <i className="fa-brands fa-discord text-sm"></i>
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 hover:text-[#c99649] hover:bg-[#c99649]/10 transition-all">
                <i className="fa-brands fa-telegram text-sm"></i>
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 hover:text-[#c99649] hover:bg-[#c99649]/10 transition-all">
                <i className="fa-brands fa-twitter text-sm"></i>
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 hover:text-[#c99649] hover:bg-[#c99649]/10 transition-all">
                <i className="fa-brands fa-instagram text-sm"></i>
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 mt-8 pt-6 text-center">
          <p className="text-gray-600 text-xs">
            © 2024 كوم روايات. جميع الحقوق محفوظة.
          </p>
        </div>
      </div>
    </footer>
  );
}
