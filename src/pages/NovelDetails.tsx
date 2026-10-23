import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { fetchNovelById, getFirstAndLastChapter, Novel } from '../firebase/service';

export default function NovelDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [novel, setNovel] = useState<Novel | null>(null);
  const [loading, setLoading] = useState(true);
  const [openVolumes, setOpenVolumes] = useState<number[]>([]);

  useEffect(() => {
    async function loadNovel() {
      if (!id) return;
      try {
        const data = await fetchNovelById(Number(id));
        setNovel(data);
      } catch (error) {
        console.error('Error loading novel:', error);
      } finally {
        setLoading(false);
      }
    }
    loadNovel();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#c99649] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">جاري تحميل الرواية...</p>
        </div>
      </div>
    );
  }

  if (!novel) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <i className="fa-solid fa-book text-6xl text-gray-600 mb-4"></i>
          <p className="text-gray-400 text-xl">الرواية غير موجودة</p>
          <Link to="/library" className="text-[#c99649] mt-4 inline-block hover:underline">
            العودة للمكتبة
          </Link>
        </div>
      </div>
    );
  }

  const { first, last } = getFirstAndLastChapter(novel);
  const totalChapters = novel.volumes.reduce((acc, v) => acc + v.chapters.length, 0);

  const toggleVolume = (volumeId: number) => {
    setOpenVolumes(prev =>
      prev.includes(volumeId)
        ? prev.filter(id => id !== volumeId)
        : [...prev, volumeId]
    );
  };

  return (
    <div className="min-h-screen">
      {/* Novel Info Section */}
      <section className="bg-gradient-to-b from-[#2a2a2a] to-[#333333] py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-6 md:gap-8">
            {/* Cover */}
            <div className="flex-shrink-0 mx-auto md:mx-0">
              <div className="w-48 md:w-56 aspect-[3/4] rounded-xl overflow-hidden shadow-2xl border-2 border-[#4a4a4a]">
                <img
                  src={novel.cover}
                  alt={novel.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-right">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">{novel.title}</h1>
              <p className="text-gray-400 text-lg mb-4">
                <i className="fa-solid fa-pen-fancy text-[#c99649] ml-2"></i>
                {novel.author}
              </p>

              {/* Status & Rating */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-4">
                <span className={`text-sm px-3 py-1 rounded-full ${
                  novel.status === 'مستمرة' || novel.status === 'ongoing' ? 'bg-green-900/50 text-green-400 border border-green-800' : 'bg-blue-900/50 text-blue-400 border border-blue-800'
                }`}>
                  <i className="fa-solid fa-circle text-[8px] ml-1"></i>
                  {novel.status}
                </span>
                <span className="text-yellow-400 flex items-center gap-1">
                  <i className="fa-solid fa-star"></i>
                  <span className="font-bold">{novel.rating}</span>
                </span>
                <span className="text-gray-400 flex items-center gap-1">
                  <i className="fa-solid fa-eye"></i>
                  {novel.views.toLocaleString('ar')} مشاهدة
                </span>
              </div>

              {/* Genres */}
              <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-4">
                {novel.genre.map(g => (
                  <span key={g} className="bg-[#3a3a3a] text-gray-300 px-3 py-1 rounded-full text-sm border border-[#4a4a4a]">
                    {g}
                  </span>
                ))}
              </div>

              {/* Description */}
              <p className="text-gray-300 leading-relaxed text-sm md:text-base max-w-2xl">
                {novel.description}
              </p>

              {/* Info Cards */}
              <div className="grid grid-cols-3 gap-3 mt-6 max-w-md mx-auto md:mx-0">
                <div className="bg-[#2a2a2a] rounded-lg p-3 text-center border border-[#4a4a4a]">
                  <div className="text-[#c99649] font-bold text-lg">{novel.volumes.length}</div>
                  <div className="text-gray-400 text-xs">مجلد</div>
                </div>
                <div className="bg-[#2a2a2a] rounded-lg p-3 text-center border border-[#4a4a4a]">
                  <div className="text-[#c99649] font-bold text-lg">{totalChapters}</div>
                  <div className="text-gray-400 text-xs">فصل</div>
                </div>
                <div className="bg-[#2a2a2a] rounded-lg p-3 text-center border border-[#4a4a4a]">
                  <div className="text-[#c99649] font-bold text-lg">{novel.gallery.length}</div>
                  <div className="text-gray-400 text-xs">صورة</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      {novel.gallery.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-8">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
            <i className="fa-solid fa-images text-[#c99649]"></i>
            معرض الصور
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {novel.gallery.map((img, index) => (
              <div key={index} className="aspect-video rounded-xl overflow-hidden border border-[#4a4a4a] hover:border-[#c99649] transition-colors">
                <img
                  src={img}
                  alt={`${novel.title} - صورة ${index + 1}`}
                  className="w-full h-full object-cover gallery-img"
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Chapters Section */}
      <section className="max-w-7xl mx-auto px-4 py-8 pb-16">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
          <i className="fa-solid fa-list text-[#c99649]"></i>
          الفصول والمجلدات
        </h2>

        {/* Navigation Buttons */}
        <div className="flex flex-wrap gap-3 mb-6">
          {first && (
            <button
              onClick={() => navigate(`/novel/${novel.id}/volume/${first.volumeId}/chapter/${first.chapterId}`)}
              className="bg-[#c99649] hover:bg-[#b8853a] text-white px-5 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <i className="fa-solid fa-forward-step"></i>
              أول فصل
            </button>
          )}
          {last && (
            <button
              onClick={() => navigate(`/novel/${novel.id}/volume/${last.volumeId}/chapter/${last.chapterId}`)}
              className="bg-[#3a3a3a] hover:bg-[#4a4a4a] text-white px-5 py-2.5 rounded-lg font-medium transition-colors border border-[#4a4a4a] flex items-center gap-2"
            >
              آخر فصل
              <i className="fa-solid fa-backward-step"></i>
            </button>
          )}
        </div>

        {/* Volumes Accordion */}
        {novel.volumes.length > 0 ? (
          <div className="space-y-3">
            {novel.volumes.map(volume => (
              <div key={volume.id} className="bg-[#2a2a2a] rounded-xl border border-[#4a4a4a] overflow-hidden">
                {/* Volume Header */}
                <button
                  onClick={() => toggleVolume(volume.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-[#3a3a3a] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#c99649]/20 rounded-lg flex items-center justify-center">
                      <i className="fa-solid fa-folder text-[#c99649] text-sm"></i>
                    </div>
                    <div className="text-right">
                      <h3 className="text-white font-medium">{volume.title}</h3>
                      <p className="text-gray-400 text-xs mt-0.5">{volume.chapters.length} فصل</p>
                    </div>
                  </div>
                  <i className={`fa-solid fa-chevron-down text-gray-400 transition-transform duration-300 ${
                    openVolumes.includes(volume.id) ? 'rotate-180' : ''
                  }`}></i>
                </button>

                {/* Chapters List */}
                <div className={`accordion-content ${openVolumes.includes(volume.id) ? 'open' : ''}`}>
                  <div className="border-t border-[#4a4a4a]">
                    {volume.chapters.map(chapter => (
                      <Link
                        key={chapter.id}
                        to={`/novel/${novel.id}/volume/${volume.id}/chapter/${chapter.id}`}
                        className="flex items-center justify-between p-4 hover:bg-[#3a3a3a] transition-colors border-b border-[#4a4a4a]/50 last:border-b-0"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-[#3a3a3a] rounded-full flex items-center justify-center text-xs text-[#c99649]">
                            {chapter.id}
                          </div>
                          <span className="text-gray-300 text-sm">{chapter.title}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-gray-500 text-xs hidden md:block">
                            {chapter.dateAdded ? new Date(chapter.dateAdded).toLocaleDateString('ar') : ''}
                          </span>
                          <i className="fa-solid fa-arrow-left text-[#c99649] text-xs"></i>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
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
