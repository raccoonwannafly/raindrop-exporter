import React, { useState } from 'react';
import { CollectionNode, Raindrop } from '../types';
import { Icons } from './Icon';

interface TreeItemProps {
  node: CollectionNode;
  depth?: number;
  onToggleNode: (id: number, checked: boolean) => void;
  onToggleBookmark: (bookmarkId: number, checked: boolean) => void;
}

export const TreeItem: React.FC<TreeItemProps> = ({ node, depth = 0, onToggleNode, onToggleBookmark }) => {
  const [isOpen, setIsOpen] = useState(true);

  const hasChildren = node.children && node.children.length > 0;
  const hasBookmarks = node.bookmarks && node.bookmarks.length > 0;
  const totalItems = (node.bookmarks?.length || 0);

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleNode(node._id, !node.checked);
  };

  return (
    <div className="select-none font-sans">
      <div 
        className={`group flex items-center gap-2 py-1.5 px-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-md cursor-pointer text-sm transition-colors duration-200 ${!node.checked ? 'opacity-60' : ''}`}
        style={{ paddingLeft: `${depth * 24 + 8}px` }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={`text-gray-400 dark:text-gray-500 w-4 h-4 flex items-center justify-center shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-0' : '-rotate-90'}`}>
          {(hasChildren || hasBookmarks) ? (
            <Icons.ChevronDown size={14} />
          ) : <span className="w-4" />}
        </span>

        {/* Checkbox for Folder */}
        <div 
          onClick={handleCheckboxClick}
          className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${
            node.checked 
              ? 'bg-blue-600 border-blue-600 dark:bg-blue-500 dark:border-blue-500' 
              : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
          }`}
        >
          {node.checked && <Icons.Check size={10} className="text-white" strokeWidth={3} />}
        </div>
        
        <span className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors shrink-0">
          {isOpen ? <Icons.FolderOpen size={16} /> : <Icons.Folder size={16} />}
        </span>
        
        <span className="text-gray-700 dark:text-gray-300 font-medium truncate group-hover:text-gray-900 dark:group-hover:text-white">{node.title}</span>
        
        {totalItems > 0 && (
          <span className="ml-auto text-xs text-gray-400 dark:text-gray-600 font-mono">
            {node.isFullyLoaded ? totalItems : `${totalItems}..`}
          </span>
        )}
      </div>

      {isOpen && (
        <div className="flex flex-col relative">
          {/* Vertical Guide Line */}
          {depth > 0 && (
             <div 
                className="absolute w-px bg-gray-100 dark:bg-gray-800 h-full top-0 bottom-0" 
                style={{ left: `${depth * 24 + 15}px` }} 
             />
          )}

          {hasChildren && node.children.map(child => (
            <TreeItem 
              key={child._id} 
              node={child} 
              depth={depth + 1} 
              onToggleNode={onToggleNode}
              onToggleBookmark={onToggleBookmark}
            />
          ))}
          
          {hasBookmarks && (
             <div className="flex flex-col">
                {node.bookmarks.map(bm => (
                  <BookmarkItem 
                    key={bm._id} 
                    bookmark={bm} 
                    depth={depth} 
                    onToggle={() => onToggleBookmark(bm._id, !bm.checked)} 
                  />
                ))}
             </div>
          )}
        </div>
      )}
    </div>
  );
};

const BookmarkItem: React.FC<{ bookmark: Raindrop, depth: number, onToggle: () => void }> = ({ bookmark, depth, onToggle }) => {
  return (
    <div 
      className={`flex items-center gap-3 py-1.5 pr-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 text-sm text-gray-500 dark:text-gray-400 group ${!bookmark.checked ? 'opacity-50' : ''}`}
      style={{ paddingLeft: `${depth * 24 + 40}px` }}
    >
       {/* Checkbox for Bookmark */}
      <div 
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
          className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors shrink-0 cursor-pointer ${
            bookmark.checked !== false
              ? 'bg-blue-600 border-blue-600 dark:bg-blue-500 dark:border-blue-500' 
              : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
          }`}
        >
          {bookmark.checked !== false && <Icons.Check size={8} className="text-white" strokeWidth={3} />}
      </div>

      <Icons.Link size={14} className="text-gray-300 dark:text-gray-600 group-hover:text-gray-400 dark:group-hover:text-gray-500 shrink-0" />
      <a href={bookmark.link} target="_blank" rel="noopener noreferrer" className="truncate hover:text-gray-900 dark:hover:text-gray-200 transition-colors block max-w-full">
        {bookmark.title || bookmark.link}
      </a>
    </div>
  )
}