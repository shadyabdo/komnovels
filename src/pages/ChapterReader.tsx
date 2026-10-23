import { useParams, Link, useNavigate } from 'react-router-dom';
import { novels } from '../data/mockData';
import { useState, useEffect } from 'react';

type FontType = 'rubik' | 'cairo' | 'almarai' | 'tajawal';
type BgColor = '#212121' | '#333333' | '#2a2a2a';

export default function ChapterReader() {
  const { id, volumeId, chapterId } = useParams<{ id: string; volumeId: string; chapterId: string }>();
  const navigate = useNavigate();

  const [font, setFont] = useState<FontType>(() => {
    return (localStorage.getItem('reader-font') as FontType) || 'rubik';
  });
  const [bgColor, setBgColor] = useState<BgColor>(() => {
    return (localStorage.getItem('reader-bg') as BgColor) || '#333333';
  });
  const [settingsOpen, setSettingsOpen] = useState(false);

  const novel = novels.find(n => n.id === Number(id));
  const volume = novel?.volumes.find(v => v.id === Number(volumeId));
  const chapter = volume?.chapters.find(c => c.id === Number(chapterId));

  useEffect(() => {
    localStorage.setItem('reader-font', font);
  }, [font]);

  useEffect(() => {
    localStorage.setItem('reader-bg', bgColor);
  }, [bgColor]);

  if (!novel || !volume || !chapter) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <i className="fa-solid fa-file-lines text-6xl text-gray-600 mb-4"></i>
          <p className="text-gray-400 text-xl">الفصل غير موجود</p>
          <Link to={`/novel/${id}`} className="text-[#c99649] mt-4 inline-block hover:underline">
            العودة للرواية
          </Link>
        </div>
      </div>
    );
  }

  // Get all chapters for navigation
  const allChapters: { volumeId: number; chapterId: number; title: string }[] = [];
  novel.volumes.forEach(v => {
    v.chapters.forEach(c => {
      allChapters.push({ volumeId: v.id, chapterId: c.id, title: c.title });
    });
  });

  const currentIndex = allChapters.findIndex(
    c => c.volumeId === Number(volumeId) && c.chapterId === Number(chapterId)
  );
  const prevChapter = currentIndex > 0 ? allChapters[currentIndex - 1] : null;
  const nextChapter = currentIndex < allChapters.length - 1 ? allChapters[currentIndex + 1] : null;

  // Parse content to handle image URLs
  const renderContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, index) => {
      const trimmed = line.trim();
      // Check if line is an image URL
      if (trimmed.match(/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)/i)) {
        return (
          <div key={index} className="my-4">
            <img
              src={trimmed}
              alt={`صورة من الفصل`}
              className="max-w-full h-auto rounded-lg mx-auto shadow-lg"
              loading="lazy"
            />
          </div>
        );
      }
      // Empty line
      if (trimmed === '') {
        return <br key={index} />;
      }
      // Regular text
      return (
        <p key={index} className="mb-3 leading-[2] text-gray-200">
          {trimmed}
        </p>
      );
    });
  };

  const fontClass = `font-${font}`;

  const fonts: { value: FontType; label: string }[] = [
    { value: 'rubik', label: 'روبيك' },
    { value: 'cairo', label: 'كايرو' },
    { value: 'almarai', label: 'المراعي' },
    { value: 'tajawal', label: 'تجوال' },
  ];

  const bgColors: { value: BgColor; label: string }[] = [
    { value: '#212121', label: 'داكن جداً' },
    { value: '#333333', label: 'داكن' },
    { value: '#2a2a2a', label: 'رمادي' },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: bgColor }}>
      {/* Top Bar */}
      <div className="sticky top-0 z-40 bg-[#2a2a2a]/95 backdrop-blur-sm border-b border-[#4a4a4a] shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/novel/${id}`)}
              className="text-gray-400 hover:text-[#c99649] transition-colors"
            >
              <i className="fa-solid fa-arrow-right"></i>
            </button>
            <div className="hidden sm:block">
              <h2 className="text-white text-sm font-medium truncate max-w-[200px]">{novel.title}</h2>
              <p className="text-[#c99649] text-xs truncate max-w-[200px]">{chapter.title}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Settings Button */}
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                settingsOpen ? 'bg-[#c99649] text-white' : 'bg-[#3a3a3a] text-gray-400 hover:text-[#c99649]'
              }`}
            >
              <i className="fa-solid fa-gear"></i>
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {settingsOpen && (
          <div className="border-t border-[#4a4a4a] bg-[#2a2a2a] px-4 py-4">
            <div className="max-w-4xl mx-auto">
              {/* Font Selection */}
              <div className="mb-4">
                <label className="text-gray-400 text-sm mb-2 block">
                  <i className="fa-solid fa-font text-[#c99649] ml-2"></i>
                  نوع الخط
                </label>
                <div className="flex flex-wrap gap-2">
                  {fonts.map(f => (
                    <button
                      key={f.value}
                      onClick={() => setFont(f.value)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        font === f.value
                          ? 'bg-[#c99649] text-white'
                          : 'bg-[#3a3a3a] text-gray-300 hover:bg-[#4a4a4a]'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Background Color */}
              <div>
                <label className="text-gray-400 text-sm mb-2 block">
                  <i className="fa-solid fa-palette text-[#c99649] ml-2"></i>
                  لون الخلفية
                </label>
                <div className="flex flex-wrap gap-2">
                  {bgColors.map(bg => (
                    <button
                      key={bg.value}
                      onClick={() => setBgColor(bg.value)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                        bgColor === bg.value
                          ? 'bg-[#c99649] text-white'
                          : 'bg-[#3a3a3a] text-gray-300 hover:bg-[#4a4a4a]'
                      }`}
                    >
                      <span
                        className="w-4 h-4 rounded-full border border-gray-500"
                        style={{ backgroundColor: bg.value }}
                      ></span>
                      {bg.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chapter Content */}
      <article className={`max-w-4xl mx-auto px-4 md:px-8 py-8 ${fontClass}`}>
        {/* Chapter Title */}
        <div className="text-center mb-8 pb-6 border-b border-[#4a4a4a]">
          <Link to={`/novel/${id}`} className="text-[#c99649] hover:underline text-sm">
            {novel.title}
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-white mt-3">{chapter.title}</h1>
          <p className="text-gray-500 text-sm mt-2">
            {new Date(chapter.dateAdded).toLocaleDateString('ar', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>

        {/* Content */}
        <div className="chapter-content text-base md:text-lg leading-relaxed">
          {renderContent(chapter.content)}
        </div>

        {/* Chapter Navigation */}
        <div className="mt-12 pt-6 border-t border-[#4a4a4a]">
          <div className="flex items-center justify-between gap-4">
            {nextChapter ? (
              <button
                onClick={() => navigate(`/novel/${id}/volume/${nextChapter.volumeId}/chapter/${nextChapter.chapterId}`)}
                className="flex-1 bg-[#c99649] hover:bg-[#b8853a] text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <i className="fa-solid fa-arrow-right"></i>
                <span className="hidden sm:inline">الفصل التالي</span>
              </button>
            ) : (
              <div className="flex-1"></div>
            )}

            <Link
              to={`/novel/${id}`}
              className="bg-[#3a3a3a] hover:bg-[#4a4a4a] text-white py-3 px-4 rounded-lg font-medium transition-colors border border-[#4a4a4a] flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-list"></i>
              <span className="hidden sm:inline">الفهرس</span>
            </Link>

            {prevChapter ? (
              <button
                onClick={() => navigate(`/novel/${id}/volume/${prevChapter.volumeId}/chapter/${prevChapter.chapterId}`)}
                className="flex-1 bg-[#3a3a3a] hover:bg-[#4a4a4a] text-white py-3 px-4 rounded-lg font-medium transition-colors border border-[#4a4a4a] flex items-center justify-center gap-2"
              >
                <span className="hidden sm:inline">الفصل السابق</span>
                <i className="fa-solid fa-arrow-left"></i>
              </button>
            ) : (
              <div className="flex-1"></div>
            )}
          </div>
        </div>
      </article>
    </div>
  );
}
