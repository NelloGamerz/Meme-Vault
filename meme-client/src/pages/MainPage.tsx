import type React from "react";
import { useEffect } from "react";
import { useMemeStore } from "../store/useMemeStore";
import { MemeCard } from "../components/mainPage/MemeCard";
import { useWebSocketStore } from "../hooks/useWebSockets";

export const MainPage: React.FC = () => {
  const {
    memes,
    fetchMemes,
    isLoading,
    error,
    fetchUserProfile
  } = useMemeStore();
  
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    useWebSocketStore.getState().restoreConnection();
  }, []);

  useEffect(() => {
    fetchMemes();
    fetchUserProfile(user.userId);
  }, [fetchMemes, fetchUserProfile, user.userId]);

  return (
    <div className="p-6">
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="text-center text-red-600 p-4">{error}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {memes.map((meme) => (
            <MemeCard key={meme.id} meme={meme} />
          ))}
          {memes.length === 0 && (
            <div className="col-span-full text-center py-8 sm:py-12">
              <p className="text-gray-500 text-lg">No memes found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};