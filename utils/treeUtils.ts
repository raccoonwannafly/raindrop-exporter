import { CollectionNode, RaindropCollection, Raindrop } from '../types';

export const buildCollectionTree = (collections: RaindropCollection[]): CollectionNode[] => {
  const nodeMap = new Map<number, CollectionNode>();
  
  // 1. Initialize nodes
  collections.forEach(c => {
    nodeMap.set(c._id, {
      ...c,
      children: [],
      bookmarks: [],
      expanded: true, // Default expanded
      isLoading: false,
      isFullyLoaded: false,
      checked: true // Default selected
    });
  });

  const roots: CollectionNode[] = [];

  // 2. Build hierarchy
  collections.forEach(c => {
    const node = nodeMap.get(c._id);
    if (!node) return;

    if (c.parent && c.parent.$id && nodeMap.has(c.parent.$id)) {
      const parent = nodeMap.get(c.parent.$id);
      parent?.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
};

// Flatten tree to list for easier processing if needed
export const flattenTree = (nodes: CollectionNode[]): CollectionNode[] => {
  let result: CollectionNode[] = [];
  nodes.forEach(node => {
    result.push(node);
    if (node.children.length > 0) {
      result = result.concat(flattenTree(node.children));
    }
  });
  return result;
};

export const countTotalBookmarks = (nodes: CollectionNode[]): number => {
  return nodes.reduce((acc, node) => {
    return acc + node.bookmarks.length + countTotalBookmarks(node.children);
  }, 0);
};

// --- Selection Helpers ---

// Helper to set checked state for a node and all its descendants (and bookmarks)
const setNodeAndChildrenChecked = (node: CollectionNode, checked: boolean): CollectionNode => {
  return {
    ...node,
    checked,
    bookmarks: node.bookmarks.map(b => ({ ...b, checked })),
    children: node.children.map(child => setNodeAndChildrenChecked(child, checked))
  };
};

// Recursive update for collections
export const toggleCollectionChecked = (nodes: CollectionNode[], id: number, checked: boolean): CollectionNode[] => {
  return nodes.map(node => {
    if (node._id === id) {
      return setNodeAndChildrenChecked(node, checked);
    }
    if (node.children.length > 0) {
      return {
        ...node,
        children: toggleCollectionChecked(node.children, id, checked)
      };
    }
    return node;
  });
};

// Recursive update for bookmarks
export const toggleBookmarkChecked = (nodes: CollectionNode[], bookmarkId: number, checked: boolean): CollectionNode[] => {
  return nodes.map(node => {
    // Check if bookmark is in this node
    const bookmarkIndex = node.bookmarks.findIndex(b => b._id === bookmarkId);
    if (bookmarkIndex !== -1) {
      const newBookmarks = [...node.bookmarks];
      newBookmarks[bookmarkIndex] = { ...newBookmarks[bookmarkIndex], checked };
      return { ...node, bookmarks: newBookmarks };
    }
    
    // Otherwise recurse children
    if (node.children.length > 0) {
      return {
        ...node,
        children: toggleBookmarkChecked(node.children, bookmarkId, checked)
      };
    }
    
    return node;
  });
};

export const setAllNodesChecked = (nodes: CollectionNode[], checked: boolean): CollectionNode[] => {
  return nodes.map(node => setNodeAndChildrenChecked(node, checked));
};