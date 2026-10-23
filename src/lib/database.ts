import { firestore } from './firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';

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
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// ===== Helpers =====
function str(val: any): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
  if (val.toDate) return val.toDate().toISOString();
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}

function num(val: any): number {
  if (val === null || val === undefined) return 0;
  const n = Number(val);
  return isNaN(n) ? 0 : n;
}

function arr(val: any): any[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'object') return Object.values(val);
  return [];
}

// Normalize image URL
function normalizeImageUrl(url: string): string {
  if (!url) return '';
  url = url.trim();
  // Remove quotes
  url = url.replace(/^["']|["']$/g, '');
  // Ensure it's a valid URL
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//')) {
    return url;
  }
  // If it's a storage path, convert to Firebase Storage URL
  if (url.startsWith('gs://')) {
    // Convert gs://bucket/path to https URL
    return url;
  }
  return url;
}

// ===== Fetch Functions =====
export async function getAllNovels(forceRefresh = false): Promise<Novel[]> {
  // Check cache
  if (!forceRefresh && novelsCache && (Date.now() - cacheTimestamp) < CACHE_DURATION) {
    return novelsCache;
  }

  try {
    const collectionNames = ['novels', 'روايات', 'Novels', 'manga'];
    let novelsData: any[] = [];
    let usedCollection = '';
    
    for (const collName of collectionNames) {
      try {
        const collRef = collection(firestore, collName);
        const snapshot = await getDocs(collRef);
        
        if (!snapshot.empty) {
          novelsData = snapshot.docs.map(d => ({
            id: d.id,
            ...d.data()
          }));
          usedCollection = collName;
          console.log(`✅ Found ${novelsData.length} novels in "${collName}"`);
          break;
        }
      } catch (e: any) {
        console.log(`⚠️ "${collName}": ${e.message}`);
        continue;
      }
    }
    
    if (novelsData.length === 0) {
      console.log('📦 No data found, using fallback');
      return getFallbackNovels();
    }
    
    // Process all novels in parallel for speed
    const novels = await Promise.all(
      novelsData.map(n => processNovel(n, usedCollection))
    );
    
    // Filter out invalid novels
    const validNovels = novels.filter(n => n.title);
    
    novelsCache = validNovels;
    cacheTimestamp = Date.now();
    
    console.log(`✅ Loaded ${validNovels.length} novels`);
    return validNovels;
  } catch (error: any) {
    console.error('❌ Error:', error);
    return novelsCache || getFallbackNovels();
  }
}

async function processNovel(n: any, collectionName: string): Promise<Novel> {
  const novelId = n.id;
  
  // Get volumes
  const volumes = await getVolumes(novelId, n, collectionName);
  
  const totalChapters = volumes.reduce((a, v) => a + v.chapters.length, 0);
  
  // Parse genres
  const genreArr = arr(n.genre || n.genres || n.category || n.categories || n.tags);
  const genre = genreArr.map((g: any) => {
    if (typeof g === 'object' && g !== null) return str(g.name || g.title || g);
    return str(g);
  }).filter(Boolean);
  
  // Parse gallery
  const galleryArr = arr(n.gallery || n.images || n.screenshots || n.pics || n.photos);
  const gallery = galleryArr.map((g: any) => {
    if (typeof g === 'object' && g !== null) return normalizeImageUrl(str(g.url || g.src || g.link || g));
    return normalizeImageUrl(str(g));
  }).filter(Boolean);
  
  return {
    id: novelId,
    title: str(n.title || n.name || n.novelName || n.ar_name || n.en_name),
    author: str(n.author || n.writer || n.auther || n.artist),
    cover: normalizeImageUrl(str(n.cover || n.image || n.thumbnail || n.img || n.coverImage || n.poster || n.photo)),
    description: str(n.description || n.synopsis || n.desc || n.summary || n.about || n.story),
    status: str(n.status || n.state || n.ongoing) || 'مستمرة',
    genre,
    rating: num(n.rating || n.rate || n.score || n.stars),
    views: num(n.views || n.viewCount || n.view_count || n.reads),
    gallery,
    volumes,
    dateAdded: str(n.dateAdded || n.createdAt || n.addedDate || n.date_added || n.created_at || n.date),
    lastUpdated: str(n.lastUpdated || n.updatedAt || n.modifiedDate || n.last_updated || n.updated_at),
    totalChapters,
  };
}

async function getVolumes(novelId: string, novelData: any, collectionName: string): Promise<Volume[]> {
  try {
    // 1. Try subcollection
    const volumePaths = [
      `${collectionName}/${novelId}/volumes`,
      `${collectionName}/${novelId}/مجلدات`,
      `${collectionName}/${novelId}/mangas`,
    ];
    
    for (const path of volumePaths) {
      try {
        const collRef = collection(firestore, path);
        const snapshot = await getDocs(collRef);
        
        if (!snapshot.empty) {
          const volumes = await Promise.all(
            snapshot.docs.map(async (docSnap) => {
              const v = docSnap.data();
              const volumeId = docSnap.id;
              const chapters = await getChapters(novelId, volumeId, v, collectionName);
              
              return {
                id: volumeId,
                title: str(v.title || v.name || v.volumeName || v.ar_name) || `المجلد ${volumeId}`,
                chapters,
                number: num(v.number || v.order || v.num || v.index),
              };
            })
          );
          
          volumes.sort((a, b) => a.number - b.number);
          console.log(`  📚 Novel ${novelId}: ${volumes.length} volumes (from subcollection)`);
          return volumes;
        }
      } catch (e) {
        continue;
      }
    }
    
    // 2. Check embedded volumes in novel data
    const embeddedVolumes = novelData.volumes || novelData['مجلدات'] || novelData.arcs;
    if (embeddedVolumes) {
      const volumesArr = arr(embeddedVolumes);
      const volumes: Volume[] = volumesArr.map((v: any, i: number) => {
        const chaptersData = arr(v.chapters || v['فصول'] || v.episodes);
        const chapters: Chapter[] = chaptersData.map((c: any, idx: number) => parseChapter(c, idx));
        chapters.sort((a, b) => a.number - b.number);
        
        return {
          id: str(v.id || i + 1),
          title: str(v.title || v.name || v.volumeName) || `المجلد ${i + 1}`,
          chapters,
          number: num(v.number || v.order || v.num || i),
        };
      });
      
      volumes.sort((a, b) => a.number - b.number);
      if (volumes.length > 0) {
        console.log(`  📚 Novel ${novelId}: ${volumes.length} volumes (embedded)`);
        return volumes;
      }
    }
    
    // 3. Try chapters directly under novel
    const chapterPaths = [
      `${collectionName}/${novelId}/chapters`,
      `${collectionName}/${novelId}/فصول`,
      `${collectionName}/${novelId}/episodes`,
    ];
    
    for (const path of chapterPaths) {
      try {
        const collRef = collection(firestore, path);
        const snapshot = await getDocs(collRef);
        
        if (!snapshot.empty) {
          const chapters: Chapter[] = snapshot.docs.map((docSnap, idx) => {
            const c = docSnap.data();
            return {
              id: docSnap.id,
              title: str(c.title || c.name || c.chapterName || c.chapter_title) || `الفصل ${docSnap.id}`,
              content: str(c.content || c.body || c.text || c.chapter_content || c.chapterContent),
              dateAdded: str(c.dateAdded || c.createdAt || c.date || c.addedDate),
              number: num(c.number || c.num || c.order || c.index || idx),
            };
          });
          
          chapters.sort((a, b) => a.number - b.number);
          
          if (chapters.length > 0) {
            console.log(`  📚 Novel ${novelId}: ${chapters.length} chapters (direct)`);
            return [{
              id: 'default',
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
    
    console.log(`  ⚠️ Novel ${novelId}: No volumes/chapters found`);
    return [];
  } catch (error: any) {
    console.error(`Error fetching volumes for ${novelId}:`, error);
    return [];
  }
}

async function getChapters(novelId: string, volumeId: string, volumeData: any, collectionName: string): Promise<Chapter[]> {
  try {
    // 1. Try subcollection
    const chapterPaths = [
      `${collectionName}/${novelId}/volumes/${volumeId}/chapters`,
      `${collectionName}/${novelId}/مجلدات/${volumeId}/chapters`,
      `${collectionName}/${novelId}/volumes/${volumeId}/فصول`,
      `${collectionName}/${novelId}/مجلدات/${volumeId}/فصول`,
    ];
    
    for (const path of chapterPaths) {
      try {
        const collRef = collection(firestore, path);
        const snapshot = await getDocs(collRef);
        
        if (!snapshot.empty) {
          const chapters: Chapter[] = snapshot.docs.map((docSnap, idx) => {
            const c = docSnap.data();
            return parseChapter(c, idx, docSnap.id);
          });
          
          chapters.sort((a, b) => a.number - b.number);
          return chapters;
        }
      } catch (e) {
        continue;
      }
    }
    
    // 2. Check embedded chapters
    const embeddedChapters = volumeData.chapters || volumeData['فصول'] || volumeData.episodes;
    if (embeddedChapters) {
      const chaptersArr = arr(embeddedChapters);
      const chapters: Chapter[] = chaptersArr.map((c: any, idx: number) => parseChapter(c, idx));
      chapters.sort((a, b) => a.number - b.number);
      return chapters;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching chapters:', error);
    return [];
  }
}

function parseChapter(c: any, idx: number, docId?: string): Chapter {
  return {
    id: docId || str(c.id || c.chapterId || idx + 1),
    title: str(c.title || c.name || c.chapterName || c.chapter_title || c.ar_name) || `الفصل ${c.id || idx + 1}`,
    content: str(c.content || c.body || c.text || c.chapter_content || c.chapterContent || c.paragraphs),
    dateAdded: str(c.dateAdded || c.createdAt || c.date || c.addedDate || c.uploadedAt),
    number: num(c.number || c.num || c.order || c.index || idx),
  };
}

export async function getNovelById(novelId: string | number): Promise<Novel | null> {
  const novels = await getAllNovels();
  return novels.find(n => String(n.id) === String(novelId)) || null;
}

export async function getChapterContent(
  novelId: any, 
  volumeId: any, 
  chapterId: any
): Promise<{ novel: Novel; chapter: Chapter; volume: Volume } | null> {
  try {
    const novel = await getNovelById(novelId);
    if (!novel) {
      console.error('Novel not found:', novelId);
      return null;
    }
    
    for (const volume of novel.volumes) {
      if (String(volume.id) === String(volumeId)) {
        const chapter = volume.chapters.find(c => String(c.id) === String(chapterId));
        if (chapter) {
          return { novel, chapter, volume };
        }
      }
    }
    
    console.error('Chapter not found:', { novelId, volumeId, chapterId });
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
  return [...novels].sort((a, b) => {
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

// ===== Fallback =====
function getFallbackNovels(): Novel[] {
  return [
    {
      id: '1',
      title: 'سيد الظلال',
      author: 'كاتسومي يوكي',
      cover: 'https://picsum.photos/seed/novel1/300/400',
      description: 'في عالم حيث تحكم الظلال كل شيء، يولد فتى بلا ظل.',
      status: 'مستمرة',
      genre: ['أكشن', 'فانتازيا'],
      rating: 4.8,
      views: 125000,
      gallery: ['https://picsum.photos/seed/gallery1/600/400'],
      volumes: [{
        id: '1',
        title: 'المجلد الأول',
        chapters: [{
          id: '1',
          title: 'الفصل 1',
          content: 'محتوى الفصل...',
          dateAdded: '2024-01-15',
          number: 1,
        }],
        number: 1,
      }],
      dateAdded: '2024-01-10',
      lastUpdated: '2024-01-15',
      totalChapters: 1,
    },
  ];
}
