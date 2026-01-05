// API Response Types
export interface RaindropCollection {
  _id: number;
  title: string;
  description?: string;
  user: { $id: number };
  parent?: { $id: number };
  count: number;
  slug?: string;
  created?: string;
  lastUpdate?: string;
}

export interface Raindrop {
  _id: number;
  title: string;
  excerpt?: string;
  link: string;
  collectionId: number;
  tags: string[];
  created: string;
  lastUpdate: string;
  cover?: string;
  type: 'link' | 'article' | 'image' | 'video' | 'document' | 'audio';
  checked?: boolean; // UI state for selection
}

// Internal Tree Structure for UI and Export
export interface CollectionNode extends RaindropCollection {
  children: CollectionNode[];
  bookmarks: Raindrop[];
  expanded?: boolean;
  isLoading?: boolean;
  isFullyLoaded?: boolean; // True if all pages of bookmarks are fetched
  checked?: boolean; // UI state for selection
}

export interface ProcessingStatus {
  totalCollections: number;
  processedCollections: number;
  totalBookmarks: number;
  currentCollectionName: string;
  isComplete: boolean;
  error: string | null;
}

export type ExportFormat = 'json' | 'html' | 'csv' | 'xml';