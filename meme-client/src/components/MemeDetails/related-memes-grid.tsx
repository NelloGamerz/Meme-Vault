"use client"

import { Heart, Play, User, Eye } from "lucide-react"
import type { Meme } from "../../types/mems"

interface RelatedMemesGridProps {
  memes: Meme[]
  isLoading: boolean
  hasMore: boolean
  onLoadMore: () => void
  onMemeClick: (memeId: string) => void
  onLike: () => void
  onSave: () => void
}

export function RelatedMemesGrid({
  memes,
  isLoading,
  hasMore,
  onLoadMore,
  onMemeClick,
  onLike,
  onSave,
}: RelatedMemesGridProps) {
  return (
    <div className="mt-12">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-2">
          More memes for you
        </h2>
        <p className="text-slate-600">Discover fresh content from our community</p>
      </div>

      {/* Loading state for initial fetch */}
      {isLoading && memes.length === 0 && (
        <div className="flex justify-center items-center py-12">
          <div className="relative">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-indigo-600"></div>
            <div className="absolute inset-0 rounded-full h-8 w-8 border-4 border-transparent border-t-purple-400 animate-spin animation-delay-150"></div>
          </div>
          <p className="text-slate-600 text-sm ml-3 font-medium">Loading more memes...</p>
        </div>
      )}

      {/* Masonry Grid */}
      {memes.length > 0 && (
        <>
          <div className="columns-3 sm:columns-4 md:columns-5 lg:columns-6 xl:columns-7 2xl:columns-8 gap-3">
            {memes.map((meme, index) => {
              const isVideo = meme.url?.match(/\.(mp4|webm|ogg)$/i)
              const heights = ["h-36", "h-44", "h-52", "h-40", "h-48", "h-56", "h-32", "h-60", "h-64", "h-68"]
              const randomHeight = heights[index % heights.length]

              return (
                <div
                  key={meme.id}
                  onClick={() => onMemeClick(meme.id)}
                  className="group cursor-pointer break-inside-avoid mb-3"
                >
                  <div className="bg-white/70 backdrop-blur-sm rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-white/30 hover:border-white/50 transform hover:-translate-y-1">
                    {/* Image Container */}
                    <div
                      className={`relative ${randomHeight} overflow-hidden bg-gradient-to-br from-slate-100 to-gray-200`}
                    >
                      {isVideo ? (
                        <video
                          src={meme.url}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                          muted
                          loop
                          playsInline
                        />
                      ) : (
                        <img
                          src={meme.url || "/placeholder.svg"}
                          alt={meme.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                      )}

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      {/* Video Play Icon */}
                      {isVideo && (
                        <div className="absolute top-3 right-3">
                          <div className="bg-black/60 backdrop-blur-sm rounded-full p-1.5 border border-white/20">
                            <Play className="w-3 h-3 text-white fill-white" />
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onLike()
                          }}
                          className="bg-white/90 backdrop-blur-sm hover:bg-white text-slate-700 hover:text-red-500 rounded-full p-2 transition-all duration-200 shadow-lg hover:shadow-xl border border-white/20"
                        >
                          <Heart className="w-3 h-3" />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onSave()
                          }}
                          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 shadow-lg hover:shadow-xl backdrop-blur-sm border border-white/20"
                        >
                          Save
                        </button>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-3 bg-white/50 backdrop-blur-sm">
                      <h3 className="text-sm font-semibold text-slate-800 line-clamp-2 mb-2 leading-tight group-hover:text-indigo-600 transition-colors duration-200">
                        {meme.title}
                      </h3>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {meme.profilePictureUrl ? (
                            <img
                              src={meme.profilePictureUrl || "/placeholder.svg"}
                              alt={meme.uploader}
                              className="w-5 h-5 rounded-full object-cover ring-1 ring-white shadow-sm"
                            />
                          ) : (
                            <div className="w-5 h-5 bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 rounded-full flex items-center justify-center ring-1 ring-white shadow-sm">
                              <User className="w-3 h-3" />
                            </div>
                          )}

                          <span className="text-xs text-slate-600 truncate font-medium">{meme.uploader}</span>
                        </div>

                        <div className="flex items-center space-x-1 text-xs text-slate-500">
                          <Heart className="w-3 h-3" />
                          <span>{meme.likeCount || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Load More Button */}
          <div className="text-center mt-8">
            {hasMore ? (
              <button
                onClick={onLoadMore}
                disabled={isLoading}
                className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Loading...</span>
                  </div>
                ) : (
                  "Load More Memes"
                )}
              </button>
            ) : (
              <div className="bg-white/40 backdrop-blur-sm rounded-xl p-6 border border-white/30">
                <p className="text-slate-600 font-medium">You've reached the end!</p>
                <p className="text-slate-500 text-sm mt-1">No more memes to load right now.</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Empty state */}
      {!isLoading && memes.length === 0 && (
        <div className="text-center py-12 bg-white/30 backdrop-blur-sm rounded-2xl border border-white/20">
          <Eye className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">No more memes available</p>
          <p className="text-slate-500 text-sm mt-1">Check back later for fresh content!</p>
        </div>
      )}
    </div>
  )
}
