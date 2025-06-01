import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMemeStore } from "../store/useMemeStore";
import {
  Heart,
  Bookmark,
  Download,
  Share2,
  MessageCircle,
  Send,
  ArrowLeft,
  User,
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
} from "lucide-react";
import { cn } from "../hooks/utils";
import toast from "react-hot-toast";

const MemeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [comment, setComment] = useState("");
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);

  const {
    memes,
    userMemes,
    likedMemes,
    savedMemes,
    toggleLike,
    toggleSave,
    fetchMemeById,
    addComment,
    isLoading,
    fetchUserProfile,
    profilePictureUrl,
    joinPostSession,
    leavePostSession,
    wsClient,
  } = useMemeStore();

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const meme =
    memes.find((m) => m.id === id) ||
    userMemes.find((m) => m.id === id) ||
    likedMemes.find((m) => m.id === id) ||
    savedMemes.find((m) => m.id === id);

  {
    meme?.comments?.map((comment) => (
      <div key={comment.id}>{comment.text}</div>
    ))
  }

  const isVideo = meme?.url.match(/\.(mp4|webm|ogg)$/i);
  const isLiked = !!meme && likedMemes.some((m) => m.id === meme.id);
  const isSaved = !!meme && savedMemes.some((m) => m.id === meme.id);
  const commentCount = meme?.comments?.length || 0;

  useEffect(() => {
    const initializePage = async () => {
      if (id) {
        joinPostSession(id);
        await fetchMemeById(id);
        if (user.userId) {
          await fetchUserProfile(user.username);
        }
      }
    };
    initializePage();

    return () => {
      if (id) {
        leavePostSession(id);
      }
    };
  }, [id, fetchMemeById, fetchUserProfile, user.userId, joinPostSession, leavePostSession]);

  useEffect(() => {
    if (videoRef.current && isVideo) {
      videoRef.current.loop = true;
      if (isPlaying) {
        videoRef.current.play().catch(() => setIsPlaying(true));
      }
    }
  }, [isPlaying, isVideo, meme?.url]);

  useEffect(() => {
    if (isCommentModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isCommentModalOpen]);

  if (isLoading || !meme) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 dark:border-purple-400"></div>
      </div>
    );
  }

  const handleDownload = async () => {
    try {
      const response = await fetch(meme.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${meme.title}${isVideo ? ".mp4" : ".jpg"}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading meme:", error);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    } catch {
      toast.error("Failed to copy link. Please try again.");
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim() && id) {
      if (!useMemeStore.getState().wsClient) {
        toast.error("Cannot add comment: WebSocket connection not established");
        return;
      }
      await addComment(id, user.username, comment.trim(), profilePictureUrl, user.userId);
      setComment("");
      if (window.innerWidth < 1024) {
        setIsCommentModalOpen(false);
      }
    }
  };

  const handleLike = async () => {
    if (user.username && meme.id) {
      await toggleLike(meme.id, user.username);
    }
  };

  const handleSave = async () => {
    if (user.username && meme.id) {
      await toggleSave(meme.id, user.username);
    }
  };

  const handleBack = () => navigate(-1);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const formatDate = (dateString: string | Date | undefined) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const openCommentModal = () => setIsCommentModalOpen(true);
  const closeCommentModal = () => setIsCommentModalOpen(false);

  const navigateToProfile = (username: string) => {
    navigate(`/profile/${username}`);
    fetchUserProfile(username);
  };

  const sortedComments = meme.comments
    ? [...meme.comments].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-purple-100 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-gray-100">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-10 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              className="flex items-center text-gray-600 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              <span className="font-medium">Back</span>
            </button>
            <h1 className="text-lg font-semibold truncate max-w-[200px] sm:max-w-md">{meme.title}</h1>
            <div className="w-5"></div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[calc(100vh-8rem)]">
            {/* Media Section */}
            <div className="relative bg-gray-900 flex items-center justify-center">
              <div className="w-full h-full flex items-center justify-center p-4 lg:p-6">
                {isVideo ? (
                  <div className="relative w-full h-full flex items-center justify-center group">
                    <video
                      ref={videoRef}
                      src={meme.url}
                      className="max-w-full max-h-[70vh] rounded-md"
                      loop
                      playsInline
                      muted={isMuted}
                    />
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-4 bg-black/50 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button
                        onClick={togglePlay}
                        className="p-2 text-white hover:text-purple-400 transition-colors"
                        aria-label={isPlaying ? "Pause" : "Play"}
                      >
                        {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                      </button>
                      <button
                        onClick={toggleMute}
                        className="p-2 text-white hover:text-purple-400 transition-colors"
                        aria-label={isMuted ? "Unmute" : "Mute"}
                      >
                        {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                      </button>
                    </div>
                  </div>
                ) : (
                  <img
                    src={meme.url || "/placeholder.svg"}
                    alt={meme.title}
                    className="max-w-full max-h-[70vh] object-contain rounded-md"
                  />
                )}
              </div>

              {/* Mobile Action Buttons */}
              <div className="lg:hidden absolute bottom-4 right-4 flex gap-2">
                <button
                  onClick={handleSave}
                  className={cn(
                    "p-3 rounded-full transition-all duration-300 shadow-md",
                    isSaved
                      ? "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
                      : "bg-white/90 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
                  )}
                  aria-label={isSaved ? "Unsave" : "Save"}
                >
                  <Bookmark className={cn("w-5 h-5", isSaved && "fill-current")} />
                </button>
              </div>
            </div>

            {/* Content Section */}
            <div className="flex flex-col h-full max-h-[80vh] p-4 sm:p-6">
              {/* Header */}
              <div className="mb-4 sm:mb-6">
                <div className="hidden lg:block mb-2">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{meme.title}</h1>
                </div>
                <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-sm">
                  <button
                    onClick={() => navigateToProfile(meme.uploader)}
                    className="flex items-center space-x-2 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                  >
                    {meme.profilePictureUrl ? (
                      <img
                        src={meme.profilePictureUrl || "/placeholder.svg"}
                        alt={meme.userId}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full p-2">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                    <span>{meme.uploader}</span>
                  </button>
                  <span>{formatDate(meme.memeCreated)}</span>
                </div>
              </div>

              <div className="hidden lg:flex flex-wrap gap-3 mb-6">
                <button
                  onClick={handleLike}
                  className={cn(
                    "flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300",
                    isLiked
                      ? "bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400"
                      : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600",
                  )}
                >
                  <Heart className={cn("w-5 h-5", isLiked && "fill-current")} />
                  <span>{isLiked ? "Liked" : "Like"}</span>
                  <span className="ml-1 text-sm">({meme.likeCount || 0})</span>
                </button>

                <button
                  onClick={handleSave}
                  className={cn(
                    "flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300",
                    isSaved
                      ? "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
                      : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600",
                  )}
                >
                  <Bookmark className={cn("w-5 h-5", isSaved && "fill-current")} />
                  <span>{isSaved ? "Saved" : "Save"}</span>
                  <span className="ml-1 text-sm">({meme.saveCount || 0})</span>
                </button>

                <button
                  onClick={handleDownload}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300"
                >
                  <Download className="w-5 h-5" />
                  <span>Download</span>
                </button>

                <button
                  onClick={handleShare}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300"
                >
                  <Share2 className="w-5 h-5" />
                  <span>Share</span>
                </button>
              </div>
              <div className="flex lg:hidden justify-around mb-4 border-y dark:border-gray-700 py-3">
                <button
                  onClick={handleLike}
                  className="flex flex-col items-center justify-center px-2 py-1 text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                  aria-label={isLiked ? "Unlike" : "Like"}
                >
                  <Heart className={cn("w-5 h-5 mb-1", isLiked && "fill-current text-pink-600")} />
                  <span className="text-xs">{meme.likeCount || 0}</span>
                </button>

                <button
                  onClick={handleDownload}
                  className="flex flex-col items-center justify-center px-2 py-1 text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                  aria-label="Download"
                >
                  <Download className="w-5 h-5 mb-1" />
                  <span className="text-xs">Download</span>
                </button>

                <button
                  onClick={handleShare}
                  className="flex flex-col items-center justify-center px-2 py-1 text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                  aria-label="Share"
                >
                  <Share2 className="w-5 h-5 mb-1" />
                  <span className="text-xs">Share</span>
                </button>

                <button
                  onClick={openCommentModal}
                  className="flex flex-col items-center justify-center px-2 py-1 text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                  aria-label="View comments"
                >
                  <MessageCircle className="w-5 h-5 mb-1" />
                  <span className="text-xs">{commentCount}</span>
                </button>
              </div>

              {/* Comments Section - Desktop */}
              <div className="hidden lg:flex flex-1 flex-col overflow-hidden">
                <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 mb-4">
                  <MessageCircle className="w-5 h-5" />
                  <h3 className="font-semibold">Comments ({commentCount})</h3>
                  {!wsClient && <span className="text-xs text-orange-500 dark:text-orange-400">(Offline)</span>}
                </div>

                {/* Comments List */}
                <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2 custom-scrollbar">
                  {sortedComments.length > 0 ? (
                    sortedComments.map((comment) => (
                      <div
                        key={`${comment.id}-${comment.createdAt}`}
                        className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <button
                            onClick={() => navigateToProfile(comment.username)}
                            className="flex items-center space-x-2 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                          >
                            {comment.profilePictureUrl ? (
                              <img
                                src={comment.profilePictureUrl || "/placeholder.svg"}
                                alt={comment.userId}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full p-2">
                                <User className="w-4 h-4" />
                              </div>
                            )}
                            <span className="font-medium text-gray-900 dark:text-white">{comment.username}</span>
                          </button>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(comment.createdAt)}
                          </span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 break-words text-sm pl-10">{comment.text}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <MessageCircle className="w-8 h-8 text-gray-400 dark:text-gray-600 mx-auto mb-2" />
                      <p className="text-gray-500 dark:text-gray-400">No comments yet. Be the first to comment!</p>
                    </div>
                  )}
                </div>

                {/* Comment Input */}
                <form onSubmit={handleSubmitComment} className="flex gap-2 mt-auto">
                  <input
                    type="text"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:text-white"
                  />
                  <button
                    type="submit"
                    disabled={!comment.trim()}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Send comment"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Comment Modal */}
      {isCommentModalOpen && (
        <div className="lg:hidden fixed inset-0 bg-black bg-opacity-70 z-50 flex flex-col justify-end">
          <div
            className="bg-white dark:bg-gray-800 rounded-t-xl max-h-[80vh] flex flex-col animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
              <h3 className="font-semibold text-lg">Comments ({commentCount})</h3>
              <button
                onClick={closeCommentModal}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Close comments"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {sortedComments.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="w-8 h-8 text-gray-400 dark:text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-500 dark:text-gray-400">No comments yet. Be the first to comment!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sortedComments.map((comment) => (
                    <div
                      key={`${comment.id}-${comment.createdAt}`}
                      className="flex items-start space-x-3 pb-4 border-b dark:border-gray-700 last:border-0"
                    >
                      <button
                        onClick={() => navigateToProfile(comment.username)}
                        className="flex items-start space-x-3 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                      >
                        {comment.profilePictureUrl ? (
                          <img
                            src={comment.profilePictureUrl || "/placeholder.svg"}
                            alt={comment.username}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full p-2">
                            <User className="w-4 h-4" />
                          </div>
                        )}
                      </button>
                      <div className="flex-1">
                        <div className="flex items-baseline justify-between mb-1">
                          <button
                            onClick={() => navigateToProfile(comment.username)}
                            className="font-medium text-gray-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                          >
                            {comment.username}
                          </button>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(comment.createdAt)}
                          </span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 break-words">{comment.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Comment Input */}
            <form onSubmit={handleSubmitComment} className="flex gap-2 p-4 border-t dark:border-gray-700">
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:text-white"
                autoFocus
              />
              <button
                type="submit"
                disabled={!comment.trim()}
                className="p-3 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                aria-label="Send comment"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemeDetailPage;