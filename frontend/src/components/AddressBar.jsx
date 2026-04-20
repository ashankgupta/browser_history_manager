import { useState, useEffect, useRef } from 'react';
import { Loader2, ExternalLink, Sparkles, Bookmark, Clock, X } from 'lucide-react';
import { useBrowser } from '../context/BrowserContext';

export default function AddressBar() {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [savingKey, setSavingKey] = useState(false);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const { currentUrl, visit, showError } = useBrowser();

  useEffect(() => {
    const savedKey = localStorage.getItem('openai_api_key');
    if (savedKey) {
      setApiKey(savedKey);
      setAiEnabled(true);
    }
  }, []);

  useEffect(() => {
    if (!inputValue.trim() || inputValue.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (!aiEnabled) {
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`http://localhost:3000/ai/suggestions?q=${encodeURIComponent(inputValue)}`);
        const data = await response.json();
        const suggestionsList = data.suggestions || [];
        setSuggestions(suggestionsList);
        setShowSuggestions(suggestionsList.length > 0);
      } catch (err) {
        console.error('Error fetching suggestions:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [inputValue, aiEnabled]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      let url = inputValue.trim();
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      visit(url);
      setInputValue('');
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (url) => {
    let fullUrl = url;
    if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
      fullUrl = 'https://' + fullUrl;
    }
    visit(fullUrl);
    setInputValue('');
    setShowSuggestions(false);
  };

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) return;
    setSavingKey(true);
    try {
      const response = await fetch('http://localhost:3000/ai/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKey.trim() })
      });
      const data = await response.json();
      if (data.success) {
        localStorage.setItem('openai_api_key', apiKey.trim());
        setAiEnabled(true);
        setShowApiKeyModal(false);
      } else {
        showError(data.error || 'Failed to configure AI');
      }
    } catch (err) {
      showError('Failed to configure AI');
    } finally {
      setSavingKey(false);
    }
  };

  const getSuggestionIcon = (type) => {
    switch (type) {
      case 'bookmark': return <Bookmark className="w-4 h-4 text-yellow-500" />;
      case 'history': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'ai_suggestion': return <Sparkles className="w-4 h-4 text-purple-500" />;
      default: return <ExternalLink className="w-4 h-4 text-gray-400" />;
    }
  };

  const getSourceLabel = (type) => {
    switch (type) {
      case 'bookmark': return 'Bookmark';
      case 'history': return 'History';
      case 'ai_suggestion': return 'AI';
      default: return '';
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="relative flex-1">
        <div className="relative flex items-center">
          {aiEnabled && inputValue.length > 0 && (
            <div className="absolute left-3 z-10">
              <div className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-500 animate-pulse" />
                <span className="text-[10px] text-purple-600 font-medium">AI</span>
              </div>
            </div>
          )}
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            placeholder={currentUrl || 'Enter URL...'}
            className={`w-full px-4 py-2.5 pr-24 bg-white/95 backdrop-blur border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/50 text-gray-900 text-sm shadow-inner ${aiEnabled && inputValue.length > 0 ? 'pl-14' : ''}`}
          />
          <div className="absolute right-1 flex items-center gap-1">
            {loading ? (
              <div className="p-2">
                <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setShowApiKeyModal(true)}
                  className={`p-2 rounded-lg transition ${
                    aiEnabled 
                      ? 'text-purple-600 bg-purple-100 dark:bg-purple-900/30' 
                      : 'text-gray-400 hover:text-purple-500'
                  }`}
                  title={aiEnabled ? 'AI Enabled' : 'Enable AI'}
                >
                  <Sparkles className={`w-4 h-4 ${aiEnabled ? 'fill-current' : ''}`} />
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
                >
                  Go
                </button>
              </>
            )}
          </div>
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
          >
            <div className="p-2 border-b border-gray-100 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">Suggestions</p>
            </div>
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                onClick={() => handleSuggestionClick(suggestion.url)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition"
              >
                {getSuggestionIcon(suggestion.type)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 dark:text-gray-200 truncate">
                    {suggestion.title || suggestion.url}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {suggestion.url}
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  suggestion.type === 'bookmark' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                  suggestion.type === 'history' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                  'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                }`}>
                  {getSourceLabel(suggestion.type)}
                </span>
              </div>
            ))}
          </div>
        )}
      </form>

      {showApiKeyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                AI Suggestions
              </h3>
              <button onClick={() => setShowApiKeyModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Enter your OpenAI API key for AI-powered URL suggestions.
            </p>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full px-4 py-3 text-sm bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-gray-100 mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowApiKeyModal(false)}
                className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveApiKey}
                disabled={!apiKey.trim() || savingKey}
                className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition disabled:opacity-50"
              >
                {savingKey ? 'Saving...' : 'Enable AI'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}