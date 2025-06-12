"use client"

import type React from "react"
import { MessageCircle } from "lucide-react"
import { CommentItem } from "./comment-item"
import { CommentInput } from "./comment-input"
import type { Comment } from "../../types/mems"

interface CommentsSectionProps {
  comments: Comment[]
  commentCount: number
  comment: string
  setComment: (value: string) => void
  onSubmitComment: (e: React.FormEvent) => void
  onProfileClick: (username: string) => void
  onOpenModal: () => void
  isLoadingMoreComments: boolean
  hasMoreComments: boolean
  commentsEndRef: React.RefObject<HTMLDivElement>
  isCommentModalOpen: boolean
  wsClient: WebSocket | null
}

export function CommentsSection({
  comments,
//   commentCount,
  comment,
  setComment,
  onSubmitComment,
  onProfileClick,
  onOpenModal,
  isLoadingMoreComments,
  hasMoreComments,
  commentsEndRef,
  isCommentModalOpen,
  wsClient,
}: CommentsSectionProps) {
  // Sort comments by date (newest first)
  const sortedComments = [...comments].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold text-slate-800">Comments</h3>
          {!wsClient && <span className="text-xs text-orange-500">(Offline)</span>}
        </div>

        <button
          onClick={onOpenModal}
          className="lg:hidden text-slate-600 hover:text-indigo-600 transition-colors duration-200 p-2 rounded-xl hover:bg-white/40 backdrop-blur-sm"
        >
          <MessageCircle className="w-5 h-5" />
        </button>
      </div>

      {/* Desktop Comments List */}
      <div
        className="hidden lg:block flex-1 overflow-y-auto mb-4 comments-scroll-container"
        style={{ maxHeight: "calc(100vh - 600px)" }}
      >
        {sortedComments.length > 0 ? (
          <div className="space-y-3">
            {sortedComments.map((comment) => (
              <CommentItem
                key={`${comment.id}-${comment.createdAt}`}
                comment={comment}
                onProfileClick={onProfileClick}
              />
            ))}

            {/* Desktop infinite scroll trigger */}
            {hasMoreComments && (
              <div
                ref={!isCommentModalOpen ? commentsEndRef : null}
                className="py-4 text-center min-h-[40px] flex flex-col items-center justify-center"
              >
                {isLoadingMoreComments ? (
                  <div className="flex justify-center items-center py-4">
                    <div className="relative">
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-200 border-t-indigo-600"></div>
                    </div>
                    <p className="text-slate-600 text-sm ml-3 font-medium">Loading more comments...</p>
                  </div>
                ) : (
                  <div className="h-4 w-full bg-transparent flex items-center justify-center">
                    <div className="w-1 h-1 bg-slate-300 rounded-full animate-pulse"></div>
                  </div>
                )}
              </div>
            )}

            {/* End of comments indicator */}
            {!hasMoreComments && comments.length > 0 && (
              <div className="py-4 text-center">
                <p className="text-sm text-slate-500">No more comments to load</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 bg-white/30 backdrop-blur-sm rounded-xl border border-white/20">
            <MessageCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">No comments yet. Be the first!</p>
          </div>
        )}
      </div>

      {/* Desktop Comment Input */}
      <div className="hidden lg:block mt-auto pt-4 border-t border-white/20">
        <CommentInput value={comment} onChange={setComment} onSubmit={onSubmitComment} />
      </div>
    </div>
  )
}
