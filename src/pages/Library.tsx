import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getAllNovels, Novel } from '../lib/database';
import Loading from '../components/Loading';

export default function Library() {
  const [novels, setNovels] = useState<Novel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState('');

  useEffect(() => {
    (async () => {
      try { setNovels(await getAllNovels()); }
      catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const genres = Array.from(new Set(novels.flatMap(n => n.genre)));

  const filtered = novels.filter(n => {
    const matchSearch = !search || n.title.includes(search) || n.author.includes(search);
    const matchGenre = !genre || n.genre.includes(genre);
    return matchSearch && matchGenre;
  });

  if (loading) return <Loading text="جاري تحميل المكتبة..." />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-[#c99649]/15 flex items-center justify-center">
            <i className="fa-solid fa-book text-[#c99649]"></i>
          </span>
          المكتبة
        </h1>
        <p className="text-gray-500 text-sm mt-2">تصفح جميع الروايات المتاحة في الموقع</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="flex-1 relative">
          <i className="fa-solid fa-magnifying-glass absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm"></i>
          <input
            type="text"
            placeholder="ابحث عن رواية..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#222] border border-white/10 rounded-xl py-3 pr-11 pl-4 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#c99649]/50 transition-colors"
          />
        </div>
        <select
          value={genre}
          onChange={e => setGenre(e.target.value)}
          className="bg-[#222] border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-[#c99649]/50 transition-colors min-w-[150px]"
        >
          <option value="">كل التصنيفات</option>
          {genres.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>

      {/* Results count */}
      <p className="text-gray-500 text-xs mb-4">
        {filtered.length} رواية {search || genre ? '(نتائج مفلترة)' : ''}
      </p>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5">
          {filtered.map(novel => (
            <Link
              key={String(novel.id)}
              to={`/novel/${novel.id}`}
              className="novel-card group rounded-2xl overflow-hidden bg-[#222] border border-white/5"
            >
              <div className="aspect-[3/4] relative overflow-hidden bg-[#333]">
                  {novel.cover && novel.cover.startsWith('http') ? (
                    <img 
                      src={novel.cover} 
                      alt={novel.title} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://via.placeholder.com/300x400/333/c99649?text=${encodeURIComponent(novel.title)}`;
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#c99649]/20 to-[#333]">
                      <i className="fa-solid fa-book text-4xl text-[#c99649]/50"></i>
                    </div>
                  )}                <div className="novel-card-overlay">
                  <div className="w-full">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-yellow-400 text-xs flex items-center gap-1">
                        <i className="fa-solid fa-star text-[10px]"></i>{novel.rating}
                      </span>
                      <span className="text-gray-300 text-xs">{novel.totalChapters} فصل</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {novel.genre.slice(0, 2).map(g => (
                        <span key={g} className="text-[10px] bg-white/10 text-white/80 px-2 py-0.5 rounded-full">{g}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="absolute top-2 right-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium backdrop-blur-sm ${
                    novel.status === 'مستمرة' || novel.status === 'ongoing' 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                      : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  }`}>{novel.status}</span>
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
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
            <i className="fa-solid fa-magnifying-glass text-2xl text-gray-600"></i>
          </div>
          <p className="text-gray-400 font-medium">لا توجد نتائج</p>
          <p className="text-gray-600 text-sm mt-1">جرب كلمات بحث مختلفة</p>
        </div>
      )}
    </div>
  );
}
