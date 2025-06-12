"use client"

interface StatsDisplayProps {
  likeCount: number
  commentCount: number
  saveCount: number
}

export function StatsDisplay({ likeCount, commentCount, saveCount }: StatsDisplayProps) {
  return (
    <div className="mb-6">
      <div className="bg-white/40 backdrop-blur-sm rounded-xl p-4 border border-white/30">
        <div className="flex items-center justify-around text-sm">
          <div className="text-center">
            <p className="font-bold text-lg text-red-600">{likeCount || 0}</p>
            <p className="text-slate-600 text-xs font-medium">likes</p>
          </div>

          <div className="w-px h-8 bg-slate-200"></div>

          <div className="text-center">
            <p className="font-bold text-lg text-blue-600">{commentCount}</p>
            <p className="text-slate-600 text-xs font-medium">comments</p>
          </div>

          <div className="w-px h-8 bg-slate-200"></div>

          <div className="text-center">
            <p className="font-bold text-lg text-purple-600">{saveCount || 0}</p>
            <p className="text-slate-600 text-xs font-medium">saves</p>
          </div>
        </div>
      </div>
    </div>
  )
}
