import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import Library from './pages/Library';
import LatestUpdates from './pages/LatestUpdates';
import NovelDetails from './pages/NovelDetails';
import ChapterReader from './pages/ChapterReader';

function Footer() {
  return (
    <footer className="bg-[#2a2a2a] border-t border-[#4a4a4a] py-8 mt-12">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-8 h-8 bg-[#c99649] rounded-lg flex items-center justify-center">
            <i className="fa-solid fa-book-open text-white text-sm"></i>
          </div>
          <span className="text-lg font-bold text-[#c99649]">كوم روايات</span>
        </div>
        <p className="text-gray-400 text-sm">
          وجهتك الأولى لقراءة أفضل الروايات الخفيفة
        </p>
        <div className="flex items-center justify-center gap-4 mt-4">
          <a href="#" className="text-gray-400 hover:text-[#c99649] transition-colors">
            <i className="fa-brands fa-twitter text-lg"></i>
          </a>
          <a href="#" className="text-gray-400 hover:text-[#c99649] transition-colors">
            <i className="fa-brands fa-discord text-lg"></i>
          </a>
          <a href="#" className="text-gray-400 hover:text-[#c99649] transition-colors">
            <i className="fa-brands fa-telegram text-lg"></i>
          </a>
        </div>
        <p className="text-gray-600 text-xs mt-4">
          © 2024 كوم روايات. جميع الحقوق محفوظة.
        </p>
      </div>
    </footer>
  );
}

function Layout() {
  const location = useLocation();
  const isChapterReader = location.pathname.includes('/chapter/');

  return (
    <div className="min-h-screen bg-[#333333] font-rubik">
      {!isChapterReader && <Header />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/library" element={<Library />} />
        <Route path="/latest" element={<LatestUpdates />} />
        <Route path="/novel/:id" element={<NovelDetails />} />
        <Route path="/novel/:id/volume/:volumeId/chapter/:chapterId" element={<ChapterReader />} />
      </Routes>
      {!isChapterReader && <Footer />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <Layout />
    </Router>
  );
}

export default App;
