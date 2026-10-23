import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getAllNovels, getAllChaptersWithNovels, Novel } from '../lib/database';
import Loading from '../components/Loading';

export default function Home() {
  const [novels, setNovels] = useState<Novel[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        console.log('🏠 Home: Loading novels...');
        const [n, c] = await Promise.all([getAllNovels(), getAllChaptersWithNovels()]);
        console.log('🏠 Home: Loaded', n.length, 'novels and', c.length, 'chapters');
        setNovels(n);
        setChapters(c.slice(0, 10));
      } catch (e) { 
        console.error('❌ Home: Error loading data:', e);
      } finally { 
        setLoading(false);
        console.log('🏠 Home: Loading complete');
      }
    })();
  }, []);

  if (loading) return <Loading text="جاري تحميل البيانات..." />;

  console.log('🏠 Home: Rendering with', novels.length, 'novels');

  const totalChapters = novels.reduce((a, n) => a + n.totalChapters, 0);

  return (
    <div>
      {/* Hero */}
      <section className="relative hero-pattern py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#1a1a1a]"></div>
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-[#c99649]/5 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-[#c99649]/3 rounded-full blur-[80px]"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-[#c99649]/10 border border-[#c99649]/20 rounded-full px-4 py-1.5 mb-6">
            <div className="w-2 h-2 bg-[#c99649] rounded-full animate-pulse"></div>
            <span className="text-[#c99649] text-xs font-medium">مرحباً بك في عالم الروايات</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-5 leading-tight">
            اقرأ رواياتك المفضلة
            <br />
            <span className="text-gold-gradient">بأسلوب مختلف</span>
          </h1>
          
          <p className="text-gray-400 text-base md:text-lg max-w-xl mx-auto mb-8 leading-relaxed">
            اكتشف مئات الروايات الخفيفة المترجمة مع تحديثات يومية وتجربة قراءة ممتعة
          </p>
          
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/library" className="bg-[#c99649] hover:bg-[#b8853a] text-white px-7 py-3 rounded-xl font-bold transition-all shadow-lg shadow-[#c99649]/20 hover:shadow-[#c99649]/40 flex items-center gap-2">
              <i className="fa-solid fa-book-open text-sm"></i>
              تصفح المكتبة
            </Link>
            <Link to="/latest" className="bg-white/5 hover:bg-white/10 text-white px-7 py-3 rounded-xl font-bold transition-all border border-white/10 flex items-center gap-2">
              <i className="fa-solid fa-clock-rotate-left text-sm"></i>
              آخر الإضافات
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 -mt-8 relative z-20">
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          {[
            { value: novels.length, label: 'رواية', icon: 'fa-book' },
            { value: totalChapters, label: 'فصل', icon: 'fa-file-lines' },
            { value: novels.reduce((a, n) => a + n.views, 0).toLocaleString(), label: 'مشاهدة', icon: 'fa-eye' },
          ].map((stat, i) => (
            <div key={i} className="bg-[#222] rounded-2xl p-4 md:p-5 border border-white/5 text-center">
              <i className={`fa-solid ${stat.icon} text-[#c99649] text-lg mb-2`}></i>
              <div className="text-2xl md:text-3xl font-black text-white">{stat.value}</div>
              <div className="text-gray-500 text-xs mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Latest Novels */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-[#c99649]/15 flex items-center justify-center">
                <i className="fa-solid fa-fire text-[#c99649] text-sm"></i>
              </span>
              أحدث الروايات
            </h2>
          </div>
          <Link to="/library" className="text-[#c99649] text-sm hover:underline flex items-center gap-1">
            عرض الكل
            <i className="fa-solid fa-chevron-left text-[10px]"></i>
          </Link>
        </div>

        {novels.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5">
            {novels.slice(0, 10).map(novel => (
              <Link
                key={String(novel.id)}
                to={`/novel/${novel.id}`}
                className="novel-card group rounded-2xl overflow-hidden bg-[#222] border border-white/5"
              >
                <div className="aspect-[3/4] relative overflow-hidden">
                  <img
                    src={novel.cover}
                    alt={novel.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="novel-card-overlay">
                    <div className="w-full">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-yellow-400 text-xs flex items-center gap-1">
                          <i className="fa-solid fa-star text-[10px]"></i>
                          {novel.rating}
                        </span>
                        <span className="text-gray-300 text-xs flex items-center gap-1">
                          <i className="fa-solid fa-eye text-[10px]"></i>
                          {novel.views >= 1000 ? `${(novel.views/1000).toFixed(0)}K` : novel.views}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {novel.genre.slice(0, 2).map(g => (
                          <span key={g} className="text-[10px] bg-white/10 text-white/80 px-2 py-0.5 rounded-full backdrop-blur-sm">{g}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  {/* Status Badge */}
                  <div className="absolute top-2 right-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium backdrop-blur-sm ${
                      novel.status === 'مستمرة' || novel.status === 'ongoing' 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}>
                      {novel.status}
                    </span>
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-bold text-white text-sm truncate">{novel.title}</h3>
                  <p className="text-gray-500 text-xs mt-1 truncate">{novel.author}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState icon="fa-book" text="لا توجد روايات متاحة" />
        )}
      </section>

      {/* Latest Chapters */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-[#c99649]/15 flex items-center justify-center">
              <i className="fa-solid fa-clock-rotate-left text-[#c99649] text-sm"></i>
            </span>
            آخر الفصول
          </h2>
          <Link to="/latest" className="text-[#c99649] text-sm hover:underline flex items-center gap-1">
            عرض الكل
            <i className="fa-solid fa-chevron-left text-[10px]"></i>
          </Link>
        </div>

        {chapters.length > 0 ? (
          <div className="bg-[#222] rounded-2xl border border-white/5 overflow-hidden divide-y divide-white/5">
            {chapters.map((item, i) => (
              <Link
                key={`${item.novel.id}-${item.chapter.id}-${i}`}
                to={`/novel/${item.novel.id}/read/${item.volume.id}/${item.chapter.id}`}
                className="flex items-center gap-4 p-4 hover:bg-white/[0.02] transition-colors group"
              >
                <img src={item.novel.cover} alt="" className="w-11 h-14 rounded-lg object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-white text-sm font-medium truncate group-hover:text-[#c99649] transition-colors">{item.novel.title}</h4>
                  <p className="text-[#c99649]/80 text-xs mt-0.5 truncate">{item.chapter.title}</p>
                </div>
                <span className="text-gray-600 text-xs flex-shrink-0 hidden sm:block">
                  {item.chapter.dateAdded ? new Date(item.chapter.dateAdded).toLocaleDateString('ar') : ''}
                </span>
                <i className="fa-solid fa-chevron-left text-gray-600 text-xs group-hover:text-[#c99649] transition-colors"></i>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState icon="fa-file-lines" text="لا توجد فصول متاحة" />
        )}
      </section>
    </div>
  );
}

function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
        <i className={`fa-solid ${icon} text-2xl text-gray-600`}></i>
      </div>
      <p className="text-gray-500">{text}</p>
    </div>
  );
}
