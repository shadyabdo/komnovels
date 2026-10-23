import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getLatestNovels, getAllChaptersWithNovels, Novel } from '../lib/database';
import Loading from '../components/Loading';

export default function Latest() {
  const [novels, setNovels] = useState<Novel[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'chapters' | 'novels'>('chapters');

  useEffect(() => {
    (async () => {
      try {
        const [n, c] = await Promise.all([getLatestNovels(), getAllChaptersWithNovels()]);
        setNovels(n);
        setChapters(c);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <Loading text="جاري تحميل آخر الإضافات..." />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-[#c99649]/15 flex items-center justify-center">
            <i className="fa-solid fa-clock-rotate-left text-[#c99649]"></i>
          </span>
          آخر الإضافات
        </h1>
        <p className="text-gray-500 text-sm mt-2">آخر الروايات والفصول المضافة للموقع</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-[#222] rounded-xl p-1 border border-white/5 w-fit">
        <button
          onClick={() => setTab('chapters')}
          className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
            tab === 'chapters' ? 'bg-[#c99649] text-white shadow-lg shadow-[#c99649]/20' : 'text-gray-400 hover:text-white'
          }`}
        >
          <i className="fa-solid fa-file-lines text-xs"></i>
          آخر الفصول
        </button>
        <button
          onClick={() => setTab('novels')}
          className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
            tab === 'novels' ? 'bg-[#c99649] text-white shadow-lg shadow-[#c99649]/20' : 'text-gray-400 hover:text-white'
          }`}
        >
          <i className="fa-solid fa-sparkles text-xs"></i>
          آخر الروايات
        </button>
      </div>

      {/* Chapters Tab */}
      {tab === 'chapters' && (
        <div>
          {chapters.length > 0 ? (
            <div className="bg-[#222] rounded-2xl border border-white/5 overflow-hidden divide-y divide-white/5">
              {chapters.map((item, i) => (
                <Link
                  key={`${item.novel.id}-${item.chapter.id}-${i}`}
                  to={`/novel/${item.novel.id}/read/${item.volume.id}/${item.chapter.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-white/[0.02] transition-colors group"
                >
                  <img src={item.novel.cover} alt="" className="w-12 h-16 rounded-lg object-cover flex-shrink-0 shadow-lg" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white text-sm font-medium truncate group-hover:text-[#c99649] transition-colors">{item.novel.title}</h4>
                    <p className="text-[#c99649]/80 text-xs mt-1 truncate">{item.chapter.title}</p>
                    <p className="text-gray-600 text-[11px] mt-1">{item.volume.title}</p>
                  </div>
                  <div className="text-left flex-shrink-0">
                    <span className="text-gray-500 text-xs block">
                      {item.chapter.dateAdded ? new Date(item.chapter.dateAdded).toLocaleDateString('ar') : ''}
                    </span>
                    <i className="fa-solid fa-chevron-left text-gray-600 text-xs mt-2 group-hover:text-[#c99649] transition-colors"></i>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <i className="fa-solid fa-file-lines text-4xl text-gray-600 mb-3"></i>
              <p className="text-gray-500">لا توجد فصول متاحة</p>
            </div>
          )}
        </div>
      )}

      {/* Novels Tab */}
      {tab === 'novels' && (
        <div>
          {novels.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {novels.map(novel => (
                <Link
                  key={String(novel.id)}
                  to={`/novel/${novel.id}`}
                  className="novel-card flex bg-[#222] rounded-2xl overflow-hidden border border-white/5 group"
                >
                  <div className="w-32 md:w-40 flex-shrink-0">
                    <img src={novel.cover} alt={novel.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 p-4 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-white group-hover:text-[#c99649] transition-colors">{novel.title}</h3>
                      <p className="text-gray-500 text-sm mt-1">{novel.author}</p>
                      <p className="text-gray-600 text-xs mt-2 line-clamp-2 leading-relaxed">{novel.description}</p>
                    </div>
                    <div className="flex items-center gap-3 mt-3 flex-wrap">
                      <span className="text-yellow-400 text-xs flex items-center gap-1">
                        <i className="fa-solid fa-star text-[10px]"></i>{novel.rating}
                      </span>
                      <span className="text-gray-500 text-xs flex items-center gap-1">
                        <i className="fa-solid fa-file-lines text-[10px]"></i>{novel.totalChapters} فصل
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                        novel.status === 'مستمرة' || novel.status === 'ongoing'
                          ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                          : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}>{novel.status}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <i className="fa-solid fa-book text-4xl text-gray-600 mb-3"></i>
              <p className="text-gray-500">لا توجد روايات متاحة</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
