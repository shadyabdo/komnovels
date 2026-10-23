import { db } from './config';
import { ref, get, child } from 'firebase/database';

export interface Chapter {
  id: number;
  title: string;
  content: string;
  dateAdded: string;
}

export interface Volume {
  id: number;
  title: string;
  chapters: Chapter[];
}

export interface Novel {
  id: number;
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
}

// Convert Firebase object to array
function firebaseObjectToArray<T>(obj: Record<string, any> | null | undefined, idKey: string = 'id'): T[] {
  if (!obj) return [];
  return Object.entries(obj).map(([key, value]) => ({
    ...value,
    [idKey]: value[idKey] !== undefined ? value[idKey] : Number(key) || key,
  })) as T[];
}

// Parse genre - handle both array and object formats
function parseGenre(genre: any): string[] {
  if (!genre) return [];
  if (Array.isArray(genre)) return genre;
  if (typeof genre === 'object') return Object.values(genre);
  if (typeof genre === 'string') return [genre];
  return [];
}

// Parse gallery - handle both array and object formats
function parseGallery(gallery: any): string[] {
  if (!gallery) return [];
  if (Array.isArray(gallery)) return gallery;
  if (typeof gallery === 'object') return Object.values(gallery);
  if (typeof gallery === 'string') return [gallery];
  return [];
}

// Fetch all novels
export async function fetchNovels(): Promise<Novel[]> {
  try {
    const novelsRef = ref(db, 'novels');
    const snapshot = await get(novelsRef);
    
    if (!snapshot.exists()) return [];
    
    const data = snapshot.val();
    const novelsArray: Novel[] = [];
    
    for (const [key, value] of Object.entries(data as Record<string, any>)) {
      const novelData = value as any;
      const novelId = novelData.id !== undefined ? Number(novelData.id) : Number(key);
      
      // Fetch volumes for this novel
      const volumes = await fetchVolumes(novelId);
      
      novelsArray.push({
        id: novelId,
        title: novelData.title || '',
        author: novelData.author || '',
        cover: novelData.cover || novelData.image || novelData.thumbnail || '',
        description: novelData.description || novelData.synopsis || '',
        status: novelData.status || 'مستمرة',
        genre: parseGenre(novelData.genre || novelData.genres || novelData.category),
        rating: Number(novelData.rating || novelData.rate || 0),
        views: Number(novelData.views || novelData.viewCount || 0),
        gallery: parseGallery(novelData.gallery || novelData.images || novelData.screenshots),
        volumes: volumes,
        dateAdded: novelData.dateAdded || novelData.createdAt || novelData.addedDate || '',
        lastUpdated: novelData.lastUpdated || novelData.updatedAt || novelData.modifiedDate || '',
      });
    }
    
    return novelsArray;
  } catch (error) {
    console.error('Error fetching novels:', error);
    return [];
  }
}

// Fetch volumes for a novel
async function fetchVolumes(novelId: number): Promise<Volume[]> {
  try {
    // Try different paths
    const paths = [
      `novels/${novelId}/volumes`,
      `volumes`, // if volumes are stored separately
    ];
    
    let volumesData: any = null;
    
    for (const path of paths) {
      const volRef = ref(db, path);
      const snapshot = await get(volRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        if (path === 'volumes') {
          // Filter volumes for this novel
          const filtered: Record<string, any> = {};
          for (const [key, value] of Object.entries(data as Record<string, any>)) {
            const vol = value as any;
            if (vol.novelId === novelId || vol.novel_id === novelId) {
              filtered[key] = value;
            }
          }
          if (Object.keys(filtered).length > 0) {
            volumesData = filtered;
            break;
          }
        } else {
          volumesData = data;
          break;
        }
      }
    }
    
    if (!volumesData) return [];
    
    const volumesArray: Volume[] = [];
    
    for (const [key, value] of Object.entries(volumesData as Record<string, any>)) {
      const volData = value as any;
      const volumeId = volData.id !== undefined ? Number(volData.id) : Number(key);
      
      // Fetch chapters for this volume
      const chapters = await fetchChapters(novelId, volumeId, volData);
      
      volumesArray.push({
        id: volumeId,
        title: volData.title || volData.name || `المجلد ${volumeId}`,
        chapters: chapters,
      });
    }
    
    // Sort volumes by id
    volumesArray.sort((a, b) => a.id - b.id);
    
    return volumesArray;
  } catch (error) {
    console.error('Error fetching volumes:', error);
    return [];
  }
}

// Fetch chapters for a volume
async function fetchChapters(novelId: number, volumeId: number, volumeData?: any): Promise<Chapter[]> {
  try {
    // Try different paths for chapters
    const paths = [
      `novels/${novelId}/volumes/${volumeId}/chapters`,
      `novels/${novelId}/chapters`,
      `chapters`,
    ];
    
    let chaptersData: any = null;
    
    // If chapters are embedded in volume data
    if (volumeData?.chapters) {
      chaptersData = volumeData.chapters;
    } else {
      for (const path of paths) {
        const chapRef = ref(db, path);
        const snapshot = await get(chapRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          if (path === 'chapters') {
            // Filter chapters for this volume
            const filtered: Record<string, any> = {};
            for (const [key, value] of Object.entries(data as Record<string, any>)) {
              const chap = value as any;
              if ((chap.volumeId === volumeId || chap.volume_id === volumeId) && 
                  (chap.novelId === novelId || chap.novel_id === novelId)) {
                filtered[key] = value;
              }
            }
            if (Object.keys(filtered).length > 0) {
              chaptersData = filtered;
              break;
            }
          } else {
            chaptersData = data;
            break;
          }
        }
      }
    }
    
    if (!chaptersData) return [];
    
    const chaptersArray: Chapter[] = [];
    
    for (const [key, value] of Object.entries(chaptersData as Record<string, any>)) {
      const chapData = value as any;
      const chapterId = chapData.id !== undefined ? Number(chapData.id) : Number(key);
      
      chaptersArray.push({
        id: chapterId,
        title: chapData.title || chapData.name || `الفصل ${chapterId}`,
        content: chapData.content || chapData.body || chapData.text || '',
        dateAdded: chapData.dateAdded || chapData.createdAt || chapData.date || '',
      });
    }
    
    // Sort chapters by id
    chaptersArray.sort((a, b) => a.id - b.id);
    
    return chaptersArray;
  } catch (error) {
    console.error('Error fetching chapters:', error);
    return [];
  }
}

// Fetch a single novel by ID
export async function fetchNovelById(novelId: number): Promise<Novel | null> {
  try {
    const novelsRef = ref(db, `novels/${novelId}`);
    const snapshot = await get(novelsRef);
    
    if (!snapshot.exists()) return null;
    
    const novelData = snapshot.val();
    const volumes = await fetchVolumes(novelId);
    
    return {
      id: novelId,
      title: novelData.title || '',
      author: novelData.author || '',
      cover: novelData.cover || novelData.image || novelData.thumbnail || '',
      description: novelData.description || novelData.synopsis || '',
      status: novelData.status || 'مستمرة',
      genre: parseGenre(novelData.genre || novelData.genres || novelData.category),
      rating: Number(novelData.rating || novelData.rate || 0),
      views: Number(novelData.views || novelData.viewCount || 0),
      gallery: parseGallery(novelData.gallery || novelData.images || novelData.screenshots),
      volumes: volumes,
      dateAdded: novelData.dateAdded || novelData.createdAt || novelData.addedDate || '',
      lastUpdated: novelData.lastUpdated || novelData.updatedAt || novelData.modifiedDate || '',
    };
  } catch (error) {
    console.error('Error fetching novel:', error);
    return null;
  }
}

// Fetch a single chapter
export async function fetchChapter(novelId: number, volumeId: number, chapterId: number): Promise<Chapter | null> {
  try {
    const paths = [
      `novels/${novelId}/volumes/${volumeId}/chapters/${chapterId}`,
      `novels/${novelId}/chapters/${chapterId}`,
      `chapters/${chapterId}`,
    ];
    
    for (const path of paths) {
      const chapRef = ref(db, path);
      const snapshot = await get(chapRef);
      if (snapshot.exists()) {
        const chapData = snapshot.val();
        return {
          id: chapterId,
          title: chapData.title || chapData.name || `الفصل ${chapterId}`,
          content: chapData.content || chapData.body || chapData.text || '',
          dateAdded: chapData.dateAdded || chapData.createdAt || chapData.date || '',
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching chapter:', error);
    return null;
  }
}

// Get all chapters sorted by date (for latest updates)
export async function fetchAllChapters(): Promise<{ novel: Novel; volume: Volume; chapter: Chapter }[]> {
  const novels = await fetchNovels();
  const allChapters: { novel: Novel; volume: Volume; chapter: Chapter }[] = [];
  
  novels.forEach(novel => {
    novel.volumes.forEach(volume => {
      volume.chapters.forEach(chapter => {
        allChapters.push({ novel, volume, chapter });
      });
    });
  });
  
  return allChapters.sort((a, b) => {
    const dateA = new Date(a.chapter.dateAdded).getTime();
    const dateB = new Date(b.chapter.dateAdded).getTime();
    return dateB - dateA; // Sort descending (newest first)
  });
}

// Get latest novels sorted by date
export async function fetchLatestNovels(): Promise<Novel[]> {
  const novels = await fetchNovels();
  return novels.sort((a, b) => {
    const dateA = new Date(a.dateAdded).getTime();
    const dateB = new Date(b.dateAdded).getTime();
    return dateB - dateA;
  });
}

// Get first and last chapter of a novel
export function getFirstAndLastChapter(novel: Novel): { first: { volumeId: number; chapterId: number } | null; last: { volumeId: number; chapterId: number } | null } {
  const allChapters: { volumeId: number; chapterId: number }[] = [];
  novel.volumes.forEach(volume => {
    volume.chapters.forEach(chapter => {
      allChapters.push({ volumeId: volume.id, chapterId: chapter.id });
    });
  });
  
  if (allChapters.length === 0) return { first: null, last: null };
  
  return {
    first: allChapters[0],
    last: allChapters[allChapters.length - 1]
  };
}
