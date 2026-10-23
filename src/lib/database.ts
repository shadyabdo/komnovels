import { db } from './firebase';
import { ref, get, query, orderByChild, limitToLast } from 'firebase/database';

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
function toArr(obj: any): any[] {
  if (!obj) return [];
  if (Array.isArray(obj)) return obj;
  if (typeof obj === 'object') {
    return Object.entries(obj).map(([key, val]) => {
      if (typeof val === 'object' && val !== null) {
        return { _key: key, ...val };
      }
      return val;
    });
  }
  return [];
}

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
    if (obj[k] !== undefined && obj[k] !== null) return String(obj[k]);
  }
  return '';
}

// ===== Fetch Functions =====
export async function getAllNovels(): Promise<Novel[]> {
  try {
    const dbRef = ref(db, '/');
    const snapshot = await get(dbRef);
    
    if (!snapshot.exists()) return [];
    
    const rootData = snapshot.val();
    const novels: Novel[] = [];
    
    // Try to find novels in various possible structures
    let novelsData = rootData.novels || rootData['روايات'] || rootData.Novels || rootData.manga || null;
    
    if (!novelsData) {
      // If root has novel-like objects directly
      const entries = Object.entries(rootData);
      for (const [key, val] of entries) {
        if (typeof val === 'object' && val !== null) {
          const v = val as any;
          if (v.title || v.name || v.cover || v.image) {
            if (!novelsData) novelsData = {};
            (novelsData as any)[key] = val;
          }
        }
      }
    }
    
    if (!novelsData) return [];
    
    const novelsArr = toArr(novelsData);
    
    for (const n of novelsArr) {
      const novelId = n.id || n._key || n.novelId || n.novel_id;
      if (!novelId && novelId !== 0) continue;
      
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
        genre: toArr(n.genre || n.genres || n.category || n.categories || n.tags || []).map((g: any) => typeof g === 'object' ? (g.name || g.title || g._key || String(g)) : String(g)),
        rating: getNum(n, 'rating', 'rate', 'score', 'stars'),
        views: getNum(n, 'views', 'viewCount', 'view_count', 'reads'),
        gallery: toArr(n.gallery || n.images || n.screenshots || n.pics || []).map((g: any) => typeof g === 'object' ? (g.url || g.src || g._key || '') : String(g)),
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

async function getVolumes(novelId: any, novelData: any): Promise<Volume[]> {
  try {
    // Try nested volumes first
    let volumesData = novelData.volumes || novelData['مجلدات'] || novelData.arcs || null;
    
    // If not found, try direct path
    if (!volumesData) {
      const volRef = ref(db, `novels/${novelId}/volumes`);
      const volSnap = await get(volRef);
      if (volSnap.exists()) {
        volumesData = volSnap.val();
      }
    }
    
    // Try chapters directly under novel (no volumes)
    if (!volumesData) {
      const chapRef = ref(db, `novels/${novelId}/chapters`);
      const chapSnap = await get(chapRef);
      if (chapSnap.exists()) {
        const chapters = parseChapters(chapSnap.val());
        if (chapters.length > 0) {
          return [{
            id: 1,
            title: 'الفصول',
            chapters,
          }];
        }
      }
    }
    
    if (!volumesData) return [];
    
    const volumesArr = toArr(volumesData);
    const volumes: Volume[] = [];
    
    for (const v of volumesArr) {
      const volumeId = v.id || v._key || v.volumeId || v.volume_id;
      
      // Get chapters for this volume
      let chaptersData = v.chapters || v['فصول'] || null;
      
      if (!chaptersData && volumeId) {
        const chapRef = ref(db, `novels/${novelId}/volumes/${volumeId}/chapters`);
        const chapSnap = await get(chapRef);
        if (chapSnap.exists()) {
          chaptersData = chapSnap.val();
        }
      }
      
      const chapters = parseChapters(chaptersData);
      
      volumes.push({
        id: volumeId || volumes.length + 1,
        title: getStr(v, 'title', 'name', 'volumeName') || `المجلد ${(volumeId || volumes.length + 1)}`,
        chapters,
        number: getNum(v, 'number', 'order', 'num'),
      });
    }
    
    // Sort volumes
    volumes.sort((a, b) => (a.number || Number(a.id) || 0) - (b.number || Number(b.id) || 0));
    
    return volumes;
  } catch (error) {
    console.error('Error fetching volumes:', error);
    return [];
  }
}

function parseChapters(chaptersData: any): Chapter[] {
  if (!chaptersData) return [];
  
  const chaptersArr = toArr(chaptersData);
  const chapters: Chapter[] = [];
  
  for (const c of chaptersArr) {
    const chapterId = c.id || c._key || c.chapterId || c.chapter_id || c.number;
    
    chapters.push({
      id: chapterId || chapters.length + 1,
      title: getStr(c, 'title', 'name', 'chapterName', 'chapter_title') || `الفصل ${chapterId || chapters.length + 1}`,
      content: getStr(c, 'content', 'body', 'text', 'chapter_content', 'chapterContent'),
      dateAdded: getDate(c, 'dateAdded', 'createdAt', 'date', 'addedDate', 'date_added', 'created_at'),
      number: getNum(c, 'number', 'num', 'order'),
    });
  }
  
  // Sort chapters
  chapters.sort((a, b) => (a.number || Number(a.id) || 0) - (b.number || Number(b.id) || 0));
  
  return chapters;
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
    
    // Try direct fetch if not found in parsed data
    const chapRef = ref(db, `novels/${novelId}/volumes/${volumeId}/chapters/${chapterId}`);
    const chapSnap = await get(chapRef);
    if (chapSnap.exists()) {
      const c = chapSnap.val();
      const chapter: Chapter = {
        id: chapterId,
        title: getStr(c, 'title', 'name', 'chapterName') || `الفصل ${chapterId}`,
        content: getStr(c, 'content', 'body', 'text', 'chapter_content'),
        dateAdded: getDate(c, 'dateAdded', 'createdAt', 'date'),
      };
      const volume = novel.volumes.find(v => String(v.id) === String(volumeId)) || novel.volumes[0];
      return { novel, chapter, volume };
    }
    
    // Try another path
    const chapRef2 = ref(db, `novels/${novelId}/chapters/${chapterId}`);
    const chapSnap2 = await get(chapRef2);
    if (chapSnap2.exists()) {
      const c = chapSnap2.val();
      const chapter: Chapter = {
        id: chapterId,
        title: getStr(c, 'title', 'name', 'chapterName') || `الفصل ${chapterId}`,
        content: getStr(c, 'content', 'body', 'text', 'chapter_content'),
        dateAdded: getDate(c, 'dateAdded', 'createdAt', 'date'),
      };
      return { novel, chapter, volume: novel.volumes[0] };
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
