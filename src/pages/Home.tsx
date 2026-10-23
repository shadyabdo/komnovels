import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { fetchNovels, fetchLatestNovels, fetchAllChapters, Novel } from '../firebase/service';

export default function Home() {
  const [novels, setNovels] = useState<Novel[]>([]);
  const [latestChapters, setLatestChapters] = useState<{ novel: Novel; volume: any; chapter: any }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [novelsData, chaptersData] = await Promise.all([
          fetchLatestNovels(),
          fetchAllChapters()
        ]);
        setNovels(novelsData);
        setLatestChapters(chaptersData.slice(0, 8));
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#c99649] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  const latestNovels = novels.slice(0, 8);
  const totalChapters = novels.reduce((acc, n) => acc + n.volumes.reduce((a, v) => a + v.chapters.length, 0), 0);
  const totalViews = novels.reduce((acc, n) => acc + n.views, 0);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-l from-[#2a2a2a] to-[#333333] py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-32 h-32 bg-[#c99649] rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 left-10 w-48 h-48 bg-[#c99649] rounded-full blur-3xl"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              مرحباً بك في <span className="text-[#c99649]">كوم روايات</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              وجهتك الأولى لقراءة أفضل الروايات الخفيفة المترجمة. استمتع بآلاف الفصول المحدثة يومياً.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                to="/library"
                className="bg-[#c99649] hover:bg-[#b8853a] text-white px-8 py-3 rounded-lg font-bold transition-all duration-200 flex items-center gap-2"
              >
                <i className="fa-solid fa-book"></i>
                تصفح المكتبة
              </Link>
              <Link
                to="/latest"
                className="bg-[#3a3a3a] hover:bg-[#4a4a4a] text-white px-8 py-3 rounded-lg font-bold transition-all duration-200 border border-[#4a4a4a] flex items-center gap-2"
              >
                <i className="fa-solid fa-clock"></i>
                آخر الإضافات
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-[#2a2a2a] py-8 border-y border-[#4a4a4a]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-4">
              <div className="text-3xl font-bold text-[#c99649]">{novels.length}</div>
              <div className="text-gray-400 mt-1">رواية</div>
            </div>
            <div className="p-4">
              <div className="text-3xl font-bold text-[#c99649]">{totalChapters}</div>
              <div className="text-gray-400 mt-1">فصل</div>
            </div>
            <div className="p-4">
              <div className="text-3xl font-bold text-[#c99649]">
                {totalViews.toLocaleString('ar')}
              </div>
              <div className="text-gray-400 mt-1">مشاهدة</div>
            </div>
            <div className="p-4">
              <div className="text-3xl font-bold text-[#c99649]">
                {novels.filter(n => n.status === 'مستمرة' || n.status === 'ongoing').length}
              </div>
              <div className="text-gray-400 mt-1">رواية مستمرة</div>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Novels */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <i className="fa-solid fa-sparkles text-[#c99649]"></i>
            أحدث الروايات
          </h2>
          <Link to="/library" className="text-[#c99649] hover:text-[#b8853a] flex items-center gap-1 transition-colors">
            عرض الكل
            <i className="fa-solid fa-arrow-left text-sm"></i>
          </Link>
        </div>
        {latestNovels.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {latestNovels.map(novel => (
              <Link
                key={novel.id}
                to={`/novel/${novel.id}`}
                className="novel-card bg-[#2a2a2a] rounded-xl overflow-hidden border border-[#4a4a4a] hover:border-[#c99649]"
              >
                <div className="aspect-[3/4] overflow-hidden">
                  <img
                    src={novel.cover}
                    alt={novel.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3">
                  <h3 className="font-bold text-white text-sm md:text-base truncate">{novel.title}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-yellow-400 text-xs flex items-center gap-1">
                      <i className="fa-solid fa-star"></i>
                      {novel.rating}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      novel.status === 'مستمرة' || novel.status === 'ongoing' ? 'bg-green-900/50 text-green-400' : 'bg-blue-900/50 text-blue-400'
                    }`}>
                      {novel.status}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <i className="fa-solid fa-book-open text-5xl text-gray-600 mb-4"></i>
            <p className="text-gray-400">لا توجد روايات متاحة حالياً</p>
          </div>
        )}
      </section>

      {/* Latest Chapters */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <i className="fa-solid fa-clock text-[#c99649]"></i>
            آخر الفصول المضافة
          </h2>
          <Link to="/latest" className="text-[#c99649] hover:text-[#b8853a] flex items-center gap-1 transition-colors">
            عرض الكل
            <i className="fa-solid fa-arrow-left text-sm"></i>
          </Link>
        </div>
        {latestChapters.length > 0 ? (
          <div className="bg-[#2a2a2a] rounded-xl border border-[#4a4a4a] overflow-hidden">
            {latestChapters.map((item, index) => (
              <Link
                key={`${item.novel.id}-${item.chapter.id}`}
                to={`/novel/${item.novel.id}/volume/${item.volume.id}/chapter/${item.chapter.id}`}
                className={`flex items-center gap-4 p-4 hover:bg-[#3a3a3a] transition-colors ${
                  index !== latestChapters.length - 1 ? 'border-b border-[#4a4a4a]' : ''
                }`}
              >
                <img
                  src={item.novel.cover}
                  alt={item.novel.title}
                  className="w-12 h-16 rounded-lg object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-medium text-sm md:text-base truncate">{item.novel.title}</h4>
                  <p className="text-[#c99649] text-sm truncate">{item.chapter.title}</p>
                </div>
                <div className="text-gray-400 text-xs flex-shrink-0">
                  {item.chapter.dateAdded ? new Date(item.chapter.dateAdded).toLocaleDateString('ar') : ''}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <i className="fa-solid fa-file-lines text-5xl text-gray-600 mb-4"></i>
            <p className="text-gray-400">لا توجد فصول متاحة حالياً</p>
          </div>
        )}
      </section>
    </div>
  );
}
