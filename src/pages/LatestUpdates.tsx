import { Link } from 'react-router-dom';
import { novels, getLatestNovels, getAllChapters } from '../data/mockData';

export default function LatestUpdates() {
  const latestNovels = getLatestNovels();
  const latestChapters = getAllChapters();

  return (
    <div className="min-h-screen max-w-7xl mx-auto px-4 py-8">
      {/* Page Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <i className="fa-solid fa-clock text-[#c99649]"></i>
          آخر الإضافات
        </h1>
        <p className="text-gray-400 mt-2">آخر الروايات والفصول المضافة</p>
      </div>

      {/* Latest Chapters Section */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
          <i className="fa-solid fa-file-lines text-[#c99649]"></i>
          آخر الفصول المضافة
        </h2>
        <div className="bg-[#2a2a2a] rounded-xl border border-[#4a4a4a] overflow-hidden">
          {latestChapters.map((item, index) => (
            <Link
              key={`${item.novel.id}-${item.volume.id}-${item.chapter.id}`}
              to={`/novel/${item.novel.id}/volume/${item.volume.id}/chapter/${item.chapter.id}`}
              className={`flex items-center gap-4 p-4 hover:bg-[#3a3a3a] transition-colors ${
                index !== latestChapters.length - 1 ? 'border-b border-[#4a4a4a]' : ''
              }`}
            >
              <img
                src={item.novel.cover}
                alt={item.novel.title}
                className="w-14 h-18 rounded-lg object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-medium text-sm md:text-base truncate">{item.novel.title}</h4>
                <p className="text-[#c99649] text-sm truncate mt-1">{item.chapter.title}</p>
                <p className="text-gray-500 text-xs mt-1">{item.volume.title}</p>
              </div>
              <div className="text-gray-400 text-xs flex-shrink-0 text-left">
                <div>{new Date(item.chapter.dateAdded).toLocaleDateString('ar')}</div>
                <div className="mt-1">
                  <i className="fa-solid fa-arrow-left text-[#c99649]"></i>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Latest Novels Section */}
      <section>
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
          <i className="fa-solid fa-sparkles text-[#c99649]"></i>
          آخر الروايات المضافة
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {latestNovels.map(novel => {
            const totalChapters = novel.volumes.reduce((acc, v) => acc + v.chapters.length, 0);
            return (
              <Link
                key={novel.id}
                to={`/novel/${novel.id}`}
                className="novel-card bg-[#2a2a2a] rounded-xl overflow-hidden border border-[#4a4a4a] hover:border-[#c99649] flex"
              >
                <div className="w-28 md:w-36 flex-shrink-0">
                  <img
                    src={novel.cover}
                    alt={novel.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 p-4 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-white text-base md:text-lg">{novel.title}</h3>
                    <p className="text-gray-400 text-sm mt-1">{novel.author}</p>
                    <p className="text-gray-500 text-xs mt-2 line-clamp-2">{novel.description}</p>
                  </div>
                  <div className="flex items-center gap-3 mt-3 flex-wrap">
                    <span className="text-yellow-400 text-xs flex items-center gap-1">
                      <i className="fa-solid fa-star"></i>
                      {novel.rating}
                    </span>
                    <span className="text-gray-400 text-xs flex items-center gap-1">
                      <i className="fa-solid fa-file-lines"></i>
                      {totalChapters} فصل
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      novel.status === 'مستمرة' ? 'bg-green-900/50 text-green-400' : 'bg-blue-900/50 text-blue-400'
                    }`}>
                      {novel.status}
                    </span>
                    <span className="text-gray-500 text-xs">
                      أُضيفت: {new Date(novel.dateAdded).toLocaleDateString('ar')}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
