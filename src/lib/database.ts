import { firestore } from './firebase';
import { collection, getDocs, doc, getDoc, query, orderBy } from 'firebase/firestore';

// ===== Types =====
export interface Chapter {
  id: string | number;
  title: string;
  content: string;
  dateAdded: string;
  number?: number;
}

export interface Volume {
  id: string | number;
  title: string;
  chapters: Chapter[];
  number?: number;
}

export interface Novel {
  id: string | number;
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

// ===== Helpers =====
function getStr(obj: any, ...keys: string[]): string {
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null) return String(obj[k]);
  }
  return '';
}

function getNum(obj: any, ...keys: string[]): number {
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null) return Number(obj[k]);
  }
  return 0;
}

function getDate(obj: any, ...keys: string[]): string {
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null) {
      const val = obj[k];
      if (val.toDate) return val.toDate().toISOString();
      return String(val);
    }
  }
  return '';
}

function getArr(obj: any, ...keys: string[]): any[] {
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null) {
      const val = obj[k];
      if (Array.isArray(val)) return val;
      if (typeof val === 'object') return Object.values(val);
    }
  }
  return [];
}

// ===== Fetch Functions =====
export async function getAllNovels(): Promise<Novel[]> {
  try {
    // Try different collection names
    const collectionNames = ['novels', 'روايات', 'Novels', 'manga'];
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
      
      novels.push({
        id: novelId,
        title: getStr(n, 'title', 'name', 'novelName'),
        author: getStr(n, 'author', 'writer', 'auther'),
        cover: getStr(n, 'cover', 'image', 'thumbnail', 'img', 'coverImage', 'poster'),
        description: getStr(n, 'description', 'synopsis', 'desc', 'summary', 'about'),
        status: getStr(n, 'status', 'state') || 'مستمرة',
        genre: getArr(n, 'genre', 'genres', 'category', 'categories', 'tags').map((g: any) => 
          typeof g === 'object' ? (g.name || g.title || String(g)) : String(g)
        ),
        rating: getNum(n, 'rating', 'rate', 'score', 'stars'),
        views: getNum(n, 'views', 'viewCount', 'view_count', 'reads'),
        gallery: getArr(n, 'gallery', 'images', 'screenshots', 'pics').map((g: any) => 
          typeof g === 'object' ? (g.url || g.src || String(g)) : String(g)
        ),
        volumes,
        dateAdded: getDate(n, 'dateAdded', 'createdAt', 'addedDate', 'date_added', 'created_at'),
        lastUpdated: getDate(n, 'lastUpdated', 'updatedAt', 'modifiedDate', 'last_updated', 'updated_at'),
        totalChapters,
      });
    }
    
    return novels;
  } catch (error) {
    console.error('Error fetching novels:', error);
    return [];
  }
}

async function getVolumes(novelId: string, novelData: any): Promise<Volume[]> {
  try {
    // Try subcollection first
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
            
            // Get chapters for this volume
            const chapters = await getChapters(novelId, volumeId, v);
            
            volumes.push({
              id: volumeId,
              title: getStr(v, 'title', 'name', 'volumeName') || `المجلد ${volumeId}`,
              chapters,
              number: getNum(v, 'number', 'order', 'num'),
            });
          }
          
          // Sort volumes
          volumes.sort((a, b) => (a.number || 0) - (b.number || 0));
          
          return volumes;
        }
      } catch (e) {
        continue;
      }
    }
    
    // If no subcollection, check if volumes are embedded in novel data
    if (novelData.volumes || novelData['مجلدات']) {
      const volumesData = novelData.volumes || novelData['مجلدات'];
      const volumesArr = Array.isArray(volumesData) ? volumesData : Object.values(volumesData);
      
      const volumes: Volume[] = [];
      for (let i = 0; i < volumesArr.length; i++) {
        const v = volumesArr[i] as any;
        const chaptersData = v.chapters || v['فصول'] || [];
        const chaptersArr = Array.isArray(chaptersData) ? chaptersData : Object.values(chaptersData);
        
        const chapters: Chapter[] = chaptersArr.map((c: any, idx: number) => ({
          id: c.id || idx + 1,
          title: getStr(c, 'title', 'name', 'chapterName', 'chapter_title') || `الفصل ${c.id || idx + 1}`,
          content: getStr(c, 'content', 'body', 'text', 'chapter_content', 'chapterContent'),
          dateAdded: getDate(c, 'dateAdded', 'createdAt', 'date', 'addedDate'),
          number: getNum(c, 'number', 'num', 'order'),
        }));
        
        chapters.sort((a, b) => (a.number || 0) - (b.number || 0));
        
        volumes.push({
          id: v.id || i + 1,
          title: getStr(v, 'title', 'name', 'volumeName') || `المجلد ${i + 1}`,
          chapters,
          number: getNum(v, 'number', 'order', 'num'),
        });
      }
      
      volumes.sort((a, b) => (a.number || 0) - (b.number || 0));
      return volumes;
    }
    
    // Try chapters directly under novel (no volumes)
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
              title: getStr(c, 'title', 'name', 'chapterName', 'chapter_title') || `الفصل ${docSnap.id}`,
              content: getStr(c, 'content', 'body', 'text', 'chapter_content', 'chapterContent'),
              dateAdded: getDate(c, 'dateAdded', 'createdAt', 'date', 'addedDate'),
              number: getNum(c, 'number', 'num', 'order'),
            };
          });
          
          chapters.sort((a, b) => (a.number || 0) - (b.number || 0));
          
          if (chapters.length > 0) {
            return [{
              id: '1',
              title: 'الفصول',
              chapters,
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
    // Try subcollection
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
              title: getStr(c, 'title', 'name', 'chapterName', 'chapter_title') || `الفصل ${docSnap.id}`,
              content: getStr(c, 'content', 'body', 'text', 'chapter_content', 'chapterContent'),
              dateAdded: getDate(c, 'dateAdded', 'createdAt', 'date', 'addedDate'),
              number: getNum(c, 'number', 'num', 'order'),
            };
          });
          
          chapters.sort((a, b) => (a.number || 0) - (b.number || 0));
          return chapters;
        }
      } catch (e) {
        continue;
      }
    }
    
    // Check if chapters are embedded in volume data
    if (volumeData.chapters || volumeData['فصول']) {
      const chaptersData = volumeData.chapters || volumeData['فصول'];
      const chaptersArr = Array.isArray(chaptersData) ? chaptersData : Object.values(chaptersData);
      
      const chapters: Chapter[] = chaptersArr.map((c: any, idx: number) => ({
        id: c.id || idx + 1,
        title: getStr(c, 'title', 'name', 'chapterName', 'chapter_title') || `الفصل ${c.id || idx + 1}`,
        content: getStr(c, 'content', 'body', 'text', 'chapter_content', 'chapterContent'),
        dateAdded: getDate(c, 'dateAdded', 'createdAt', 'date', 'addedDate'),
        number: getNum(c, 'number', 'num', 'order'),
      }));
      
      chapters.sort((a, b) => (a.number || 0) - (b.number || 0));
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
    
    // Find the chapter in volumes
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

// Get all chapters with novel info for latest updates
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
  
  // Sort by date descending
  result.sort((a, b) => {
    const dateA = a.chapter.dateAdded ? new Date(a.chapter.dateAdded).getTime() : 0;
    const dateB = b.chapter.dateAdded ? new Date(b.chapter.dateAdded).getTime() : 0;
    return dateB - dateA;
  });
  
  return result;
}

// Get latest novels
export async function getLatestNovels(): Promise<Novel[]> {
  const novels = await getAllNovels();
  return novels.sort((a, b) => {
    const dateA = a.dateAdded ? new Date(a.dateAdded).getTime() : 0;
    const dateB = b.dateAdded ? new Date(b.dateAdded).getTime() : 0;
    return dateB - dateA;
  });
}

// Get first and last chapter
export function getFirstLastChapter(novel: Novel) {
  const all: { volumeId: any; chapterId: any }[] = [];
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
