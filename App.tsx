import React, { useState, useEffect } from 'react';
import { Icons } from './components/Icon';
import { validateToken, fetchAllCollections, fetchBookmarks } from './services/raindropApi';
import { CollectionNode, ProcessingStatus, ExportFormat } from './types';
import { buildCollectionTree, flattenTree, toggleCollectionChecked, toggleBookmarkChecked, setAllNodesChecked } from './utils/treeUtils';
import { generateJSON, generateNetscapeHTML, generateCSV, generateXML, downloadFile } from './utils/exportGenerators';
import { TreeItem } from './components/TreeItem';

const App: React.FC = () => {
  // State
  const [token, setToken] = useState<string>(localStorage.getItem('raindrop_token') || '');
  const [step, setStep] = useState<number>(1); // 1: Token, 2: Fetch, 3: Export
  const [roots, setRoots] = useState<CollectionNode[]>([]);
  const [status, setStatus] = useState<ProcessingStatus>({
    totalCollections: 0,
    processedCollections: 0,
    totalBookmarks: 0,
    currentCollectionName: '',
    isComplete: false,
    error: null
  });
  const [isLoading, setIsLoading] = useState(false);
  
  // Theme State
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' ||
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  // Theme Effect
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  // Handlers
  const handleTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus(prev => ({ ...prev, error: null }));
    
    try {
      const isValid = await validateToken(token);
      if (isValid) {
        localStorage.setItem('raindrop_token', token);
        const collections = await fetchAllCollections(token);
        const treeRoots = buildCollectionTree(collections);
        setRoots(treeRoots);
        setStep(2);
      } else {
        setStatus(prev => ({ ...prev, error: "Invalid Access Token" }));
      }
    } catch (err) {
      setStatus(prev => ({ ...prev, error: "Connection Error" }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetchAll = async () => {
    if (!token) return;
    setIsLoading(true);
    setStep(3); 
    
    // Only process checked nodes
    const allFlatNodes = flattenTree(roots);
    const nodesToFetch = allFlatNodes.filter(n => n.checked !== false);
    
    let totalBms = 0;
    
    setStatus(prev => ({
      ...prev,
      totalCollections: nodesToFetch.length,
      processedCollections: 0,
      isComplete: false,
      error: null
    }));

    try {
      for (let i = 0; i < nodesToFetch.length; i++) {
        const node = nodesToFetch[i];
        
        setStatus(prev => ({
          ...prev,
          currentCollectionName: node.title,
          processedCollections: i + 1
        }));

        const bookmarks = await fetchBookmarks(token, node._id, () => {});
        
        // Initialize new bookmarks as checked
        const bookmarksWithState = bookmarks.map(b => ({ ...b, checked: true }));

        node.bookmarks = bookmarksWithState;
        node.isFullyLoaded = true;
        totalBms += bookmarks.length;
        
        setStatus(prev => ({ ...prev, totalBookmarks: totalBms }));
        // Note: Mutating `roots` deeply via `node` reference works because we only need to trigger re-render
        setRoots([...roots]); 
      }
      
      setStatus(prev => ({ ...prev, isComplete: true, currentCollectionName: 'All done.' }));
      
    } catch (err) {
      console.error(err);
      setStatus(prev => ({ ...prev, error: "Error fetching bookmarks." }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = (format: ExportFormat) => {
    const filename = `raindrop-${new Date().toISOString().split('T')[0]}`;
    
    switch (format) {
      case 'json':
        downloadFile(generateJSON(roots), `${filename}.json`, 'application/json');
        break;
      case 'html':
        downloadFile(generateNetscapeHTML(roots), `${filename}.html`, 'text/html');
        break;
      case 'csv':
        downloadFile(generateCSV(roots), `${filename}.csv`, 'text/csv');
        break;
      case 'xml':
        downloadFile(generateXML(roots), `${filename}.xml`, 'application/xml');
        break;
    }
  };

  // Selection Handlers
  const handleToggleNode = (id: number, checked: boolean) => {
    const newRoots = toggleCollectionChecked(roots, id, checked);
    setRoots(newRoots);
  };

  const handleToggleBookmark = (bookmarkId: number, checked: boolean) => {
    const newRoots = toggleBookmarkChecked(roots, bookmarkId, checked);
    setRoots(newRoots);
  };

  const handleSelectAll = (checked: boolean) => {
    const newRoots = setAllNodesChecked(roots, checked);
    setRoots(newRoots);
  };

  const getSelectedCount = () => {
     const flat = flattenTree(roots);
     return flat.filter(n => n.checked !== false).length;
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-gray-900 bg-white dark:bg-gray-950 dark:text-gray-100 transition-colors duration-300">
      {/* Minimal Header */}
      <header className="border-b border-gray-100 dark:border-gray-900 py-4 transition-colors">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 p-1.5 rounded-md transition-colors">
                <Icons.Download size={16} strokeWidth={2.5} />
            </div>
            <h1 className="font-semibold text-gray-900 dark:text-white tracking-tight">Raindrop Exporter</h1>
          </div>
          <div className="flex items-center gap-4">
            {step > 1 && (
              <button onClick={() => setStep(1)} className="text-xs text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors">
                Reset
              </button>
            )}
            <button 
              onClick={() => setIsDark(!isDark)}
              className="p-2 text-gray-400 hover:text-gray-900 dark:text-gray-500 dark:hover:text-gray-100 rounded-full hover:bg-gray-100 dark:hover:bg-gray-900 transition-all"
              aria-label="Toggle Dark Mode"
            >
              {isDark ? <Icons.Sun size={18} /> : <Icons.Moon size={18} />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full p-6">
        
        {/* Step 1: Token Input */}
        {step === 1 && (
          <div className="max-w-md mx-auto mt-24">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white mb-2">Connect your account</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                Enter your test access token from Raindrop.io settings.
                </p>
            </div>
            
            <form onSubmit={handleTokenSubmit} className="space-y-4">
              <div className="relative">
                <input 
                  type="password" 
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsIn..."
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-3 text-sm font-mono focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-500 focus:border-transparent focus:outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600 dark:text-white"
                  required
                />
              </div>
              
              {status.error && (
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-xs bg-red-50 dark:bg-red-900/20 p-3 rounded-md border border-red-100 dark:border-red-900/30">
                  <Icons.Error size={14} />
                  {status.error}
                </div>
              )}

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {isLoading ? <Icons.Loader className="animate-spin" size={16} /> : "Continue"}
              </button>
            </form>
            
            <div className="mt-8 text-center">
                 <a href="https://app.raindrop.io/settings/integrations" target="_blank" className="text-xs text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 border-b border-gray-200 dark:border-gray-800 hover:border-gray-900 dark:hover:border-white pb-0.5 transition-all">
                    Where do I find my token?
                 </a>
            </div>
          </div>
        )}

        {/* Step 2 & 3: Workspace */}
        {step >= 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 h-full">
            
            {/* Sidebar Controls */}
            <div className="lg:col-span-4 space-y-8">
              <div className="sticky top-10">
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Export</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {step === 2 
                            ? 'Select collections to fetch.' 
                            : status.isComplete 
                                ? 'Refine your selection before downloading.' 
                                : 'Fetching your bookmarks...'}
                    </p>
                </div>
                
                {step === 2 && (
                  <button 
                    onClick={handleFetchAll}
                    disabled={getSelectedCount() === 0}
                    className="w-full bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {getSelectedCount() === 0 ? 'Select Collections' : `Fetch ${getSelectedCount()} Collections`}
                    <Icons.ChevronRight size={16} />
                  </button>
                )}

                {step === 3 && (
                  <div className="space-y-6">
                    {/* Status Indicators */}
                    <div className="space-y-2">
                       <div className="flex justify-between text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                           <span>Progress</span>
                           <span>{Math.round((status.processedCollections / status.totalCollections) * 100)}%</span>
                       </div>
                       <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div className="h-full bg-gray-900 dark:bg-white transition-all duration-300" style={{ width: `${(status.processedCollections / status.totalCollections) * 100}%` }}></div>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="border border-gray-100 dark:border-gray-800 rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
                            <div className="text-2xl font-semibold text-gray-900 dark:text-white">{status.totalBookmarks}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">Bookmarks</div>
                        </div>
                        <div className="border border-gray-100 dark:border-gray-800 rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
                            <div className="text-2xl font-semibold text-gray-900 dark:text-white">{status.processedCollections}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">Collections</div>
                        </div>
                    </div>
                    
                    {!status.isComplete && (
                        <div className="text-xs text-gray-400 font-mono truncate">
                            Processing: {status.currentCollectionName}
                        </div>
                    )}

                    {status.isComplete && (
                      <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-medium bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
                          <Icons.Check size={16} />
                          Ready to download
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <button 
                            onClick={() => handleExport('html')}
                            className="col-span-2 w-full bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                          >
                            <Icons.FileText size={16} /> Download HTML
                          </button>
                          
                          <button 
                            onClick={() => handleExport('json')}
                            className="w-full bg-white dark:bg-transparent border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 py-2.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                          >
                            <Icons.FileCode size={14} /> JSON
                          </button>
                          
                          <button 
                            onClick={() => handleExport('csv')}
                            className="w-full bg-white dark:bg-transparent border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 py-2.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                          >
                             <Icons.FileSpreadsheet size={14} /> CSV
                          </button>

                          <button 
                            onClick={() => handleExport('xml')}
                            className="col-span-2 w-full bg-white dark:bg-transparent border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                          >
                             <span className="font-mono text-[10px]">&lt;/&gt;</span> XML (Advanced)
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Tree Preview */}
            <div className="lg:col-span-8">
               <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden bg-white dark:bg-gray-900 transition-colors">
                 <div className="bg-gray-50 dark:bg-gray-900/50 px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                     <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Preview</span>
                     <div className="h-4 w-px bg-gray-300 dark:bg-gray-700"></div>
                     <button onClick={() => handleSelectAll(true)} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Select All</button>
                     <button onClick={() => handleSelectAll(false)} className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-300 hover:underline">None</button>
                   </div>
                   <span className="text-xs font-mono text-gray-400 dark:text-gray-500">{roots.length} Root Items</span>
                 </div>
                 <div className="p-2 overflow-auto max-h-[75vh]">
                   {roots.length === 0 ? (
                     <div className="text-center py-20 text-gray-400 dark:text-gray-600 text-sm">No collections found.</div>
                   ) : (
                     <div className="space-y-0.5">
                       {roots.map(node => (
                         <TreeItem 
                            key={node._id} 
                            node={node} 
                            onToggleNode={handleToggleNode}
                            onToggleBookmark={handleToggleBookmark}
                         />
                       ))}
                     </div>
                   )}
                 </div>
               </div>
            </div>

          </div>
        )}
      </main>

      {/* Buy Me A Coffee Fixed Button */}
      <a 
        href="https://buymeacoffee.com" 
        target="_blank" 
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded-full font-medium shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
      >
        <Icons.Coffee size={18} />
        <span className="text-sm font-semibold">Buy me a coffee</span>
      </a>
    </div>
  );
};

export default App;