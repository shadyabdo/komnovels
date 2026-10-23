import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Library from './pages/Library';
import Latest from './pages/Latest';
import NovelDetails from './pages/NovelDetails';
import ChapterReader from './pages/ChapterReader';

function AppContent() {
  const location = useLocation();
  const isReader = location.pathname.includes('/read/');

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      {!isReader && <Header />}
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/library" element={<Library />} />
          <Route path="/latest" element={<Latest />} />
          <Route path="/novel/:id" element={<NovelDetails />} />
          <Route path="/novel/:id/read/:volumeId/:chapterId" element={<ChapterReader />} />
        </Routes>
      </main>
      {!isReader && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
