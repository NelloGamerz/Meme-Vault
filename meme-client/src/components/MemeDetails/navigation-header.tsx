"use client"

import { ArrowLeft, Share2, MoreHorizontal } from "lucide-react"

interface NavigationHeaderProps {
  onBack: () => void
  onShare: () => void
}

export function NavigationHeader({ onBack, onShare }: NavigationHeaderProps) {
  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-sm">
      <div className="max-w-full mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center text-slate-700 hover:text-slate-900 transition-all duration-200 p-2.5 rounded-xl hover:bg-white/60 backdrop-blur-sm group"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform duration-200" />
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={onShare}
              className="p-2.5 rounded-xl hover:bg-white/60 backdrop-blur-sm text-slate-700 hover:text-indigo-600 transition-all duration-200 group"
            >
              <Share2 className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
            </button>

            <button className="p-2.5 rounded-xl hover:bg-white/60 backdrop-blur-sm text-slate-700 hover:text-slate-900 transition-all duration-200 group">
              <MoreHorizontal className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
