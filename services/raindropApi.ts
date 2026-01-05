import { Raindrop, RaindropCollection } from '../types';

const BASE_URL = 'https://api.raindrop.io/rest/v1';

// Simple delay helper to respect rate limits (approx 120 req/min)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const validateToken = async (token: string): Promise<boolean> => {
  try {
    const response = await fetch(`${BASE_URL}/user`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.ok;
  } catch (error) {
    return false;
  }
};

export const fetchAllCollections = async (token: string): Promise<RaindropCollection[]> => {
  // Raindrop has system collections (-1: Unsorted, -99: Trash)
  // and user collections.
  
  // 1. Fetch user collections
  const response = await fetch(`${BASE_URL}/collections/all`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) throw new Error('Failed to fetch collections');
  
  const data = await response.json();
  const userCollections: RaindropCollection[] = data.items || [];

  // 2. Add system collection "Unsorted" explicitly if not present (usually ID -1)
  // We manually construct it because /collections/all might not include the system root properly depending on API version details
  // But typically 'Unsorted' is where many bookmarks live.
  const unsorted: RaindropCollection = {
    _id: -1,
    title: 'Unsorted',
    count: 0, // Will be updated if we fetch stats, but for now strictly placeholder
    user: { $id: 0 }
  };

  return [unsorted, ...userCollections];
};

export const fetchBookmarks = async (
  token: string, 
  collectionId: number, 
  onProgress?: (count: number) => void
): Promise<Raindrop[]> => {
  let allBookmarks: Raindrop[] = [];
  let page = 0;
  const perPage = 50;
  let hasMore = true;

  while (hasMore) {
    try {
      const response = await fetch(`${BASE_URL}/raindrops/${collectionId}?perpage=${perPage}&page=${page}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        // If 429 Too Many Requests, wait and retry once
        if (response.status === 429) {
          await delay(2000);
          continue; 
        }
        throw new Error(`Failed to fetch bookmarks for collection ${collectionId}`);
      }

      const data = await response.json();
      const items: Raindrop[] = data.items || [];

      if (items.length === 0) {
        hasMore = false;
      } else {
        allBookmarks = [...allBookmarks, ...items];
        if (onProgress) onProgress(allBookmarks.length);
        page++;
        // Respect rate limit: Raindrop is generous but let's be safe with a small tick
        await delay(100); 
      }
    } catch (e) {
      console.error(e);
      hasMore = false; 
    }
  }

  return allBookmarks;
};