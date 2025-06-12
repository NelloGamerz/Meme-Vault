// import React, { useCallback, useEffect, useRef, useState } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { useMemeContentStore } from "../store/useMemeContentStore";
// import { useUserStore } from "../store/useUserStore";
// import useWebSocketStore from "../hooks/useWebSockets";
// import {
//   Heart,
//   Bookmark,
//   Download,
//   Share2,
//   MessageCircle,
//   Send,
//   ArrowLeft,
//   User,
//   X,
//   Play,
//   Pause,
//   Volume2,
//   VolumeX,
// } from "lucide-react";
// import { cn } from "../hooks/utils";
// import toast from "react-hot-toast";
// import type { Comment } from "../types/mems";

// const MemeDetailPage: React.FC = () => {
//   const { id } = useParams<{ id: string }>();
//   const navigate = useNavigate();
//   const videoRef = useRef<HTMLVideoElement>(null);
//   const [isPlaying, setIsPlaying] = useState(true);
//   const [isMuted, setIsMuted] = useState(false);
//   const [comment, setComment] = useState("");
//   const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
//   const [localIsLiked, setLocalIsLiked] = useState(false);
//   const [localIsSaved, setLocalIsSaved] = useState(false);

//   // Add a forceUpdate function to force re-renders
//   const [, updateState] = useState<object>();
//   const forceUpdate = useCallback(() => updateState({}), []);

//   // Get meme-related state and actions from useMemeContentStore
//   const memes = useMemeContentStore.use.memes();
//   const memeList = useMemeContentStore.use.memeList();
//   const likedMemes = useMemeContentStore.use.likedMemes();
//   const savedMemes = useMemeContentStore.use.savedMemes();
//   const selectedMeme = useMemeContentStore.use.selectedMeme(); // Add this line to get the selectedMeme
//   const toggleLike = useMemeContentStore.use.toggleLike();
//   const toggleSave = useMemeContentStore.use.toggleSave();
//   const fetchMemeById = useMemeContentStore.use.fetchMemeById();
//   const isLoading = useMemeContentStore.use.isLoading();
//   const joinPostSession = useMemeContentStore.use.joinPostSession();
//   const leavePostSession = useMemeContentStore.use.leavePostSession();

//   // Get user-related state and actions from useUserStore
//   const fetchUserProfile = useUserStore.use.fetchUserProfile();
//   const profilePictureUrl = useUserStore.use.profilePictureUrl();
//   const isLoggedInUserProfileLoaded = useUserStore.use.isLoggedInUserProfileLoaded();
//   const userLikedMemes = useUserStore.use.likedMemes();
//   const userSavedMemes = useUserStore.use.savedMemes();
//   const loggedInUserProfile = useUserStore.use.loggedInUserProfile();

//   // Get WebSocket client from the WebSocketStore
//   const { client: wsClient } = useWebSocketStore();

//   // Initialize WebSocketConnectionStore to ensure message handlers are set up
//   // const connectWebSocket = useWebSocketConnectionStore.use.connectWebSocket();

//   // // Initialize WebSocket connection when component mounts
//   // useEffect(() => {
//   //   connectWebSocket();
//   // }, [connectWebSocket]);

//   const user = JSON.parse(localStorage.getItem("user") || "{}");

//   // First check if we have a selectedMeme from the store (set by fetchMemeById)
//   // If not, try to find the meme in the other collections
//   const meme =
//     (selectedMeme && selectedMeme.id === id ? selectedMeme : null) ||
//     memes.find((m) => m.id === id) ||
//     memeList.find((m) => m.id === id) ||
//     likedMemes.find((m) => m.id === id) ||
//     savedMemes.find((m) => m.id === id);

//   {
//     meme?.comments?.map((comment) => (
//       <div key={comment.id}>{comment.text}</div>
//     ))
//   }

//   const isVideo = meme?.url?.match(/\.(mp4|webm|ogg)$/i);

//   // Check if the meme is liked by looking at both the store and user profile
//   const isLikedInStore = !!meme && likedMemes.some((m) => m.id === meme.id);
//   const isLikedInUserProfile = !!meme && !!loggedInUserProfile &&
//     userLikedMemes.some((m) => m.id === meme.id);
//   const isLiked = isLikedInStore || isLikedInUserProfile;

//   // Check if the meme is saved by looking at both the store and user profile
//   const isSavedInStore = !!meme && savedMemes.some((m) => m.id === meme.id);
//   const isSavedInUserProfile = !!meme && !!loggedInUserProfile &&
//     userSavedMemes.some((m) => m.id === meme.id);
//   const isSaved = isSavedInStore || isSavedInUserProfile;

//   // Log the like/save status for debugging and update local state
//   useEffect(() => {
//     if (meme && loggedInUserProfile) {
//       console.log(`Meme ${meme.id} like status:`, {
//         isLikedInStore,
//         isLikedInUserProfile,
//         isLiked
//       });
//       console.log(`Meme ${meme.id} save status:`, {
//         isSavedInStore,
//         isSavedInUserProfile,
//         isSaved
//       });

//       // Update local state to match the global state
//       setLocalIsLiked(isLiked);
//       setLocalIsSaved(isSaved);
//     }
//   }, [meme, isLikedInStore, isLikedInUserProfile, isSavedInStore, isSavedInUserProfile, loggedInUserProfile, isLiked, isSaved]);

//   const commentCount = meme?.comments?.length || 0;

//   // Use a ref to track if we've already joined the session
//   const sessionJoinedRef = useRef(false);

//   useEffect(() => {
//     // Reset the session joined flag when the ID changes
//     sessionJoinedRef.current = false;

//     const initializePage = async () => {
//       if (id) {
//         // Only join the session if we haven't already
//         if (!sessionJoinedRef.current) {
//           console.log("MemeDetailPage: Joining post session for first time:", id);
//           joinPostSession(id);
//           sessionJoinedRef.current = true;
//         }

//         // Clear any previous loading state
//         console.log("MemeDetailPage: Fetching meme with ID:", id);
//         const fetchedMeme = await fetchMemeById(id);

//         if (!fetchedMeme) {
//           console.error("MemeDetailPage: Failed to fetch meme with ID:", id);
//         }

//         // Only fetch user profile if it's not already loaded in the global state
//         if (user.userId && !isLoggedInUserProfileLoaded) {
//           console.log("MemeDetailPage: Fetching user profile from API");
//           await fetchUserProfile(user.username);
//         } else if (user.userId && isLoggedInUserProfileLoaded) {
//           console.log("MemeDetailPage: Using cached user profile from global state");
//         }
//       }
//     };
//     initializePage();

//     // Handle WebSocket reconnection
//     const handleWebSocketReconnect = () => {
//       if (id && sessionJoinedRef.current) {
//         console.log("MemeDetailPage: WebSocket reconnected, rejoining post session for meme:", id);
//         joinPostSession(id);

//         // Refresh the meme data to ensure we have the latest comments
//         console.log("MemeDetailPage: Refreshing meme data after WebSocket reconnection");
//         fetchMemeById(id).then(refreshedMeme => {
//           if (refreshedMeme) {
//             console.log("MemeDetailPage: Successfully refreshed meme data after reconnection");
//           }
//         });
//       }
//     };

//     // Listen for the websocket-reconnected event
//     window.addEventListener('websocket-reconnected', handleWebSocketReconnect);

//     return () => {
//       if (id && sessionJoinedRef.current) {
//         console.log("MemeDetailPage: Leaving post session on unmount:", id);
//         leavePostSession(id);
//         sessionJoinedRef.current = false;
//       }
//       // Clean up event listener
//       window.removeEventListener('websocket-reconnected', handleWebSocketReconnect);
//     };
//   }, [id, fetchMemeById, fetchUserProfile, user.userId, joinPostSession, leavePostSession, isLoggedInUserProfileLoaded]);

//   useEffect(() => {
//     if (videoRef.current && isVideo) {
//       videoRef.current.loop = true;
//       if (isPlaying) {
//         videoRef.current.play().catch(() => setIsPlaying(true));
//       }
//     }
//   }, [isPlaying, isVideo, meme?.url]);

//   useEffect(() => {
//     if (isCommentModalOpen) {
//       document.body.style.overflow = "hidden";
//     } else {
//       document.body.style.overflow = "auto";
//     }
//     return () => {
//       document.body.style.overflow = "auto";
//     };
//   }, [isCommentModalOpen]);

//   // Subscribe to store changes instead of handling WebSocket messages directly
//   useEffect(() => {
//     if (!id || !meme) return;

//     // Set up subscriptions to the stores to react to changes
//     const memeContentUnsubscribe = useMemeContentStore.subscribe((state) => {
//       // Check if the current meme's like/save status has changed
//       const isLikedInStore = state.likedMemes.some(m => m.id === id);
//       const isSavedInStore = state.savedMemes.some(m => m.id === id);

//       // Update local state to match the store
//       if (isLikedInStore !== localIsLiked) {
//         console.log(`Updating local like state to match store: ${isLikedInStore}`);
//         setLocalIsLiked(isLikedInStore);
//       }

//       if (isSavedInStore !== localIsSaved) {
//         console.log(`Updating local save state to match store: ${isSavedInStore}`);
//         setLocalIsSaved(isSavedInStore);
//       }
//     });

//     // Subscribe to user store changes as well
//     const userStoreUnsubscribe = useUserStore.subscribe((state) => {
//       if (state.loggedInUserProfile) {
//         const isLikedInUserProfile = state.likedMemes.some(m => m.id === id);
//         const isSavedInUserProfile = state.savedMemes.some(m => m.id === id);

//         // Update local state if user profile state differs
//         if (isLikedInUserProfile !== localIsLiked) {
//           console.log(`Updating local like state to match user profile: ${isLikedInUserProfile}`);
//           setLocalIsLiked(isLikedInUserProfile);
//         }

//         if (isSavedInUserProfile !== localIsSaved) {
//           console.log(`Updating local save state to match user profile: ${isSavedInUserProfile}`);
//           setLocalIsSaved(isSavedInUserProfile);
//         }
//       }
//     });

//     // Clean up subscriptions when component unmounts or meme changes
//     return () => {
//       memeContentUnsubscribe();
//       userStoreUnsubscribe();
//     };
//   }, [id, meme, localIsLiked, localIsSaved]);

//   // Show loading state if:
//   // 1. The store is in a loading state, OR
//   // 2. We have an ID but no meme data yet
//   if (isLoading || (id && !meme)) {
//     return (
//       <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 dark:border-purple-400 mb-4"></div>
//         <p className="text-gray-600 dark:text-gray-300">Loading meme...</p>
//       </div>
//     );
//   }

//   // Handle case where meme wasn't found
//   if (!meme) {
//     return (
//       <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
//         <p className="text-xl text-gray-700 dark:text-gray-300 mb-4">Meme not found</p>
//         <button
//           onClick={handleBack}
//           className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
//         >
//           Go Back
//         </button>
//       </div>
//     );
//   }

//   const handleDownload = async () => {
//     try {
//       if (!meme.url) {
//         toast.error("Cannot download: Media URL is missing");
//         return;
//       }

//       const response = await fetch(meme.url);
//       const blob = await response.blob();
//       const url = window.URL.createObjectURL(blob);
//       const a = document.createElement("a");
//       a.href = url;
//       a.download = `${meme.title}${isVideo ? ".mp4" : ".jpg"}`;
//       document.body.appendChild(a);
//       a.click();
//       document.body.removeChild(a);
//       window.URL.revokeObjectURL(url);
//     } catch (error) {
//       console.error("Error downloading meme:", error);
//       toast.error("Failed to download media. Please try again.");
//     }
//   };

//   const handleShare = async () => {
//     try {
//       await navigator.clipboard.writeText(window.location.href);
//       toast.success("Link copied to clipboard!");
//     } catch {
//       toast.error("Failed to copy link. Please try again.");
//     }
//   };

//   const handleSubmitComment = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (comment.trim() && id) {
//       if (!wsClient) {
//         console.log("WebSocket client not available, attempting to reconnect...");
//         // Try to restore the connection
//         useWebSocketStore.getState().restoreConnection();

//         // Check if reconnection was successful
//         setTimeout(() => {
//           const newWsClient = useWebSocketStore.getState().client;
//           if (!newWsClient || newWsClient.readyState !== WebSocket.OPEN) {
//             toast.error("Cannot add comment: WebSocket connection not established");
//             return;
//           } else {
//             // Connection restored, proceed with sending the comment
//             sendComment();
//           }
//         }, 1000);
//         return;
//       }

//       // Send the comment if WebSocket is connected
//       sendComment();
//     }
//   };

//   // Helper function to send the comment
//   const sendComment = () => {
//     if (!id || !comment.trim()) return;

//     // Send comment directly through WebSocket instead of HTTP
//     const success = useWebSocketStore.getState().sendCommentRequest(
//       id,
//       comment.trim(),
//       profilePictureUrl || ""
//     );

//     if (success) {
//       // Clear the comment input field
//       setComment("");

//       // Close the comment modal on mobile
//       if (window.innerWidth < 1024) {
//         setIsCommentModalOpen(false);
//       }

//       // Show success message
//       toast.success("Comment sent successfully");

//       // Optimistically add the comment to the UI
//       // This will be replaced by the actual comment from the server when it arrives
//       const user = JSON.parse(localStorage.getItem("user") || "{}");
//       const optimisticComment: Comment = {
//         id: `temp-${Date.now()}`,
//         memeId: id,
//         userId: user.userId,
//         username: user.username,
//         text: comment.trim(),
//         createdAt: new Date().toISOString(),
//         profilePictureUrl: profilePictureUrl || "",
//       };

//       // Add the optimistic comment to the store
//       useMemeContentStore.getState().forceAddComment(optimisticComment);
//     } else {
//       toast.error("Failed to send comment. Please try again.");
//     }
//   };

//   const handleLike = async () => {
//     if (user.username && meme.id) {
//       // Log the current state before toggling
//       const currentlyLiked = isLiked;
//       console.log(`Handling like for meme ${meme.id}, currently liked: ${currentlyLiked}`);

//       // Immediately update local state for responsive UI - toggle based on the global state
//       setLocalIsLiked(!currentlyLiked);

//       // First update the UI state through the store
//       await toggleLike(meme.id, user.username);

//       // Get the updated like status after toggling
//       const updatedIsLiked = useMemeContentStore.getState().likedMemes.some(m => m.id === meme.id);
//       console.log(`After toggle, meme ${meme.id} liked status: ${updatedIsLiked}`);

//       // Also update the UserStore to keep the two stores in sync
//       if (loggedInUserProfile) {
//         const userStore = useUserStore.getState();

//         // If the meme is now liked, add it to the user's liked memes if not already there
//         if (updatedIsLiked) {
//           if (!userStore.likedMemes.some(m => m.id === meme.id)) {
//             userStore.likedMemes.push(meme);
//             console.log(`Added meme ${meme.id} to UserStore likedMemes`);
//           }
//         }
//         // If the meme is now unliked, remove it from the user's liked memes
//         else {
//           userStore.likedMemes = userStore.likedMemes.filter(m => m.id !== meme.id);
//           console.log(`Removed meme ${meme.id} from UserStore likedMemes`);
//         }
//       }

//       // Then send the WebSocket message directly with the correct action based on the updated state
//       if (wsClient) {
//         // The action should be the opposite of the current state since we're toggling
//         const action = currentlyLiked ? 'UNLIKE' : 'LIKE';
//         console.log(`Sending WebSocket message with action: ${action}`);

//         useWebSocketStore.getState().sendMessage({
//           type: 'LIKE',
//           memeId: meme.id,
//           action: action,
//           username: user.username,
//           userId: user.userId
//         });
//       }

//       // Force a re-render to update the UI
//       forceUpdate();
//     }
//   };

//   const handleSave = async () => {
//     if (user.username && meme.id) {
//       // Log the current state before toggling
//       const currentlySaved = isSaved;
//       console.log(`Handling save for meme ${meme.id}, currently saved: ${currentlySaved}`);

//       // Immediately update local state for responsive UI - toggle based on the global state
//       setLocalIsSaved(!currentlySaved);

//       // First update the UI state through the store
//       await toggleSave(meme.id, user.username);

//       // Get the updated save status after toggling
//       const updatedIsSaved = useMemeContentStore.getState().savedMemes.some(m => m.id === meme.id);
//       console.log(`After toggle, meme ${meme.id} saved status: ${updatedIsSaved}`);

//       // Also update the UserStore to keep the two stores in sync
//       if (loggedInUserProfile) {
//         const userStore = useUserStore.getState();

//         // If the meme is now saved, add it to the user's saved memes if not already there
//         // if (updatedIsSaved) {
//         //   if (!userStore.savedMemes.some(m => m.id === meme.id)) {
//         //     userStore.savedMemes.push(meme);
//         //     console.log(`Added meme ${meme.id} to UserStore savedMemes`);
//         //   }
//         // } 
//         // // If the meme is now unsaved, remove it from the user's saved memes
//         // else {
//         //   userStore.savedMemes = userStore.savedMemes.filter(m => m.id !== meme.id);
//         //   console.log(`Removed meme ${meme.id} from UserStore savedMemes`);
//         // }

//         if (updatedIsSaved) {
//           if (!userStore.savedMemes.some(m => m.id === meme.id)) {
//             useUserStore.setState((state) => ({
//               savedMemes: [...state.savedMemes, meme]
//             }));
//             console.log(`Added meme ${meme.id} to UserStore savedMemes`);
//           }
//         } else {
//           useUserStore.setState((state) => ({
//             savedMemes: state.savedMemes.filter(m => m.id !== meme.id)
//           }));
//           console.log(`Removed meme ${meme.id} from UserStore savedMemes`);
//         }
//       }

//       // Then send the WebSocket message directly with the correct action based on the updated state
//       if (wsClient) {
//         // The action should be the opposite of the current state since we're toggling
//         const action = currentlySaved ? 'UNSAVE' : 'SAVE';
//         console.log(`Sending WebSocket message with action: ${action}`);

//         useWebSocketStore.getState().sendMessage({
//           type: 'SAVE',
//           memeId: meme.id,
//           action: action,
//           username: user.username,
//           userId: user.userId
//         });
//       }

//       // Force a re-render to update the UI
//       forceUpdate();
//     }
//   };

//   const handleBack = () => navigate(-1);

//   const togglePlay = () => {
//     if (videoRef.current) {
//       if (isPlaying) {
//         videoRef.current.pause();
//       } else {
//         videoRef.current.play();
//       }
//       setIsPlaying(!isPlaying);
//     }
//   };

//   const toggleMute = () => {
//     if (videoRef.current) {
//       videoRef.current.muted = !isMuted;
//       setIsMuted(!isMuted);
//     }
//   };

//   const formatDate = (dateString: string | Date | undefined) => {
//     if (!dateString) return "";
//     const date = new Date(dateString);
//     return date.toLocaleString("en-US", {
//       year: "numeric",
//       month: "long",
//       day: "numeric",
//     });
//   };

//   const openCommentModal = () => setIsCommentModalOpen(true);
//   const closeCommentModal = () => setIsCommentModalOpen(false);

//   const navigateToProfile = (username: string) => {
//     navigate(`/profile/${username}`);

//     // Only fetch the profile if it's not the logged-in user's profile or if the logged-in user's profile is not loaded
//     const isOwnProfile = username === user.username;
//     if (!isOwnProfile || !isLoggedInUserProfileLoaded) {
//       fetchUserProfile(username);
//     }
//   };

//   const sortedComments = meme.comments
//     ? [...meme.comments].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
//     : [];

//   return (
//     <div className="min-h-screen bg-gradient-to-b from-purple-50 to-purple-100 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-gray-100">
//       {/* Navigation Bar */}
//       <nav className="sticky top-0 z-10 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md shadow-sm">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
//           <div className="flex items-center justify-between">
//             <button
//               onClick={handleBack}
//               className="flex items-center text-gray-600 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
//               aria-label="Go back"
//             >
//               <ArrowLeft className="w-5 h-5 mr-2" />
//               <span className="font-medium">Back</span>
//             </button>
//             <h1 className="text-lg font-semibold truncate max-w-[200px] sm:max-w-md">{meme.title}</h1>
//             <div className="w-5"></div>
//           </div>
//         </div>
//       </nav>

//       <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
//         <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
//           <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[calc(100vh-8rem)]">
//             {/* Media Section */}
//             <div className="relative bg-gray-900 flex items-center justify-center">
//               <div className="w-full h-full flex items-center justify-center p-4 lg:p-6">
//                 {isVideo ? (
//                   <div className="relative w-full h-full flex items-center justify-center group">
//                     <video
//                       ref={videoRef}
//                       src={meme.url}
//                       className="max-w-full max-h-[70vh] rounded-md"
//                       loop
//                       playsInline
//                       muted={isMuted}
//                     />
//                     <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-4 bg-black/50 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
//                       <button
//                         onClick={togglePlay}
//                         className="p-2 text-white hover:text-purple-400 transition-colors"
//                         aria-label={isPlaying ? "Pause" : "Play"}
//                       >
//                         {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
//                       </button>
//                       <button
//                         onClick={toggleMute}
//                         className="p-2 text-white hover:text-purple-400 transition-colors"
//                         aria-label={isMuted ? "Unmute" : "Mute"}
//                       >
//                         {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
//                       </button>
//                     </div>
//                   </div>
//                 ) : (
//                   <img
//                     src={meme.url || "/placeholder.svg"}
//                     alt={meme.title}
//                     className="max-w-full max-h-[70vh] object-contain rounded-md"
//                   />
//                 )}
//               </div>

//               {/* Mobile Action Buttons */}
//               <div className="lg:hidden absolute bottom-4 right-4 flex gap-2">
//                 <button
//                   onClick={handleSave}
//                   className={cn(
//                     "p-3 rounded-full transition-all duration-300 shadow-md",
//                     (isSaved || localIsSaved)
//                       ? "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
//                       : "bg-white/90 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
//                   )}
//                   aria-label={(isSaved || localIsSaved) ? "Unsave" : "Save"}
//                 >
//                   <Bookmark className={cn("w-5 h-5", (isSaved || localIsSaved) && "fill-current")} />
//                 </button>
//               </div>
//             </div>

//             {/* Content Section */}
//             <div className="flex flex-col h-full max-h-[80vh] p-4 sm:p-6">
//               {/* Header */}
//               <div className="mb-4 sm:mb-6">
//                 <div className="hidden lg:block mb-2">
//                   <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{meme.title}</h1>
//                 </div>
//                 <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-sm">
//                   <button
//                     onClick={() => navigateToProfile(meme.uploader)}
//                     className="flex items-center space-x-2 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
//                   >
//                     {meme.profilePictureUrl ? (
//                       <img
//                         src={meme.profilePictureUrl || "/placeholder.svg"}
//                         alt={meme.userId}
//                         className="w-8 h-8 rounded-full object-cover"
//                       />
//                     ) : (
//                       <div className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full p-2">
//                         <User className="w-4 h-4" />
//                       </div>
//                     )}
//                     <span>{meme.uploader}</span>
//                   </button>
//                   <span>{formatDate(meme.memeCreated)}</span>
//                 </div>
//               </div>

//               <div className="hidden lg:flex flex-wrap gap-3 mb-6">
//                 <button
//                   onClick={handleLike}
//                   className={cn(
//                     "flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300",
//                     (isLiked || localIsLiked)
//                       ? "bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400"
//                       : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600",
//                   )}
//                 >
//                   <Heart className={cn("w-5 h-5", (isLiked || localIsLiked) && "fill-current")} />
//                   <span>{(isLiked || localIsLiked) ? "Liked" : "Like"}</span>
//                   <span className="ml-1 text-sm">({meme.likeCount || 0})</span>
//                 </button>

//                 <button
//                   onClick={handleSave}
//                   className={cn(
//                     "flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300",
//                     (isSaved || localIsSaved)
//                       ? "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
//                       : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600",
//                   )}
//                 >
//                   <Bookmark className={cn("w-5 h-5", (isSaved || localIsSaved) && "fill-current")} />
//                   <span>{(isSaved || localIsSaved) ? "Saved" : "Save"}</span>
//                   <span className="ml-1 text-sm">({meme.saveCount || 0})</span>
//                 </button>

//                 <button
//                   onClick={handleDownload}
//                   className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300"
//                 >
//                   <Download className="w-5 h-5" />
//                   <span>Download</span>
//                 </button>

//                 <button
//                   onClick={handleShare}
//                   className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300"
//                 >
//                   <Share2 className="w-5 h-5" />
//                   <span>Share</span>
//                 </button>
//               </div>
//               <div className="flex lg:hidden justify-around mb-4 border-y dark:border-gray-700 py-3">
//                 <button
//                   onClick={handleLike}
//                   className="flex flex-col items-center justify-center px-2 py-1 text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
//                   aria-label={isLiked ? "Unlike" : "Like"}
//                 >
//                   <Heart className={cn("w-5 h-5 mb-1", (isLiked || localIsLiked) && "fill-current text-pink-600")} />
//                   <span className="text-xs">{meme.likeCount || 0}</span>
//                 </button>

//                 <button
//                   onClick={handleDownload}
//                   className="flex flex-col items-center justify-center px-2 py-1 text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
//                   aria-label="Download"
//                 >
//                   <Download className="w-5 h-5 mb-1" />
//                   <span className="text-xs">Download</span>
//                 </button>

//                 <button
//                   onClick={handleShare}
//                   className="flex flex-col items-center justify-center px-2 py-1 text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
//                   aria-label="Share"
//                 >
//                   <Share2 className="w-5 h-5 mb-1" />
//                   <span className="text-xs">Share</span>
//                 </button>

//                 <button
//                   onClick={openCommentModal}
//                   className="flex flex-col items-center justify-center px-2 py-1 text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
//                   aria-label="View comments"
//                 >
//                   <MessageCircle className="w-5 h-5 mb-1" />
//                   <span className="text-xs">{commentCount}</span>
//                 </button>
//               </div>

//               {/* Comments Section - Desktop */}
//               <div className="hidden lg:flex flex-1 flex-col overflow-hidden">
//                 <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 mb-4">
//                   <MessageCircle className="w-5 h-5" />
//                   <h3 className="font-semibold">Comments ({commentCount})</h3>
//                   {!wsClient && <span className="text-xs text-orange-500 dark:text-orange-400">(Offline)</span>}
//                 </div>

//                 {/* Comments List */}
//                 <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2 custom-scrollbar">
//                   {sortedComments.length > 0 ? (
//                     sortedComments.map((comment) => (
//                       <div
//                         key={`${comment.id}-${comment.createdAt}`}
//                         className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-700"
//                       >
//                         <div className="flex items-center justify-between mb-1">
//                           <button
//                             onClick={() => navigateToProfile(comment.username)}
//                             className="flex items-center space-x-2 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
//                           >
//                             {comment.profilePictureUrl ? (
//                               <img
//                                 src={comment.profilePictureUrl || "/placeholder.svg"}
//                                 alt={comment.userId}
//                                 className="w-8 h-8 rounded-full object-cover"
//                               />
//                             ) : (
//                               <div className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full p-2">
//                                 <User className="w-4 h-4" />
//                               </div>
//                             )}
//                             <span className="font-medium text-gray-900 dark:text-white">{comment.username}</span>
//                           </button>
//                           <span className="text-xs text-gray-500 dark:text-gray-400">
//                             {formatDate(comment.createdAt)}
//                           </span>
//                         </div>
//                         <p className="text-gray-700 dark:text-gray-300 break-words text-sm pl-10">{comment.text}</p>
//                       </div>
//                     ))
//                   ) : (
//                     <div className="text-center py-8">
//                       <MessageCircle className="w-8 h-8 text-gray-400 dark:text-gray-600 mx-auto mb-2" />
//                       <p className="text-gray-500 dark:text-gray-400">No comments yet. Be the first to comment!</p>
//                     </div>
//                   )}
//                 </div>

//                 {/* Comment Input */}
//                 <form onSubmit={handleSubmitComment} className="flex gap-2 mt-auto">
//                   <input
//                     type="text"
//                     value={comment}
//                     onChange={(e) => setComment(e.target.value)}
//                     placeholder="Add a comment..."
//                     className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:text-white"
//                   />
//                   <button
//                     type="submit"
//                     disabled={!comment.trim()}
//                     className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//                     aria-label="Send comment"
//                   >
//                     <Send className="w-5 h-5" />
//                   </button>
//                 </form>
//               </div>
//             </div>
//           </div>
//         </div>
//       </main>

//       {/* Mobile Comment Modal */}
//       {isCommentModalOpen && (
//         <div className="lg:hidden fixed inset-0 bg-black bg-opacity-70 z-50 flex flex-col justify-end">
//           <div
//             className="bg-white dark:bg-gray-800 rounded-t-xl max-h-[80vh] flex flex-col animate-slide-up"
//             onClick={(e) => e.stopPropagation()}
//           >
//             {/* Modal Header */}
//             <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
//               <h3 className="font-semibold text-lg">Comments ({commentCount})</h3>
//               <button
//                 onClick={closeCommentModal}
//                 className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
//                 aria-label="Close comments"
//               >
//                 <X className="w-5 h-5" />
//               </button>
//             </div>

//             {/* Comments List */}
//             <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
//               {sortedComments.length === 0 ? (
//                 <div className="text-center py-8">
//                   <MessageCircle className="w-8 h-8 text-gray-400 dark:text-gray-600 mx-auto mb-2" />
//                   <p className="text-gray-500 dark:text-gray-400">No comments yet. Be the first to comment!</p>
//                 </div>
//               ) : (
//                 <div className="space-y-4">
//                   {sortedComments.map((comment) => (
//                     <div
//                       key={`${comment.id}-${comment.createdAt}`}
//                       className="flex items-start space-x-3 pb-4 border-b dark:border-gray-700 last:border-0"
//                     >
//                       <button
//                         onClick={() => navigateToProfile(comment.username)}
//                         className="flex items-start space-x-3 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
//                       >
//                         {comment.profilePictureUrl ? (
//                           <img
//                             src={comment.profilePictureUrl || "/placeholder.svg"}
//                             alt={comment.username}
//                             className="w-8 h-8 rounded-full object-cover"
//                           />
//                         ) : (
//                           <div className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full p-2">
//                             <User className="w-4 h-4" />
//                           </div>
//                         )}
//                       </button>
//                       <div className="flex-1">
//                         <div className="flex items-baseline justify-between mb-1">
//                           <button
//                             onClick={() => navigateToProfile(comment.username)}
//                             className="font-medium text-gray-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
//                           >
//                             {comment.username}
//                           </button>
//                           <span className="text-xs text-gray-500 dark:text-gray-400">
//                             {formatDate(comment.createdAt)}
//                           </span>
//                         </div>
//                         <p className="text-gray-700 dark:text-gray-300 break-words">{comment.text}</p>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </div>

//             {/* Comment Input */}
//             <form onSubmit={handleSubmitComment} className="flex gap-2 p-4 border-t dark:border-gray-700">
//               <input
//                 type="text"
//                 value={comment}
//                 onChange={(e) => setComment(e.target.value)}
//                 placeholder="Add a comment..."
//                 className="flex-1 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:text-white"
//                 autoFocus
//               />
//               <button
//                 type="submit"
//                 disabled={!comment.trim()}
//                 className="p-3 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
//                 aria-label="Send comment"
//               >
//                 <Send className="w-5 h-5" />
//               </button>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default MemeDetailPage;


// "use client"

// import type React from "react"
// import { useCallback, useEffect, useRef, useState } from "react"
// import { useParams, useNavigate } from "react-router-dom"
// import { useMemeContentStore } from "../store/useMemeContentStore"
// import { useUserStore } from "../store/useUserStore"
// import useWebSocketStore from "../hooks/useWebSockets"
// import {
//   Heart,
//   Download,
//   Share2,
//   MessageCircle,
//   ArrowLeft,
//   User,
//   X,
//   Play,
//   Pause,
//   Volume2,
//   VolumeX,
//   MoreHorizontal,
//   Bookmark,
//   Eye,
//   Send,
// } from "lucide-react"
// import { cn } from "../hooks/utils"
// import toast from "react-hot-toast"
// import type { Comment, Meme } from "../types/mems"

// const MemeDetailPage: React.FC = () => {
//   const { id } = useParams<{ id: string }>()
//   const navigate = useNavigate()
//   const videoRef = useRef<HTMLVideoElement>(null)
//   const [isPlaying, setIsPlaying] = useState(true)
//   const [isMuted, setIsMuted] = useState(false)
//   const [comment, setComment] = useState("")
//   const [isCommentModalOpen, setIsCommentModalOpen] = useState(false)
//   const [localIsLiked, setLocalIsLiked] = useState(false)
//   const [localIsSaved, setLocalIsSaved] = useState(false)
//   const [moreMemes, setMoreMemes] = useState<Meme[]>([])
//   const [isLoadingMoreMemes, setIsLoadingMoreMemes] = useState(false)
//   const [hasMoreMemes, setHasMoreMemes] = useState(true)
//   const [currentPage, setCurrentPage] = useState(1)

//   // Comment pagination state
//   const [comments, setComments] = useState<Comment[]>([])
//   const [commentsPage, setCommentsPage] = useState(1)
//   const [isLoadingMoreComments, setIsLoadingMoreComments] = useState(false)
//   const [hasMoreComments, setHasMoreComments] = useState(true)
//   const commentsPerPage = 10
//   const commentsEndRef = useRef<HTMLDivElement>(null)

//   // Get meme-related state and actions from useMemeContentStore
//   const memes = useMemeContentStore.use.memes()
//   const memeList = useMemeContentStore.use.memeList()
//   const likedMemes = useMemeContentStore.use.likedMemes()
//   const savedMemes = useMemeContentStore.use.savedMemes()
//   const selectedMeme = useMemeContentStore.use.selectedMeme()
//   const toggleLike = useMemeContentStore.use.toggleLike()
//   const toggleSave = useMemeContentStore.use.toggleSave()
//   const fetchMemeById = useMemeContentStore.use.fetchMemeById()
//   const fetchMemeComments = useMemeContentStore.use.fetchMemeComments()
//   const isLoading = useMemeContentStore.use.isLoading()
//   const joinPostSession = useMemeContentStore.use.joinPostSession()
//   const leavePostSession = useMemeContentStore.use.leavePostSession()

//   // Get user-related state and actions from useUserStore
//   const fetchUserProfile = useUserStore.use.fetchUserProfile()
//   const profilePictureUrl = useUserStore.use.profilePictureUrl()
//   const isLoggedInUserProfileLoaded = useUserStore.use.isLoggedInUserProfileLoaded()
//   const userLikedMemes = useUserStore.use.likedMemes()
//   const userSavedMemes = useUserStore.use.savedMemes()
//   const loggedInUserProfile = useUserStore.use.loggedInUserProfile()

//   // Get WebSocket client from the WebSocketStore
//   const { client: wsClient } = useWebSocketStore()
//   const user = JSON.parse(localStorage.getItem("user") || "{}")

//   // First check if we have a selectedMeme from the store (set by fetchMemeById)
//   // If not, try to find the meme in the other collections
//   const meme =
//     (selectedMeme && selectedMeme.id === id ? selectedMeme : null) ||
//     memes.find((m) => m.id === id) ||
//     memeList.find((m) => m.id === id) ||
//     likedMemes.find((m) => m.id === id) ||
//     savedMemes.find((m) => m.id === id)

//   const isVideo = meme?.url?.match(/\.(mp4|webm|ogg)$/i)

//   // Check if the meme is liked by looking at both the store and user profile
//   const isLikedInStore = !!meme && likedMemes.some((m) => m.id === meme.id)
//   const isLikedInUserProfile = !!meme && !!loggedInUserProfile && userLikedMemes.some((m) => m.id === meme.id)
//   const isLiked = isLikedInStore || isLikedInUserProfile

//   // Check if the meme is saved by looking at both the store and user profile
//   const isSavedInStore = !!meme && savedMemes.some((m) => m.id === meme.id)
//   const isSavedInUserProfile = !!meme && !!loggedInUserProfile && userSavedMemes.some((m) => m.id === meme.id)
//   const isSaved = isSavedInStore || isSavedInUserProfile

//   // Get related memes (excluding current meme)
//   const getRelatedMemes = () => {
//     const allMemes = [...memes, ...memeList]
//     const relatedMemes = allMemes.filter((m) => m.id !== id).slice(0, 30)
//     return relatedMemes
//   }

//   const relatedMemes = getRelatedMemes()

//   const fetchMoreMemes = async (page = 1) => {
//     if (isLoadingMoreMemes) return

//     setIsLoadingMoreMemes(true)

//     try {
//       // Replace with your actual API endpoint
//       const response = await fetch(`/memes?page=${page}&limit=20&exclude=${id}`)
//       const data = await response.json()

//       if (data.success && data.memes) {
//         if (page === 1) {
//           setMoreMemes(data.memes)
//         } else {
//           setMoreMemes((prev) => [...prev, ...data.memes])
//         }

//         setHasMoreMemes(data.hasMore || data.memes.length === 20)
//         setCurrentPage(page)
//       }
//     } catch (error) {
//       console.error("Error fetching more memes:", error)
//       toast.error("Failed to load more memes")
//     } finally {
//       setIsLoadingMoreMemes(false)
//     }
//   }

//   // Log the like/save status for debugging and update local state
//   useEffect(() => {
//     if (meme && loggedInUserProfile) {
//       console.log(`Meme ${meme.id} like status:`, {
//         isLikedInStore,
//         isLikedInUserProfile,
//         isLiked,
//       })

//       console.log(`Meme ${meme.id} save status:`, {
//         isSavedInStore,
//         isSavedInUserProfile,
//         isSaved,
//       })

//       // Update local state to match the global state
//       setLocalIsLiked(isLiked)
//       setLocalIsSaved(isSaved)
//     }
//   }, [
//     meme,
//     isLikedInStore,
//     isLikedInUserProfile,
//     isSavedInStore,
//     isSavedInUserProfile,
//     loggedInUserProfile,
//     isLiked,
//     isSaved,
//   ])

//   // Fetch more memes when component mounts
//   useEffect(() => {
//     if (id) {
//       fetchMoreMemes(1)
//     }
//   }, [id])

//   const commentCount = meme?.commentsCount || comments.length || 0

//   // Use a ref to track if we've already joined the session
//   const sessionJoinedRef = useRef(false)

//   const handleBack = () => navigate(-1)

//   useEffect(() => {
//     // Reset the session joined flag when the ID changes
//     sessionJoinedRef.current = false

//     const initializePage = async () => {
//       if (id) {
//         // Only join the session if we haven't already
//         if (!sessionJoinedRef.current) {
//           console.log("MemeDetailPage: Joining post session for first time:", id)
//           joinPostSession(id)
//           sessionJoinedRef.current = true
//         }

//         // Clear any previous loading state
//         console.log("MemeDetailPage: Fetching meme with ID:", id)

//         // Reset comments pagination state
//         setCommentsPage(1)
//         setHasMoreComments(true)
//         setComments([])

//         // Fetch the meme details
//         const fetchedMeme = await fetchMemeById(id)

//         // Fetch initial comments using the new API method
//         try {
//           const initialResult = await fetchMemeComments(id, 1, commentsPerPage)
//           setComments(initialResult.comments)
//           setCommentsPage(initialResult.currentPage)
//           setHasMoreComments(initialResult.currentPage < (initialResult.totalPages ?? 1))
//         } catch (error) {
//           console.error("Error fetching initial comments:", error)
//         }

//         if (!fetchedMeme) {
//           console.error("MemeDetailPage: Failed to fetch meme with ID:", id)
//         }

//         // Only fetch user profile if it's not already loaded in the global state
//         if (user.userId && !isLoggedInUserProfileLoaded) {
//           console.log("MemeDetailPage: Fetching user profile from API")
//           await fetchUserProfile(user.username)
//         } else if (user.userId && isLoggedInUserProfileLoaded) {
//           console.log("MemeDetailPage: Using cached user profile from global state")
//         }
//       }
//     }

//     initializePage()

//     // Handle WebSocket reconnection
//     const handleWebSocketReconnect = () => {
//       if (id && sessionJoinedRef.current) {
//         console.log("MemeDetailPage: WebSocket reconnected, rejoining post session for meme:", id)
//         joinPostSession(id)

//         // Refresh the meme data to ensure we have the latest comments
//         console.log("MemeDetailPage: Refreshing meme data after WebSocket reconnection")
//         fetchMemeById(id).then((refreshedMeme) => {
//           if (refreshedMeme) {
//             console.log("MemeDetailPage: Successfully refreshed meme data after reconnection")
//           }
//         })
//       }
//     }

//     // Listen for the websocket-reconnected event
//     window.addEventListener("websocket-reconnected", handleWebSocketReconnect)

//     return () => {
//       if (id && sessionJoinedRef.current) {
//         console.log("MemeDetailPage: Leaving post session on unmount:", id)
//         leavePostSession(id)
//         sessionJoinedRef.current = false
//       }

//       // Clean up event listener
//       window.removeEventListener("websocket-reconnected", handleWebSocketReconnect)
//     }
//   }, [id, fetchMemeById, fetchMemeComments, fetchUserProfile, user.userId, joinPostSession, leavePostSession, isLoggedInUserProfileLoaded, user.username])

//   // Function to load more comments with updated API integration
//   const loadMoreComments = useCallback(async () => {
//     if (!id || isLoadingMoreComments || !hasMoreComments) {
//       console.log("loadMoreComments blocked:", { id, isLoadingMoreComments, hasMoreComments })
//       return
//     }

//     console.log("Loading more comments, current page:", commentsPage)

//     try {
//       setIsLoadingMoreComments(true)
//       const nextPage = commentsPage + 1

//       // Fetch more comments using the provided API method
//       const result = await fetchMemeComments(id, nextPage, commentsPerPage)

//       console.log("Fetched comments result:", result)

//       if (result && result.comments && Array.isArray(result.comments)) {
//         // Append new comments to existing comments
//         setComments((prevComments) => {
//           const newComments = [...prevComments, ...result.comments]
//           console.log("Updated comments count:", newComments.length)
//           return newComments
//         })

//         // Update pagination state
//         setCommentsPage(nextPage)

//         // Check if there are more comments based on the response
//         const hasMore =
//           result.comments.length === commentsPerPage && (result.totalPages ? nextPage < result.totalPages : true)

//         setHasMoreComments(hasMore)
//         console.log("Has more comments:", hasMore)
//       } else {
//         console.log("No more comments available")
//         setHasMoreComments(false)
//       }
//     } catch (error) {
//       console.error("Error loading more comments:", error)
//       toast.error("Failed to load more comments")
//       setHasMoreComments(false)
//     } finally {
//       setIsLoadingMoreComments(false)
//     }
//   }, [id, isLoadingMoreComments, hasMoreComments, commentsPage, commentsPerPage, fetchMemeComments])

//   // Set up intersection observer for infinite scrolling of comments - unified for both desktop and mobile
//   useEffect(() => {
//     console.log("Setting up intersection observer:", {
//       hasRef: !!commentsEndRef.current,
//       hasMoreComments,
//       isLoadingMoreComments,
//       isCommentModalOpen,
//       commentsLength: comments.length,
//     })

//     if (!commentsEndRef.current || !hasMoreComments || isLoadingMoreComments) {
//       console.log("Observer setup blocked")
//       return
//     }

//     const observer = new IntersectionObserver(
//       (entries) => {
//         const entry = entries[0]
//         console.log("Intersection observer triggered:", {
//           isIntersecting: entry.isIntersecting,
//           intersectionRatio: entry.intersectionRatio,
//           isMobile: isCommentModalOpen,
//           target: entry.target.className,
//         })

//         if (entry.isIntersecting && entry.intersectionRatio > 0) {
//           console.log("Loading more comments via intersection observer")
//           loadMoreComments()
//         }
//       },
//       {
//         threshold: [0, 0.1, 0.5],
//         rootMargin: "50px",
//         root: null,
//       },
//     )

//     observer.observe(commentsEndRef.current)
//     console.log("Observer attached successfully")

//     return () => {
//       console.log("Cleaning up intersection observer")
//       observer.disconnect()
//     }
//   }, [hasMoreComments, isLoadingMoreComments, loadMoreComments, isCommentModalOpen, comments.length])

//   // Subscribe to store changes instead of handling WebSocket messages directly
//   useEffect(() => {
//     if (!id || !meme) return

//     // Set up subscriptions to the stores to react to changes
//     const memeContentUnsubscribe = useMemeContentStore.subscribe((state) => {
//       // Check if the current meme's like/save status has changed
//       const isLikedInStore = state.likedMemes.some((m) => m.id === id)
//       const isSavedInStore = state.savedMemes.some((m) => m.id === id)

//       // Update local state to match the store
//       if (isLikedInStore !== localIsLiked) {
//         console.log(`Updating local like state to match store: ${isLikedInStore}`)
//         setLocalIsLiked(isLikedInStore)
//       }

//       if (isSavedInStore !== localIsSaved) {
//         console.log(`Updating local save state to match store: ${isSavedInStore}`)
//         setLocalIsSaved(isSavedInStore)
//       }
//     })

//     // Subscribe to user store changes as well
//     const userStoreUnsubscribe = useUserStore.subscribe((state) => {
//       if (state.loggedInUserProfile) {
//         const isLikedInUserProfile = state.likedMemes.some((m) => m.id === id)
//         const isSavedInUserProfile = state.savedMemes.some((m) => m.id === id)

//         // Update local state if user profile state differs
//         if (isLikedInUserProfile !== localIsLiked) {
//           console.log(`Updating local like state to match user profile: ${isLikedInUserProfile}`)
//           setLocalIsLiked(isLikedInUserProfile)
//         }

//         if (isSavedInUserProfile !== localIsSaved) {
//           console.log(`Updating local save state to match user profile: ${isSavedInUserProfile}`)
//           setLocalIsSaved(isSavedInUserProfile)
//         }
//       }
//     })

//     // Clean up subscriptions when component unmounts or meme changes
//     return () => {
//       memeContentUnsubscribe()
//       userStoreUnsubscribe()
//     }
//   }, [id, meme, localIsLiked, localIsSaved])

//   // Subscribe to comments changes from the store for real-time updates
//   useEffect(() => {
//     if (!id || !meme) return

//     // Subscribe to meme content store changes to get real-time comment updates
//     const unsubscribe = useMemeContentStore.subscribe((state) => {
//       // Check if the selected meme has updated comments
//       const updatedMeme = state.selectedMeme
//       if (updatedMeme && updatedMeme.id === id && updatedMeme.comments) {
//         console.log("Real-time comment update received:", updatedMeme.comments.length)

//         // Only update if we have fewer comments locally than in the store
//         // This prevents overwriting paginated comments
//         if (updatedMeme.comments.length > comments.length) {
//           console.log("Updating comments with new real-time data")

//           // Merge new comments with existing ones, avoiding duplicates
//           setComments((prevComments) => {
//             const existingIds = new Set(prevComments.map((c) => c.id))
//             const newComments = updatedMeme.comments.filter((c) => !existingIds.has(c.id))

//             if (newComments.length > 0) {
//               console.log("Adding new comments:", newComments.length)
//               return [...newComments, ...prevComments]
//             }

//             return prevComments
//           })
//         }

//         // Update comment count if it has changed
//         if (updatedMeme.commentsCount !== commentCount) {
//           console.log("Comment count updated:", updatedMeme.commentsCount)
//         }
//       }
//     })

//     return () => {
//       unsubscribe()
//     }
//   }, [id, meme, comments.length, commentCount])

//   useEffect(() => {
//     if (videoRef.current && isVideo) {
//       videoRef.current.loop = true

//       if (isPlaying) {
//         videoRef.current.play().catch(() => setIsPlaying(true))
//       }
//     }
//   }, [isPlaying, isVideo, meme?.url])

//   useEffect(() => {
//     if (isCommentModalOpen) {
//       document.body.style.overflow = "hidden"
//     } else {
//       document.body.style.overflow = "auto"
//     }

//     return () => {
//       document.body.style.overflow = "auto"
//     }
//   }, [isCommentModalOpen])

//   const handleLoadMore = () => {
//     if (hasMoreMemes && !isLoadingMoreMemes) {
//       fetchMoreMemes(currentPage + 1)
//     }
//   }

//   // Show loading state
//   if (isLoading || (id && !meme)) {
//     return (
//       <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-gray-100">
//         <div className="relative">
//           <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-indigo-600"></div>
//           <div className="absolute inset-0 rounded-full h-12 w-12 border-4 border-transparent border-t-purple-400 animate-spin animation-delay-150"></div>
//         </div>
//         <p className="text-slate-600 text-sm mt-4 font-medium">Loading amazing content...</p>
//       </div>
//     )
//   }

//   // Handle case where meme wasn't found
//   if (!meme) {
//     return (
//       <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-gray-100">
//         <div className="text-center">
//           <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-pink-100 rounded-full flex items-center justify-center mb-4 mx-auto">
//             <Eye className="w-8 h-8 text-red-500" />
//           </div>
//           <p className="text-xl font-semibold text-slate-800 mb-2">Content not found</p>
//           <p className="text-slate-600 mb-6">This pin might have been removed or doesn't exist.</p>
//           <button
//             onClick={handleBack}
//             className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
//           >
//             Go Back
//           </button>
//         </div>
//       </div>
//     )
//   }

//   const handleDownload = async () => {
//     try {
//       if (!meme.url) {
//         toast.error("Cannot download: Media URL is missing")
//         return
//       }

//       const response = await fetch(meme.url)
//       const blob = await response.blob()
//       const url = window.URL.createObjectURL(blob)
//       const a = document.createElement("a")
//       a.href = url
//       a.download = `${meme.title}${isVideo ? ".mp4" : ".jpg"}`
//       document.body.appendChild(a)
//       a.click()
//       document.body.removeChild(a)
//       window.URL.revokeObjectURL(url)
//     } catch (error) {
//       console.error("Error downloading meme:", error)
//       toast.error("Failed to download media. Please try again.")
//     }
//   }

//   const handleShare = async () => {
//     try {
//       await navigator.clipboard.writeText(window.location.href)
//       toast.success("Link copied to clipboard!")
//     } catch {
//       toast.error("Failed to copy link. Please try again.")
//     }
//   }

//   const handleSubmitComment = async (e: React.FormEvent) => {
//     e.preventDefault()

//     if (comment.trim() && id) {
//       if (!wsClient) {
//         console.log("WebSocket client not available, attempting to reconnect...")
//         // Try to restore the connection
//         useWebSocketStore.getState().restoreConnection()

//         // Check if reconnection was successful
//         setTimeout(() => {
//           const newWsClient = useWebSocketStore.getState().client

//           if (!newWsClient || newWsClient.readyState !== WebSocket.OPEN) {
//             toast.error("Cannot add comment: WebSocket connection not established")
//             return
//           } else {
//             // Connection restored, proceed with sending the comment
//             sendComment()
//           }
//         }, 1000)

//         return
//       }

//       // Send the comment if WebSocket is connected
//       sendComment()
//     }
//   }

//   // Helper function to send the comment
//   const sendComment = () => {
//     if (!id || !comment.trim()) return

//     // Create optimistic comment
//     const user = JSON.parse(localStorage.getItem("user") || "{}")
//     const optimisticComment: Comment = {
//       id: `temp-${Date.now()}`,
//       memeId: id,
//       userId: user.userId,
//       username: user.username,
//       text: comment.trim(),
//       createdAt: new Date().toISOString(),
//       profilePictureUrl: profilePictureUrl || "",
//     }

//     // Add optimistic comment to local state immediately (at the beginning for newest first)
//     setComments((prevComments) => [optimisticComment, ...prevComments])

//     // Update the comment count locally
//     const updatedCommentCount = commentCount + 1

//     // Update the meme in the store with the new comment count
//     if (meme) {
//       useMemeContentStore.setState((state) => ({
//         selectedMeme: state.selectedMeme
//           ? {
//               ...state.selectedMeme,
//               commentsCount: updatedCommentCount,
//             }
//           : null,
//       }))
//     }

//     // Send comment directly through WebSocket instead of HTTP
//     const success = useWebSocketStore.getState().sendCommentRequest(id, comment.trim(), profilePictureUrl || "")

//     if (success) {
//       // Clear the comment input field
//       setComment("")

//       // Close the comment modal on mobile
//       if (window.innerWidth < 1024) {
//         setIsCommentModalOpen(false)
//       }

//       // Show success message
//       toast.success("Comment sent successfully")

//       // Also add to the store (this will be replaced by the real comment when it arrives)
//       useMemeContentStore.getState().forceAddComment(optimisticComment)
//     } else {
//       // Remove optimistic comment if sending failed
//       setComments((prevComments) => prevComments.filter((c) => c.id !== optimisticComment.id))
//       toast.error("Failed to send comment. Please try again.")
//     }
//   }

//   const handleLike = async () => {
//     if (user.username && meme.id) {
//       // Log the current state before toggling
//       const currentlyLiked = isLiked
//       console.log(`Handling like for meme ${meme.id}, currently liked: ${currentlyLiked}`)

//       // Immediately update local state for responsive UI - toggle based on the global state
//       setLocalIsLiked(!currentlyLiked)

//       // First update the UI state through the store
//       await toggleLike(meme.id, user.username)

//       // Get the updated like status after toggling
//       const updatedIsLiked = useMemeContentStore.getState().likedMemes.some((m) => m.id === meme.id)
//       console.log(`After toggle, meme ${meme.id} liked status: ${updatedIsLiked}`)

//       // Also update the UserStore to keep the two stores in sync
//       if (loggedInUserProfile) {
//         // If the meme is now liked, add it to the user's liked memes if not already there
//         if (updatedIsLiked) {
//           if (!useUserStore.getState().likedMemes.some((m) => m.id === meme.id)) {
//             useUserStore.setState((state) => ({
//               likedMemes: [...state.likedMemes, meme],
//             }))
//             console.log(`Added meme ${meme.id} to UserStore likedMemes`)
//           }
//         }
//         // If the meme is now unliked, remove it from the user's liked memes
//         else {
//           useUserStore.setState((state) => ({
//             likedMemes: state.likedMemes.filter((m) => m.id !== meme.id),
//           }))
//           console.log(`Removed meme ${meme.id} from UserStore likedMemes`)
//         }
//       }

//       // Then send the WebSocket message directly with the correct action based on the updated state
//       if (wsClient) {
//         // The action should be the opposite of the current state since we're toggling
//         const action = currentlyLiked ? "UNLIKE" : "LIKE"
//         console.log(`Sending WebSocket message with action: ${action}`)

//         useWebSocketStore.getState().sendMessage({
//           type: "LIKE",
//           memeId: meme.id,
//           action: action,
//           username: user.username,
//           userId: user.userId,
//         })
//       }
//     }
//   }

//   const handleSave = async () => {
//     if (user.username && meme.id) {
//       // Log the current state before toggling
//       const currentlySaved = isSaved
//       console.log(`Handling save for meme ${meme.id}, currently saved: ${currentlySaved}`)

//       // Immediately update local state for responsive UI - toggle based on the global state
//       setLocalIsSaved(!currentlySaved)

//       // First update the UI state through the store
//       await toggleSave(meme.id, user.username)

//       // Get the updated save status after toggling
//       const updatedIsSaved = useMemeContentStore.getState().savedMemes.some((m) => m.id === meme.id)
//       console.log(`After toggle, meme ${meme.id} saved status: ${updatedIsSaved}`)

//       // Also update the UserStore to keep the two stores in sync
//       if (loggedInUserProfile) {
//         if (updatedIsSaved) {
//           if (!useUserStore.getState().savedMemes.some((m) => m.id === meme.id)) {
//             useUserStore.setState((state) => ({
//               savedMemes: [...state.savedMemes, meme],
//             }))
//             console.log(`Added meme ${meme.id} to UserStore savedMemes`)
//           }
//         } else {
//           useUserStore.setState((state) => ({
//             savedMemes: state.savedMemes.filter((m) => m.id !== meme.id),
//           }))
//           console.log(`Removed meme ${meme.id} from UserStore savedMemes`)
//         }
//       }

//       // Then send the WebSocket message directly with the correct action based on the updated state
//       if (wsClient) {
//         // The action should be the opposite of the current state since we're toggling
//         const action = currentlySaved ? "UNSAVE" : "SAVE"
//         console.log(`Sending WebSocket message with action: ${action}`)

//         useWebSocketStore.getState().sendMessage({
//           type: "SAVE",
//           memeId: meme.id,
//           action: action,
//           username: user.username,
//           userId: user.userId,
//         })
//       }
//     }
//   }

//   const togglePlay = () => {
//     if (videoRef.current) {
//       if (isPlaying) {
//         videoRef.current.pause()
//       } else {
//         videoRef.current.play()
//       }

//       setIsPlaying(!isPlaying)
//     }
//   }

//   const toggleMute = () => {
//     if (videoRef.current) {
//       videoRef.current.muted = !isMuted
//       setIsMuted(!isMuted)
//     }
//   }

//   const formatDate = (dateString: string | Date | undefined) => {
//     if (!dateString) return ""

//     const date = new Date(dateString)
//     return date.toLocaleDateString("en-US", {
//       month: "short",
//       day: "numeric",
//     })
//   }

//   const openCommentModal = () => setIsCommentModalOpen(true)
//   const closeCommentModal = () => setIsCommentModalOpen(false)

//   const navigateToProfile = (username: string) => {
//     navigate(`/profile/${username}`)

//     if (username !== user.username || !isLoggedInUserProfileLoaded) {
//       fetchUserProfile(username)
//     }
//   }

//   const navigateToMeme = (memeId: string) => {
//     navigate(`/meme/${memeId}`)
//   }

//   // Sort comments by date (newest first)
//   const sortedComments = [...comments].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-100">
//       {/* Modern Glass Navigation */}
//       <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-sm">
//         <div className="max-w-full mx-auto px-4 py-3">
//           <div className="flex items-center justify-between">
//             <button
//               onClick={handleBack}
//               className="flex items-center text-slate-700 hover:text-slate-900 transition-all duration-200 p-2.5 rounded-xl hover:bg-white/60 backdrop-blur-sm group"
//               aria-label="Go back"
//             >
//               <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform duration-200" />
//             </button>

//             <div className="flex items-center space-x-2">
//               <button
//                 onClick={handleShare}
//                 className="p-2.5 rounded-xl hover:bg-white/60 backdrop-blur-sm text-slate-700 hover:text-indigo-600 transition-all duration-200 group"
//               >
//                 <Share2 className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
//               </button>

//               <button className="p-2.5 rounded-xl hover:bg-white/60 backdrop-blur-sm text-slate-700 hover:text-slate-900 transition-all duration-200 group">
//                 <MoreHorizontal className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
//               </button>
//             </div>
//           </div>
//         </div>
//       </nav>

//       <main className="max-w-full mx-auto px-3 py-4">
//         {/* Premium Pin Detail Layout */}
//         <div className="max-w-7xl mx-auto">
//           <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 overflow-hidden">
//             <div className="grid grid-cols-1 lg:grid-cols-3">
//               {/* Enhanced Media Section */}
//               <div className="lg:col-span-2 relative bg-gradient-to-br from-slate-100 to-gray-200 flex items-center justify-center min-h-[50vh] lg:min-h-[85vh]">
//                 <div className="w-full h-full flex items-center justify-center p-4">
//                   {isVideo ? (
//                     <div className="relative w-full h-full flex items-center justify-center group">
//                       <video
//                         ref={videoRef}
//                         src={meme.url}
//                         className="max-w-full max-h-full rounded-xl shadow-2xl border border-white/30"
//                         loop
//                         playsInline
//                         muted={isMuted}
//                       />

//                       <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-3 bg-black/70 backdrop-blur-sm rounded-full p-3 opacity-0 group-hover:opacity-100 transition-all duration-300 border border-white/20">
//                         <button
//                           onClick={togglePlay}
//                           className="p-2 text-white hover:text-blue-300 transition-colors duration-200 rounded-full hover:bg-white/10"
//                         >
//                           {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
//                         </button>

//                         <button
//                           onClick={toggleMute}
//                           className="p-2 text-white hover:text-blue-300 transition-colors duration-200 rounded-full hover:bg-white/10"
//                         >
//                           {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
//                         </button>
//                       </div>
//                     </div>
//                   ) : (
//                     <img
//                       src={meme.url || "/placeholder.svg"}
//                       alt={meme.title}
//                       className="max-w-full max-h-full object-contain rounded-xl shadow-2xl border border-white/30"
//                     />
//                   )}
//                 </div>
//               </div>

//               {/* Premium Content Section */}
//               <div className="p-6 flex flex-col h-full bg-gradient-to-b from-white/50 to-slate-50/50 backdrop-blur-sm">
//                 {/* Premium Actions */}
//                 <div className="flex items-center justify-between mb-6">
//                   <div className="flex items-center space-x-3">
//                     <button
//                       onClick={handleSave}
//                       className={cn(
//                         "px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5",
//                         isSaved || localIsSaved
//                           ? "bg-gradient-to-r from-slate-700 to-slate-800 text-white"
//                           : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700",
//                       )}
//                     >
//                       <div className="flex items-center space-x-2">
//                         <Bookmark className={cn("w-4 h-4", (isSaved || localIsSaved) && "fill-current")} />
//                         <span>{isSaved || localIsSaved ? "Saved" : "Save"}</span>
//                       </div>
//                     </button>

//                     <button
//                       onClick={handleDownload}
//                       className="p-2.5 rounded-xl hover:bg-white/60 backdrop-blur-sm text-slate-700 hover:text-indigo-600 transition-all duration-200 shadow-md hover:shadow-lg group"
//                     >
//                       <Download className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
//                     </button>
//                   </div>

//                   <button
//                     onClick={handleLike}
//                     className={cn(
//                       "p-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg group",
//                       isLiked || localIsLiked
//                         ? "text-red-500 bg-red-50/80 backdrop-blur-sm hover:bg-red-100/80"
//                         : "text-slate-700 hover:bg-white/60 backdrop-blur-sm hover:text-red-500",
//                     )}
//                   >
//                     <Heart
//                       className={cn(
//                         "w-6 h-6 group-hover:scale-110 transition-transform duration-200",
//                         (isLiked || localIsLiked) && "fill-current",
//                       )}
//                     />
//                   </button>
//                 </div>

//                 {/* Premium Title */}
//                 <div className="mb-6">
//                   <h1 className="text-2xl font-bold text-slate-800 leading-tight bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text">
//                     {meme.title}
//                   </h1>
//                 </div>

//                 {/* Premium User Info */}
//                 <div className="mb-6">
//                   <button
//                     onClick={() => navigateToProfile(meme.uploader)}
//                     className="flex items-center space-x-3 hover:bg-white/40 backdrop-blur-sm rounded-xl p-3 -m-3 transition-all duration-200 group w-full"
//                   >
//                     {meme.profilePictureUrl ? (
//                       <img
//                         src={meme.profilePictureUrl || "/placeholder.svg"}
//                         alt={meme.uploader}
//                         className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-md group-hover:ring-indigo-200 transition-all duration-200"
//                       />
//                     ) : (
//                       <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-600 rounded-full flex items-center justify-center ring-2 ring-white shadow-md group-hover:ring-indigo-200 transition-all duration-200">
//                         <User className="w-5 h-5" />
//                       </div>
//                     )}

//                     <div className="text-left">
//                       <p className="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors duration-200">
//                         {meme.uploader}
//                       </p>
//                       <p className="text-slate-500 text-sm">{formatDate(meme.memeCreated)}</p>
//                     </div>
//                   </button>
//                 </div>

//                 {/* Premium Stats */}
//                 <div className="mb-6">
//                   <div className="bg-white/40 backdrop-blur-sm rounded-xl p-4 border border-white/30">
//                     <div className="flex items-center justify-around text-sm">
//                       <div className="text-center">
//                         <p className="font-bold text-lg text-red-600">{meme.likeCount || 0}</p>
//                         <p className="text-slate-600 text-xs font-medium">likes</p>
//                       </div>

//                       <div className="w-px h-8 bg-slate-200"></div>

//                       <div className="text-center">
//                         <p className="font-bold text-lg text-blue-600">{commentCount}</p>
//                         <p className="text-slate-600 text-xs font-medium">comments</p>
//                       </div>

//                       <div className="w-px h-8 bg-slate-200"></div>

//                       <div className="text-center">
//                         <p className="font-bold text-lg text-purple-600">{meme.saveCount || 0}</p>
//                         <p className="text-slate-600 text-xs font-medium">saves</p>
//                       </div>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Premium Comments Section */}
//                 <div className="flex-1 flex flex-col min-h-0">
//                   <div className="flex items-center justify-between mb-4">
//                     <div className="flex items-center space-x-2">
//                       <h3 className="text-lg font-semibold text-slate-800">Comments</h3>
//                       {!wsClient && <span className="text-xs text-orange-500">(Offline)</span>}
//                     </div>

//                     <button
//                       onClick={openCommentModal}
//                       className="lg:hidden text-slate-600 hover:text-indigo-600 transition-colors duration-200 p-2 rounded-xl hover:bg-white/40 backdrop-blur-sm"
//                     >
//                       <MessageCircle className="w-5 h-5" />
//                     </button>
//                   </div>

//                   {/* Premium Comments List - Desktop */}
//                   <div
//                     className="hidden lg:block flex-1 overflow-y-auto mb-4 comments-scroll-container"
//                     style={{ maxHeight: "calc(100vh - 600px)" }}
//                   >
//                     {sortedComments.length > 0 ? (
//                       <div className="space-y-3">
//                         {sortedComments.map((comment) => (
//                           <div
//                             key={`${comment.id}-${comment.createdAt}`}
//                             className="flex items-start space-x-3 p-3 bg-white/40 backdrop-blur-sm rounded-xl border border-white/30 hover:bg-white/60 transition-all duration-200"
//                           >
//                             <button onClick={() => navigateToProfile(comment.username)}>
//                               {comment.profilePictureUrl ? (
//                                 <img
//                                   src={comment.profilePictureUrl || "/placeholder.svg"}
//                                   alt={comment.username}
//                                   className="w-8 h-8 rounded-full object-cover ring-2 ring-white shadow-sm"
//                                 />
//                               ) : (
//                                 <div className="w-8 h-8 bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 rounded-full flex items-center justify-center ring-2 ring-white shadow-sm">
//                                   <User className="w-4 h-4" />
//                                 </div>
//                               )}
//                             </button>

//                             <div className="flex-1 min-w-0">
//                               <div className="flex items-center space-x-2 mb-1">
//                                 <button
//                                   onClick={() => navigateToProfile(comment.username)}
//                                   className="font-semibold text-slate-800 text-sm hover:text-indigo-600 transition-colors duration-200 truncate"
//                                 >
//                                   {comment.username}
//                                 </button>
//                                 <span className="text-slate-500 text-xs">{formatDate(comment.createdAt)}</span>
//                               </div>

//                               <p className="text-slate-700 text-sm leading-relaxed">{comment.text}</p>
//                             </div>
//                           </div>
//                         ))}

//                         {/* Desktop infinite scroll trigger - always render when there are comments and more to load */}
//                         {hasMoreComments && (
//                           <div
//                             ref={!isCommentModalOpen ? commentsEndRef : null}
//                             className="py-4 text-center min-h-[40px] flex flex-col items-center justify-center"
//                           >
//                             {isLoadingMoreComments ? (
//                               <div className="flex justify-center items-center py-4">
//                                 <div className="relative">
//                                   <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-200 border-t-indigo-600"></div>
//                                 </div>
//                                 <p className="text-slate-600 text-sm ml-3 font-medium">Loading more comments...</p>
//                               </div>
//                             ) : (
//                               <div className="h-4 w-full bg-transparent flex items-center justify-center">
//                                 <div className="w-1 h-1 bg-slate-300 rounded-full animate-pulse"></div>
//                               </div>
//                             )}
//                           </div>
//                         )}

//                         {/* End of comments indicator */}
//                         {!hasMoreComments && comments.length > 0 && (
//                           <div className="py-4 text-center">
//                             <p className="text-sm text-slate-500">No more comments to load</p>
//                           </div>
//                         )}
//                       </div>
//                     ) : (
//                       <div className="text-center py-8 bg-white/30 backdrop-blur-sm rounded-xl border border-white/20">
//                         <MessageCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
//                         <p className="text-slate-500 text-sm">No comments yet. Be the first!</p>
//                       </div>
//                     )}
//                   </div>

//                   {/* Premium Comment Input - Desktop - Always visible at bottom */}
//                   <div className="hidden lg:block mt-auto pt-4 border-t border-white/20">
//                     <form onSubmit={handleSubmitComment} className="flex space-x-3">
//                       <input
//                         type="text"
//                         value={comment}
//                         onChange={(e) => setComment(e.target.value)}
//                         placeholder="Add a comment..."
//                         className="flex-1 border border-white/30 bg-white/40 backdrop-blur-sm rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 placeholder-slate-500"
//                       />

//                       <button
//                         type="submit"
//                         disabled={!comment.trim()}
//                         className="px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
//                       >
//                         <Send className="w-4 h-4" />
//                       </button>
//                     </form>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Premium More Memes Section */}
//         <div className="mt-12">
//           <div className="text-center mb-8">
//             <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-2">
//               More memes for you
//             </h2>
//             <p className="text-slate-600">Discover fresh content from our community</p>
//           </div>

//           {/* Loading state for initial fetch */}
//           {isLoadingMoreMemes && moreMemes.length === 0 && (
//             <div className="flex justify-center items-center py-12">
//               <div className="relative">
//                 <div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-indigo-600"></div>
//                 <div className="absolute inset-0 rounded-full h-8 w-8 border-4 border-transparent border-t-purple-400 animate-spin animation-delay-150"></div>
//               </div>
//               <p className="text-slate-600 text-sm ml-3 font-medium">Loading more memes...</p>
//             </div>
//           )}

//           {/* Premium Masonry Grid */}
//           {moreMemes.length > 0 && (
//             <>
//               <div className="columns-3 sm:columns-4 md:columns-5 lg:columns-6 xl:columns-7 2xl:columns-8 gap-3">
//                 {moreMemes.map((moreMeme, index) => {
//                   const isMoreVideo = moreMeme.url?.match(/\.(mp4|webm|ogg)$/i)
//                   const heights = ["h-36", "h-44", "h-52", "h-40", "h-48", "h-56", "h-32", "h-60", "h-64", "h-68"]
//                   const randomHeight = heights[index % heights.length]

//                   return (
//                     <div
//                       key={moreMeme.id}
//                       onClick={() => navigateToMeme(moreMeme.id)}
//                       className="group cursor-pointer break-inside-avoid mb-3"
//                     >
//                       <div className="bg-white/70 backdrop-blur-sm rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-white/30 hover:border-white/50 transform hover:-translate-y-1">
//                         {/* Premium Image Container */}
//                         <div
//                           className={`relative ${randomHeight} overflow-hidden bg-gradient-to-br from-slate-100 to-gray-200`}
//                         >
//                           {isMoreVideo ? (
//                             <video
//                               src={moreMeme.url}
//                               className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
//                               muted
//                               loop
//                               playsInline
//                             />
//                           ) : (
//                             <img
//                               src={moreMeme.url || "/placeholder.svg"}
//                               alt={moreMeme.title}
//                               className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
//                             />
//                           )}

//                           {/* Premium Hover Overlay */}
//                           <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

//                           {/* Video Play Icon */}
//                           {isMoreVideo && (
//                             <div className="absolute top-3 right-3">
//                               <div className="bg-black/60 backdrop-blur-sm rounded-full p-1.5 border border-white/20">
//                                 <Play className="w-3 h-3 text-white fill-white" />
//                               </div>
//                             </div>
//                           )}

//                           {/* Premium Action Buttons */}
//                           <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 flex gap-2">
//                             <button
//                               onClick={(e) => {
//                                 e.stopPropagation()
//                                 handleLike()
//                               }}
//                               className="bg-white/90 backdrop-blur-sm hover:bg-white text-slate-700 hover:text-red-500 rounded-full p-2 transition-all duration-200 shadow-lg hover:shadow-xl border border-white/20"
//                             >
//                               <Heart className="w-3 h-3" />
//                             </button>

//                             <button
//                               onClick={(e) => {
//                                 e.stopPropagation()
//                                 handleSave()
//                               }}
//                               className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 shadow-lg hover:shadow-xl backdrop-blur-sm border border-white/20"
//                             >
//                               Save
//                             </button>
//                           </div>
//                         </div>

//                         {/* Premium Content */}
//                         <div className="p-3 bg-white/50 backdrop-blur-sm">
//                           <h3 className="text-sm font-semibold text-slate-800 line-clamp-2 mb-2 leading-tight group-hover:text-indigo-600 transition-colors duration-200">
//                             {moreMeme.title}
//                           </h3>

//                           <div className="flex items-center justify-between">
//                             <div className="flex items-center space-x-2">
//                               {moreMeme.profilePictureUrl ? (
//                                 <img
//                                   src={moreMeme.profilePictureUrl || "/placeholder.svg"}
//                                   alt={moreMeme.uploader}
//                                   className="w-5 h-5 rounded-full object-cover ring-1 ring-white shadow-sm"
//                                 />
//                               ) : (
//                                 <div className="w-5 h-5 bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 rounded-full flex items-center justify-center ring-1 ring-white shadow-sm">
//                                   <User className="w-3 h-3" />
//                                 </div>
//                               )}

//                               <span className="text-xs text-slate-600 truncate font-medium">{moreMeme.uploader}</span>
//                             </div>

//                             <div className="flex items-center space-x-1 text-xs text-slate-500">
//                               <Heart className="w-3 h-3" />
//                               <span>{moreMeme.likeCount || 0}</span>
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   )
//                 })}
//               </div>

//               {/* Load More Button */}
//               <div className="text-center mt-8">
//                 {hasMoreMemes ? (
//                   <button
//                     onClick={handleLoadMore}
//                     disabled={isLoadingMoreMemes}
//                     className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
//                   >
//                     {isLoadingMoreMemes ? (
//                       <div className="flex items-center space-x-2">
//                         <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
//                         <span>Loading...</span>
//                       </div>
//                     ) : (
//                       "Load More Memes"
//                     )}
//                   </button>
//                 ) : (
//                   <div className="bg-white/40 backdrop-blur-sm rounded-xl p-6 border border-white/30">
//                     <p className="text-slate-600 font-medium">You've reached the end!</p>
//                     <p className="text-slate-500 text-sm mt-1">No more memes to load right now.</p>
//                   </div>
//                 )}
//               </div>
//             </>
//           )}

//           {/* Empty state */}
//           {!isLoadingMoreMemes && moreMemes.length === 0 && (
//             <div className="text-center py-12 bg-white/30 backdrop-blur-sm rounded-2xl border border-white/20">
//               <Eye className="w-12 h-12 text-slate-400 mx-auto mb-4" />
//               <p className="text-slate-600 font-medium">No more memes available</p>
//               <p className="text-slate-500 text-sm mt-1">Check back later for fresh content!</p>
//             </div>
//           )}
//         </div>
//       </main>

//       {/* Premium Mobile Comment Modal */}
//       {isCommentModalOpen && (
//         <div className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col justify-end">
//           <div className="bg-white/90 backdrop-blur-xl rounded-t-3xl max-h-[80vh] flex flex-col border-t border-white/30 shadow-2xl">
//             {/* Modal Header */}
//             <div className="flex items-center justify-between p-6 border-b border-white/20">
//               <div className="flex items-center space-x-2">
//                 <h3 className="text-lg font-semibold text-slate-800">Comments ({commentCount})</h3>
//                 {!wsClient && <span className="text-xs text-orange-500">(Offline)</span>}
//               </div>

//               <button
//                 onClick={closeCommentModal}
//                 className="p-2 rounded-xl hover:bg-white/40 backdrop-blur-sm transition-all duration-200 group"
//               >
//                 <X className="w-6 h-6 text-slate-600 group-hover:text-slate-800 group-hover:scale-110 transition-all duration-200" />
//               </button>
//             </div>

//             {/* Comments List */}
//             <div className="flex-1 overflow-y-auto p-6 comments-scroll-container-mobile">
//               {sortedComments.length === 0 ? (
//                 <div className="text-center py-12 bg-white/30 backdrop-blur-sm rounded-2xl border border-white/20">
//                   <MessageCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
//                   <p className="text-slate-600 font-medium">No comments yet</p>
//                   <p className="text-slate-500 text-sm mt-1">Be the first to share your thoughts!</p>
//                 </div>
//               ) : (
//                 <div className="space-y-4">
//                   {sortedComments.map((comment) => (
//                     <div
//                       key={`${comment.id}-${comment.createdAt}`}
//                       className="flex items-start space-x-3 p-4 bg-white/40 backdrop-blur-sm rounded-xl border border-white/30"
//                     >
//                       <button onClick={() => navigateToProfile(comment.username)}>
//                         {comment.profilePictureUrl ? (
//                           <img
//                             src={comment.profilePictureUrl || "/placeholder.svg"}
//                             alt={comment.username}
//                             className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-md"
//                           />
//                         ) : (
//                           <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 rounded-full flex items-center justify-center ring-2 ring-white shadow-md">
//                             <User className="w-5 h-5" />
//                           </div>
//                         )}
//                       </button>

//                       <div className="flex-1">
//                         <div className="flex items-center space-x-2 mb-2">
//                           <button
//                             onClick={() => navigateToProfile(comment.username)}
//                             className="font-semibold text-slate-800 hover:text-indigo-600 transition-colors duration-200"
//                           >
//                             {comment.username}
//                           </button>
//                           <span className="text-slate-500 text-sm">{formatDate(comment.createdAt)}</span>
//                         </div>

//                         <p className="text-slate-700 leading-relaxed">{comment.text}</p>
//                       </div>
//                     </div>
//                   ))}

//                   {/* Mobile infinite scroll trigger - only show when modal is open */}
//                   <div
//                     ref={isCommentModalOpen ? commentsEndRef : null}
//                     className="py-6 text-center min-h-[60px] flex flex-col items-center justify-center"
//                     style={{ minHeight: "60px" }}
//                   >
//                     {isLoadingMoreComments && (
//                       <div className="flex justify-center items-center py-4">
//                         <div className="relative">
//                           <div className="animate-spin rounded-full h-8 w-8 border-3 border-slate-200 border-t-indigo-600"></div>
//                           <div className="absolute inset-0 rounded-full h-8 w-8 border-3 border-transparent border-t-purple-400 animate-spin animation-delay-150"></div>
//                         </div>
//                         <p className="text-slate-600 text-sm ml-3 font-medium">Loading more comments...</p>
//                       </div>
//                     )}

//                     {!hasMoreComments && !isLoadingMoreComments && comments.length > 0 && (
//                       <p className="text-sm text-slate-500 py-2">No more comments to load</p>
//                     )}

//                     {hasMoreComments && !isLoadingMoreComments && (
//                       <div className="h-8 w-full bg-transparent flex items-center justify-center">
//                         <div className="w-2 h-2 bg-slate-300 rounded-full animate-pulse"></div>
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               )}
//             </div>

//             {/* Comment Input */}
//             <form
//               onSubmit={handleSubmitComment}
//               className="flex gap-4 p-6 border-t border-white/20 bg-white/50 backdrop-blur-sm"
//             >
//               <input
//                 type="text"
//                 value={comment}
//                 onChange={(e) => setComment(e.target.value)}
//                 placeholder="Add a comment..."
//                 className="flex-1 border border-white/30 bg-white/40 backdrop-blur-sm rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 placeholder-slate-500"
//                 autoFocus
//               />

//               <button
//                 type="submit"
//                 disabled={!comment.trim()}
//                 className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
//               >
//                 <Send className="w-4 h-4" />
//               </button>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }

// export default MemeDetailPage



"use client"

import type React from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useMemeContentStore } from "../store/useMemeContentStore"
import { useUserStore } from "../store/useUserStore"
import useWebSocketStore from "../hooks/useWebSockets"
import toast from "react-hot-toast"
import type { Comment, Meme } from "../types/mems"

// Import components
import { NavigationHeader } from "../components/MemeDetails/navigation-header"
import { MediaViewer } from "../components/MemeDetails/media-viewer"
import { ActionButtons } from "../components/MemeDetails/action-buttons"
import { UserInfo } from "../components/MemeDetails/user-info"
import { StatsDisplay } from "../components/MemeDetails/stats-display"
import { CommentsSection } from "../components/MemeDetails/comments-section"
import { MobileCommentModal } from "../components/MemeDetails/mobile-comment-modal"
import { RelatedMemesGrid } from "../components/MemeDetails/related-memes-grid"
import { LoadingSpinner } from "../components/MemeDetails/loading-spinner"
import { NotFound } from "../components/MemeDetails/not-found"

const MemeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [comment, setComment] = useState("")
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false)
  const [localIsLiked, setLocalIsLiked] = useState(false)
  const [localIsSaved, setLocalIsSaved] = useState(false)
  const [moreMemes, setMoreMemes] = useState<Meme[]>([])
  const [isLoadingMoreMemes, setIsLoadingMoreMemes] = useState(false)
  const [hasMoreMemes, setHasMoreMemes] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)

  // Comment pagination state
  const [comments, setComments] = useState<Comment[]>([])
  const [commentsPage, setCommentsPage] = useState(1)
  const [isLoadingMoreComments, setIsLoadingMoreComments] = useState(false)
  const [hasMoreComments, setHasMoreComments] = useState(true)
  const commentsPerPage = 10
  const commentsEndRef = useRef<HTMLDivElement>(null)

  // Get meme-related state and actions from useMemeContentStore
  const memes = useMemeContentStore.use.memes()
  const memeList = useMemeContentStore.use.memeList()
  const likedMemes = useMemeContentStore.use.likedMemes()
  const savedMemes = useMemeContentStore.use.savedMemes()
  const selectedMeme = useMemeContentStore.use.selectedMeme()
  const toggleLike = useMemeContentStore.use.toggleLike()
  const toggleSave = useMemeContentStore.use.toggleSave()
  const fetchMemeById = useMemeContentStore.use.fetchMemeById()
  const fetchMemeComments = useMemeContentStore.use.fetchMemeComments()
  const isLoading = useMemeContentStore.use.isLoading()
  const joinPostSession = useMemeContentStore.use.joinPostSession()
  const leavePostSession = useMemeContentStore.use.leavePostSession()

  // Get user-related state and actions from useUserStore
  const fetchUserProfile = useUserStore.use.fetchUserProfile()
  const profilePictureUrl = useUserStore.use.profilePictureUrl()
  const isLoggedInUserProfileLoaded = useUserStore.use.isLoggedInUserProfileLoaded()
  const userLikedMemes = useUserStore.use.likedMemes()
  const userSavedMemes = useUserStore.use.savedMemes()
  const loggedInUserProfile = useUserStore.use.loggedInUserProfile()

  // Get WebSocket client from the WebSocketStore
  const { client: wsClient } = useWebSocketStore()
  const user = JSON.parse(localStorage.getItem("user") || "{}")

  // First check if we have a selectedMeme from the store (set by fetchMemeById)
  // If not, try to find the meme in the other collections
  const meme =
    (selectedMeme && selectedMeme.id === id ? selectedMeme : null) ||
    memes.find((m) => m.id === id) ||
    memeList.find((m) => m.id === id) ||
    likedMemes.find((m) => m.id === id) ||
    savedMemes.find((m) => m.id === id)

  const isVideo = meme?.url?.match(/\.(mp4|webm|ogg)$/i)

  // Check if the meme is liked by looking at both the store and user profile
  const isLikedInStore = !!meme && likedMemes.some((m) => m.id === meme.id)
  const isLikedInUserProfile = !!meme && !!loggedInUserProfile && userLikedMemes.some((m) => m.id === meme.id)
  const isLiked = isLikedInStore || isLikedInUserProfile

  // Check if the meme is saved by looking at both the store and user profile
  const isSavedInStore = !!meme && savedMemes.some((m) => m.id === meme.id)
  const isSavedInUserProfile = !!meme && !!loggedInUserProfile && userSavedMemes.some((m) => m.id === meme.id)
  const isSaved = isSavedInStore || isSavedInUserProfile

  const commentCount = meme?.commentsCount || comments.length || 0

  // Use a ref to track if we've already joined the session
  const sessionJoinedRef = useRef(false)

  const handleBack = () => navigate(-1)

  const fetchMoreMemes = async (page = 1) => {
    if (isLoadingMoreMemes) return

    setIsLoadingMoreMemes(true)

    try {
      // Replace with your actual API endpoint
      const response = await fetch(`/memes?page=${page}&limit=20&exclude=${id}`)
      const data = await response.json()

      if (data.success && data.memes) {
        if (page === 1) {
          setMoreMemes(data.memes)
        } else {
          setMoreMemes((prev) => [...prev, ...data.memes])
        }

        setHasMoreMemes(data.hasMore || data.memes.length === 20)
        setCurrentPage(page)
      }
    } catch (error) {
      console.error("Error fetching more memes:", error)
      toast.error("Failed to load more memes")
    } finally {
      setIsLoadingMoreMemes(false)
    }
  }

  // Log the like/save status for debugging and update local state
  useEffect(() => {
    if (meme && loggedInUserProfile) {
      console.log(`Meme ${meme.id} like status:`, {
        isLikedInStore,
        isLikedInUserProfile,
        isLiked,
      })

      console.log(`Meme ${meme.id} save status:`, {
        isSavedInStore,
        isSavedInUserProfile,
        isSaved,
      })

      // Update local state to match the global state
      setLocalIsLiked(isLiked)
      setLocalIsSaved(isSaved)
    }
  }, [
    meme,
    isLikedInStore,
    isLikedInUserProfile,
    isSavedInStore,
    isSavedInUserProfile,
    loggedInUserProfile,
    isLiked,
    isSaved,
  ])

  // Fetch more memes when component mounts
  useEffect(() => {
    if (id) {
      fetchMoreMemes(1)
    }
  }, [id])

  useEffect(() => {
    // Reset the session joined flag when the ID changes
    sessionJoinedRef.current = false

    const initializePage = async () => {
      if (id) {
        // Only join the session if we haven't already
        if (!sessionJoinedRef.current) {
          console.log("MemeDetailPage: Joining post session for first time:", id)
          joinPostSession(id)
          sessionJoinedRef.current = true
        }

        // Clear any previous loading state
        console.log("MemeDetailPage: Fetching meme with ID:", id)

        // Reset comments pagination state
        setCommentsPage(1)
        setHasMoreComments(true)
        setComments([])

        // Fetch the meme details
        const fetchedMeme = await fetchMemeById(id)

        // Fetch initial comments using the new API method
        try {
          const initialResult = await fetchMemeComments(id, 1, commentsPerPage)
          setComments(initialResult.comments)
          setCommentsPage(initialResult.currentPage)
          setHasMoreComments(initialResult.currentPage < (initialResult.totalPages ?? 1))
        } catch (error) {
          console.error("Error fetching initial comments:", error)
        }

        if (!fetchedMeme) {
          console.error("MemeDetailPage: Failed to fetch meme with ID:", id)
        }

        // Only fetch user profile if it's not already loaded in the global state
        if (user.userId && !isLoggedInUserProfileLoaded) {
          console.log("MemeDetailPage: Fetching user profile from API")
          await fetchUserProfile(user.username)
        } else if (user.userId && isLoggedInUserProfileLoaded) {
          console.log("MemeDetailPage: Using cached user profile from global state")
        }
      }
    }

    initializePage()

    // Handle WebSocket reconnection
    const handleWebSocketReconnect = () => {
      if (id && sessionJoinedRef.current) {
        console.log("MemeDetailPage: WebSocket reconnected, rejoining post session for meme:", id)
        joinPostSession(id)

        // Refresh the meme data to ensure we have the latest comments
        console.log("MemeDetailPage: Refreshing meme data after WebSocket reconnection")
        fetchMemeById(id).then((refreshedMeme) => {
          if (refreshedMeme) {
            console.log("MemeDetailPage: Successfully refreshed meme data after reconnection")
          }
        })
      }
    }

    // Listen for the websocket-reconnected event
    window.addEventListener("websocket-reconnected", handleWebSocketReconnect)

    return () => {
      if (id && sessionJoinedRef.current) {
        console.log("MemeDetailPage: Leaving post session on unmount:", id)
        leavePostSession(id)
        sessionJoinedRef.current = false
      }

      // Clean up event listener
      window.removeEventListener("websocket-reconnected", handleWebSocketReconnect)
    }
  }, [
    id,
    fetchMemeById,
    fetchMemeComments,
    fetchUserProfile,
    user.userId,
    joinPostSession,
    leavePostSession,
    isLoggedInUserProfileLoaded,
    user.username,
  ])

  // Function to load more comments with updated API integration
  const loadMoreComments = useCallback(async () => {
    if (!id || isLoadingMoreComments || !hasMoreComments) {
      console.log("loadMoreComments blocked:", { id, isLoadingMoreComments, hasMoreComments })
      return
    }

    console.log("Loading more comments, current page:", commentsPage)

    try {
      setIsLoadingMoreComments(true)
      const nextPage = commentsPage + 1

      // Fetch more comments using the provided API method
      const result = await fetchMemeComments(id, nextPage, commentsPerPage)

      console.log("Fetched comments result:", result)

      if (result && result.comments && Array.isArray(result.comments)) {
        // Append new comments to existing comments
        setComments((prevComments) => {
          const newComments = [...prevComments, ...result.comments]
          console.log("Updated comments count:", newComments.length)
          return newComments
        })

        // Update pagination state
        setCommentsPage(nextPage)

        // Check if there are more comments based on the response
        const hasMore =
          result.comments.length === commentsPerPage && (result.totalPages ? nextPage < result.totalPages : true)

        setHasMoreComments(hasMore)
        console.log("Has more comments:", hasMore)
      } else {
        console.log("No more comments available")
        setHasMoreComments(false)
      }
    } catch (error) {
      console.error("Error loading more comments:", error)
      toast.error("Failed to load more comments")
      setHasMoreComments(false)
    } finally {
      setIsLoadingMoreComments(false)
    }
  }, [id, isLoadingMoreComments, hasMoreComments, commentsPage, commentsPerPage, fetchMemeComments])

  // Set up intersection observer for infinite scrolling of comments - unified for both desktop and mobile
  useEffect(() => {
    console.log("Setting up intersection observer:", {
      hasRef: !!commentsEndRef.current,
      hasMoreComments,
      isLoadingMoreComments,
      isCommentModalOpen,
      commentsLength: comments.length,
    })

    if (!commentsEndRef.current || !hasMoreComments || isLoadingMoreComments) {
      console.log("Observer setup blocked")
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        console.log("Intersection observer triggered:", {
          isIntersecting: entry.isIntersecting,
          intersectionRatio: entry.intersectionRatio,
          isMobile: isCommentModalOpen,
          target: entry.target.className,
        })

        if (entry.isIntersecting && entry.intersectionRatio > 0) {
          console.log("Loading more comments via intersection observer")
          loadMoreComments()
        }
      },
      {
        threshold: [0, 0.1, 0.5],
        rootMargin: "50px",
        root: null,
      },
    )

    observer.observe(commentsEndRef.current)
    console.log("Observer attached successfully")

    return () => {
      console.log("Cleaning up intersection observer")
      observer.disconnect()
    }
  }, [hasMoreComments, isLoadingMoreComments, loadMoreComments, isCommentModalOpen, comments.length])

  // Subscribe to store changes instead of handling WebSocket messages directly
  useEffect(() => {
    if (!id || !meme) return

    // Set up subscriptions to the stores to react to changes
    const memeContentUnsubscribe = useMemeContentStore.subscribe((state) => {
      // Check if the current meme's like/save status has changed
      const isLikedInStore = state.likedMemes.some((m) => m.id === id)
      const isSavedInStore = state.savedMemes.some((m) => m.id === id)

      // Update local state to match the store
      if (isLikedInStore !== localIsLiked) {
        console.log(`Updating local like state to match store: ${isLikedInStore}`)
        setLocalIsLiked(isLikedInStore)
      }

      if (isSavedInStore !== localIsSaved) {
        console.log(`Updating local save state to match store: ${isSavedInStore}`)
        setLocalIsSaved(isSavedInStore)
      }
    })

    // Subscribe to user store changes as well
    const userStoreUnsubscribe = useUserStore.subscribe((state) => {
      if (state.loggedInUserProfile) {
        const isLikedInUserProfile = state.likedMemes.some((m) => m.id === id)
        const isSavedInUserProfile = state.savedMemes.some((m) => m.id === id)

        // Update local state if user profile state differs
        if (isLikedInUserProfile !== localIsLiked) {
          console.log(`Updating local like state to match user profile: ${isLikedInUserProfile}`)
          setLocalIsLiked(isLikedInUserProfile)
        }

        if (isSavedInUserProfile !== localIsSaved) {
          console.log(`Updating local save state to match user profile: ${isSavedInUserProfile}`)
          setLocalIsSaved(isSavedInUserProfile)
        }
      }
    })

    // Clean up subscriptions when component unmounts or meme changes
    return () => {
      memeContentUnsubscribe()
      userStoreUnsubscribe()
    }
  }, [id, meme, localIsLiked, localIsSaved])

  // Subscribe to comments changes from the store for real-time updates
  useEffect(() => {
    if (!id || !meme) return

    // Subscribe to meme content store changes to get real-time comment updates
    const unsubscribe = useMemeContentStore.subscribe((state) => {
      // Check if the selected meme has updated comments
      const updatedMeme = state.selectedMeme
      if (updatedMeme && updatedMeme.id === id && updatedMeme.comments) {
        console.log("Real-time comment update received:", updatedMeme.comments.length)

        // Only update if we have fewer comments locally than in the store
        // This prevents overwriting paginated comments
        if (updatedMeme.comments.length > comments.length) {
          console.log("Updating comments with new real-time data")

          // Merge new comments with existing ones, avoiding duplicates
          setComments((prevComments) => {
            const existingIds = new Set(prevComments.map((c) => c.id))
            const newComments = updatedMeme.comments.filter((c) => !existingIds.has(c.id))

            if (newComments.length > 0) {
              console.log("Adding new comments:", newComments.length)
              return [...newComments, ...prevComments]
            }

            return prevComments
          })
        }

        // Update comment count if it has changed
        if (updatedMeme.commentsCount !== commentCount) {
          console.log("Comment count updated:", updatedMeme.commentsCount)
        }
      }
    })

    return () => {
      unsubscribe()
    }
  }, [id, meme, comments.length, commentCount])

  useEffect(() => {
    if (isCommentModalOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "auto"
    }

    return () => {
      document.body.style.overflow = "auto"
    }
  }, [isCommentModalOpen])

  const handleLoadMore = () => {
    if (hasMoreMemes && !isLoadingMoreMemes) {
      fetchMoreMemes(currentPage + 1)
    }
  }

  // Show loading state
  if (isLoading || (id && !meme)) {
    return <LoadingSpinner />
  }

  // Handle case where meme wasn't found
  if (!meme) {
    return <NotFound onBack={handleBack} />
  }

  const handleDownload = async () => {
    try {
      if (!meme.url) {
        toast.error("Cannot download: Media URL is missing")
        return
      }

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
    } catch (error) {
      console.error("Error downloading meme:", error)
      toast.error("Failed to download media. Please try again.")
    }
  }

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.success("Link copied to clipboard!")
    } catch {
      toast.error("Failed to copy link. Please try again.")
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()

    if (comment.trim() && id) {
      if (!wsClient) {
        console.log("WebSocket client not available, attempting to reconnect...")
        // Try to restore the connection
        useWebSocketStore.getState().restoreConnection()

        // Check if reconnection was successful
        setTimeout(() => {
          const newWsClient = useWebSocketStore.getState().client

          if (!newWsClient || newWsClient.readyState !== WebSocket.OPEN) {
            toast.error("Cannot add comment: WebSocket connection not established")
            return
          } else {
            // Connection restored, proceed with sending the comment
            sendComment()
          }
        }, 1000)

        return
      }

      // Send the comment if WebSocket is connected
      sendComment()
    }
  }

  // Helper function to send the comment
  const sendComment = () => {
    if (!id || !comment.trim()) return

    // Create optimistic comment
    const user = JSON.parse(localStorage.getItem("user") || "{}")
    const optimisticComment: Comment = {
      id: `temp-${Date.now()}`,
      memeId: id,
      userId: user.userId,
      username: user.username,
      text: comment.trim(),
      createdAt: new Date().toISOString(),
      profilePictureUrl: profilePictureUrl || "",
    }

    // Add optimistic comment to local state immediately (at the beginning for newest first)
    setComments((prevComments) => [optimisticComment, ...prevComments])

    // Update the comment count locally
    const updatedCommentCount = commentCount + 1

    // Update the meme in the store with the new comment count
    if (meme) {
      useMemeContentStore.setState((state) => ({
        selectedMeme: state.selectedMeme
          ? {
              ...state.selectedMeme,
              commentsCount: updatedCommentCount,
            }
          : null,
      }))
    }

    // Send comment directly through WebSocket instead of HTTP
    const success = useWebSocketStore.getState().sendCommentRequest(id, comment.trim(), profilePictureUrl || "")

    if (success) {
      // Clear the comment input field
      setComment("")

      // Close the comment modal on mobile
      if (window.innerWidth < 1024) {
        setIsCommentModalOpen(false)
      }

      // Show success message
      toast.success("Comment sent successfully")

      // Also add to the store (this will be replaced by the real comment when it arrives)
      useMemeContentStore.getState().forceAddComment(optimisticComment)
    } else {
      // Remove optimistic comment if sending failed
      setComments((prevComments) => prevComments.filter((c) => c.id !== optimisticComment.id))
      toast.error("Failed to send comment. Please try again.")
    }
  }

  const handleLike = async () => {
    if (user.username && meme.id) {
      // Log the current state before toggling
      const currentlyLiked = isLiked
      console.log(`Handling like for meme ${meme.id}, currently liked: ${currentlyLiked}`)

      // Immediately update local state for responsive UI - toggle based on the global state
      setLocalIsLiked(!currentlyLiked)

      // First update the UI state through the store
      await toggleLike(meme.id, user.username)

      // Get the updated like status after toggling
      const updatedIsLiked = useMemeContentStore.getState().likedMemes.some((m) => m.id === meme.id)
      console.log(`After toggle, meme ${meme.id} liked status: ${updatedIsLiked}`)

      // Also update the UserStore to keep the two stores in sync
      if (loggedInUserProfile) {
        // If the meme is now liked, add it to the user's liked memes if not already there
        if (updatedIsLiked) {
          if (!useUserStore.getState().likedMemes.some((m) => m.id === meme.id)) {
            useUserStore.setState((state) => ({
              likedMemes: [...state.likedMemes, meme],
            }))
            console.log(`Added meme ${meme.id} to UserStore likedMemes`)
          }
        }
        // If the meme is now unliked, remove it from the user's liked memes
        else {
          useUserStore.setState((state) => ({
            likedMemes: state.likedMemes.filter((m) => m.id !== meme.id),
          }))
          console.log(`Removed meme ${meme.id} from UserStore likedMemes`)
        }
      }

      // Then send the WebSocket message directly with the correct action based on the updated state
      if (wsClient) {
        // The action should be the opposite of the current state since we're toggling
        const action = currentlyLiked ? "UNLIKE" : "LIKE"
        console.log(`Sending WebSocket message with action: ${action}`)

        useWebSocketStore.getState().sendMessage({
          type: "LIKE",
          memeId: meme.id,
          action: action,
          username: user.username,
          userId: user.userId,
        })
      }
    }
  }

  const handleSave = async () => {
    if (user.username && meme.id) {
      // Log the current state before toggling
      const currentlySaved = isSaved
      console.log(`Handling save for meme ${meme.id}, currently saved: ${currentlySaved}`)

      // Immediately update local state for responsive UI - toggle based on the global state
      setLocalIsSaved(!currentlySaved)

      // First update the UI state through the store
      await toggleSave(meme.id, user.username)

      // Get the updated save status after toggling
      const updatedIsSaved = useMemeContentStore.getState().savedMemes.some((m) => m.id === meme.id)
      console.log(`After toggle, meme ${meme.id} saved status: ${updatedIsSaved}`)

      // Also update the UserStore to keep the two stores in sync
      if (loggedInUserProfile) {
        if (updatedIsSaved) {
          if (!useUserStore.getState().savedMemes.some((m) => m.id === meme.id)) {
            useUserStore.setState((state) => ({
              savedMemes: [...state.savedMemes, meme],
            }))
            console.log(`Added meme ${meme.id} to UserStore savedMemes`)
          }
        } else {
          useUserStore.setState((state) => ({
            savedMemes: state.savedMemes.filter((m) => m.id !== meme.id),
          }))
          console.log(`Removed meme ${meme.id} from UserStore savedMemes`)
        }
      }

      // Then send the WebSocket message directly with the correct action based on the updated state
      if (wsClient) {
        // The action should be the opposite of the current state since we're toggling
        const action = currentlySaved ? "UNSAVE" : "SAVE"
        console.log(`Sending WebSocket message with action: ${action}`)

        useWebSocketStore.getState().sendMessage({
          type: "SAVE",
          memeId: meme.id,
          action: action,
          username: user.username,
          userId: user.userId,
        })
      }
    }
  }

  const navigateToProfile = (username: string) => {
    navigate(`/profile/${username}`)

    if (username !== user.username || !isLoggedInUserProfileLoaded) {
      fetchUserProfile(username)
    }
  }

  const navigateToMeme = (memeId: string) => {
    navigate(`/meme/${memeId}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-100">
      <NavigationHeader onBack={handleBack} onShare={handleShare} />

      <main className="max-w-full mx-auto px-3 py-4">
        {/* Premium Pin Detail Layout */}
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-3">
              <MediaViewer url={meme.url || ""} title={meme.title || ""} isVideo={!!isVideo} />

              {/* Premium Content Section */}
              <div className="p-6 flex flex-col h-full bg-gradient-to-b from-white/50 to-slate-50/50 backdrop-blur-sm">
                <ActionButtons
                  isLiked={isLiked || localIsLiked}
                  isSaved={isSaved || localIsSaved}
                  onLike={handleLike}
                  onSave={handleSave}
                  onDownload={handleDownload}
                />

                {/* Premium Title */}
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-slate-800 leading-tight bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text">
                    {meme.title}
                  </h1>
                </div>

                <UserInfo
                  username={meme.uploader}
                  profilePictureUrl={meme.profilePictureUrl}
                  createdAt={meme.memeCreated || Date()}
                  onProfileClick={navigateToProfile}
                />

                <StatsDisplay
                  likeCount={meme.likeCount || 0}
                  commentCount={commentCount}
                  saveCount={meme.saveCount || 0}
                />

                <CommentsSection
                  comments={comments}
                  commentCount={commentCount}
                  comment={comment}
                  setComment={setComment}
                  onSubmitComment={handleSubmitComment}
                  onProfileClick={navigateToProfile}
                  onOpenModal={() => setIsCommentModalOpen(true)}
                  isLoadingMoreComments={isLoadingMoreComments}
                  hasMoreComments={hasMoreComments}
                  commentsEndRef={commentsEndRef}
                  isCommentModalOpen={isCommentModalOpen}
                  wsClient={wsClient}
                />
              </div>
            </div>
          </div>
        </div>

        <RelatedMemesGrid
          memes={moreMemes}
          isLoading={isLoadingMoreMemes}
          hasMore={hasMoreMemes}
          onLoadMore={handleLoadMore}
          onMemeClick={navigateToMeme}
          onLike={handleLike}
          onSave={handleSave}
        />
      </main>

      <MobileCommentModal
        isOpen={isCommentModalOpen}
        onClose={() => setIsCommentModalOpen(false)}
        comments={comments}
        commentCount={commentCount}
        comment={comment}
        setComment={setComment}
        onSubmitComment={handleSubmitComment}
        onProfileClick={navigateToProfile}
        isLoadingMoreComments={isLoadingMoreComments}
        hasMoreComments={hasMoreComments}
        commentsEndRef={commentsEndRef}
        wsClient={wsClient}
      />
    </div>
  )
}

export default MemeDetailPage
