import React, { useState, useRef } from "react"
import { Heart, Bookmark, Download, MessageCircle, MoreVertical, Trash, Share, Play, Pause } from "lucide-react"
import { cn } from "../../hooks/utils"
import type { Meme } from "../../types/mems"
import { useMemeStore } from "../../store/useMemeStore"
import { useNavigate, useLocation } from "react-router-dom"
import toast from "react-hot-toast"
import DOMPurify from "dompurify"

interface MemeCardProps {
  meme: Meme
  activeOptionsId?: string | null
  onOptionsClick?: (id: string | null) => void
}

export const MemeCard: React.FC<MemeCardProps> = ({ meme, activeOptionsId, onOptionsClick }) => {
  const { likedMemes, savedMemes, toggleLike, toggleSave, deleteMeme } = useMemeStore()
  const navigate = useNavigate()
  const location = useLocation()
  const user = JSON.parse(localStorage.getItem("user") || "{}")
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const safeUrl = encodeURI(meme.url);
  const sanitizeUrl = DOMPurify.sanitize(safeUrl);

  const isLiked = likedMemes.some((m) => m.id === meme.id)
  const isSaved = savedMemes.some((m) => m.id === meme.id)
  const pathSegments = location.pathname.split("/")
  const isProfilePage = pathSegments[1] === "profile"
  const profileUserId = pathSegments[2]
  const isOwnProfile = isProfilePage && profileUserId === user.userId
  const isOptionsOpen = activeOptionsId === meme.id
  const isVideo = meme.url.match(/\.(mp4|webm|ogg)$/i)

  const formatDate = (dateString: string | Date | undefined) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const response = await fetch(meme.url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${meme.title}${isVideo ? ".mp4" : ".jpg"}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast.success("Download Complete")
    } catch (error) {
      console.error("Error downloading meme:", error)
    }
  }

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const memeLink = `${window.location.origin}/meme/${meme.id}`
      await navigator.clipboard.writeText(memeLink)
      toast.success("Link copied to clipboard!")
    } catch (error) {
      console.error("Error copying meme link:", error)
      toast.error("Failed to copy link")
    }
    (onOptionsClick ?? (() => { }))(null);
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (window.confirm("Are you sure you want to delete this meme?")) {
      try {
        await deleteMeme(meme.id)
        if (onOptionsClick) {
          onOptionsClick(null);
        }
        toast.success("Meme Delete Sucessfully")
      } catch (error) {
        console.error("Failed to delete meme. Please try again." + error)
        toast.error("Failed to Delete Meme")
      }
    }
  }

  // const handleEdit = (e: React.MouseEvent) => {
  //   e.stopPropagation()
  //   console.log("Edit meme:", meme.id)
  //   onOptionsClick(null)
  // }

  const navigateToMemeDetail = () => {
    navigate(`/meme/${meme.id}`)
  }

  const handleMouseEnter = () => {
    if (isVideo && videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay was prevented
        console.log("Autoplay prevented")
      })
      setIsPlaying(true)
    }
  }

  const handleMouseLeave = () => {
    if (isVideo && videoRef.current) {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
      setIsPlaying(false)
    }
  }

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  // Close options menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest(`[data-meme-id="${meme.id}"]`)) {
        (onOptionsClick ?? (() => { }))(null);
      }
    }

    if (isOptionsOpen) {
      document.addEventListener("click", handleClickOutside)
    }

    return () => {
      document.removeEventListener("click", handleClickOutside)
    }
  }, [isOptionsOpen, meme.id, onOptionsClick])

  return (
    <div
      className={cn(
        "group relative bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1",
        isOptionsOpen && "z-50",
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="relative aspect-[4/3] cursor-pointer overflow-hidden rounded-t-xl" onClick={navigateToMemeDetail}>
        {isVideo ? (
          <>
            <video ref={videoRef} src={sanitizeUrl} className="w-full h-full object-cover" loop muted playsInline />
            <button
              onClick={togglePlay}
              className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            >
              {isPlaying ? <Pause className="w-12 h-12 text-white" /> : <Play className="w-12 h-12 text-white" />}
            </button>
          </>
        ) : (
          <img
            src={meme.url || "/placeholder.svg"}
            alt={meme.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Hover Overlay Actions */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
            <button
              onClick={navigateToMemeDetail}
              className="px-4 py-2 bg-white/90 text-gray-800 rounded-lg font-medium hover:bg-white transition-colors"
            >
              View Details
            </button>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <h3
            className="text-lg font-semibold cursor-pointer hover:text-blue-600 transition-colors line-clamp-2"
            onClick={navigateToMemeDetail}
          >
            {meme.title}
          </h3>
          <div className="flex items-center space-x-1">
            <div className="bg-gray-100 px-2 py-1 rounded-full flex items-center space-x-1">
              <MessageCircle className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600 font-medium">{meme.comments.length}</span>
            </div>
            {isOwnProfile && (
              <div className="relative inline-block" data-meme-id={meme.id}>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (onOptionsClick) {
                      onOptionsClick(isOptionsOpen? null : meme.id);
                    }
                  }}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors ml-1"
                >
                  <MoreVertical className="w-5 h-5 text-gray-600" />
                </button>
                {isOptionsOpen && (
                  <div
                    className="absolute right-0 w-48 bg-white rounded-lg shadow-lg py-1 z-[60]"
                    style={{
                      bottom: "100%",
                      marginBottom: "0.5rem",
                      transform: "none",
                      left: "auto",
                      right: 0,
                    }}
                  >
                    {/* <button
                      onClick={handleEdit}
                      className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center space-x-2 group/option transition-all duration-200"
                    >
                      <Edit className="w-4 h-4 transition-transform group-hover/option:scale-110" />
                      <span className="group-hover/option:translate-x-0.5 transition-transform">Edit Meme</span>
                    </button> */}
                    <button
                      onClick={handleShare}
                      className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center space-x-2 group/option transition-all duration-200"
                    >
                      <Share className="w-4 h-4 transition-transform group-hover/option:scale-110" />
                      <span className="group-hover/option:translate-x-0.5 transition-transform">Share Meme</span>
                    </button>
                    <button
                      onClick={handleDelete}
                      className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center space-x-2 group/option transition-all duration-200"
                    >
                      <Trash className="w-4 h-4 transition-transform group-hover/option:scale-110" />
                      <span className="group-hover/option:translate-x-0.5 transition-transform">Delete Meme</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex -space-x-1">
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleLike(meme.id, user.username)
              }}
              className="relative p-2 hover:bg-gray-100 rounded-full transition-colors z-20 group/btn"
            >
              <Heart
                className={cn(
                  "w-6 h-6 transition-all duration-300 transform group-hover/btn:scale-110",
                  isLiked ? "fill-red-500 stroke-red-500" : "stroke-gray-600",
                )}
              />
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover/btn:opacity-100 transition-opacity">
                {isLiked ? "Unlike" : "Like"}
              </span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleSave(meme.id, user.username)
              }}
              className="relative p-2 hover:bg-gray-100 rounded-full transition-colors z-10 group/btn"
            >
              <Bookmark
                className={cn(
                  "w-6 h-6 transition-all duration-300 transform group-hover/btn:scale-110",
                  isSaved ? "fill-yellow-500 stroke-yellow-500" : "stroke-gray-600",
                )}
              />
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover/btn:opacity-100 transition-opacity">
                {isSaved ? "Unsave" : "Save"}
              </span>
            </button>
            <button
              onClick={handleDownload}
              className="relative p-2 hover:bg-gray-100 rounded-full transition-colors group/btn"
            >
              <Download className="w-6 h-6 stroke-gray-600 transition-all duration-300 transform group-hover/btn:scale-110" />
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover/btn:opacity-100 transition-opacity">
                Download
              </span>
            </button>
          </div>

          <div className="text-sm text-gray-500">{formatDate(meme.memeCreated)}</div>
        </div>
      </div>
    </div>
  )
}

