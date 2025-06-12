"use client"

import { Heart, Download, Bookmark } from "lucide-react"
import { cn } from "../../hooks/utils"

interface ActionButtonsProps {
  isLiked: boolean
  isSaved: boolean
  onLike: () => void
  onSave: () => void
  onDownload: () => void
}

export function ActionButtons({ isLiked, isSaved, onLike, onSave, onDownload }: ActionButtonsProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center space-x-3">
        <button
          onClick={onSave}
          className={cn(
            "px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5",
            isSaved
              ? "bg-gradient-to-r from-slate-700 to-slate-800 text-white"
              : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700",
          )}
        >
          <div className="flex items-center space-x-2">
            <Bookmark className={cn("w-4 h-4", isSaved && "fill-current")} />
            <span>{isSaved ? "Saved" : "Save"}</span>
          </div>
        </button>

        <button
          onClick={onDownload}
          className="p-2.5 rounded-xl hover:bg-white/60 backdrop-blur-sm text-slate-700 hover:text-indigo-600 transition-all duration-200 shadow-md hover:shadow-lg group"
        >
          <Download className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
        </button>
      </div>

      <button
        onClick={onLike}
        className={cn(
          "p-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg group",
          isLiked
            ? "text-red-500 bg-red-50/80 backdrop-blur-sm hover:bg-red-100/80"
            : "text-slate-700 hover:bg-white/60 backdrop-blur-sm hover:text-red-500",
        )}
      >
        <Heart
          className={cn("w-6 h-6 group-hover:scale-110 transition-transform duration-200", isLiked && "fill-current")}
        />
      </button>
    </div>
  )
}
