"use client"

import type React from "react"

import { X, MessageCircle, User } from "lucide-react"
import { CommentInput } from "./comment-input"
import type { Comment } from "../../types/mems"

interface MobileCommentModalProps {
  isOpen: boolean
  onClose: () => void
  comments: Comment[]
  commentCount: number
  comment: string
  setComment: (value: string) => void
  onSubmitComment: (e: React.FormEvent) => void
  onProfileClick: (username: string) => void
  isLoadingMoreComments: boolean
  hasMoreComments: boolean
  commentsEndRef: React.RefObject<HTMLDivElement>
  wsClient: WebSocket | null
}

export function MobileCommentModal({
  isOpen,
  onClose,
  comments,
  commentCount,
  comment,
  setComment,
  onSubmitComment,
  onProfileClick,
  isLoadingMoreComments,
  hasMoreComments,
  commentsEndRef,
  wsClient,
}: MobileCommentModalProps) {
  if (!isOpen) return null

  // Sort comments by date (newest first)
  const sortedComments = [...comments].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return (
    <div className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col justify-end">
      <div className="bg-white/90 backdrop-blur-xl rounded-t-3xl max-h-[80vh] flex flex-col border-t border-white/30 shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-semibold text-slate-800">Comments ({commentCount})</h3>
            {!wsClient && <span className="text-xs text-orange-500">(Offline)</span>}
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/40 backdrop-blur-sm transition-all duration-200 group"
          >
            <X className="w-6 h-6 text-slate-600 group-hover:text-slate-800 group-hover:scale-110 transition-all duration-200" />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-6 comments-scroll-container-mobile">
          {sortedComments.length === 0 ? (
            <div className="text-center py-12 bg-white/30 backdrop-blur-sm rounded-2xl border border-white/20">
              <MessageCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 font-medium">No comments yet</p>
              <p className="text-slate-500 text-sm mt-1">Be the first to share your thoughts!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedComments.map((comment) => (
                <div
                  key={`${comment.id}-${comment.createdAt}`}
                  className="flex items-start space-x-3 p-4 bg-white/40 backdrop-blur-sm rounded-xl border border-white/30"
                >
                  <button onClick={() => onProfileClick(comment.username)}>
                    {comment.profilePictureUrl ? (
                      <img
                        src={comment.profilePictureUrl || "/placeholder.svg"}
                        alt={comment.username}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-md"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 rounded-full flex items-center justify-center ring-2 ring-white shadow-md">
                        <User className="w-5 h-5" />
                      </div>
                    )}
                  </button>

                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <button
                        onClick={() => onProfileClick(comment.username)}
                        className="font-semibold text-slate-800 hover:text-indigo-600 transition-colors duration-200"
                      >
                        {comment.username}
                      </button>
                      <span className="text-slate-500 text-sm">
                        {new Date(comment.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>

                    <p className="text-slate-700 leading-relaxed">{comment.text}</p>
                  </div>
                </div>
              ))}

              {/* Mobile infinite scroll trigger */}
              <div
                ref={isOpen ? commentsEndRef : null}
                className="py-6 text-center min-h-[60px] flex flex-col items-center justify-center"
                style={{ minHeight: "60px" }}
              >
                {isLoadingMoreComments && (
                  <div className="flex justify-center items-center py-4">
                    <div className="relative">
                      <div className="animate-spin rounded-full h-8 w-8 border-3 border-slate-200 border-t-indigo-600"></div>
                      <div className="absolute inset-0 rounded-full h-8 w-8 border-3 border-transparent border-t-purple-400 animate-spin animation-delay-150"></div>
                    </div>
                    <p className="text-slate-600 text-sm ml-3 font-medium">Loading more comments...</p>
                  </div>
                )}

                {!hasMoreComments && !isLoadingMoreComments && comments.length > 0 && (
                  <p className="text-sm text-slate-500 py-2">No more comments to load</p>
                )}

                {hasMoreComments && !isLoadingMoreComments && (
                  <div className="h-8 w-full bg-transparent flex items-center justify-center">
                    <div className="w-2 h-2 bg-slate-300 rounded-full animate-pulse"></div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Comment Input */}
        <div className="p-6 border-t border-white/20 bg-white/50 backdrop-blur-sm">
          <CommentInput value={comment} onChange={setComment} onSubmit={onSubmitComment} className="gap-4" />
        </div>
      </div>
    </div>
  )
}
