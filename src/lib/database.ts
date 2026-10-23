import { firestore } from './firebase';
import { collection, getDocs } from 'firebase/firestore';

// ===== Types =====
export interface Chapter {
  id: string;
  title: string;
  content: string;
  dateAdded: string;
  number: number;
}

export interface Volume {
  id: string;
  title: string;
  chapters: Chapter[];
  number: number;
}

export interface Novel {
  id: string;
  title: string;
  author: string;
  cover: string;
  description: string;
  status: string;
  genre: string[];
  rating: number;
  views: number;
  gallery: string[];
  volumes: Volume[];
  dateAdded: string;
  lastUpdated: string;
  totalChapters: number;
}

// ===== Cache =====
let novelsCache: Novel[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 60000; // 1 minute

// ===== Helpers =====
function safeString(val: any): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
  if (val.toDate) return val.toDate().toISOString();
  return String(val);
}

function safeNumber(val: any): number {
  if (val === null || val === undefined) return 0;
  const num = Number(val);
  return isNaN(num) ? 0 : num;
}

function safeArray(val: any): any[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'object') return Object.values(val);
  return [];
}

// ===== Fetch Functions =====
export async function getAllNovels(forceRefresh = false): Promise<Novel[]> {
  // Check cache
  if (!forceRefresh && novelsCache && (Date.now() - cacheTimestamp) < CACHE_DURATION) {
    console.log('📦 Using cached novels data');
    return novelsCache;
  }

  try {
    const collectionNames = ['novels', 'روايات', 'Novels'];
    let novelsData: any[] = [];
    
    for (const collName of collectionNames) {
      try {
        const collRef = collection(firestore, collName);
        const snapshot = await getDocs(collRef);
        
        if (!snapshot.empty) {
          novelsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          console.log(`✅ Found ${novelsData.length} novels in collection: ${collName}`);
          break;
        }
      } catch (e) {
        console.log(`⚠️ Collection "${collName}" not accessible`);
        continue;
      }
    }
    
    if (novelsData.length === 0) {
      console.log('📦 No data in Firestore, using fallback data');
      return getFallbackNovels();
    }
    
    const novels: Novel[] = [];
    
    for (const n of novelsData) {
      const novelId = n.id;
      
      // Get volumes
      const volumes = await getVolumes(novelId, n);
      
      // Count total chapters
      const totalChapters = volumes.reduce((acc, v) => acc + v.chapters.length, 0);
      
      // Parse genres
      const genreArr = safeArray(n.genre || n.genres || n.category || n.categories || n.tags);
      const genre = genreArr.map((g: any) => {
        if (typeof g === 'object' && g !== null) return safeString(g.name || g.title || g);
        return safeString(g);
      }).filter(g => g);
      
      // Parse gallery
      const galleryArr = safeArray(n.gallery || n.images || n.screenshots || n.pics);
      const gallery = galleryArr.map((g: any) => {
        if (typeof g === 'object' && g !== null) return safeString(g.url || g.src || g);
        return safeString(g);
      }).filter(g => g);
      
      const novel: Novel = {
        id: novelId,
        title: safeString(n.title || n.name || n.novelName),
        author: safeString(n.author || n.writer || n.auther),
        cover: safeString(n.cover || n.image || n.thumbnail || n.img || n.coverImage || n.poster),
        description: safeString(n.description || n.synopsis || n.desc || n.summary || n.about),
        status: safeString(n.status || n.state) || 'مستمرة',
        genre,
        rating: safeNumber(n.rating || n.rate || n.score || n.stars),
        views: safeNumber(n.views || n.viewCount || n.view_count || n.reads),
        gallery,
        volumes,
        dateAdded: safeString(n.dateAdded || n.createdAt || n.addedDate || n.date_added || n.created_at),
        lastUpdated: safeString(n.lastUpdated || n.updatedAt || n.modifiedDate || n.last_updated || n.updated_at),
        totalChapters,
      };
      
      novels.push(novel);
    }
    
    // Cache the result
    novelsCache = novels;
    cacheTimestamp = Date.now();
    
    console.log(`✅ Successfully loaded ${novels.length} novels`);
    return novels;
  } catch (error) {
    console.error('❌ Error fetching novels:', error);
    return novelsCache || getFallbackNovels();
  }
}

async function getVolumes(novelId: string, novelData: any): Promise<Volume[]> {
  try {
    // Try subcollection paths
    const volumePaths = [
      `novels/${novelId}/volumes`,
      `روايات/${novelId}/volumes`,
      `novels/${novelId}/مجلدات`,
      `روايات/${novelId}/مجلدات`,
    ];
    
    for (const path of volumePaths) {
      try {
        const collRef = collection(firestore, path);
        const snapshot = await getDocs(collRef);
        
        if (!snapshot.empty) {
          const volumes: Volume[] = [];
          
          for (const docSnap of snapshot.docs) {
            const v = docSnap.data();
            const volumeId = docSnap.id;
            
            const chapters = await getChapters(novelId, volumeId, v);
            
            volumes.push({
              id: volumeId,
              title: safeString(v.title || v.name || v.volumeName) || `المجلد ${volumeId}`,
              chapters,
              number: safeNumber(v.number || v.order || v.num),
            });
          }
          
          volumes.sort((a, b) => a.number - b.number);
          return volumes;
        }
      } catch (e) {
        continue;
      }
    }
    
    // Check embedded volumes
    if (novelData.volumes || novelData['مجلدات']) {
      const volumesData = novelData.volumes || novelData['مجلدات'];
      const volumesArr = safeArray(volumesData);
      
      const volumes: Volume[] = volumesArr.map((v: any, i: number) => {
        const chaptersData = safeArray(v.chapters || v['فصول']);
        const chapters: Chapter[] = chaptersData.map((c: any, idx: number) => ({
          id: safeString(c.id || idx + 1),
          title: safeString(c.title || c.name || c.chapterName || c.chapter_title) || `الفصل ${c.id || idx + 1}`,
          content: safeString(c.content || c.body || c.text || c.chapter_content || c.chapterContent),
          dateAdded: safeString(c.dateAdded || c.createdAt || c.date || c.addedDate),
          number: safeNumber(c.number || c.num || c.order),
        }));
        
        chapters.sort((a, b) => a.number - b.number);
        
        return {
          id: safeString(v.id || i + 1),
          title: safeString(v.title || v.name || v.volumeName) || `المجلد ${i + 1}`,
          chapters,
          number: safeNumber(v.number || v.order || v.num),
        };
      });
      
      volumes.sort((a, b) => a.number - b.number);
      return volumes;
    }
    
    // Try chapters directly under novel
    const chapterPaths = [
      `novels/${novelId}/chapters`,
      `روايات/${novelId}/chapters`,
      `novels/${novelId}/فصول`,
      `روايات/${novelId}/فصول`,
    ];
    
    for (const path of chapterPaths) {
      try {
        const collRef = collection(firestore, path);
        const snapshot = await getDocs(collRef);
        
        if (!snapshot.empty) {
          const chapters: Chapter[] = snapshot.docs.map(docSnap => {
            const c = docSnap.data();
            return {
              id: docSnap.id,
              title: safeString(c.title || c.name || c.chapterName || c.chapter_title) || `الفصل ${docSnap.id}`,
              content: safeString(c.content || c.body || c.text || c.chapter_content || c.chapterContent),
              dateAdded: safeString(c.dateAdded || c.createdAt || c.date || c.addedDate),
              number: safeNumber(c.number || c.num || c.order),
            };
          });
          
          chapters.sort((a, b) => a.number - b.number);
          
          if (chapters.length > 0) {
            return [{
              id: '1',
              title: 'الفصول',
              chapters,
              number: 1,
            }];
          }
        }
      } catch (e) {
        continue;
      }
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching volumes:', error);
    return [];
  }
}

async function getChapters(novelId: string, volumeId: string, volumeData: any): Promise<Chapter[]> {
  try {
    const chapterPaths = [
      `novels/${novelId}/volumes/${volumeId}/chapters`,
      `روايات/${novelId}/volumes/${volumeId}/chapters`,
      `novels/${novelId}/مجلدات/${volumeId}/chapters`,
      `روايات/${novelId}/مجلدات/${volumeId}/chapters`,
      `novels/${novelId}/volumes/${volumeId}/فصول`,
      `روايات/${novelId}/volumes/${volumeId}/فصول`,
    ];
    
    for (const path of chapterPaths) {
      try {
        const collRef = collection(firestore, path);
        const snapshot = await getDocs(collRef);
        
        if (!snapshot.empty) {
          const chapters: Chapter[] = snapshot.docs.map(docSnap => {
            const c = docSnap.data();
            return {
              id: docSnap.id,
              title: safeString(c.title || c.name || c.chapterName || c.chapter_title) || `الفصل ${docSnap.id}`,
              content: safeString(c.content || c.body || c.text || c.chapter_content || c.chapterContent),
              dateAdded: safeString(c.dateAdded || c.createdAt || c.date || c.addedDate),
              number: safeNumber(c.number || c.num || c.order),
            };
          });
          
          chapters.sort((a, b) => a.number - b.number);
          return chapters;
        }
      } catch (e) {
        continue;
      }
    }
    
    // Check embedded chapters
    if (volumeData.chapters || volumeData['فصول']) {
      const chaptersData = safeArray(volumeData.chapters || volumeData['فصول']);
      
      const chapters: Chapter[] = chaptersData.map((c: any, idx: number) => ({
        id: safeString(c.id || idx + 1),
        title: safeString(c.title || c.name || c.chapterName || c.chapter_title) || `الفصل ${c.id || idx + 1}`,
        content: safeString(c.content || c.body || c.text || c.chapter_content || c.chapterContent),
        dateAdded: safeString(c.dateAdded || c.createdAt || c.date || c.addedDate),
        number: safeNumber(c.number || c.num || c.order),
      }));
      
      chapters.sort((a, b) => a.number - b.number);
      return chapters;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching chapters:', error);
    return [];
  }
}

export async function getNovelById(novelId: string | number): Promise<Novel | null> {
  const novels = await getAllNovels();
  return novels.find(n => String(n.id) === String(novelId)) || null;
}

export async function getChapterContent(novelId: any, volumeId: any, chapterId: any): Promise<{ novel: Novel; chapter: Chapter; volume: Volume } | null> {
  try {
    const novel = await getNovelById(novelId);
    if (!novel) return null;
    
    for (const volume of novel.volumes) {
      if (String(volume.id) === String(volumeId)) {
        const chapter = volume.chapters.find(c => String(c.id) === String(chapterId));
        if (chapter) {
          return { novel, chapter, volume };
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching chapter:', error);
    return null;
  }
}

export async function getAllChaptersWithNovels(): Promise<{ novel: Novel; volume: Volume; chapter: Chapter }[]> {
  const novels = await getAllNovels();
  const result: { novel: Novel; volume: Volume; chapter: Chapter }[] = [];
  
  novels.forEach(novel => {
    novel.volumes.forEach(volume => {
      volume.chapters.forEach(chapter => {
        result.push({ novel, volume, chapter });
      });
    });
  });
  
  result.sort((a, b) => {
    const dateA = a.chapter.dateAdded ? new Date(a.chapter.dateAdded).getTime() : 0;
    const dateB = b.chapter.dateAdded ? new Date(b.chapter.dateAdded).getTime() : 0;
    return dateB - dateA;
  });
  
  return result;
}

export async function getLatestNovels(): Promise<Novel[]> {
  const novels = await getAllNovels();
  return novels.sort((a, b) => {
    const dateA = a.dateAdded ? new Date(a.dateAdded).getTime() : 0;
    const dateB = b.dateAdded ? new Date(b.dateAdded).getTime() : 0;
    return dateB - dateA;
  });
}

export function getFirstLastChapter(novel: Novel) {
  const all: { volumeId: string; chapterId: string }[] = [];
  novel.volumes.forEach(v => {
    v.chapters.forEach(c => {
      all.push({ volumeId: v.id, chapterId: c.id });
    });
  });
  if (all.length === 0) return { first: null, last: null };
  return { first: all[0], last: all[all.length - 1] };
}

// ===== Fallback Data =====
function getFallbackNovels(): Novel[] {
  return [
    {
      id: '1',
      title: 'سيد الظلال',
      author: 'كاتسومي يوكي',
      cover: 'https://picsum.photos/seed/novel1/300/400',
      description: 'في عالم حيث تحكم الظلال كل شيء، يولد فتى بلا ظل. يُنبذ من مجتمعه ويُطرد من عائلته. لكن ما لا يعرفه أحد هو أن عدم وجود ظل يعني أنه يمتلك قوة تفوق كل الظلال مجتمعة.',
      status: 'مستمرة',
      genre: ['أكشن', 'فانتازيا', 'مغامرة'],
      rating: 4.8,
      views: 125000,
      gallery: [
        'https://picsum.photos/seed/gallery1/600/400',
        'https://picsum.photos/seed/gallery2/600/400',
        'https://picsum.photos/seed/gallery3/600/400',
      ],
      volumes: [
        {
          id: '1',
          title: 'المجلد الأول - بداية الظلام',
          chapters: [
            {
              id: '1',
              title: 'الفصل 1 - الولادة بلا ظل',
              content: `استيقظ كايرو من نومه على صوت صراخ أمه في الغرفة المجاورة. كانت الشمس تتسلل من بين ستائر النافذة الرقيقة.

https://picsum.photos/seed/ch1img1/800/500

"كايرو! تعال بسرعة!" صرخت أمه بصوت مليء بالقلق.

نهض من فراشه ببطء. لم يكن يعلم أن هذا اليوم سيغير حياته إلى الأبد.

https://picsum.photos/seed/ch1img2/800/500

خرج إلى الممر ليجد أمه تحمل أخاه الصغير. كان الظل يتشكل بوضوح تحت قدميه، لكن عندما نظر كايرو إلى الأسفل... لم يجد شيئاً. لا ظل.

"لماذا لا أملك ظلاً؟" سأل بصوت مرتجف.

ما لم يكن يعرفه أن قدره أعظم من أن يتخيله أي شخص...`,
              dateAdded: '2024-01-15',
              number: 1,
            },
            {
              id: '2',
              title: 'الفصل 2 - الاختبار الأول',
              content: `مرت الأسابيع وكايرو يحاول التكيف مع حياته الجديدة. لكن القدر كان له رأي آخر.

في صباح يوم عادي، وصل معلم جديد إلى الأكاديمية.

https://picsum.photos/seed/ch2img1/800/500

"اسمي ريوكين،" قال بصوت هادئ. "وسأقوم بتقييم قدراتكم."

بدأ الاختبار بسيطاً: تحريك حجر صغير. نجح الجميع... إلا كايرو.

"مثير للاهتمام..." همهم المعلم.

بعد انتهاء الحصة، طلب ريوكين من كايرو البقاء.

"أنت لست بلا قوة يا فتى. أنت تمتلك قوة لا يراها أحد... حتى الآن."`,
              dateAdded: '2024-01-22',
              number: 2,
            },
          ],
          number: 1,
        },
      ],
      dateAdded: '2024-01-10',
      lastUpdated: '2024-01-22',
      totalChapters: 2,
    },
    {
      id: '2',
      title: 'ملوك الأساطير',
      author: 'هان لي وينغ',
      cover: 'https://picsum.photos/seed/novel2/300/400',
      description: 'عندما تنهار الحدود بين عالم البشر وعالم الأساطير، يُختار شاب عادي ليصبح حارس البوابة. مسلحاً بسيف قديم وقوة منسية، يجب عليه حماية العالمين من الفوضى المطلقة.',
      status: 'مكتملة',
      genre: ['فانتازيا', 'أكشن', 'أساطير'],
      rating: 4.5,
      views: 89000,
      gallery: [
        'https://picsum.photos/seed/gal2_1/600/400',
        'https://picsum.photos/seed/gal2_2/600/400',
      ],
      volumes: [
        {
          id: '1',
          title: 'المجلد الأول - البوابة',
          chapters: [
            {
              id: '1',
              title: 'الفصل 1 - الانهيار',
              content: `كانت السماء تنزف.

هذا ما لاحظه لين أولاً. خطوط حمراء تمتد عبر السماء الزرقاء.

https://picsum.photos/seed/n2ch1img1/800/500

"ماذا يحدث؟!" صرخ وهو يركض في الشوارع.

ثم رآها. بوابة ضخمة تتشكل في وسط المدينة. منها خرجت كائنات... لم يرها أحد من قبل.

"أنت!" جاءه صوت غامض. "أنت المختار. تعال معي."

لم يكن أمام لين خيار...`,
              dateAdded: '2024-02-01',
              number: 1,
            },
          ],
          number: 1,
        },
      ],
      dateAdded: '2024-01-25',
      lastUpdated: '2024-02-01',
      totalChapters: 1,
    },
  ];
}
