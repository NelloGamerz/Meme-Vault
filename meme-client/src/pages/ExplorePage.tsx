import React from 'react';
import { useMemeStore } from '../store/useMemeStore';
import { MemeCard } from '../components/mainPage/MemeCard';
import { Search } from 'lucide-react';

export const ExplorePage = () => {
  const { memes, searchMemes, isLoading } = useMemeStore();
  const [searchQuery, setSearchQuery] = React.useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      searchMemes(searchQuery.trim());
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto mb-8">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search memes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none"
          />
        </form>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {memes.map((meme) => (
            <MemeCard key={meme.id} meme={meme} />
          ))}
        </div>
      )}
    </div>
  );
};