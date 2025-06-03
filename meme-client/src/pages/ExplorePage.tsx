import React, { useEffect } from 'react';
import { useMemeStore } from '../store/useMemeStore.ts';
import { MemeCard } from '../components/mainPage/MemeCard';
import { Search, X } from 'lucide-react';

export const ExplorePage = () => {
  const { memes, searchMemes, fetchMemes, isLoading } = useMemeStore();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [hasSearched, setHasSearched] = React.useState(false);
  const [isTyping, setIsTyping] = React.useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Focus the search input when the page loads
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // Debounce function to limit how often the search is triggered while typing
  const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = React.useState(value);
    
    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);
      
      return () => {
        clearTimeout(handler);
      };
    }, [value, delay]);
    
    return debouncedValue;
  };
  
  const debouncedSearchQuery = useDebounce(searchQuery, 500); // 500ms delay
  
  // Effect to perform search when debounced query changes
  useEffect(() => {
    if (debouncedSearchQuery.trim()) {
      setIsTyping(true);
      
      // Add a minimum delay to make the search feel more substantial
      const searchPromise = searchMemes(debouncedSearchQuery.trim());
      const minDelay = new Promise(resolve => setTimeout(resolve, 800)); // 800ms minimum delay
      
      Promise.all([searchPromise, minDelay])
        .finally(() => setIsTyping(false));
        
      setHasSearched(true);
    } else if (debouncedSearchQuery === '') {
      setIsTyping(true);
      
      // Add a slight delay when returning to initial state
      const fetchPromise = fetchMemes();
      const minDelay = new Promise(resolve => setTimeout(resolve, 400)); // 400ms minimum delay
      
      Promise.all([fetchPromise, minDelay])
        .finally(() => setIsTyping(false));
        
      setHasSearched(false);
    }
  }, [debouncedSearchQuery, searchMemes, fetchMemes]);
  
  // Keep the form submit handler for users who prefer to press enter
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsTyping(true);
      
      // Use the same delay pattern for consistency
      const searchPromise = searchMemes(searchQuery.trim());
      const minDelay = new Promise(resolve => setTimeout(resolve, 800));
      
      Promise.all([searchPromise, minDelay])
        .finally(() => setIsTyping(false));
        
      setHasSearched(true);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setHasSearched(false);
    setIsTyping(true);
    
    // Add a slight delay when clearing search
    const fetchPromise = fetchMemes();
    const minDelay = new Promise(resolve => setTimeout(resolve, 400));
    
    Promise.all([fetchPromise, minDelay])
      .finally(() => setIsTyping(false));
    
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  return (
    <div className="p-4 sm:p-6 pt-6">
      <div className="max-w-2xl mx-auto mb-6 sm:mb-8">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search memes..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (e.target.value.trim()) {
                setIsTyping(true);
              }
            }}
            className="w-full pl-10 pr-10 py-3 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 shadow-sm"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </form>
      </div>

      {isLoading || isTyping ? (
        <div className="flex flex-col justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600 text-center">
            {isLoading ? "Loading results..." : "Searching for memes..."}
          </p>
          <p className="text-gray-400 text-sm mt-1">This may take a moment</p>
        </div>
      ) : (
        <>
          {hasSearched && (
            <div className="max-w-2xl mx-auto mb-4">
              <p className="text-gray-600">
                {memes.length === 0 
                  ? 'No results found for "' + searchQuery + '"' 
                  : 'Showing results for "' + searchQuery + '"'}
              </p>
            </div>
          )}
          
          {memes.length === 0 && hasSearched ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="bg-gray-100 p-4 rounded-full mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">No memes found</h3>
              <p className="text-gray-500 max-w-md">
                We couldn't find any memes matching your search. Try using different keywords or browse our trending memes.
              </p>
              <button
                onClick={handleClearSearch}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Clear search
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6">
              {memes.map((meme) => (
                <MemeCard key={meme.id} meme={meme} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};