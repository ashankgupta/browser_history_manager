import { useState, useEffect } from 'react';
import { AlertCircle, Globe, Loader2, ExternalLink, AlertTriangle } from 'lucide-react';
import { useBrowser } from './context/BrowserContext';
import AddressBar from './components/AddressBar';
import NavigationButtons from './components/NavigationButtons';
import BookmarkSidebar from './components/BookmarkSidebar';
import HistoryPanel from './components/HistoryPanel';

function App() {
  const { error, currentUrl, canGoBack, canGoForward, goBack, goForward, loading, darkMode } = useBrowser();
  const [iframeError, setIframeError] = useState(false);
  const [iframeErrorMsg, setIframeErrorMsg] = useState('');
  const [iframeLoading, setIframeLoading] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [viewMode, setViewMode] = useState('preview');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        if (canGoBack) goBack();
      } else if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault();
        if (canGoForward) goForward();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canGoBack, canGoForward, goBack, goForward]);

  useEffect(() => {
    if (currentUrl) {
      setIframeError(false);
      setIframeErrorMsg('');
      setIframeLoading(true);
      setIframeKey(prev => prev + 1);
    }
  }, [currentUrl]);

  useEffect(() => {
    if (!currentUrl) return;

    const timeout = setTimeout(() => {
      if (iframeLoading) {
        setIframeLoading(false);
        setIframeError(true);
        setIframeErrorMsg('Page took too long to load');
      }
    }, 15000);

    return () => clearTimeout(timeout);
  }, [currentUrl, iframeLoading]);

  const getProxyUrl = (url) => {
    return `/proxy?url=${encodeURIComponent(url)}`;
  };

  const handleIframeLoad = () => {
    setIframeLoading(false);
    setIframeError(false);
  };

  const handleIframeError = () => {
    setIframeLoading(false);
    setIframeError(true);
  };

  const openInNewTab = () => {
    if (currentUrl) {
      window.open(currentUrl, '_blank');
    }
  };

  return (
    <div className={`h-screen flex flex-col ${darkMode ? 'dark' : ''}`}>
      <header className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 shadow-lg">
        <div className="flex items-center gap-4">
          <NavigationButtons />
          <div className="flex-1">
            <AddressBar />
          </div>
          {loading && (
            <Loader2 className="w-5 h-5 text-white animate-spin" />
          )}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden bg-gray-50 dark:bg-gray-900">
        <BookmarkSidebar />
        
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="h-[65%] min-h-[300px] flex items-center justify-center p-4">
            <div className="w-full h-full bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden flex flex-col">
              <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-b border-green-100 dark:border-green-800">
                <div className={`w-2.5 h-2.5 rounded-full ${currentUrl ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <span className="text-xs font-medium text-green-700 dark:text-green-300">
                  {currentUrl ? 'Viewing' : 'Ready'}
                </span>
                <span className="text-xs text-green-600 dark:text-green-400 truncate flex-1">
                  {currentUrl || 'Enter a URL to browse'}
                </span>
                {currentUrl && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setViewMode(viewMode === 'preview' ? 'info' : 'preview')}
                      className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-800/30"
                    >
                      {viewMode === 'preview' ? 'Info' : 'Preview'}
                    </button>
                    <button
                      onClick={openInNewTab}
                      className="p-1 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 rounded"
                      title="Open in new tab"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {currentUrl ? (
                viewMode === 'preview' ? (
                  <div className="flex-1 relative bg-white dark:bg-gray-900">
                    {iframeLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-800 z-10">
                        <div className="text-center">
                          <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" />
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Loading page...</p>
                        </div>
                      </div>
                    )}
                    {iframeError ? (
                      <div className="flex-1 flex items-center justify-center">
                        <div className="text-center p-4 max-w-md">
                          <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-yellow-500" />
                          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Cannot display this page
                          </h3>
                          {iframeErrorMsg && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                              {iframeErrorMsg}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                            This site uses security restrictions that prevent embedding (CORS/X-Frame-Options).
                            Complex sites like Google, Facebook, etc. will not work.
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
                            Simple HTML pages should work fine.
                          </p>
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => { setIframeError(false); setIframeLoading(true); setIframeKey(prev => prev + 1); }}
                              className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                            >
                              Retry
                            </button>
                            <button
                              onClick={openInNewTab}
                              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                              Open in Browser
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <iframe
                          key={iframeKey}
                          src={getProxyUrl(currentUrl)}
                          className="w-full h-full border-0"
                          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation"
                          onLoad={handleIframeLoad}
                          onError={handleIframeError}
                          title="Website preview"
                        />
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex-1 overflow-auto p-4">
                    <div className="max-w-2xl mx-auto">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center">
                          <Globe className="w-6 h-6 text-blue-500 dark:text-blue-400" />
                        </div>
                        <div>
                          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                            {currentUrl}
                          </h2>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            URL in Browser History Manager
                          </p>
                        </div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                        <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">
                          <strong>Full URL:</strong>
                        </p>
                        <code className="text-xs break-all text-blue-600 dark:text-blue-400">
                          {currentUrl}
                        </code>
                      </div>
                    </div>
                  </div>
                )
              ) : (
                <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
                  <div className="text-center p-4">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                      <Globe className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-1">
                      Browser History Manager
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Enter a URL above to browse
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex-1 min-h-0 border-t border-gray-200 dark:border-gray-700">
            <HistoryPanel />
          </div>
        </main>
      </div>

      {error && (
        <div className="fixed bottom-4 right-4 flex items-center gap-3 px-5 py-3 bg-red-500 text-white rounded-xl shadow-xl animate-pulse">
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium">{error}</span>
        </div>
      )}
    </div>
  );
}

export default App;
