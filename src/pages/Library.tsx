import { Link } from 'react-router-dom';
import { novels } from '../data/mockData';
import { useState } from 'react';

export default function Library() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');

  const allGenres = Array.from(new Set(novels.flatMap(n => n.genre)));

  const filteredNovels = novels.filter(novel => {
    const matchesSearch = novel.title.includes(searchTerm) || novel.author.includes(searchTerm);
    const matchesGenre = !selectedGenre || novel.genre.includes(selectedGenre);
    return matchesSearch && matchesGenre;
  });

  return (
    <div className="min-h-screen max-w-7xl mx-auto px-4 py-8">
      {/* Page Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <i className="fa-solid fa-book text-[#c99649]"></i>
          المكتبة
        </h1>
        <p className="text-gray-400 mt-2">تصفح جميع الروايات المتاحة</p>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1 relative">
          <i className="fa-solid fa-search absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input
            type="text"
            placeholder="ابحث عن رواية أو مؤلف..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#2a2a2a] border border-[#4a4a4a] rounded-lg py-3 pr-12 pl-4 text-white placeholder-gray-500 focus:outline-none focus:border-[#c99649] transition-colors"
          />
        </div>
        <select
          value={selectedGenre}
          onChange={(e) => setSelectedGenre(e.target.value)}
          className="bg-[#2a2a2a] border border-[#4a4a4a] rounded-lg py-3 px-4 text-white focus:outline-none focus:border-[#c99649] transition-colors min-w-[160px]"
        >
          <option value="">جميع التصنيفات</option>
          {allGenres.map(genre => (
            <option key={genre} value={genre}>{genre}</option>
          ))}
        </select>
      </div>

      {/* Novels Grid */}
      {filteredNovels.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {filteredNovels.map(novel => (
            <Link
              key={novel.id}
              to={`/novel/${novel.id}`}
              className="novel-card bg-[#2a2a2a] rounded-xl overflow-hidden border border-[#4a4a4a] hover:border-[#c99649]"
            >
              <div className="aspect-[3/4] overflow-hidden relative">
                <img
                  src={novel.cover}
                  alt={novel.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    novel.status === 'مستمرة' ? 'bg-green-900/80 text-green-400' : 'bg-blue-900/80 text-blue-400'
                  }`}>
                    {novel.status}
                  </span>
                </div>
              </div>
              <div className="p-3">
                <h3 className="font-bold text-white text-sm truncate">{novel.title}</h3>
                <p className="text-gray-400 text-xs mt-1 truncate">{novel.author}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-yellow-400 text-xs flex items-center gap-1">
                    <i className="fa-solid fa-star"></i>
                    {novel.rating}
                  </span>
                  <span className="text-gray-500 text-xs flex items-center gap-1">
                    <i className="fa-solid fa-eye"></i>
                    {(novel.views / 1000).toFixed(0)}K
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {novel.genre.slice(0, 2).map(g => (
                    <span key={g} className="text-[10px] bg-[#3a3a3a] text-gray-300 px-2 py-0.5 rounded-full">
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <i className="fa-solid fa-book-open text-6xl text-gray-600 mb-4"></i>
          <p className="text-gray-400 text-lg">لا توجد نتائج</p>
          <p className="text-gray-500 text-sm mt-2">جرب البحث بكلمات مختلفة</p>
        </div>
      )}
    </div>
  );
}
