// import React, { useState, useRef } from "react"
// import { Heart, Bookmark, Download, MessageCircle, MoreVertical, Trash, Share, Play, Pause } from "lucide-react"
// import { cn } from "../../hooks/utils"
// import type { Meme } from "../../types/mems"
// import { useMemeContentStore } from "../../store/useMemeContentStore.ts"
// import { useNavigate, useLocation } from "react-router-dom"
// import toast from "react-hot-toast"
// import DOMPurify from "dompurify"
// import useWebSocketStore from "../../hooks/useWebSockets"

// interface MemeCardProps {
//   meme: Meme
//   activeOptionsId?: string | null
//   onOptionsClick?: (id: string | null) => void
// }

// export const MemeCard: React.FC<MemeCardProps> = ({ meme, activeOptionsId, onOptionsClick }) => {
//   // Use selectors to only subscribe to what we need
//   const likedMemes = useMemeContentStore.use.likedMemes()
//   const savedMemes = useMemeContentStore.use.savedMemes()
//   const toggleLike = useMemeContentStore.use.toggleLike()
//   const toggleSave = useMemeContentStore.use.toggleSave()
//   const deleteMeme = useMemeContentStore.use.deleteMeme()
  
//   // Get WebSocket store for direct message sending
//   const wsStore = useWebSocketStore()
  
//   const navigate = useNavigate()
//   const location = useLocation()
//   const user = JSON.parse(localStorage.getItem("user") || "{}")
//   const videoRef = useRef<HTMLVideoElement>(null)
//   const [isPlaying, setIsPlaying] = useState(false)
//   const isOptionsOpen = activeOptionsId === meme?.id
  
//   // Close options menu when clicking outside
//   React.useEffect(() => {
//     // Only add event listener if meme is valid and options are open
//     if (meme?.id && isOptionsOpen) {
//       const handleClickOutside = (event: MouseEvent) => {
//         const target = event.target as HTMLElement
//         if (!target.closest(`[data-meme-id="${meme.id}"]`)) {
//           (onOptionsClick ?? (() => { }))(null);
//         }
//       }
      
//       document.addEventListener("click", handleClickOutside)
      
//       return () => {
//         document.removeEventListener("click", handleClickOutside)
//       }
//     }
//   }, [meme?.id, isOptionsOpen, onOptionsClick])
  
//   // Check if meme is valid and has required properties
//   if (!meme || !meme.id) {
//     console.error("Invalid meme object:", meme);
//     return <div className="bg-white rounded-xl shadow-sm p-4">Invalid meme data</div>;
//   }

//   // Handle different URL formats (url or mediaUrl)
//   const memeUrl = meme.url || meme.mediaUrl || "";
//   const safeUrl = memeUrl ? encodeURI(memeUrl) : "";
//   const sanitizeUrl = DOMPurify.sanitize(safeUrl);
  
//   // Debug the meme object
//   console.log("MemeCard: Meme object:", meme);

//   const isLiked = likedMemes.some((m) => m.id === meme.id)
//   const isSaved = savedMemes.some((m) => m.id === meme.id)
//   const pathSegments = location.pathname.split("/")
//   const isProfilePage = pathSegments[1] === "profile"
//   const profileUserId = pathSegments[2]
//   const isOwnProfile = isProfilePage && profileUserId === user.userId
//   const isVideo = memeUrl ? memeUrl.match(/\.(mp4|webm|ogg)$/i) : false

//   const formatDate = (dateString: string | Date | undefined) => {
//     if (!dateString) return ""
//     const date = new Date(dateString)
//     return date.toLocaleString("en-US", {
//       year: "numeric",
//       month: "long",
//       day: "numeric",
//     })
//   }

//   const handleDownload = async (e: React.MouseEvent) => {
//     e.stopPropagation()
//     if (!memeUrl) {
//       toast.error("Cannot download: Media URL is missing")
//       return
//     }
    
//     try {
//       const response = await fetch(memeUrl)
//       const blob = await response.blob()
//       const url = window.URL.createObjectURL(blob)
//       const a = document.createElement("a")
//       a.href = url
//       a.download = `${meme.title || "meme"}${isVideo ? ".mp4" : ".jpg"}`
//       document.body.appendChild(a)
//       a.click()
//       document.body.removeChild(a)
//       window.URL.revokeObjectURL(url)

//       toast.success("Download Complete")
//     } catch (error) {
//       console.error("Error downloading meme:", error)
//       toast.error("Failed to download meme")
//     }
//   }

//   const handleShare = async (e: React.MouseEvent) => {
//     e.stopPropagation()
//     try {
//       const memeLink = `${window.location.origin}/meme/${meme.id}`
//       await navigator.clipboard.writeText(memeLink)
//       toast.success("Link copied to clipboard!")
//     } catch (error) {
//       console.error("Error copying meme link:", error)
//       toast.error("Failed to copy link")
//     }
//     (onOptionsClick ?? (() => { }))(null);
//   }

//   const handleDelete = async (e: React.MouseEvent) => {
//     e.stopPropagation()
//     if (window.confirm("Are you sure you want to delete this meme?")) {
//       try {
//         // Call the store method to delete the meme
//         await deleteMeme(meme.id)
        
//         // No need to send a WebSocket message for delete as it's handled by the API
        
//         if (onOptionsClick) {
//           onOptionsClick(null);
//         }
//         toast.success("Meme Deleted Successfully")
//       } catch (error) {
//         console.error("Failed to delete meme. Please try again." + error)
//         toast.error("Failed to Delete Meme")
//       }
//     }
//   }

//   const navigateToMemeDetail = () => {
//     navigate(`/meme/${meme.id}`)
//   }

//   const handleMouseEnter = () => {
//     if (isVideo && videoRef.current) {
//       videoRef.current.play().catch(() => {
//       })
//       setIsPlaying(true)
//     }
//   }

//   const handleMouseLeave = () => {
//     if (isVideo && videoRef.current) {
//       videoRef.current.pause()
//       videoRef.current.currentTime = 0
//       setIsPlaying(false)
//     }
//   }

//   const togglePlay = (e: React.MouseEvent) => {
//     e.stopPropagation()
//     if (videoRef.current) {
//       if (isPlaying) {
//         videoRef.current.pause()
//       } else {
//         videoRef.current.play()
//       }
//       setIsPlaying(!isPlaying)
//     }
//   }

//   // useEffect for closing options menu is now placed before the conditional return

//   return (
//     <div
//       className={cn(
//         "group relative bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1",
//         isOptionsOpen && "z-50",
//       )}
//       onMouseEnter={handleMouseEnter}
//       onMouseLeave={handleMouseLeave}
//     >
//       <div className="relative aspect-[4/3] cursor-pointer overflow-hidden rounded-t-xl" onClick={navigateToMemeDetail}>
//         {isVideo ? (
//           <>
//             <video ref={videoRef} src={sanitizeUrl} className="w-full h-full object-cover" loop muted playsInline />
//             <button
//               onClick={togglePlay}
//               className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
//             >
//               {isPlaying ? <Pause className="w-12 h-12 text-white" /> : <Play className="w-12 h-12 text-white" />}
//             </button>
//           </>
//         ) : (
//           <img
//             src={memeUrl || "/placeholder.svg"}
//             alt={meme.title || "Meme"}
//             className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
//           />
//         )}
//         <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

//         {/* Hover Overlay Actions */}
//         <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
//           <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
//             <button
//               onClick={navigateToMemeDetail}
//               className="px-4 py-2 bg-white/90 text-gray-800 rounded-lg font-medium hover:bg-white transition-colors"
//             >
//               View Details
//             </button>
//           </div>
//         </div>
//       </div>

//       <div className="p-4">
//         <div className="flex items-start justify-between mb-3">
//           <h3
//             className="text-lg font-semibold cursor-pointer hover:text-blue-600 transition-colors line-clamp-2"
//             onClick={navigateToMemeDetail}
//           >
//             {meme.title}
//           </h3>
//           <div className="flex items-center space-x-1">
//             <div className="bg-gray-100 px-2 py-1 rounded-full flex items-center space-x-1">
//               <MessageCircle className="w-4 h-4 text-gray-500" />
//               <span className="text-sm text-gray-600 font-medium">{meme.comments.length}</span>
//             </div>
//             {isOwnProfile && (
//               <div className="relative inline-block" data-meme-id={meme.id}>
//                 <button
//                   onClick={(e) => {
//                     e.stopPropagation()
//                     if (onOptionsClick) {
//                       onOptionsClick(isOptionsOpen? null : meme.id);
//                     }
//                   }}
//                   className="p-1 hover:bg-gray-100 rounded-full transition-colors ml-1"
//                 >
//                   <MoreVertical className="w-5 h-5 text-gray-600" />
//                 </button>
//                 {isOptionsOpen && (
//                   <div
//                     className="absolute right-0 w-48 bg-white rounded-lg shadow-lg py-1 z-[60]"
//                     style={{
//                       bottom: "100%",
//                       marginBottom: "0.5rem",
//                       transform: "none",
//                       left: "auto",
//                       right: 0,
//                     }}
//                   >
//                     {/* <button
//                       onClick={handleEdit}
//                       className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center space-x-2 group/option transition-all duration-200"
//                     >
//                       <Edit className="w-4 h-4 transition-transform group-hover/option:scale-110" />
//                       <span className="group-hover/option:translate-x-0.5 transition-transform">Edit Meme</span>
//                     </button> */}
//                     <button
//                       onClick={handleShare}
//                       className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center space-x-2 group/option transition-all duration-200"
//                     >
//                       <Share className="w-4 h-4 transition-transform group-hover/option:scale-110" />
//                       <span className="group-hover/option:translate-x-0.5 transition-transform">Share Meme</span>
//                     </button>
//                     <button
//                       onClick={handleDelete}
//                       className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center space-x-2 group/option transition-all duration-200"
//                     >
//                       <Trash className="w-4 h-4 transition-transform group-hover/option:scale-110" />
//                       <span className="group-hover/option:translate-x-0.5 transition-transform">Delete Meme</span>
//                     </button>
//                   </div>
//                 )}
//               </div>
//             )}
//           </div>
//         </div>

//         <div className="flex items-center justify-between">
//           <div className="flex -space-x-1">
//             <button
//               onClick={(e) => {
//                 e.stopPropagation()
//                 // First update the UI state through the store
//                 toggleLike(meme.id, user.username)
                
//                 // Then send the WebSocket message directly in the same format as MemeDetailPage
//                 if (wsStore.isConnected) {
//                   wsStore.sendMessage({
//                     type: 'LIKE',
//                     memeId: meme.id,
//                     action: isLiked ? 'UNLIKE' : 'LIKE',
//                     username: user.username
//                   });
//                 }
//               }}
//               className="relative p-2 hover:bg-gray-100 rounded-full transition-colors z-20 group/btn"
//             >
//               <Heart
//                 className={cn(
//                   "w-6 h-6 transition-all duration-300 transform group-hover/btn:scale-110",
//                   isLiked ? "fill-red-500 stroke-red-500" : "stroke-gray-600",
//                 )}
//               />
//               <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover/btn:opacity-100 transition-opacity">
//                 {isLiked ? "Unlike" : "Like"}
//               </span>
//             </button>
//             <button
//               onClick={(e) => {
//                 e.stopPropagation()
//                 // First update the UI state through the store
//                 toggleSave(meme.id, user.username)
                
//                 // Then send the WebSocket message directly in the same format as MemeDetailPage
//                 if (wsStore.isConnected) {
//                   wsStore.sendMessage({
//                     type: 'SAVE',
//                     memeId: meme.id,
//                     action: isSaved ? 'UNSAVE' : 'SAVE',
//                     username: user.username
//                   });
//                 }
//               }}
//               className="relative p-2 hover:bg-gray-100 rounded-full transition-colors z-10 group/btn"
//             >
//               <Bookmark
//                 className={cn(
//                   "w-6 h-6 transition-all duration-300 transform group-hover/btn:scale-110",
//                   isSaved ? "fill-yellow-500 stroke-yellow-500" : "stroke-gray-600",
//                 )}
//               />
//               <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover/btn:opacity-100 transition-opacity">
//                 {isSaved ? "Unsave" : "Save"}
//               </span>
//             </button>
//             <button
//               onClick={handleDownload}
//               className="relative p-2 hover:bg-gray-100 rounded-full transition-colors group/btn"
//             >
//               <Download className="w-6 h-6 stroke-gray-600 transition-all duration-300 transform group-hover/btn:scale-110" />
//               <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover/btn:opacity-100 transition-opacity">
//                 Download
//               </span>
//             </button>
//           </div>

//           <div className="text-sm text-gray-500">{formatDate(meme.memeCreated)}</div>
//         </div>
//       </div>
//     </div>
//   )
// }



// "use client"

// import React, { useState, useRef } from "react"
// import { Heart, Bookmark, MessageCircle, MoreVertical, Trash, Share, Play, Pause, User } from "lucide-react"
// import { cn } from "../../hooks/utils"
// import type { Meme } from "../../types/mems"
// import { useMemeContentStore } from "../../store/useMemeContentStore.ts"
// import { useNavigate, useLocation } from "react-router-dom"
// import toast from "react-hot-toast"
// import DOMPurify from "dompurify"
// import useWebSocketStore from "../../hooks/useWebSockets"

// interface MemeCardProps {
//   meme: Meme
//   activeOptionsId?: string | null
//   onOptionsClick?: (id: string | null) => void
// }

// export const MemeCard: React.FC<MemeCardProps> = ({ meme, activeOptionsId, onOptionsClick }) => {
//   const likedMemes = useMemeContentStore.use.likedMemes()
//   const savedMemes = useMemeContentStore.use.savedMemes()
//   const toggleLike = useMemeContentStore.use.toggleLike()
//   const toggleSave = useMemeContentStore.use.toggleSave()
//   const deleteMeme = useMemeContentStore.use.deleteMeme()
//   const wsStore = useWebSocketStore()

//   const navigate = useNavigate()
//   const location = useLocation()
//   const user = JSON.parse(localStorage.getItem("user") || "{}")
//   const videoRef = useRef<HTMLVideoElement>(null)
//   const [isPlaying, setIsPlaying] = useState(false)
//   const isOptionsOpen = activeOptionsId === meme?.id

//   React.useEffect(() => {
//     if (meme?.id && isOptionsOpen) {
//       const handleClickOutside = (event: MouseEvent) => {
//         const target = event.target as HTMLElement
//         if (!target.closest(`[data-meme-id="${meme.id}"]`)) {
//           ;(onOptionsClick ?? (() => {}))(null)
//         }
//       }
//       document.addEventListener("click", handleClickOutside)
//       return () => document.removeEventListener("click", handleClickOutside)
//     }
//   }, [meme?.id, isOptionsOpen, onOptionsClick])

//   if (!meme || !meme.id) {
//     return (
//       <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
//         <div className="text-gray-400 text-sm text-center">Content unavailable</div>
//       </div>
//     )
//   }

//   const memeUrl = meme.url || meme.mediaUrl || ""
//   const sanitizeUrl = DOMPurify.sanitize(memeUrl ? encodeURI(memeUrl) : "")
//   const isLiked = likedMemes.some((m) => m.id === meme.id)
//   const isSaved = savedMemes.some((m) => m.id === meme.id)
//   const pathSegments = location.pathname.split("/")
//   const isProfilePage = pathSegments[1] === "profile"
//   const profileUserId = pathSegments[2]
//   const isOwnProfile = isProfilePage && profileUserId === user.userId
//   const isVideo = memeUrl ? memeUrl.match(/\.(mp4|webm|ogg)$/i) : false

//   const formatDate = (dateString: string | Date | undefined) => {
//     if (!dateString) return ""
//     const date = new Date(dateString)
//     const now = new Date()
//     const diffDays = Math.ceil((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

//     if (diffDays < 1) return "Today"
//     if (diffDays === 1) return "1d"
//     if (diffDays < 7) return `${diffDays}d`
//     if (diffDays < 30) return `${Math.ceil(diffDays / 7)}w`
//     return `${Math.ceil(diffDays / 30)}mo`
//   }

//   const handleShare = async (e: React.MouseEvent) => {
//     e.stopPropagation()
//     try {
//       await navigator.clipboard.writeText(`${window.location.origin}/meme/${meme.id}`)
//       toast.success("Link copied!")
//     } catch {
//       toast.error("Failed to copy")
//     }
//     ;(onOptionsClick ?? (() => {}))(null)
//   }

//   const handleDelete = async (e: React.MouseEvent) => {
//     e.stopPropagation()
//     if (window.confirm("Delete this meme?")) {
//       try {
//         await deleteMeme(meme.id)
//         if (onOptionsClick) onOptionsClick(null)
//         toast.success("Deleted successfully!")
//       } catch {
//         toast.error("Failed to delete")
//       }
//     }
//   }

//   const navigateToMemeDetail = () => navigate(`/meme/${meme.id}`)
//   const navigateToProfile = (e: React.MouseEvent) => {
//     e.stopPropagation()
//     navigate(`/profile/${meme.uploader}`)
//   }

//   const handleMouseEnter = () => {
//     if (isVideo && videoRef.current) {
//       videoRef.current.play().catch(() => {})
//       setIsPlaying(true)
//     }
//   }

//   const handleMouseLeave = () => {
//     if (isVideo && videoRef.current) {
//       videoRef.current.pause()
//       videoRef.current.currentTime = 0
//       setIsPlaying(false)
//     }
//   }

//   const togglePlay = (e: React.MouseEvent) => {
//     e.stopPropagation()
//     if (videoRef.current) {
//       if (isPlaying) {
//         videoRef.current.pause()
//       } else {
//         videoRef.current.play()
//       }
//       setIsPlaying(!isPlaying)
//     }
//   }

//   return (
//     <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
//       {/* Header - User Info */}
//       <div className="p-4 pb-3 flex items-center justify-between">
//         <button onClick={navigateToProfile} className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
//           {meme.profilePictureUrl ? (
//             <img
//               src={meme.profilePictureUrl || "/placeholder.svg"}
//               alt={meme.uploader}
//               className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-100"
//             />
//           ) : (
//             <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
//               <User className="w-5 h-5 text-white" />
//             </div>
//           )}
//           <div className="text-left">
//             <p className="font-semibold text-gray-900 text-sm">{meme.uploader}</p>
//             <p className="text-gray-500 text-xs">{formatDate(meme.memeCreated)}</p>
//           </div>
//         </button>

//         {isOwnProfile && (
//           <div className="relative" data-meme-id={meme.id}>
//             <button
//               onClick={(e) => {
//                 e.stopPropagation()
//                 if (onOptionsClick) {
//                   onOptionsClick(isOptionsOpen ? null : meme.id)
//                 }
//               }}
//               className="p-2 hover:bg-gray-100 rounded-full transition-colors"
//             >
//               <MoreVertical className="w-4 h-4 text-gray-500" />
//             </button>
//             {isOptionsOpen && (
//               <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
//                 <button
//                   onClick={handleShare}
//                   className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3 transition-colors"
//                 >
//                   <Share className="w-4 h-4" />
//                   <span>Share</span>
//                 </button>
//                 <button
//                   onClick={handleDelete}
//                   className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-3 transition-colors"
//                 >
//                   <Trash className="w-4 h-4" />
//                   <span>Delete</span>
//                 </button>
//               </div>
//             )}
//           </div>
//         )}
//       </div>

//       {/* Media Content */}
//       <div
//         className="relative cursor-pointer overflow-hidden"
//         onClick={navigateToMemeDetail}
//         onMouseEnter={handleMouseEnter}
//         onMouseLeave={handleMouseLeave}
//       >
//         {isVideo ? (
//           <>
//             <video
//               ref={videoRef}
//               src={sanitizeUrl}
//               className="w-full object-cover transition-transform duration-300 group-hover:scale-105"
//               loop
//               muted
//               playsInline
//             />
//             <button
//               onClick={togglePlay}
//               className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
//             >
//               <div className="bg-white/90 backdrop-blur-sm rounded-full p-4 shadow-lg">
//                 {isPlaying ? (
//                   <Pause className="w-6 h-6 text-gray-800" />
//                 ) : (
//                   <Play className="w-6 h-6 text-gray-800 ml-0.5" />
//                 )}
//               </div>
//             </button>
//           </>
//         ) : (
//           <img
//             src={memeUrl || "/placeholder.svg"}
//             alt={meme.title || "Meme"}
//             className="w-full object-cover transition-transform duration-300 group-hover:scale-105"
//           />
//         )}
//       </div>

//       {/* Content */}
//       <div className="p-4 pt-3">
//         {/* Title */}
//         <h3
//           className="font-semibold text-gray-900 text-sm mb-3 line-clamp-2 cursor-pointer hover:text-blue-600 transition-colors leading-relaxed"
//           onClick={navigateToMemeDetail}
//         >
//           {meme.title}
//         </h3>

//         {/* Actions */}
//         <div className="flex items-center justify-between">
//           <div className="flex items-center space-x-4">
//             <button
//               onClick={(e) => {
//                 e.stopPropagation()
//                 toggleLike(meme.id, user.username)
//                 if (wsStore.isConnected) {
//                   wsStore.sendMessage({
//                     type: "LIKE",
//                     memeId: meme.id,
//                     action: isLiked ? "UNLIKE" : "LIKE",
//                     username: user.username,
//                   })
//                 }
//               }}
//               className={cn(
//                 "flex items-center space-x-2 px-3 py-2 rounded-full transition-all duration-200 hover:scale-105",
//                 isLiked
//                   ? "bg-red-50 text-red-600 hover:bg-red-100"
//                   : "bg-gray-50 text-gray-600 hover:bg-red-50 hover:text-red-600",
//               )}
//             >
//               <Heart className={cn("w-4 h-4", isLiked && "fill-current")} />
//               <span className="text-sm font-medium">{meme.likeCount || 0}</span>
//             </button>

//             <button
//               onClick={(e) => {
//                 e.stopPropagation()
//                 toggleSave(meme.id, user.username)
//                 if (wsStore.isConnected) {
//                   wsStore.sendMessage({
//                     type: "SAVE",
//                     memeId: meme.id,
//                     action: isSaved ? "UNSAVE" : "SAVE",
//                     username: user.username,
//                   })
//                 }
//               }}
//               className={cn(
//                 "flex items-center space-x-2 px-3 py-2 rounded-full transition-all duration-200 hover:scale-105",
//                 isSaved
//                   ? "bg-yellow-50 text-yellow-600 hover:bg-yellow-100"
//                   : "bg-gray-50 text-gray-600 hover:bg-yellow-50 hover:text-yellow-600",
//               )}
//             >
//               <Bookmark className={cn("w-4 h-4", isSaved && "fill-current")} />
//               <span className="text-sm font-medium">{meme.saveCount || 0}</span>
//             </button>

//             <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-full">
//               <MessageCircle className="w-4 h-4 text-gray-600" />
//               <span className="text-sm font-medium text-gray-600">{meme.comments?.length || 0}</span>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }



// "use client"

// import React, { useState, useRef } from "react"
// import { Heart, MessageCircle, MoreVertical, Trash, Share, Play, Pause, User } from "lucide-react"
// import { cn } from "../../hooks/utils"
// import type { Meme } from "../../types/mems"
// import { useMemeContentStore } from "../../store/useMemeContentStore.ts"
// import { useNavigate, useLocation } from "react-router-dom"
// import toast from "react-hot-toast"
// import DOMPurify from "dompurify"
// import useWebSocketStore from "../../hooks/useWebSockets"

// interface MemeCardProps {
//   meme: Meme
//   activeOptionsId?: string | null
//   onOptionsClick?: (id: string | null) => void
// }

// export const MemeCard: React.FC<MemeCardProps> = ({ meme, activeOptionsId, onOptionsClick }) => {
//   const likedMemes = useMemeContentStore.use.likedMemes()
//   const savedMemes = useMemeContentStore.use.savedMemes()
//   const toggleLike = useMemeContentStore.use.toggleLike()
//   const toggleSave = useMemeContentStore.use.toggleSave()
//   const deleteMeme = useMemeContentStore.use.deleteMeme()
//   const wsStore = useWebSocketStore()

//   const navigate = useNavigate()
//   const location = useLocation()
//   const user = JSON.parse(localStorage.getItem("user") || "{}")
//   const videoRef = useRef<HTMLVideoElement>(null)
//   const [isPlaying, setIsPlaying] = useState(false)
//   const [isHovered, setIsHovered] = useState(false)
//   const isOptionsOpen = activeOptionsId === meme?.id

//   React.useEffect(() => {
//     if (meme?.id && isOptionsOpen) {
//       const handleClickOutside = (event: MouseEvent) => {
//         const target = event.target as HTMLElement
//         if (!target.closest(`[data-meme-id="${meme.id}"]`)) {
//           ;(onOptionsClick ?? (() => {}))(null)
//         }
//       }
//       document.addEventListener("click", handleClickOutside)
//       return () => document.removeEventListener("click", handleClickOutside)
//     }
//   }, [meme?.id, isOptionsOpen, onOptionsClick])

//   if (!meme || !meme.id) {
//     return null
//   }

//   const memeUrl = meme.url || meme.mediaUrl || ""
//   const sanitizeUrl = DOMPurify.sanitize(memeUrl ? encodeURI(memeUrl) : "")
//   const isLiked = likedMemes.some((m) => m.id === meme.id)
//   const isSaved = savedMemes.some((m) => m.id === meme.id)
//   const pathSegments = location.pathname.split("/")
//   const isProfilePage = pathSegments[1] === "profile"
//   const profileUserId = pathSegments[2]
//   const isOwnProfile = isProfilePage && profileUserId === user.userId
//   const isVideo = memeUrl ? memeUrl.match(/\.(mp4|webm|ogg)$/i) : false

//   const handleSave = async (e: React.MouseEvent) => {
//     e.stopPropagation()
//     toggleSave(meme.id, user.username)
//     if (wsStore.isConnected) {
//       wsStore.sendMessage({
//         type: "SAVE",
//         memeId: meme.id,
//         action: isSaved ? "UNSAVE" : "SAVE",
//         username: user.username,
//       })
//     }
//   }

//   const handleLike = async (e: React.MouseEvent) => {
//     e.stopPropagation()
//     toggleLike(meme.id, user.username)
//     if (wsStore.isConnected) {
//       wsStore.sendMessage({
//         type: "LIKE",
//         memeId: meme.id,
//         action: isLiked ? "UNLIKE" : "LIKE",
//         username: user.username,
//       })
//     }
//   }

//   const handleShare = async (e: React.MouseEvent) => {
//     e.stopPropagation()
//     try {
//       await navigator.clipboard.writeText(`${window.location.origin}/meme/${meme.id}`)
//       toast.success("Link copied!")
//     } catch {
//       toast.error("Failed to copy")
//     }
//     ;(onOptionsClick ?? (() => {}))(null)
//   }

//   const handleDelete = async (e: React.MouseEvent) => {
//     e.stopPropagation()
//     if (window.confirm("Delete this meme?")) {
//       try {
//         await deleteMeme(meme.id)
//         if (onOptionsClick) onOptionsClick(null)
//         toast.success("Deleted!")
//       } catch {
//         toast.error("Failed to delete")
//       }
//     }
//   }

//   const navigateToMemeDetail = () => navigate(`/meme/${meme.id}`)
//   const navigateToProfile = (e: React.MouseEvent) => {
//     e.stopPropagation()
//     navigate(`/profile/${meme.uploader}`)
//   }

//   const handleMouseEnter = () => {
//     setIsHovered(true)
//     if (isVideo && videoRef.current) {
//       videoRef.current.play().catch(() => {})
//       setIsPlaying(true)
//     }
//   }

//   const handleMouseLeave = () => {
//     setIsHovered(false)
//     if (isVideo && videoRef.current) {
//       videoRef.current.pause()
//       videoRef.current.currentTime = 0
//       setIsPlaying(false)
//     }
//   }

//   const togglePlay = (e: React.MouseEvent) => {
//     e.stopPropagation()
//     if (videoRef.current) {
//       if (isPlaying) {
//         videoRef.current.pause()
//       } else {
//         videoRef.current.play()
//       }
//       setIsPlaying(!isPlaying)
//     }
//   }

//   return (
//     <div
//       className="relative group cursor-pointer break-inside-avoid mb-4 rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-lg transition-all duration-300"
//       onMouseEnter={handleMouseEnter}
//       onMouseLeave={handleMouseLeave}
//       onClick={navigateToMemeDetail}
//     >
//       {/* Main Image/Video */}
//       <div className="relative">
//         {isVideo ? (
//           <>
//             <video ref={videoRef} src={sanitizeUrl} className="w-full object-cover" loop muted playsInline />
//             {isHovered && (
//               <button onClick={togglePlay} className="absolute inset-0 flex items-center justify-center bg-black/20">
//                 <div className="bg-white/90 rounded-full p-3 shadow-lg">
//                   {isPlaying ? (
//                     <Pause className="w-5 h-5 text-gray-800" />
//                   ) : (
//                     <Play className="w-5 h-5 text-gray-800 ml-0.5" />
//                   )}
//                 </div>
//               </button>
//             )}
//           </>
//         ) : (
//           <img src={memeUrl || "/placeholder.svg"} alt={meme.title || "Meme"} className="w-full object-cover" />
//         )}

//         {/* Pinterest-style Save Button */}
//         <button
//           onClick={handleSave}
//           className={cn(
//             "absolute top-3 right-3 px-4 py-2 rounded-full text-white text-sm font-semibold transition-all duration-200 shadow-lg",
//             isSaved ? "bg-gray-800 hover:bg-gray-900" : "bg-red-600 hover:bg-red-700",
//             "opacity-0 group-hover:opacity-100 transform translate-y-1 group-hover:translate-y-0",
//           )}
//         >
//           {isSaved ? "Saved" : "Save"}
//         </button>

//         {/* Options Menu for Own Profile */}
//         {isOwnProfile && (
//           <div
//             className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
//             data-meme-id={meme.id}
//           >
//             <button
//               onClick={(e) => {
//                 e.stopPropagation()
//                 if (onOptionsClick) {
//                   onOptionsClick(isOptionsOpen ? null : meme.id)
//                 }
//               }}
//               className="p-2 bg-white/90 rounded-full hover:bg-white transition-colors shadow-lg"
//             >
//               <MoreVertical className="w-4 h-4 text-gray-700" />
//             </button>
//             {isOptionsOpen && (
//               <div className="absolute left-0 top-full mt-1 w-36 bg-white rounded-xl shadow-lg border py-2 z-50">
//                 <button
//                   onClick={handleShare}
//                   className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
//                 >
//                   <Share className="w-4 h-4" />
//                   <span>Share</span>
//                 </button>
//                 <button
//                   onClick={handleDelete}
//                   className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
//                 >
//                   <Trash className="w-4 h-4" />
//                   <span>Delete</span>
//                 </button>
//               </div>
//             )}
//           </div>
//         )}

//         {/* Bottom Overlay with User Info and Actions */}
//         <div
//           className={cn(
//             "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent p-4 transition-opacity duration-200",
//             isHovered ? "opacity-100" : "opacity-0",
//           )}
//         >
//           {/* Title */}
//           <h3 className="text-white font-medium text-sm mb-3 line-clamp-2 leading-tight">{meme.title}</h3>

//           {/* User Info and Actions */}
//           <div className="flex items-center justify-between">
//             <button
//               onClick={navigateToProfile}
//               className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
//             >
//               {meme.profilePictureUrl ? (
//                 <img
//                   src={meme.profilePictureUrl || "/placeholder.svg"}
//                   alt={meme.uploader}
//                   className="w-8 h-8 rounded-full object-cover"
//                 />
//               ) : (
//                 <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
//                   <User className="w-4 h-4 text-white" />
//                 </div>
//               )}
//               <span className="text-white text-sm font-medium">{meme.uploader}</span>
//             </button>

//             <div className="flex items-center space-x-2">
//               <button onClick={handleLike} className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
//                 <Heart className={cn("w-4 h-4 text-white", isLiked && "fill-white")} />
//               </button>
//               <div className="flex items-center space-x-1 bg-white/20 rounded-full px-2 py-1">
//                 <MessageCircle className="w-4 h-4 text-white" />
//                 <span className="text-white text-xs">{meme.comments?.length || 0}</span>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }



// "use client"

// import React, { useState, useRef } from "react"
// import { Heart, MessageCircle, MoreVertical, Trash, Share, Play, Pause, User } from "lucide-react"
// import { cn } from "../../hooks/utils"
// import type { Meme } from "../../types/mems"
// import { useMemeContentStore } from "../../store/useMemeContentStore.ts"
// import { useNavigate, useLocation } from "react-router-dom"
// import toast from "react-hot-toast"
// import DOMPurify from "dompurify"
// import useWebSocketStore from "../../hooks/useWebSockets"

// interface MemeCardProps {
//   meme: Meme
//   activeOptionsId?: string | null
//   onOptionsClick?: (id: string | null) => void
// }

// export const MemeCard: React.FC<MemeCardProps> = ({ meme, activeOptionsId, onOptionsClick }) => {
//   const likedMemes = useMemeContentStore.use.likedMemes()
//   const savedMemes = useMemeContentStore.use.savedMemes()
//   const toggleLike = useMemeContentStore.use.toggleLike()
//   const toggleSave = useMemeContentStore.use.toggleSave()
//   const deleteMeme = useMemeContentStore.use.deleteMeme()
//   const wsStore = useWebSocketStore()

//   const navigate = useNavigate()
//   const location = useLocation()
//   const user = JSON.parse(localStorage.getItem("user") || "{}")
//   const videoRef = useRef<HTMLVideoElement>(null)
//   const [isPlaying, setIsPlaying] = useState(false)
//   const [isHovered, setIsHovered] = useState(false)
//   const isOptionsOpen = activeOptionsId === meme?.id

//   React.useEffect(() => {
//     if (meme?.id && isOptionsOpen) {
//       const handleClickOutside = (event: MouseEvent) => {
//         const target = event.target as HTMLElement
//         if (!target.closest(`[data-meme-id="${meme.id}"]`)) {
//           ;(onOptionsClick ?? (() => {}))(null)
//         }
//       }
//       document.addEventListener("click", handleClickOutside)
//       return () => document.removeEventListener("click", handleClickOutside)
//     }
//   }, [meme?.id, isOptionsOpen, onOptionsClick])

//   if (!meme || !meme.id) {
//     return null
//   }

//   const memeUrl = meme.url || meme.mediaUrl || ""
//   const sanitizeUrl = DOMPurify.sanitize(memeUrl ? encodeURI(memeUrl) : "")
//   const isLiked = likedMemes.some((m) => m.id === meme.id)
//   const isSaved = savedMemes.some((m) => m.id === meme.id)
//   const pathSegments = location.pathname.split("/")
//   const isProfilePage = pathSegments[1] === "profile"
//   const profileUserId = pathSegments[2]
//   const isOwnProfile = isProfilePage && profileUserId === user.userId
//   const isVideo = memeUrl ? memeUrl.match(/\.(mp4|webm|ogg)$/i) : false

//   const handleSave = async (e: React.MouseEvent) => {
//     e.stopPropagation()
//     toggleSave(meme.id, user.username)
//     if (wsStore.isConnected) {
//       wsStore.sendMessage({
//         type: "SAVE",
//         memeId: meme.id,
//         action: isSaved ? "UNSAVE" : "SAVE",
//         username: user.username,
//       })
//     }
//   }

//   const handleLike = async (e: React.MouseEvent) => {
//     e.stopPropagation()
//     toggleLike(meme.id, user.username)
//     if (wsStore.isConnected) {
//       wsStore.sendMessage({
//         type: "LIKE",
//         memeId: meme.id,
//         action: isLiked ? "UNLIKE" : "LIKE",
//         username: user.username,
//       })
//     }
//   }

//   const handleShare = async (e: React.MouseEvent) => {
//     e.stopPropagation()
//     try {
//       await navigator.clipboard.writeText(`${window.location.origin}/meme/${meme.id}`)
//       toast.success("Link copied!")
//     } catch {
//       toast.error("Failed to copy")
//     }
//     ;(onOptionsClick ?? (() => {}))(null)
//   }

//   const handleDelete = async (e: React.MouseEvent) => {
//     e.stopPropagation()
//     if (window.confirm("Delete this meme?")) {
//       try {
//         await deleteMeme(meme.id)
//         if (onOptionsClick) onOptionsClick(null)
//         toast.success("Deleted!")
//       } catch {
//         toast.error("Failed to delete")
//       }
//     }
//   }

//   const navigateToMemeDetail = () => navigate(`/meme/${meme.id}`)
//   const navigateToProfile = (e: React.MouseEvent) => {
//     e.stopPropagation()
//     navigate(`/profile/${meme.uploader}`)
//   }

//   const handleMouseEnter = () => {
//     setIsHovered(true)
//     if (isVideo && videoRef.current) {
//       videoRef.current.play().catch(() => {})
//       setIsPlaying(true)
//     }
//   }

//   const handleMouseLeave = () => {
//     setIsHovered(false)
//     if (isVideo && videoRef.current) {
//       videoRef.current.pause()
//       videoRef.current.currentTime = 0
//       setIsPlaying(false)
//     }
//   }

//   const togglePlay = (e: React.MouseEvent) => {
//     e.stopPropagation()
//     if (videoRef.current) {
//       if (isPlaying) {
//         videoRef.current.pause()
//       } else {
//         videoRef.current.play()
//       }
//       setIsPlaying(!isPlaying)
//     }
//   }

//   return (
//     <div
//       className="relative group cursor-pointer rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 break-inside-avoid mb-4 w-full inline-block"
//       onMouseEnter={handleMouseEnter}
//       onMouseLeave={handleMouseLeave}
//       onClick={navigateToMemeDetail}
//     >
//       {/* Main Image/Video */}
//       <div className="relative">
//         {isVideo ? (
//           <>
//             <video
//               ref={videoRef}
//               src={sanitizeUrl}
//               className="w-full h-auto object-cover block"
//               loop
//               muted
//               playsInline
//             />
//             {isHovered && (
//               <button onClick={togglePlay} className="absolute inset-0 flex items-center justify-center bg-black/20">
//                 <div className="bg-white/90 rounded-full p-3 shadow-lg">
//                   {isPlaying ? (
//                     <Pause className="w-5 h-5 text-gray-800" />
//                   ) : (
//                     <Play className="w-5 h-5 text-gray-800 ml-0.5" />
//                   )}
//                 </div>
//               </button>
//             )}
//           </>
//         ) : (
//           <img
//             src={memeUrl || "/placeholder.svg"}
//             alt={meme.title || "Meme"}
//             className="w-full h-auto object-cover block"
//           />
//         )}

//         {/* Pinterest-style Save Button */}
//         <button
//           onClick={handleSave}
//           className={cn(
//             "absolute top-3 right-3 px-4 py-2 rounded-full text-white text-sm font-semibold transition-all duration-200 shadow-lg",
//             isSaved ? "bg-gray-800 hover:bg-gray-900" : "bg-red-600 hover:bg-red-700",
//             "opacity-0 group-hover:opacity-100 transform translate-y-1 group-hover:translate-y-0",
//           )}
//         >
//           {isSaved ? "Saved" : "Save"}
//         </button>

//         {/* Options Menu for Own Profile */}
//         {isOwnProfile && (
//           <div
//             className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
//             data-meme-id={meme.id}
//           >
//             <button
//               onClick={(e) => {
//                 e.stopPropagation()
//                 if (onOptionsClick) {
//                   onOptionsClick(isOptionsOpen ? null : meme.id)
//                 }
//               }}
//               className="p-2 bg-white/90 rounded-full hover:bg-white transition-colors shadow-lg"
//             >
//               <MoreVertical className="w-4 h-4 text-gray-700" />
//             </button>
//             {isOptionsOpen && (
//               <div className="absolute left-0 top-full mt-1 w-36 bg-white rounded-xl shadow-lg border py-2 z-50">
//                 <button
//                   onClick={handleShare}
//                   className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
//                 >
//                   <Share className="w-4 h-4" />
//                   <span>Share</span>
//                 </button>
//                 <button
//                   onClick={handleDelete}
//                   className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
//                 >
//                   <Trash className="w-4 h-4" />
//                   <span>Delete</span>
//                 </button>
//               </div>
//             )}
//           </div>
//         )}

//         {/* Bottom Overlay with User Info and Actions */}
//         <div
//           className={cn(
//             "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-4 transition-opacity duration-200",
//             isHovered ? "opacity-100" : "opacity-0",
//           )}
//         >
//           {/* Title */}
//           <h3 className="text-white font-medium text-sm mb-3 line-clamp-2 leading-tight">{meme.title}</h3>

//           {/* User Info and Actions */}
//           <div className="flex items-center justify-between">
//             <button
//               onClick={navigateToProfile}
//               className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
//             >
//               {meme.profilePictureUrl ? (
//                 <img
//                   src={meme.profilePictureUrl || "/placeholder.svg"}
//                   alt={meme.uploader}
//                   className="w-8 h-8 rounded-full object-cover"
//                 />
//               ) : (
//                 <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
//                   <User className="w-4 h-4 text-white" />
//                 </div>
//               )}
//               <span className="text-white text-sm font-medium">{meme.uploader}</span>
//             </button>

//             <div className="flex items-center space-x-2">
//               <button onClick={handleLike} className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
//                 <Heart className={cn("w-4 h-4 text-white", isLiked && "fill-white")} />
//               </button>
//               <div className="flex items-center space-x-1 bg-white/20 rounded-full px-2 py-1">
//                 <MessageCircle className="w-4 h-4 text-white" />
//                 <span className="text-white text-xs">{meme.comments?.length || 0}</span>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }


// "use client"

// import React, { useState, useRef } from "react"
// import { Heart, MessageCircle, MoreVertical, Trash, Share, User } from "lucide-react"
// import { cn } from "../../hooks/utils"
// import type { Meme } from "../../types/mems"
// import { useMemeContentStore } from "../../store/useMemeContentStore.ts"
// import { useNavigate, useLocation } from "react-router-dom"
// import toast from "react-hot-toast"
// import DOMPurify from "dompurify"
// import useWebSocketStore from "../../hooks/useWebSockets"

// interface MemeCardProps {
//   meme: Meme
//   activeOptionsId?: string | null
//   onOptionsClick?: (id: string | null) => void
// }

// export const MemeCard: React.FC<MemeCardProps> = ({ meme, activeOptionsId, onOptionsClick }) => {
//   const likedMemes = useMemeContentStore.use.likedMemes()
//   const savedMemes = useMemeContentStore.use.savedMemes()
//   const toggleLike = useMemeContentStore.use.toggleLike()
//   const toggleSave = useMemeContentStore.use.toggleSave()
//   const deleteMeme = useMemeContentStore.use.deleteMeme()
//   const wsStore = useWebSocketStore()

//   const navigate = useNavigate()
//   const location = useLocation()
//   const user = JSON.parse(localStorage.getItem("user") || "{}")
//   const videoRef = useRef<HTMLVideoElement>(null)
//   const [isPlaying, setIsPlaying] = useState(false)
//   const [isHovered, setIsHovered] = useState(false)
//   const isOptionsOpen = activeOptionsId === meme?.id

//   React.useEffect(() => {
//     if (meme?.id && isOptionsOpen) {
//       const handleClickOutside = (event: MouseEvent) => {
//         const target = event.target as HTMLElement
//         if (!target.closest(`[data-meme-id="${meme.id}"]`)) {
//           ;(onOptionsClick ?? (() => {}))(null)
//         }
//       }
//       document.addEventListener("click", handleClickOutside)
//       return () => document.removeEventListener("click", handleClickOutside)
//     }
//   }, [meme?.id, isOptionsOpen, onOptionsClick])

//   if (!meme || !meme.id) {
//     return null
//   }

//   const memeUrl = meme.url || meme.mediaUrl || ""
//   const sanitizeUrl = DOMPurify.sanitize(memeUrl ? encodeURI(memeUrl) : "")
//   const isLiked = likedMemes.some((m) => m.id === meme.id)
//   const isSaved = savedMemes.some((m) => m.id === meme.id)
//   const pathSegments = location.pathname.split("/")
//   const isProfilePage = pathSegments[1] === "profile"
//   const profileUserId = pathSegments[2]
//   const isOwnProfile = isProfilePage && profileUserId === user.userId
//   const isVideo = memeUrl ? memeUrl.match(/\.(mp4|webm|ogg)$/i) : false

//   const handleSave = async (e: React.MouseEvent) => {
//     e.stopPropagation()
//     toggleSave(meme.id, user.username)
//     if (wsStore.isConnected) {
//       wsStore.sendMessage({
//         type: "SAVE",
//         memeId: meme.id,
//         action: isSaved ? "UNSAVE" : "SAVE",
//         username: user.username,
//       })
//     }
//   }

//   const handleLike = async (e: React.MouseEvent) => {
//     e.stopPropagation()
//     toggleLike(meme.id, user.username)
//     if (wsStore.isConnected) {
//       wsStore.sendMessage({
//         type: "LIKE",
//         memeId: meme.id,
//         action: isLiked ? "UNLIKE" : "LIKE",
//         username: user.username,
//       })
//     }
//   }

//   const handleShare = async (e: React.MouseEvent) => {
//     e.stopPropagation()
//     try {
//       await navigator.clipboard.writeText(`${window.location.origin}/meme/${meme.id}`)
//       toast.success("Link copied!")
//     } catch {
//       toast.error("Failed to copy")
//     }
//     ;(onOptionsClick ?? (() => {}))(null)
//   }

//   const handleDelete = async (e: React.MouseEvent) => {
//     e.stopPropagation()
//     if (window.confirm("Delete this meme?")) {
//       try {
//         await deleteMeme(meme.id)
//         if (onOptionsClick) onOptionsClick(null)
//         toast.success("Deleted!")
//       } catch {
//         toast.error("Failed to delete")
//       }
//     }
//   }

//   const navigateToMemeDetail = () => navigate(`/meme/${meme.id}`)
//   const navigateToProfile = (e: React.MouseEvent) => {
//     e.stopPropagation()
//     navigate(`/profile/${meme.uploader}`)
//   }

//   const handleMouseEnter = () => {
//     setIsHovered(true)
//     if (isVideo && videoRef.current) {
//       videoRef.current.play().catch(() => {})
//       setIsPlaying(true)
//     }
//   }

//   const handleMouseLeave = () => {
//     setIsHovered(false)
//     if (isVideo && videoRef.current) {
//       videoRef.current.pause()
//       videoRef.current.currentTime = 0
//       setIsPlaying(false)
//     }
//   }

//   return (
//     <div
//       className="relative group cursor-pointer rounded-3xl overflow-hidden bg-white shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 break-inside-avoid mb-8 w-full inline-block border border-gray-100"
//       onMouseEnter={handleMouseEnter}
//       onMouseLeave={handleMouseLeave}
//       onClick={navigateToMemeDetail}
//     >
//       {/* Main Image/Video */}
//       <div className="relative">
//         {isVideo ? (
//           <>
//             <video
//               ref={videoRef}
//               src={sanitizeUrl}
//               className="w-full h-auto object-cover block rounded-t-3xl"
//               loop
//               muted
//               playsInline
//             />
//           </>
//         ) : (
//           <img
//             src={memeUrl || "/placeholder.svg"}
//             alt={meme.title || "Meme"}
//             className="w-full h-auto object-cover block rounded-t-3xl"
//           />
//         )}

//         {/* Pinterest-style Save Button */}
//         <button
//           onClick={handleSave}
//           className={cn(
//             "absolute top-4 right-4 px-5 py-2.5 rounded-full text-white text-base font-semibold transition-all duration-200 shadow-xl",
//             isSaved ? "bg-gray-800 hover:bg-gray-900" : "bg-red-600 hover:bg-red-700",
//             "opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0",
//           )}
//         >
//           {isSaved ? "Saved" : "Save"}
//         </button>

//         {/* Options Menu for Own Profile */}
//         {isOwnProfile && (
//           <div
//             className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
//             data-meme-id={meme.id}
//           >
//             <button
//               onClick={(e) => {
//                 e.stopPropagation()
//                 if (onOptionsClick) {
//                   onOptionsClick(isOptionsOpen ? null : meme.id)
//                 }
//               }}
//               className="p-3 bg-white/90 rounded-full hover:bg-white transition-colors shadow-xl"
//             >
//               <MoreVertical className="w-5 h-5 text-gray-700" />
//             </button>
//             {isOptionsOpen && (
//               <div className="absolute left-0 top-full mt-2 w-40 bg-white rounded-xl shadow-xl border py-2 z-50">
//                 <button
//                   onClick={handleShare}
//                   className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3"
//                 >
//                   <Share className="w-4 h-4" />
//                   <span>Share</span>
//                 </button>
//                 <button
//                   onClick={handleDelete}
//                   className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-3"
//                 >
//                   <Trash className="w-4 h-4" />
//                   <span>Delete</span>
//                 </button>
//               </div>
//             )}
//           </div>
//         )}

//         {/* Bottom Overlay with User Info and Actions */}
//         <div
//           className={cn(
//             "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-5 transition-opacity duration-200",
//             isHovered ? "opacity-100" : "opacity-0",
//           )}
//         >
//           {/* Title */}
//           <h3 className="text-white font-semibold text-base mb-4 line-clamp-2 leading-tight">{meme.title}</h3>

//           {/* User Info and Actions */}
//           <div className="flex items-center justify-between">
//             <button
//               onClick={navigateToProfile}
//               className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
//             >
//               {meme.profilePictureUrl ? (
//                 <img
//                   src={meme.profilePictureUrl || "/placeholder.svg"}
//                   alt={meme.uploader}
//                   className="w-10 h-10 rounded-full object-cover border-2 border-white/20"
//                 />
//               ) : (
//                 <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center border-2 border-white/20">
//                   <User className="w-5 h-5 text-white" />
//                 </div>
//               )}
//               <span className="text-white text-base font-medium">{meme.uploader}</span>
//             </button>

//             <div className="flex items-center space-x-3">
//               <button
//                 onClick={handleLike}
//                 className="p-2.5 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
//               >
//                 <Heart className={cn("w-5 h-5 text-white", isLiked && "fill-white")} />
//               </button>
//               <div className="flex items-center space-x-2 bg-white/20 rounded-full px-3 py-1.5">
//                 <MessageCircle className="w-4 h-4 text-white" />
//                 <span className="text-white text-sm font-medium">{meme.comments?.length || 0}</span>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }




// "use client"

// import React, { useState, useRef, useEffect } from "react"
// import { Heart, MessageCircle, MoreVertical, Trash, Share, User } from "lucide-react"
// import { cn } from "../../hooks/utils"
// import type { Meme } from "../../types/mems"
// import { useMemeContentStore } from "../../store/useMemeContentStore.ts"
// import { useNavigate, useLocation } from "react-router-dom"
// import toast from "react-hot-toast"
// import DOMPurify from "dompurify"
// import useWebSocketStore from "../../hooks/useWebSockets"

// interface MemeCardProps {
//   meme: Meme
//   activeOptionsId?: string | null
//   onOptionsClick?: (id: string | null) => void
// }

// export const MemeCard: React.FC<MemeCardProps> = ({ meme, activeOptionsId, onOptionsClick }) => {
//   const likedMemes = useMemeContentStore.use.likedMemes()
//   const savedMemes = useMemeContentStore.use.savedMemes()
//   const toggleLike = useMemeContentStore.use.toggleLike()
//   const toggleSave = useMemeContentStore.use.toggleSave()
//   const deleteMeme = useMemeContentStore.use.deleteMeme()
//   const wsStore = useWebSocketStore()

//   const navigate = useNavigate()
//   const location = useLocation()
//   const user = JSON.parse(localStorage.getItem("user") || "{}")
//   const videoRef = useRef<HTMLVideoElement>(null)
//   const usernameRef = useRef<HTMLSpanElement>(null)
//   const usernameContainerRef = useRef<HTMLDivElement>(null)
//   const [isPlaying, setIsPlaying] = useState(false)
//   const [isHovered, setIsHovered] = useState(false)
//   const [shouldScroll, setShouldScroll] = useState(false)
//   const isOptionsOpen = activeOptionsId === meme?.id

//   React.useEffect(() => {
//     if (meme?.id && isOptionsOpen) {
//       const handleClickOutside = (event: MouseEvent) => {
//         const target = event.target as HTMLElement
//         if (!target.closest(`[data-meme-id="${meme.id}"]`)) {
//           ;(onOptionsClick ?? (() => {}))(null)
//         }
//       }
//       document.addEventListener("click", handleClickOutside)
//       return () => document.removeEventListener("click", handleClickOutside)
//     }
//   }, [meme?.id, isOptionsOpen, onOptionsClick])

//   // Check if username needs scrolling
//   useEffect(() => {
//     const checkTextOverflow = () => {
//       if (usernameRef.current && usernameContainerRef.current) {
//         const textWidth = usernameRef.current.scrollWidth
//         const containerWidth = usernameContainerRef.current.clientWidth
//         setShouldScroll(textWidth > containerWidth)
//       }
//     }

//     checkTextOverflow()
//     window.addEventListener("resize", checkTextOverflow)
//     return () => window.removeEventListener("resize", checkTextOverflow)
//   }, [meme.uploader])

//   if (!meme || !meme.id) {
//     return null
//   }

//   const memeUrl = meme.url || meme.mediaUrl || ""
//   const sanitizeUrl = DOMPurify.sanitize(memeUrl ? encodeURI(memeUrl) : "")
//   const isLiked = likedMemes.some((m) => m.id === meme.id)
//   const isSaved = savedMemes.some((m) => m.id === meme.id)
//   const pathSegments = location.pathname.split("/")
//   const isProfilePage = pathSegments[1] === "profile"
//   const profileUserId = pathSegments[2]
//   const isOwnProfile = isProfilePage && profileUserId === user.userId
//   const isVideo = memeUrl ? memeUrl.match(/\.(mp4|webm|ogg)$/i) : false

//   const handleSave = async (e: React.MouseEvent) => {
//     e.stopPropagation()
//     toggleSave(meme.id, user.username)
//     if (wsStore.isConnected) {
//       wsStore.sendMessage({
//         type: "SAVE",
//         memeId: meme.id,
//         action: isSaved ? "UNSAVE" : "SAVE",
//         username: user.username,
//       })
//     }
//   }

//   const handleLike = async (e: React.MouseEvent) => {
//     e.stopPropagation()
//     toggleLike(meme.id, user.username)
//     if (wsStore.isConnected) {
//       wsStore.sendMessage({
//         type: "LIKE",
//         memeId: meme.id,
//         action: isLiked ? "UNLIKE" : "LIKE",
//         username: user.username,
//       })
//     }
//   }

//   const handleShare = async (e: React.MouseEvent) => {
//     e.stopPropagation()
//     try {
//       await navigator.clipboard.writeText(`${window.location.origin}/meme/${meme.id}`)
//       toast.success("Link copied!")
//     } catch {
//       toast.error("Failed to copy")
//     }
//     ;(onOptionsClick ?? (() => {}))(null)
//   }

//   const handleDelete = async (e: React.MouseEvent) => {
//     e.stopPropagation()
//     if (window.confirm("Delete this meme?")) {
//       try {
//         await deleteMeme(meme.id)
//         if (onOptionsClick) onOptionsClick(null)
//         toast.success("Deleted!")
//       } catch {
//         toast.error("Failed to delete")
//       }
//     }
//   }

//   const navigateToMemeDetail = () => navigate(`/meme/${meme.id}`)
//   const navigateToProfile = (e: React.MouseEvent) => {
//     e.stopPropagation()
//     navigate(`/profile/${meme.uploader}`)
//   }

//   const handleMouseEnter = () => {
//     setIsHovered(true)
//     if (isVideo && videoRef.current) {
//       videoRef.current.play().catch(() => {})
//       setIsPlaying(true)
//     }
//   }

//   const handleMouseLeave = () => {
//     setIsHovered(false)
//     if (isVideo && videoRef.current) {
//       videoRef.current.pause()
//       videoRef.current.currentTime = 0
//       setIsPlaying(false)
//     }
//   }

//   return (
//     <div
//       className="relative group cursor-pointer rounded-2xl lg:rounded-3xl overflow-hidden bg-white shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 break-inside-avoid mb-6 lg:mb-8 w-full inline-block border border-gray-100"
//       onMouseEnter={handleMouseEnter}
//       onMouseLeave={handleMouseLeave}
//       onClick={navigateToMemeDetail}
//     >
//       {/* Main Image/Video */}
//       <div className="relative">
//         {isVideo ? (
//           <>
//             <video
//               ref={videoRef}
//               src={sanitizeUrl}
//               className="w-full h-auto object-cover block rounded-t-2xl lg:rounded-t-3xl"
//               loop
//               muted
//               playsInline
//             />
//           </>
//         ) : (
//           <img
//             src={memeUrl || "/placeholder.svg"}
//             alt={meme.title || "Meme"}
//             className="w-full h-auto object-cover block rounded-t-2xl lg:rounded-t-3xl"
//           />
//         )}

//         {/* Pinterest-style Save Button - Responsive */}
//         <button
//           onClick={handleSave}
//           className={cn(
//             "absolute top-2 right-2 lg:top-4 lg:right-4 px-3 py-1.5 lg:px-5 lg:py-2.5 rounded-full text-white text-sm lg:text-base font-semibold transition-all duration-200 shadow-xl",
//             isSaved ? "bg-gray-800 hover:bg-gray-900" : "bg-red-600 hover:bg-red-700",
//             "opacity-0 group-hover:opacity-100 transform translate-y-1 lg:translate-y-2 group-hover:translate-y-0",
//           )}
//         >
//           {isSaved ? "Saved" : "Save"}
//         </button>

//         {/* Options Menu for Own Profile - Responsive */}
//         {isOwnProfile && (
//           <div
//             className="absolute top-2 left-2 lg:top-4 lg:left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
//             data-meme-id={meme.id}
//           >
//             <button
//               onClick={(e) => {
//                 e.stopPropagation()
//                 if (onOptionsClick) {
//                   onOptionsClick(isOptionsOpen ? null : meme.id)
//                 }
//               }}
//               className="p-2 lg:p-3 bg-white/90 rounded-full hover:bg-white transition-colors shadow-xl"
//             >
//               <MoreVertical className="w-4 h-4 lg:w-5 lg:h-5 text-gray-700" />
//             </button>
//             {isOptionsOpen && (
//               <div className="absolute left-0 top-full mt-1 lg:mt-2 w-32 lg:w-40 bg-white rounded-xl shadow-xl border py-2 z-50">
//                 <button
//                   onClick={handleShare}
//                   className="w-full px-3 lg:px-4 py-2 lg:py-3 text-left text-xs lg:text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2 lg:space-x-3"
//                 >
//                   <Share className="w-3 h-3 lg:w-4 lg:h-4" />
//                   <span>Share</span>
//                 </button>
//                 <button
//                   onClick={handleDelete}
//                   className="w-full px-3 lg:px-4 py-2 lg:py-3 text-left text-xs lg:text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2 lg:space-x-3"
//                 >
//                   <Trash className="w-3 h-3 lg:w-4 lg:h-4" />
//                   <span>Delete</span>
//                 </button>
//               </div>
//             )}
//           </div>
//         )}

//         {/* Bottom Overlay with User Info and Actions - Responsive */}
//         <div
//           className={cn(
//             "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 lg:p-5 transition-opacity duration-200",
//             isHovered ? "opacity-100" : "opacity-0",
//           )}
//         >
//           {/* Title - Responsive */}
//           <h3 className="text-white font-medium lg:font-semibold text-xs lg:text-base mb-2 lg:mb-4 line-clamp-2 leading-tight">
//             {meme.title}
//           </h3>

//           {/* User Info and Actions - Responsive */}
//           <div className="flex items-center justify-between">
//             <button
//               onClick={navigateToProfile}
//               className="flex items-center space-x-2 lg:space-x-3 hover:opacity-80 transition-opacity min-w-0 flex-1 mr-2"
//             >
//               {meme.profilePictureUrl ? (
//                 <img
//                   src={meme.profilePictureUrl || "/placeholder.svg"}
//                   alt={meme.uploader}
//                   className="w-6 h-6 lg:w-10 lg:h-10 rounded-full object-cover border border-white/20 lg:border-2 flex-shrink-0"
//                 />
//               ) : (
//                 <div className="w-6 h-6 lg:w-10 lg:h-10 bg-white/20 rounded-full flex items-center justify-center border border-white/20 lg:border-2 flex-shrink-0">
//                   <User className="w-3 h-3 lg:w-5 lg:h-5 text-white" />
//                 </div>
//               )}

//               {/* Username with scrolling animation */}
//               <div ref={usernameContainerRef} className="min-w-0 flex-1 overflow-hidden">
//                 <span
//                   ref={usernameRef}
//                   className={cn(
//                     "text-white text-xs lg:text-base font-medium whitespace-nowrap inline-block",
//                     shouldScroll && "animate-marquee",
//                   )}
//                   style={{
//                     animationDuration: shouldScroll ? `${meme.uploader.length * 0.15}s` : undefined,
//                   }}
//                 >
//                   {meme.uploader}
//                 </span>
//               </div>
//             </button>

//             <div className="flex items-center space-x-1 lg:space-x-3 flex-shrink-0">
//               <button
//                 onClick={handleLike}
//                 className="p-1.5 lg:p-2.5 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
//               >
//                 <Heart className={cn("w-3 h-3 lg:w-5 lg:h-5 text-white", isLiked && "fill-white")} />
//               </button>
//               <div className="flex items-center space-x-1 bg-white/20 rounded-full px-2 py-1 lg:px-3 lg:py-1.5">
//                 <MessageCircle className="w-3 h-3 lg:w-4 lg:h-4 text-white" />
//                 <span className="text-white text-xs lg:text-sm font-medium">{meme.comments?.length || 0}</span>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       <style jsx>{`
//         @keyframes marquee {
//           0% {
//             transform: translateX(0%);
//           }
//           50% {
//             transform: translateX(-100%);
//           }
//           100% {
//             transform: translateX(0%);
//           }
//         }
        
//         .animate-marquee {
//           animation: marquee linear infinite;
//         }
//       `}</style>
//     </div>
//   )
// }



"use client"

import React, { useState, useRef, useEffect } from "react"
import { Heart, MessageCircle, MoreVertical, Trash, Share, User } from "lucide-react"
import { cn } from "../../hooks/utils"
import type { Meme } from "../../types/mems"
import { useMemeContentStore } from "../../store/useMemeContentStore.ts"
import { useNavigate, useLocation } from "react-router-dom"
import toast from "react-hot-toast"
import DOMPurify from "dompurify"
import useWebSocketStore from "../../hooks/useWebSockets"

interface MemeCardProps {
  meme: Meme
  activeOptionsId?: string | null
  onOptionsClick?: (id: string | null) => void
}

export const MemeCard: React.FC<MemeCardProps> = ({ meme, activeOptionsId, onOptionsClick }) => {
  const likedMemes = useMemeContentStore.use.likedMemes()
  const savedMemes = useMemeContentStore.use.savedMemes()
  const toggleLike = useMemeContentStore.use.toggleLike()
  const toggleSave = useMemeContentStore.use.toggleSave()
  const deleteMeme = useMemeContentStore.use.deleteMeme()
  const wsStore = useWebSocketStore()

  const navigate = useNavigate()
  const location = useLocation()
  const user = JSON.parse(localStorage.getItem("user") || "{}")
  const videoRef = useRef<HTMLVideoElement>(null)
  const usernameRef = useRef<HTMLSpanElement>(null)
  const usernameContainerRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [shouldScroll, setShouldScroll] = useState(false)
  const [isScrollPaused, setIsScrollPaused] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const isOptionsOpen = activeOptionsId === meme?.id

  React.useEffect(() => {
    if (meme?.id && isOptionsOpen) {
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as HTMLElement
        if (!target.closest(`[data-meme-id="${meme.id}"]`)) {
          ;(onOptionsClick ?? (() => {}))(null)
        }
      }
      document.addEventListener("click", handleClickOutside)
      return () => document.removeEventListener("click", handleClickOutside)
    }
  }, [meme?.id, isOptionsOpen, onOptionsClick])

  // Check if username needs scrolling
  useEffect(() => {
    const checkTextOverflow = () => {
      if (usernameRef.current && usernameContainerRef.current) {
        const textWidth = usernameRef.current.scrollWidth
        const containerWidth = usernameContainerRef.current.clientWidth
        setShouldScroll(textWidth > containerWidth + 5) // Add 5px buffer
      }
    }

    // Small delay to ensure elements are rendered
    const timer = setTimeout(checkTextOverflow, 100)

    window.addEventListener("resize", checkTextOverflow)
    return () => {
      clearTimeout(timer)
      window.removeEventListener("resize", checkTextOverflow)
    }
  }, [meme.uploader, isHovered])

  if (!meme || !meme.id) {
    return null
  }

  const memeUrl = meme.url || meme.mediaUrl || ""
  const sanitizeUrl = DOMPurify.sanitize(memeUrl ? encodeURI(memeUrl) : "")
  const isLiked = likedMemes.some((m) => m.id === meme.id)
  const isSaved = savedMemes.some((m) => m.id === meme.id)
  const pathSegments = location.pathname.split("/")
  const isProfilePage = pathSegments[1] === "profile"
  const profileUserId = pathSegments[2]
  const isOwnProfile = isProfilePage && profileUserId === user.userId
  const isVideo = memeUrl ? memeUrl.match(/\.(mp4|webm|ogg)$/i) : false

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation()
    toggleSave(meme.id, user.username)
    if (wsStore.isConnected) {
      wsStore.sendMessage({
        type: "SAVE",
        memeId: meme.id,
        action: isSaved ? "UNSAVE" : "SAVE",
        username: user.username,
      })
    }
  }

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation()
    toggleLike(meme.id, user.username)
    if (wsStore.isConnected) {
      wsStore.sendMessage({
        type: "LIKE",
        memeId: meme.id,
        action: isLiked ? "UNLIKE" : "LIKE",
        username: user.username,
      })
    }
  }

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/meme/${meme.id}`)
      toast.success("Link copied!")
    } catch {
      toast.error("Failed to copy")
    }
    ;(onOptionsClick ?? (() => {}))(null)
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (window.confirm("Delete this meme?")) {
      try {
        await deleteMeme(meme.id)
        if (onOptionsClick) onOptionsClick(null)
        toast.success("Deleted!")
      } catch {
        toast.error("Failed to delete")
      }
    }
  }

  const navigateToMemeDetail = () => navigate(`/meme/${meme.id}`)
  const navigateToProfile = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigate(`/profile/${meme.uploader}`)
  }

  const handleMouseEnter = () => {
    setIsHovered(true)
    if (isVideo && videoRef.current) {
      videoRef.current.play().catch(() => {})
      setIsPlaying(true)
    }
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    if (isVideo && videoRef.current) {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
      setIsPlaying(false)
    }
  }

  const handleUsernameMouseEnter = () => {
    setIsScrollPaused(true)
  }

  const handleUsernameMouseLeave = () => {
    setIsScrollPaused(false)
  }

  return (
    <div
      className="relative group cursor-pointer rounded-2xl lg:rounded-3xl overflow-hidden bg-white shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 break-inside-avoid mb-6 lg:mb-8 w-full inline-block border border-gray-100"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={navigateToMemeDetail}
    >
      {/* Main Image/Video */}
      <div className="relative">
        {isVideo ? (
          <>
            <video
              ref={videoRef}
              src={sanitizeUrl}
              className="w-full h-auto object-cover block rounded-t-2xl lg:rounded-t-3xl"
              loop
              muted
              playsInline
            />
          </>
        ) : (
          <img
            src={memeUrl || "/placeholder.svg"}
            alt={meme.title || "Meme"}
            className="w-full h-auto object-cover block rounded-t-2xl lg:rounded-t-3xl"
          />
        )}

        {/* Pinterest-style Save Button - Responsive */}
        <button
          onClick={handleSave}
          className={cn(
            "absolute top-2 right-2 lg:top-4 lg:right-4 px-3 py-1.5 lg:px-5 lg:py-2.5 rounded-full text-white text-sm lg:text-base font-semibold transition-all duration-200 shadow-xl",
            isSaved ? "bg-gray-800 hover:bg-gray-900" : "bg-red-600 hover:bg-red-700",
            "opacity-0 group-hover:opacity-100 transform translate-y-1 lg:translate-y-2 group-hover:translate-y-0",
          )}
        >
          {isSaved ? "Saved" : "Save"}
        </button>

        {/* Options Menu for Own Profile - Responsive */}
        {isOwnProfile && (
          <div
            className="absolute top-2 left-2 lg:top-4 lg:left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            data-meme-id={meme.id}
          >
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (onOptionsClick) {
                  onOptionsClick(isOptionsOpen ? null : meme.id)
                }
              }}
              className="p-2 lg:p-3 bg-white/90 rounded-full hover:bg-white transition-colors shadow-xl"
            >
              <MoreVertical className="w-4 h-4 lg:w-5 lg:h-5 text-gray-700" />
            </button>
            {isOptionsOpen && (
              <div className="absolute left-0 top-full mt-1 lg:mt-2 w-32 lg:w-40 bg-white rounded-xl shadow-xl border py-2 z-50">
                <button
                  onClick={handleShare}
                  className="w-full px-3 lg:px-4 py-2 lg:py-3 text-left text-xs lg:text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2 lg:space-x-3"
                >
                  <Share className="w-3 h-3 lg:w-4 lg:h-4" />
                  <span>Share</span>
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full px-3 lg:px-4 py-2 lg:py-3 text-left text-xs lg:text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2 lg:space-x-3"
                >
                  <Trash className="w-3 h-3 lg:w-4 lg:h-4" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Bottom Overlay with User Info and Actions - Responsive */}
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 lg:p-5 transition-opacity duration-200",
            isHovered ? "opacity-100" : "opacity-0",
          )}
        >
          {/* Title - Responsive */}
          <h3 className="text-white font-medium lg:font-semibold text-xs lg:text-base mb-2 lg:mb-4 line-clamp-2 leading-tight">
            {meme.title}
          </h3>

          {/* User Info and Actions - Responsive */}
          <div className="flex items-center justify-between">
            <button
              onClick={navigateToProfile}
              className="flex items-center space-x-2 lg:space-x-3 hover:opacity-80 transition-opacity min-w-0 flex-1 mr-2"
              onMouseEnter={handleUsernameMouseEnter}
              onMouseLeave={handleUsernameMouseLeave}
            >
              {meme.profilePictureUrl ? (
                <img
                  src={meme.profilePictureUrl || "/placeholder.svg"}
                  alt={meme.uploader}
                  className="w-6 h-6 lg:w-10 lg:h-10 rounded-full object-cover border border-white/20 lg:border-2 flex-shrink-0"
                />
              ) : (
                <div className="w-6 h-6 lg:w-10 lg:h-10 bg-white/20 rounded-full flex items-center justify-center border border-white/20 lg:border-2 flex-shrink-0">
                  <User className="w-3 h-3 lg:w-5 lg:h-5 text-white" />
                </div>
              )}

              {/* Username with scrolling animation */}
              <div ref={usernameContainerRef} className="min-w-0 flex-1 overflow-hidden relative">
                <span
                  ref={usernameRef}
                  className={cn(
                    "text-white text-xs lg:text-base font-medium whitespace-nowrap inline-block transition-transform duration-1000 ease-in-out",
                    shouldScroll && !isScrollPaused && "animate-scroll-text",
                    isScrollPaused && "animation-paused",
                  )}
                  style={{
                    animationDuration: shouldScroll ? `${Math.max(3, meme.uploader.length * 0.2)}s` : undefined,
                  }}
                >
                  {meme.uploader}
                </span>
                {/* Fade edges for scrolling text */}
                {shouldScroll && (
                  <>
                    <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-r from-black/80 to-transparent pointer-events-none"></div>
                    <div className="absolute right-0 top-0 bottom-0 w-2 bg-gradient-to-l from-black/80 to-transparent pointer-events-none"></div>
                  </>
                )}
              </div>
            </button>

            <div className="flex items-center space-x-1 lg:space-x-3 flex-shrink-0">
              <button
                onClick={handleLike}
                className="p-1.5 lg:p-2.5 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
              >
                <Heart className={cn("w-3 h-3 lg:w-5 lg:h-5 text-white", isLiked && "fill-white")} />
              </button>
              <div className="flex items-center space-x-1 bg-white/20 rounded-full px-2 py-1 lg:px-3 lg:py-1.5">
                <MessageCircle className="w-3 h-3 lg:w-4 lg:h-4 text-white" />
                <span className="text-white text-xs lg:text-sm font-medium">{meme.commentsCount || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CSS for scrolling animation */}
      <style>{`
        @keyframes scroll-text {
          0% {
            transform: translateX(0%);
          }
          25% {
            transform: translateX(0%);
          }
          75% {
            transform: translateX(calc(-100% + 100px));
          }
          100% {
            transform: translateX(calc(-100% + 100px));
          }
        }
        
        .animate-scroll-text {
          animation: scroll-text linear infinite;
        }
        
        .animation-paused {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  )
}
