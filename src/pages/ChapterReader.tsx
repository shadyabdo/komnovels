import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getChapterContent, getNovelById, Novel, Chapter, Volume } from '../lib/database';

type FontType = 'rubik' | 'cairo' | 'almarai' | 'tajawal';
type BgColor = '#212121' | '#333333' | '#2a2a2a';

export default function ChapterReader() {
  const { id, volumeId, chapterId } = useParams<{ id: string; volumeId: string; chapterId: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<{ novel: Novel; chapter: Chapter; volume: Volume } | null>(null);
  const [loading, setLoading] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [font, setFont] = useState<FontType>(() => (localStorage.getItem('koom-font') as FontType) || 'rubik');
  const [bgColor, setBgColor] = useState<BgColor>(() => (localStorage.getItem('koom-bg') as BgColor) || '#333333');
  const [fontSize, setFontSize] = useState<number>(() => Number(localStorage.getItem('koom-fs')) || 17);

  useEffect(() => { localStorage.setItem('koom-font', font); }, [font]);
  useEffect(() => { localStorage.setItem('koom-bg', bgColor); }, [bgColor]);
  useEffect(() => { localStorage.setItem('koom-fs', String(fontSize)); }, [fontSize]);

  useEffect(() => {
    (async () => {
      if (!id || !volumeId || !chapterId) return;
      setLoading(true);
      try {
        const result = await getChapterContent(id, volumeId, chapterId);
        setData(result);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
    window.scrollTo(0, 0);
  }, [id, volumeId, chapterId]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: bgColor }}>
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-[#c99649] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-400 text-sm">جاري تحميل الفصل...</p>
      </div>
    </div>
  );

  if (!data) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: bgColor }}>
      <div className="text-center">
        <i className="fa-solid fa-file-circle-xmark text-5xl text-gray-600 mb-4"></i>
        <p className="text-gray-400">الفصل غير موجود</p>
        <Link to={`/novel/${id}`} className="text-[#c99649] mt-3 inline-block hover:underline text-sm">العودة للرواية</Link>
      </div>
    </div>
  );

  const { novel, chapter, volume } = data;

  // Navigation
  const allChapters: { volumeId: any; chapterId: any; title: string }[] = [];
  novel.volumes.forEach(v => v.chapters.forEach(c => allChapters.push({ volumeId: v.id, chapterId: c.id, title: c.title })));
  const currentIdx = allChapters.findIndex(c => String(c.volumeId) === String(volumeId) && String(c.chapterId) === String(chapterId));
  const prevCh = currentIdx > 0 ? allChapters[currentIdx - 1] : null;
  const nextCh = currentIdx < allChapters.length - 1 ? allChapters[currentIdx + 1] : null;

  // Render content with images
  const renderContent = (content: string) => {
    if (!content) return <p className="text-gray-500 text-center py-10">لا يوجد محتوى</p>;
    
    return content.split('\n').map((line, i) => {
      const t = line.trim();
      
      // Check if line is an image URL (support many formats)
      const isImage = 
        t.match(/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i) ||
        t.match(/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i) ||
        (t.startsWith('http') && (
          t.includes('firebasestorage.googleapis.com') ||
          t.includes('storage.googleapis.com') ||
          t.includes('imgur.com') ||
          t.includes('i.imgur.com') ||
          t.includes('cdn.') ||
          t.includes('/image') ||
          t.includes('/img/') ||
          t.includes('/photo')
        )) ||
        // Support Firebase Storage URLs
        t.match(/^https:\/\/firebasestorage\.googleapis\.com\//i) ||
        // Support any URL that looks like an image host
        (t.startsWith('http') && t.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)/i));
      
      if (isImage) {
        return (
          <div key={i} className="my-5">
            <img 
              src={t} 
              alt="" 
              className="max-w-full h-auto rounded-xl mx-auto shadow-xl" 
              loading="lazy"
              onError={(e) => {
                console.error('Image failed to load:', t);
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        );
      }
      
      if (t === '') return <div key={i} className="h-4" />;
      return <p key={i} className="mb-4 leading-[2] text-gray-200">{t}</p>;
    });
  };

  const fonts: { value: FontType; label: string }[] = [
    { value: 'rubik', label: 'روبيك' },
    { value: 'cairo', label: 'كايرو' },
    { value: 'almarai', label: 'المراعي' },
    { value: 'tajawal', label: 'تجوال' },
  ];

  const bgs: { value: BgColor; label: string }[] = [
    { value: '#212121', label: 'أسود' },
    { value: '#333333', label: 'رمادي' },
    { value: '#2a2a2a', label: 'داكن' },
  ];

  return (
    <div className="min-h-screen font-rubik" style={{ backgroundColor: bgColor }}>
      {/* Top Bar */}
      <div className="sticky top-0 z-50 glass border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => navigate(`/novel/${id}`)} className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-colors flex-shrink-0">
              <i className="fa-solid fa-arrow-right text-sm"></i>
            </button>
            <div className="min-w-0 hidden sm:block">
              <h2 className="text-white text-sm font-medium truncate">{novel.title}</h2>
              <p className="text-[#c99649] text-xs truncate">{chapter.title}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Font size controls */}
            <div className="hidden sm:flex items-center gap-1 bg-white/5 rounded-xl p-1">
              <button onClick={() => setFontSize(s => Math.max(14, s - 1))} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-white text-xs transition-colors">
                <i className="fa-solid fa-minus"></i>
              </button>
              <span className="text-gray-400 text-xs w-6 text-center">{fontSize}</span>
              <button onClick={() => setFontSize(s => Math.min(24, s + 1))} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-white text-xs transition-colors">
                <i className="fa-solid fa-plus"></i>
              </button>
            </div>

            {/* Settings */}
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                settingsOpen ? 'bg-[#c99649] text-white' : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              <i className="fa-solid fa-gear text-sm"></i>
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {settingsOpen && (
          <div className="border-t border-white/5 bg-[#1e1e1e] px-4 py-5 animate-fadeIn">
            <div className="max-w-4xl mx-auto space-y-5">
              {/* Font */}
              <div>
                <label className="text-gray-400 text-xs font-medium mb-2.5 block flex items-center gap-2">
                  <i className="fa-solid fa-font text-[#c99649]"></i>
                  نوع الخط
                </label>
                <div className="flex flex-wrap gap-2">
                  {fonts.map(f => (
                    <button
                      key={f.value}
                      onClick={() => setFont(f.value)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all font-${f.value} ${
                        font === f.value ? 'bg-[#c99649] text-white shadow-lg shadow-[#c99649]/20' : 'bg-white/5 text-gray-300 hover:bg-white/10'
                      }`}
                    >{f.label}</button>
                  ))}
                </div>
              </div>

              {/* Background */}
              <div>
                <label className="text-gray-400 text-xs font-medium mb-2.5 block flex items-center gap-2">
                  <i className="fa-solid fa-palette text-[#c99649]"></i>
                  لون الخلفية
                </label>
                <div className="flex flex-wrap gap-2">
                  {bgs.map(bg => (
                    <button
                      key={bg.value}
                      onClick={() => setBgColor(bg.value)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                        bgColor === bg.value ? 'bg-[#c99649] text-white shadow-lg shadow-[#c99649]/20' : 'bg-white/5 text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: bg.value }}></span>
                      {bg.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Size (Mobile) */}
              <div className="sm:hidden">
                <label className="text-gray-400 text-xs font-medium mb-2.5 block flex items-center gap-2">
                  <i className="fa-solid fa-text-height text-[#c99649]"></i>
                  حجم الخط: {fontSize}px
                </label>
                <input
                  type="range"
                  min="14"
                  max="24"
                  value={fontSize}
                  onChange={e => setFontSize(Number(e.target.value))}
                  className="w-full accent-[#c99649]"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <article className={`max-w-3xl mx-auto px-5 md:px-8 py-10 font-${font}`} style={{ fontSize: `${fontSize}px` }}>
        {/* Title */}
        <div className="text-center mb-10 pb-8 border-b border-white/10">
          <Link to={`/novel/${id}`} className="text-[#c99649] hover:underline text-sm">{novel.title}</Link>
          <h1 className="text-2xl md:text-3xl font-black text-white mt-3">{chapter.title}</h1>
          <p className="text-gray-600 text-xs mt-3">
            {chapter.dateAdded ? new Date(chapter.dateAdded).toLocaleDateString('ar', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
          </p>
        </div>

        {/* Body */}
        <div className="chapter-content">
          {renderContent(chapter.content)}
        </div>

        {/* Navigation */}
        <div className="mt-14 pt-8 border-t border-white/10">
          <div className="flex items-center gap-3">
            {nextCh ? (
              <button
                onClick={() => navigate(`/novel/${id}/read/${nextCh.volumeId}/${nextCh.chapterId}`)}
                className="flex-1 bg-[#c99649] hover:bg-[#b8853a] text-white py-3.5 px-4 rounded-xl font-bold text-sm transition-all shadow-lg shadow-[#c99649]/20 flex items-center justify-center gap-2"
              >
                <i className="fa-solid fa-arrow-right text-xs"></i>
                <span className="hidden sm:inline">الفصل التالي</span>
                <span className="sm:hidden">التالي</span>
              </button>
            ) : <div className="flex-1"></div>}

            <Link
              to={`/novel/${id}`}
              className="bg-white/5 hover:bg-white/10 text-white py-3.5 px-4 rounded-xl font-medium text-sm transition-all border border-white/10 flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-list text-xs"></i>
              <span className="hidden sm:inline">الفهرس</span>
            </Link>

            {prevCh ? (
              <button
                onClick={() => navigate(`/novel/${id}/read/${prevCh.volumeId}/${prevCh.chapterId}`)}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white py-3.5 px-4 rounded-xl font-medium text-sm transition-all border border-white/10 flex items-center justify-center gap-2"
              >
                <span className="hidden sm:inline">الفصل السابق</span>
                <span className="sm:hidden">السابق</span>
                <i className="fa-solid fa-arrow-left text-xs"></i>
              </button>
            ) : <div className="flex-1"></div>}
          </div>
        </div>
      </article>
    </div>
  );
}
