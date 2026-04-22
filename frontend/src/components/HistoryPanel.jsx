import { useState, useEffect, useRef } from 'react';
import { Clock, Search, Trash2, X, RotateCcw, Loader2, ChevronDown } from 'lucide-react';
import { useBrowser } from '../context/BrowserContext';

export default function HistoryPanel() {
  const { 
    history, 
    historyTotal, 
    historyHasMore, 
    loading, 
    loadingMore,
    navigate, 
    searchHistory, 
    clearHistory, 
    fetchHistory, 
    loadMoreHistory,
    removeFromHistory 
  } = useBrowser();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredHistory, setFilteredHistory] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!searchQuery.trim()) {
      setFilteredHistory(null);
      setIsSearching(false);
      setIsLoading(false);
      return;
    }

    setIsSearching(true);
    setIsLoading(true);

    debounceRef.current = setTimeout(async () => {
      const results = await searchHistory(searchQuery);
      setFilteredHistory(results);
      setIsLoading(false);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchQuery, searchHistory]);

  const handleLoadMore = () => {
    loadMoreHistory();
  };

  const handleVisit = (url) => {
    let fullUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      fullUrl = 'https://' + fullUrl;
    }
    navigate(fullUrl, true);
  };

  const handleDeleteItem = async (e, id) => {
    e.stopPropagation();
    await removeFromHistory(id);
  };

  const handleClearHistory = async () => {
    if (confirm('Clear all browsing history?')) {
      await clearHistory();
      setFilteredHistory(null);
      setSearchQuery('');
      setIsSearching(false);
    }
  };

  const handleRefresh = () => {
    fetchHistory();
    setFilteredHistory(null);
    setSearchQuery('');
    setIsSearching(false);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setFilteredHistory(null);
    setIsSearching(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const displayHistory = filteredHistory !== null ? filteredHistory : history;

  return (
    <div className="bg-white dark:bg-gray-900 border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-700 h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-500" />
            <h2 className="font-semibold text-gray-800 dark:text-gray-200">
              History
            </h2>
            <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-full">
              {historyTotal}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleRefresh}
              className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
              title="Refresh"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={handleClearHistory}
              className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"
              title="Clear History"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search browsing history..."
            className="w-full pl-10 pr-10 py-2.5 text-sm bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-gray-100 placeholder-gray-400"
          />
          {isLoading ? (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />
            </div>
          ) : searchQuery ? (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          ) : null}
        </div>

        {isSearching && !isLoading && (
          <div className="mt-3 flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Found <span className="font-semibold text-purple-600 dark:text-purple-400">{filteredHistory?.length || 0}</span> result{filteredHistory?.length !== 1 ? 's' : ''}
            </p>
            <button
              onClick={handleClearSearch}
              className="text-xs text-purple-600 hover:text-purple-800 dark:text-purple-400 flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Clear search
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {displayHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <Clock className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-sm">
              {isSearching ? 'No results found' : 'No history yet'}
            </p>
            <p className="text-xs mt-1 opacity-75">
              {isSearching ? 'Try a different search term' : 'Start browsing to see your history'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
              {displayHistory.map((item, index) => (
                <div
                  key={item.id || index}
                  className="group flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition"
                  onClick={() => handleVisit(item.url)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 dark:text-gray-200 truncate hover:text-purple-600 dark:hover:text-purple-400 transition">
                      {item.url}
                    </p>
                    {item.visitedAt && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {formatDate(item.visitedAt)}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={(e) => handleDeleteItem(e, item.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            
            {!isSearching && historyHasMore && (
              <div className="p-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl transition disabled:opacity-50"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Loading...</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      <span className="text-sm">Load More ({historyTotal - history.length} remaining)</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
