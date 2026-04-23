import { ChevronLeft, ChevronRight, Moon, Sun, Home } from 'lucide-react';
import { useBrowser } from '../context/BrowserContext';

export default function NavigationButtons() {
  const { canGoBack, canGoForward, goBack, goForward, darkMode, toggleDarkMode, visit } = useBrowser();

  const handleHome = () => {
    // Clear current URL - you could add a /home endpoint if needed
  };

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={goBack}
        disabled={!canGoBack}
        className="p-2.5 rounded-xl hover:bg-white/20 transition disabled:opacity-40 disabled:cursor-not-allowed text-white hover:bg-white/10"
        title="Go Back (Alt + ←)"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={goForward}
        disabled={!canGoForward}
        className="p-2.5 rounded-xl hover:bg-white/20 transition disabled:opacity-40 disabled:cursor-not-allowed text-white hover:bg-white/10"
        title="Go Forward (Alt + →)"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
      <div className="w-px h-6 bg-white/30 mx-2" />
      <button
        onClick={toggleDarkMode}
        className="p-2.5 rounded-xl hover:bg-white/20 transition text-white hover:bg-white/10"
        title="Toggle Dark Mode"
      >
        {darkMode ? (
          <Sun className="w-5 h-5" />
        ) : (
          <Moon className="w-5 h-5" />
        )}
      </button>
    </div>
  );
}
