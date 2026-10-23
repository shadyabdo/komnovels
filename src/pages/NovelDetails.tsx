import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getNovelById, getFirstLastChapter, Novel } from '../lib/database';
import Loading from '../components/Loading';

export default function NovelDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [novel, setNovel] = useState<Novel | null>(null);
  const [loading, setLoading] = useState(true);
  const [openVolumes, setOpenVolumes] = useState<Set<string | number>>(new Set());

  useEffect(() => {
    (async () => {
      if (!id) return;
      try { setNovel(await getNovelById(id)); }
      catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [id]);

  if (loading) return <Loading text="جاري تحميل الرواية..." />;
  if (!novel) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <i className="fa-solid fa-book text-5xl text-gray-600 mb-4"></i>
        <p className="text-gray-400">الرواية غير موجودة</p>
        <Link to="/library" className="text-[#c99649] mt-3 inline-block hover:underline text-sm">العودة للمكتبة</Link>
      </div>
    </div>
  );

  const { first, last } = getFirstLastChapter(novel);

  const toggleVolume = (vId: string | number) => {
    setOpenVolumes(prev => {
      const next = new Set(prev);
      if (next.has(vId)) next.delete(vId);
      else next.add(vId);
      return next;
    });
  };

  return (
    <div>
      {/* Hero - Novel Info */}
      <section className="relative hero-pattern py-10 md:py-14">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#1a1a1a]"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="flex flex-col md:flex-row gap-6 md:gap-10">
            {/* Cover */}
            <div className="flex-shrink-0 mx-auto md:mx-0">
              <div className="w-52 md:w-60 aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl shadow-black/50 ring-1 ring-white/10">
                <img src={novel.cover} alt={novel.title} className="w-full h-full object-cover" />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-right">
              <h1 className="text-3xl md:text-4xl font-black text-white mb-2">{novel.title}</h1>
              <p className="text-gray-400 text-base mb-5">
                <i className="fa-solid fa-feather-pointed text-[#c99649] ml-2"></i>
                {novel.author}
              </p>

              {/* Badges */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-5">
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                  novel.status === 'مستمرة' || novel.status === 'ongoing'
                    ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                    : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                }`}>
                  <i className="fa-solid fa-circle text-[6px] ml-1.5"></i>{novel.status}
                </span>
                <span className="text-xs px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 flex items-center gap-1">
                  <i className="fa-solid fa-star text-[10px]"></i>{novel.rating}
                </span>
                <span className="text-xs px-3 py-1 rounded-full bg-white/5 text-gray-400 border border-white/10 flex items-center gap-1">
                  <i className="fa-solid fa-eye text-[10px]"></i>{novel.views.toLocaleString()}
                </span>
              </div>

              {/* Genres */}
              <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-5">
                {novel.genre.map(g => (
                  <span key={g} className="text-xs bg-[#c99649]/10 text-[#c99649] px-3 py-1 rounded-full border border-[#c99649]/20">{g}</span>
                ))}
              </div>

              {/* Description */}
              <p className="text-gray-300 text-sm leading-[1.9] max-w-2xl">{novel.description}</p>

              {/* Stats Cards */}
              <div className="grid grid-cols-3 gap-3 mt-6 max-w-sm mx-auto md:mx-0">
                {[
                  { val: novel.volumes.length, label: 'مجلد', icon: 'fa-folder' },
                  { val: novel.totalChapters, label: 'فصل', icon: 'fa-file-lines' },
                  { val: novel.gallery.length, label: 'صورة', icon: 'fa-images' },
                ].map((s, i) => (
                  <div key={i} className="bg-[#222] rounded-xl p-3 text-center border border-white/5">
                    <i className={`fa-solid ${s.icon} text-[#c99649] text-sm mb-1`}></i>
                    <div className="text-xl font-black text-white">{s.val}</div>
                    <div className="text-gray-500 text-[10px]">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery */}
      {novel.gallery.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-[#c99649]/15 flex items-center justify-center">
              <i className="fa-solid fa-images text-[#c99649] text-sm"></i>
            </span>
            معرض الصور
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {novel.gallery.map((img, i) => (
              <div key={i} className="aspect-video rounded-xl overflow-hidden border border-white/5 hover:border-[#c99649]/30 transition-colors group">
                <img src={img} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Chapters */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10 pb-16">
        <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-3">
          <span className="w-8 h-8 rounded-lg bg-[#c99649]/15 flex items-center justify-center">
            <i className="fa-solid fa-list text-[#c99649] text-sm"></i>
          </span>
          الفصول والمجلدات
        </h2>

        {/* Nav Buttons */}
        <div className="flex flex-wrap gap-3 mb-6">
          {first && (
            <button
              onClick={() => navigate(`/novel/${novel.id}/read/${first.volumeId}/${first.chapterId}`)}
              className="bg-[#c99649] hover:bg-[#b8853a] text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-[#c99649]/20 flex items-center gap-2"
            >
              <i className="fa-solid fa-play text-xs"></i>
              ابدأ القراءة
            </button>
          )}
          {last && (
            <button
              onClick={() => navigate(`/novel/${novel.id}/read/${last.volumeId}/${last.chapterId}`)}
              className="bg-white/5 hover:bg-white/10 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all border border-white/10 flex items-center gap-2"
            >
              آخر فصل
              <i className="fa-solid fa-forward-fast text-xs"></i>
            </button>
          )}
        </div>

        {/* Volumes Accordion */}
        {novel.volumes.length > 0 ? (
          <div className="space-y-3">
            {novel.volumes.map(vol => (
              <div key={String(vol.id)} className="bg-[#222] rounded-2xl border border-white/5 overflow-hidden">
                <button
                  onClick={() => toggleVolume(vol.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#c99649]/10 flex items-center justify-center">
                      <i className="fa-solid fa-folder-open text-[#c99649] text-sm"></i>
                    </div>
                    <div className="text-right">
                      <h3 className="text-white font-medium text-sm">{vol.title}</h3>
                      <p className="text-gray-500 text-xs mt-0.5">{vol.chapters.length} فصل</p>
                    </div>
                  </div>
                  <div className={`w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center transition-transform duration-300 ${openVolumes.has(vol.id) ? 'rotate-180' : ''}`}>
                    <i className="fa-solid fa-chevron-down text-gray-400 text-xs"></i>
                  </div>
                </button>

                <div className={`accordion-body ${openVolumes.has(vol.id) ? 'open' : ''}`}>
                  <div className="border-t border-white/5">
                    {vol.chapters.map(ch => (
                      <Link
                        key={String(ch.id)}
                        to={`/novel/${novel.id}/read/${vol.id}/${ch.id}`}
                        className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors border-b border-white/[0.03] last:border-b-0 group"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-xs text-[#c99649] font-bold">
                            {ch.number || ch.id}
                          </span>
                          <span className="text-gray-300 text-sm group-hover:text-[#c99649] transition-colors">{ch.title}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-gray-600 text-xs hidden sm:block">
                            {ch.dateAdded ? new Date(ch.dateAdded).toLocaleDateString('ar') : ''}
                          </span>
                          <i className="fa-solid fa-chevron-left text-gray-600 text-[10px] group-hover:text-[#c99649] transition-colors"></i>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <i className="fa-solid fa-file-lines text-4xl text-gray-600 mb-3"></i>
            <p className="text-gray-500">لا توجد فصول متاحة</p>
          </div>
        )}
      </section>
    </div>
  );
}
