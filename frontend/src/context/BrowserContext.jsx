import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { navigationApi, bookmarkApi, historyApi } from '../services/api';

const BrowserContext = createContext(null);

export function BrowserProvider({ children }) {
  const [currentUrl, setCurrentUrl] = useState('');
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [bookmarks, setBookmarks] = useState({});
  const [folders, setFolders] = useState(['default']);
  const [history, setHistory] = useState([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyHasMore, setHistoryHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState({});

  const showError = useCallback((message) => {
    setError(message);
    setTimeout(() => setError(null), 3000);
  }, []);

  const fetchHistory = useCallback(async (count = 20, append = false) => {
    try {
      if (!append) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      const result = await historyApi.getRecent(count);
      if (result.success) {
        if (append) {
          setHistory(prev => [...prev, ...result.data.items]);
        } else {
          setHistory(result.data.items);
        }
        setHistoryTotal(result.data.total);
        setHistoryHasMore(result.data.hasMore);
      }
    } catch (err) {
      showError(err.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [showError]);

  const loadMoreHistory = useCallback(async () => {
    if (!loadingMore && historyHasMore) {
      await fetchHistory(20, true);
    }
  }, [fetchHistory, loadingMore, historyHasMore]);

  const fetchCurrentUrl = useCallback(async () => {
    try {
      const result = await navigationApi.getCurrent();
      if (result.success) {
        setCurrentUrl(result.data.currentUrl || '');
        setCanGoBack(result.data.canGoBack);
        setCanGoForward(result.data.canGoForward);
      }
    } catch (err) {
      showError(err.message);
    }
  }, [showError]);

  const visit = useCallback(async (url) => {
    setLoading(true);
    setError(null);
    try {
      const result = await navigationApi.visit(url);
      if (result.success) {
        setCurrentUrl(result.data.currentUrl);
        setCanGoBack(result.data.canGoBack);
        setCanGoForward(result.data.canGoForward);
        await fetchHistory();
      }
    } catch (err) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  }, [showError, fetchHistory]);

  const goBack = useCallback(async () => {
    setLoading(true);
    try {
      const result = await navigationApi.back();
      if (result.success) {
        setCurrentUrl(result.data.currentUrl);
        setCanGoBack(result.data.canGoBack);
        setCanGoForward(result.data.canGoForward);
        await fetchHistory();
      }
    } catch (err) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  }, [showError, fetchHistory]);

  const goForward = useCallback(async () => {
    setLoading(true);
    try {
      const result = await navigationApi.forward();
      if (result.success) {
        setCurrentUrl(result.data.currentUrl);
        setCanGoBack(result.data.canGoBack);
        setCanGoForward(result.data.canGoForward);
        await fetchHistory();
      }
    } catch (err) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  }, [showError, fetchHistory]);

  const navigate = useCallback(async (url, fromHistory = false) => {
    setLoading(true);
    setError(null);
    try {
      const result = await navigationApi.navigate(url, fromHistory);
      if (result.success) {
        setCurrentUrl(result.data.currentUrl);
        setCanGoBack(result.data.canGoBack);
        setCanGoForward(result.data.canGoForward);
        if (!fromHistory) {
          await fetchHistory();
        }
      }
    } catch (err) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  }, [showError, fetchHistory]);

  const fetchFolders = useCallback(async () => {
    try {
      const result = await bookmarkApi.getFolders();
      if (result.success) {
        setFolders(result.data.length > 0 ? result.data : ['default']);
      }
    } catch (err) {
      showError(err.message);
    }
  }, [showError]);

  const fetchBookmarksByFolder = useCallback(async (folder) => {
    try {
      const result = await bookmarkApi.getByFolder(folder);
      if (result.success) {
        setBookmarks(prev => ({ ...prev, [folder]: result.data }));
      }
    } catch (err) {
      showError(err.message);
    }
  }, [showError]);

  const fetchAllBookmarks = useCallback(async () => {
    try {
      const allBookmarks = {};
      for (const folder of folders) {
        const result = await bookmarkApi.getByFolder(folder);
        if (result.success) {
          allBookmarks[folder] = result.data;
        }
      }
      setBookmarks(allBookmarks);
    } catch (err) {
      showError(err.message);
    }
  }, [folders, showError]);

  const addBookmark = useCallback(async (url, title, folder = 'default') => {
    setLoading(true);
    try {
      const result = await bookmarkApi.add(url, title, folder);
      if (result.success) {
        await fetchFolders();
        await fetchBookmarksByFolder(folder);
      }
      return result;
    } catch (err) {
      showError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchFolders, fetchBookmarksByFolder, showError]);

  const removeBookmark = useCallback(async (id, folder) => {
    try {
      const result = await bookmarkApi.remove(id, folder);
      if (result.success) {
        await fetchBookmarksByFolder(folder);
      }
      return result;
    } catch (err) {
      showError(err.message);
      throw err;
    }
  }, [fetchBookmarksByFolder, showError]);

  const deleteFolder = useCallback(async (folder) => {
    if (folder === 'default') {
      showError('Cannot delete default folder');
      return;
    }
    try {
      const result = await bookmarkApi.deleteFolder(folder);
      if (result.success) {
        setFolders(prev => prev.filter(f => f !== folder));
        setBookmarks(prev => {
          const newBookmarks = { ...prev };
          delete newBookmarks[folder];
          return newBookmarks;
        });
        setExpandedFolders(prev => {
          const newExpanded = { ...prev };
          delete newExpanded[folder];
          return newExpanded;
        });
      }
      return result;
    } catch (err) {
      showError(err.message);
      throw err;
    }
  }, [showError]);

  const searchBookmarks = useCallback(async (query) => {
    try {
      const result = await bookmarkApi.search(query);
      if (result.success) {
        return result.data;
      }
      return [];
    } catch (err) {
      showError(err.message);
      return [];
    }
  }, [showError]);

  const searchHistory = useCallback(async (query) => {
    try {
      const result = await historyApi.search(query);
      if (result.success) {
        return result.data;
      }
      return [];
    } catch (err) {
      showError(err.message);
      return [];
    }
  }, [showError]);

  const clearHistory = useCallback(async () => {
    try {
      const result = await historyApi.clear();
      if (result.success) {
        setHistory([]);
        setHistoryTotal(0);
        setHistoryHasMore(false);
      }
      return result;
    } catch (err) {
      showError(err.message);
      throw err;
    }
  }, [showError]);

  const removeFromHistory = useCallback(async (id) => {
    try {
      const result = await historyApi.remove(id);
      if (result.success) {
        setHistory(prev => prev.filter(item => item.id !== id));
        setHistoryTotal(prev => prev - 1);
      }
      return result;
    } catch (err) {
      showError(err.message);
      throw err;
    }
  }, [showError]);

  const toggleFolder = useCallback((folder) => {
    setExpandedFolders(prev => ({ ...prev, [folder]: !prev[folder] }));
  }, []);

  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => !prev);
  }, []);

  const createFolder = useCallback((folderName) => {
    if (!folders.includes(folderName)) {
      setFolders(prev => [...prev, folderName]);
      setExpandedFolders(prev => ({ ...prev, [folderName]: false }));
    }
  }, [folders]);

  useEffect(() => {
    fetchCurrentUrl();
    fetchFolders();
    fetchHistory();
  }, [fetchCurrentUrl, fetchFolders, fetchHistory]);

  useEffect(() => {
    if (folders.length > 0) {
      fetchAllBookmarks();
    }
  }, [folders, fetchAllBookmarks]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const value = {
    currentUrl,
    canGoBack,
    canGoForward,
    bookmarks,
    folders,
    history,
    historyTotal,
    historyHasMore,
    loading,
    loadingMore,
    error,
    darkMode,
    expandedFolders,
    visit,
    navigate,
    goBack,
    goForward,
    fetchCurrentUrl,
    fetchFolders,
    fetchBookmarksByFolder,
    addBookmark,
    removeBookmark,
    deleteFolder,
    searchBookmarks,
    fetchHistory,
    loadMoreHistory,
    searchHistory,
    clearHistory,
    removeFromHistory,
    toggleFolder,
    toggleDarkMode,
    createFolder,
    showError,
  };

  return (
    <BrowserContext.Provider value={value}>
      {children}
    </BrowserContext.Provider>
  );
}

export function useBrowser() {
  const context = useContext(BrowserContext);
  if (!context) {
    throw new Error('useBrowser must be used within a BrowserProvider');
  }
  return context;
}
