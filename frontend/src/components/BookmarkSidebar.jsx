import { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronDown, Plus, Star, Trash2, Search, X, FolderPlus, Loader2 } from 'lucide-react';
import { useBrowser } from '../context/BrowserContext';

export default function BookmarkSidebar() {
  const {
    bookmarks,
    folders,
    expandedFolders,
    navigate,
    addBookmark,
    removeBookmark,
    deleteFolder,
    searchBookmarks,
    toggleFolder,
    currentUrl,
    createFolder,
    showError,
  } = useBrowser();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newBookmark, setNewBookmark] = useState({ url: '', title: '', folder: 'default' });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!showSearch) return;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!searchQuery.trim()) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    debounceRef.current = setTimeout(async () => {
      const results = await searchBookmarks(searchQuery);
      setSearchResults(results);
      setIsSearching(false);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchQuery, showSearch, searchBookmarks]);

  const handleAddBookmark = async () => {
    if (!newBookmark.url || !newBookmark.title) {
      showError('URL and Title are required');
      return;
    }
    try {
      await addBookmark(newBookmark.url, newBookmark.title, newBookmark.folder);
      setNewBookmark({ url: '', title: '', folder: 'default' });
      setShowAddForm(false);
    } catch (err) {
      // Error handled by context
    }
  };

  const handleRemoveBookmark = async (e, id, folder) => {
    e.stopPropagation();
    if (confirm('Remove this bookmark?')) {
      await removeBookmark(id, folder);
    }
  };

  const handleVisitBookmark = (url) => {
    let fullUrl = url;
    if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
      fullUrl = 'https://' + fullUrl;
    }
    navigate(fullUrl, true);
  };

  const handleCreateFolder = () => {
    const folderName = newFolderName.trim().toLowerCase().replace(/\s+/g, '-');
    if (!folderName) {
      showError('Folder name is required');
      return;
    }
    if (folders.includes(folderName)) {
      showError('Folder already exists');
      return;
    }
    createFolder(folderName);
    setNewBookmark(prev => ({ ...prev, folder: folderName }));
    setNewFolderName('');
    setShowNewFolderInput(false);
    setShowAddForm(true);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults(null);
    setShowSearch(false);
  };

  return (
    <div className="w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-500" />
            Bookmarks
          </h2>
          <div className="flex gap-1">
            <button
              onClick={() => { setShowSearch(!showSearch); setShowAddForm(false); setShowNewFolderInput(false); setSearchResults(null); }}
              className={`p-1.5 rounded transition ${showSearch ? 'bg-blue-100 dark:bg-blue-900 text-blue-600' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              title="Search Bookmarks"
            >
              <Search className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setShowNewFolderInput(!showNewFolderInput); setShowAddForm(false); setShowSearch(false); setSearchResults(null); }}
              className={`p-1.5 rounded transition ${showNewFolderInput ? 'bg-blue-100 dark:bg-blue-900 text-blue-600' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              title="Create Folder"
            >
              <FolderPlus className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setShowAddForm(!showAddForm); setShowSearch(false); setShowNewFolderInput(false); setSearchResults(null); }}
              className={`p-1.5 rounded transition ${showAddForm ? 'bg-blue-100 dark:bg-blue-900 text-blue-600' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              title="Add Bookmark"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {showNewFolderInput && (
          <div className="mx-1 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex gap-2">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                placeholder="Folder name"
                className="flex-1 px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
              />
              <button
                onClick={handleCreateFolder}
                className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition"
              >
                Create
              </button>
            </div>
          </div>
        )}

        {showSearch && (
          <div className="mx-1 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search bookmarks..."
                className="w-full px-3 py-2 pr-10 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
              />
              {isSearching ? (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500 animate-spin" />
              ) : searchQuery ? (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : null}
            </div>
          </div>
        )}

        {showAddForm && (
          <div className="mx-1 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2">
            <input
              type="text"
              value={newBookmark.url}
              onChange={(e) => setNewBookmark({ ...newBookmark, url: e.target.value })}
              placeholder="URL"
              className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
            />
            <input
              type="text"
              value={newBookmark.title}
              onChange={(e) => setNewBookmark({ ...newBookmark, title: e.target.value })}
              placeholder="Title"
              className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
            />
            <select
              value={newBookmark.folder}
              onChange={(e) => setNewBookmark({ ...newBookmark, folder: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
            >
              {folders.map(folder => (
                <option key={folder} value={folder}>
                  {folder.charAt(0).toUpperCase() + folder.slice(1)}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={handleAddBookmark}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition"
              >
                Add
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-500 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {searchResults !== null ? (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
              </p>
              <button
                onClick={handleClearSearch}
                className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Clear
              </button>
            </div>
            <div className="space-y-1">
              {searchResults.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                  No bookmarks found
                </p>
              ) : (
                searchResults.map(bookmark => (
                  <div
                    key={bookmark.id}
                    className="group mx-1 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition"
                  >
                    <div
                      className="flex justify-between items-start"
                      onClick={() => handleVisitBookmark(bookmark.url)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                          {bookmark.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {bookmark.url}
                        </p>
                        <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded">
                          {bookmark.folder}
                        </span>
                      </div>
                      <button
                        onClick={(e) => handleRemoveBookmark(e, bookmark.id, bookmark.folder)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition ml-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {folders.map(folder => (
              <div key={folder} className="rounded-lg overflow-hidden group">
                <div
                  className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition rounded-lg mx-1"
                >
                  <button
                    onClick={() => toggleFolder(folder)}
                    className="flex items-center gap-2 flex-1"
                  >
                    {expandedFolders[folder] ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                    <FolderPlus className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium">
                      {folder.charAt(0).toUpperCase() + folder.slice(1)}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-600 rounded-full">
                      {bookmarks[folder]?.length || 0}
                    </span>
                  </button>
                  {folder !== 'default' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete folder "${folder}" and all its bookmarks?`)) {
                          deleteFolder(folder);
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition"
                      title="Delete folder"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                {expandedFolders[folder] && (
                  <div className="ml-6 mt-1 space-y-0.5">
                    {bookmarks[folder]?.length === 0 ? (
                      <p className="text-xs text-gray-400 dark:text-gray-500 px-3 py-2">
                        No bookmarks
                      </p>
                    ) : (
                      bookmarks[folder]?.map(bookmark => (
                        <div
                          key={bookmark.id}
                          className={`group p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition ${
                            currentUrl === bookmark.url 
                              ? 'bg-blue-50 dark:bg-blue-900/30 border-l-2 border-blue-500' 
                              : ''
                          }`}
                        >
                          <div
                            className="flex items-center justify-between"
                            onClick={() => handleVisitBookmark(bookmark.url)}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-800 dark:text-gray-200 truncate">
                                {bookmark.title}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {bookmark.url}
                              </p>
                            </div>
                            <button
                              onClick={(e) => handleRemoveBookmark(e, bookmark.id, folder)}
                              className="opacity-0 group-hover:opacity-100 p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition ml-2"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
