// import type React from "react"
// import { useEffect, useState } from "react"
// import { Bell } from "lucide-react"
// import { useMemeContentStore } from "../store/useMemeContentStore.ts"
// import { useUserStore } from "../store/useUserStore.ts"
// import { MemeCard } from "../components/mainPage/MemeCard"
// // import { useWebSocketStore } from "../hooks/useWebSockets"
// import { useNavigate } from "react-router-dom"

// export const MainPage: React.FC = () => {
//   // Use selectors to only subscribe to what we need
//   const memes = useMemeContentStore.use.memes()
//   const fetchMemes = useMemeContentStore.use.fetchMemes()
//   const isLoading = useMemeContentStore.use.isLoading()
//   const error = useMemeContentStore.use.error()
//   const userName = useUserStore.use.userName()
  
//   const navigate = useNavigate()
//   const [unreadCount, setUnreadCount] = useState(0)
//   // const { client: wsClient } = useWebSocketStore()

//   // WebSocket connection is now handled in the Layout component

//   useEffect(() => {
//     fetchMemes()
//   }, [fetchMemes])
  
//   // Listen for notification events from Sidebar instead of registering duplicate WebSocket handlers
//   useEffect(() => {
//     // Only set up event listeners if we have a user
//     if (!userName) return;
    
//     console.log('Setting up notification event listeners in MainPage');
    
//     // Listen for the custom notification event that Sidebar dispatches
//     const handleNewNotification = () => {
//       // Increment notification count when we receive any notification
//       setUnreadCount(prev => prev + 1);
//     };
    
//     // Listen for notifications being marked as read
//     const handleNotificationsRead = () => {
//       // Reset the unread count to zero
//       setUnreadCount(0);
//     };
    
//     // Add event listeners for custom notification events
//     window.addEventListener('new-notification', handleNewNotification);
//     window.addEventListener('notifications-read', handleNotificationsRead);
    
//     // Cleanup function
//     return () => {
//       console.log('Removing notification event listeners in MainPage');
//       window.removeEventListener('new-notification', handleNewNotification);
//       window.removeEventListener('notifications-read', handleNotificationsRead);
//     };
//   }, [userName])

//   return (
//     <div className="py-6">
//       {/* Mobile Header - Only visible on mobile */}
//       <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 px-4 py-3">
//         <div className="flex items-center justify-between">
//           <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
//             MemeVault
//           </h1>
//           <div className="relative">
//             <button
//               onClick={() => {
//                 if (userName) {
//                   navigate(`/notifications/${userName}`);
//                 }
//               }}
//               className="p-2 hover:bg-gray-100 rounded-full transition-colors"
//             >
//               <Bell className="w-6 h-6 text-gray-600" />
//               {unreadCount > 0 && (
//                 <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
//                   {unreadCount}
//                 </span>
//               )}
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Main content with padding for mobile header */}
//       <div className="mt-12 lg:mt-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
//         {isLoading ? (
//           <div className="flex items-center justify-center h-64">
//             <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600"></div>
//           </div>
//         ) : error ? (
//           <div className="text-center text-red-600 p-4">{error}</div>
//         ) : (
//           <div className="grid grid-cols-1 gap-4 sm:gap-6 md:gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
//             {memes.map((meme) => (
//               <MemeCard key={meme.id} meme={meme} />
//             ))}
//             {memes.length === 0 && (
//               <div className="col-span-full text-center py-8 sm:py-12">
//                 <p className="text-gray-500 text-lg">No memes found</p>
//               </div>
//             )}
//           </div>
//         )}
//       </div>
//     </div>
//   )
// }


// "use client"

// import type React from "react"
// import { useEffect, useState } from "react"
// import { Bell } from "lucide-react"
// import { useMemeContentStore } from "../store/useMemeContentStore.ts"
// import { useUserStore } from "../store/useUserStore.ts"
// import { MemeCard } from "../components/mainPage/MemeCard"
// import { TrueMasonryGrid } from "../components/mainPage/TrueMasonryGrid.tsx"
// import { useNavigate } from "react-router-dom"

// export const MainPage: React.FC = () => {
//   // Use selectors to only subscribe to what we need
//   const memes = useMemeContentStore.use.memes()
//   const fetchMemes = useMemeContentStore.use.fetchMemes()
//   const isLoading = useMemeContentStore.use.isLoading()
//   const error = useMemeContentStore.use.error()
//   const userName = useUserStore.use.userName()

//   const navigate = useNavigate()
//   const [unreadCount, setUnreadCount] = useState(0)
//   const [activeOptionsId, setActiveOptionsId] = useState<string | null>(null)

//   // WebSocket connection is now handled in the Layout component

//   useEffect(() => {
//     fetchMemes()
//   }, [fetchMemes])

//   // Listen for notification events from Sidebar instead of registering duplicate WebSocket handlers
//   useEffect(() => {
//     // Only set up event listeners if we have a user
//     if (!userName) return

//     console.log("Setting up notification event listeners in MainPage")

//     // Listen for the custom notification event that Sidebar dispatches
//     const handleNewNotification = () => {
//       // Increment notification count when we receive any notification
//       setUnreadCount((prev) => prev + 1)
//     }

//     // Listen for notifications being marked as read
//     const handleNotificationsRead = () => {
//       // Reset the unread count to zero
//       setUnreadCount(0)
//     }

//     // Add event listeners for custom notification events
//     window.addEventListener("new-notification", handleNewNotification)
//     window.addEventListener("notifications-read", handleNotificationsRead)

//     // Cleanup function
//     return () => {
//       console.log("Removing notification event listeners in MainPage")
//       window.removeEventListener("new-notification", handleNewNotification)
//       window.removeEventListener("notifications-read", handleNotificationsRead)
//     }
//   }, [userName])

//   const handleOptionsClick = (id: string | null) => {
//     setActiveOptionsId(id)
//   }

//   return (
//     <div className="py-6">
//       {/* Mobile Header - Only visible on mobile */}
//       <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 px-4 py-3">
//         <div className="flex items-center justify-between">
//           <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
//             MemeVault
//           </h1>
//           <div className="relative">
//             <button
//               onClick={() => {
//                 if (userName) {
//                   navigate(`/notifications/${userName}`)
//                 }
//               }}
//               className="p-2 hover:bg-gray-100 rounded-full transition-colors"
//             >
//               <Bell className="w-6 h-6 text-gray-600" />
//               {unreadCount > 0 && (
//                 <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
//                   {unreadCount}
//                 </span>
//               )}
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Main content with padding for mobile header */}
//       <div className="mt-12 lg:mt-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         {isLoading ? (
//           <div className="flex items-center justify-center h-64">
//             <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600"></div>
//           </div>
//         ) : error ? (
//           <div className="text-center text-red-600 p-4">{error}</div>
//         ) : (
//           <TrueMasonryGrid>
//             {memes.map((meme) => (
//               <MemeCard
//                 key={meme.id}
//                 meme={meme}
//                 activeOptionsId={activeOptionsId}
//                 onOptionsClick={handleOptionsClick}
//               />
//             ))}
//             {memes.length === 0 && (
//               <div className="col-span-full text-center py-8 sm:py-12">
//                 <p className="text-gray-500 text-lg">No memes found</p>
//               </div>
//             )}
//           </TrueMasonryGrid>
//         )}
//       </div>
//     </div>
//   )
// }



// "use client"

// import type React from "react"
// import { useEffect, useState } from "react"
// import { Bell } from "lucide-react"
// import { useMemeContentStore } from "../store/useMemeContentStore.ts"
// import { useUserStore } from "../store/useUserStore.ts"
// import { MemeCard } from "../components/mainPage/MemeCard"
// import { TrueMasonryGrid } from "../components/mainPage/TrueMasonryGrid"
// import { useNavigate } from "react-router-dom"

// export const MainPage: React.FC = () => {
//   // Use selectors to only subscribe to what we need
//   const memes = useMemeContentStore.use.memes()
//   const fetchMemes = useMemeContentStore.use.fetchMemes()
//   const isLoading = useMemeContentStore.use.isLoading()
//   const error = useMemeContentStore.use.error()
//   const userName = useUserStore.use.userName()

//   const navigate = useNavigate()
//   const [unreadCount, setUnreadCount] = useState(0)
//   const [activeOptionsId, setActiveOptionsId] = useState<string | null>(null)

//   // WebSocket connection is now handled in the Layout component

//   useEffect(() => {
//     fetchMemes()
//   }, [fetchMemes])

//   // Listen for notification events from Sidebar instead of registering duplicate WebSocket handlers
//   useEffect(() => {
//     // Only set up event listeners if we have a user
//     if (!userName) return

//     console.log("Setting up notification event listeners in MainPage")

//     // Listen for the custom notification event that Sidebar dispatches
//     const handleNewNotification = () => {
//       // Increment notification count when we receive any notification
//       setUnreadCount((prev) => prev + 1)
//     }

//     // Listen for notifications being marked as read
//     const handleNotificationsRead = () => {
//       // Reset the unread count to zero
//       setUnreadCount(0)
//     }

//     // Add event listeners for custom notification events
//     window.addEventListener("new-notification", handleNewNotification)
//     window.addEventListener("notifications-read", handleNotificationsRead)

//     // Cleanup function
//     return () => {
//       console.log("Removing notification event listeners in MainPage")
//       window.removeEventListener("new-notification", handleNewNotification)
//       window.removeEventListener("notifications-read", handleNotificationsRead)
//     }
//   }, [userName])

//   const handleOptionsClick = (id: string | null) => {
//     setActiveOptionsId(id)
//   }

//   return (
//     <div className="py-6">
//       {/* Mobile Header - Only visible on mobile */}
//       <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 px-4 py-3">
//         <div className="flex items-center justify-between">
//           <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
//             MemeVault
//           </h1>
//           <div className="relative">
//             <button
//               onClick={() => {
//                 if (userName) {
//                   navigate(`/notifications/${userName}`)
//                 }
//               }}
//               className="p-2 hover:bg-gray-100 rounded-full transition-colors"
//             >
//               <Bell className="w-6 h-6 text-gray-600" />
//               {unreadCount > 0 && (
//                 <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
//                   {unreadCount}
//                 </span>
//               )}
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Main content with padding for mobile header */}
//       <div className="mt-12 lg:mt-0 w-full mx-auto px-2 sm:px-4">
//         {isLoading ? (
//           <div className="flex items-center justify-center h-64">
//             <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600"></div>
//           </div>
//         ) : error ? (
//           <div className="text-center text-red-600 p-4">{error}</div>
//         ) : (
//           <TrueMasonryGrid className="px-2 sm:px-4">
//             {memes.map((meme) => (
//               <MemeCard
//                 key={meme.id}
//                 meme={meme}
//                 activeOptionsId={activeOptionsId}
//                 onOptionsClick={handleOptionsClick}
//               />
//             ))}
//             {memes.length === 0 && (
//               <div className="col-span-full text-center py-8 sm:py-12">
//                 <p className="text-gray-500 text-lg">No memes found</p>
//               </div>
//             )}
//           </TrueMasonryGrid>
//         )}
//       </div>
//     </div>
//   )
// }



// "use client"

// import type React from "react"
// import { useEffect, useState } from "react"
// import { Bell } from "lucide-react"
// import { useMemeContentStore } from "../store/useMemeContentStore.ts"
// import { useUserStore } from "../store/useUserStore.ts"
// import { MemeCard } from "../components/mainPage/MemeCard"
// import { SkeletonCard } from "../components/ui/SkeletonCard"
// import { TrueMasonryGrid } from "../components/mainPage/TrueMasonryGrid"
// import { useNavigate } from "react-router-dom"

// export const MainPage: React.FC = () => {
//   // Use selectors to only subscribe to what we need
//   const memes = useMemeContentStore.use.memes()
//   const fetchMemes = useMemeContentStore.use.fetchMemes()
//   const isLoading = useMemeContentStore.use.isLoading()
//   const error = useMemeContentStore.use.error()
//   const userName = useUserStore.use.userName()

//   const navigate = useNavigate()
//   const [unreadCount, setUnreadCount] = useState(0)
//   const [activeOptionsId, setActiveOptionsId] = useState<string | null>(null)

//   // WebSocket connection is now handled in the Layout component

//   useEffect(() => {
//     fetchMemes()
//   }, [fetchMemes])

//   // Listen for notification events from Sidebar instead of registering duplicate WebSocket handlers
//   useEffect(() => {
//     // Only set up event listeners if we have a user
//     if (!userName) return

//     console.log("Setting up notification event listeners in MainPage")

//     // Listen for the custom notification event that Sidebar dispatches
//     const handleNewNotification = () => {
//       // Increment notification count when we receive any notification
//       setUnreadCount((prev) => prev + 1)
//     }

//     // Listen for notifications being marked as read
//     const handleNotificationsRead = () => {
//       // Reset the unread count to zero
//       setUnreadCount(0)
//     }

//     // Add event listeners for custom notification events
//     window.addEventListener("new-notification", handleNewNotification)
//     window.addEventListener("notifications-read", handleNotificationsRead)

//     // Cleanup function
//     return () => {
//       console.log("Removing notification event listeners in MainPage")
//       window.removeEventListener("new-notification", handleNewNotification)
//       window.removeEventListener("notifications-read", handleNotificationsRead)
//     }
//   }, [userName])

//   const handleOptionsClick = (id: string | null) => {
//     setActiveOptionsId(id)
//   }

//   // Generate skeleton cards for loading state
//   const renderSkeletonCards = () => {
//     return Array.from({ length: 12 }, (_, index) => <SkeletonCard key={`skeleton-${index}`} />)
//   }

//   return (
//     <div className="py-6">
//       {/* Mobile Header - Only visible on mobile */}
//       <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 px-4 py-3">
//         <div className="flex items-center justify-between">
//           <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
//             MemeVault
//           </h1>
//           <div className="relative">
//             <button
//               onClick={() => {
//                 if (userName) {
//                   navigate(`/notifications/${userName}`)
//                 }
//               }}
//               className="p-2 hover:bg-gray-100 rounded-full transition-colors"
//             >
//               <Bell className="w-6 h-6 text-gray-600" />
//               {unreadCount > 0 && (
//                 <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
//                   {unreadCount}
//                 </span>
//               )}
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Main content with padding for mobile header */}
//       <div className="mt-12 lg:mt-0 w-full mx-auto px-2 sm:px-4">
//         {error ? (
//           <div className="text-center text-red-600 p-4">{error}</div>
//         ) : (
//           <TrueMasonryGrid className="px-2 sm:px-4">
//             {isLoading ? (
//               // Show skeleton cards while loading
//               renderSkeletonCards()
//             ) : memes.length > 0 ? (
//               // Show actual meme cards
//               memes.map((meme) => (
//                 <MemeCard
//                   key={meme.id}
//                   meme={meme}
//                   activeOptionsId={activeOptionsId}
//                   onOptionsClick={handleOptionsClick}
//                 />
//               ))
//             ) : (
//               // Show empty state
//               <div className="col-span-full text-center py-8 sm:py-12">
//                 <div className="max-w-md mx-auto">
//                   <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
//                     <Bell className="w-8 h-8 text-gray-400" />
//                   </div>
//                   <h3 className="text-lg font-semibold text-gray-900 mb-2">No memes found</h3>
//                   <p className="text-gray-500">Be the first to share something amazing!</p>
//                 </div>
//               </div>
//             )}
//           </TrueMasonryGrid>
//         )}
//       </div>
//     </div>
//   )
// }



"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Bell } from "lucide-react"
import { useMemeContentStore } from "../store/useMemeContentStore.ts"
import { useUserStore } from "../store/useUserStore.ts"
import { MemeCard } from "../components/mainPage/MemeCard"
import { SkeletonCard } from "../components/ui/SkeletonCard"
import { TrueMasonryGrid } from "../components/mainPage/TrueMasonryGrid"
import { useNavigate } from "react-router-dom"

export const MainPage: React.FC = () => {
  // Use selectors to only subscribe to what we need
  const memes = useMemeContentStore.use.memes()
  const fetchMemes = useMemeContentStore.use.fetchMemes()
  const isLoading = useMemeContentStore.use.isLoading()
  const error = useMemeContentStore.use.error()
  const userName = useUserStore.use.userName()

  const navigate = useNavigate()
  const [unreadCount, setUnreadCount] = useState(0)
  const [activeOptionsId, setActiveOptionsId] = useState<string | null>(null)

  // WebSocket connection is now handled in the Layout component

  useEffect(() => {
    fetchMemes()
  }, [fetchMemes])

  // Listen for notification events from Sidebar instead of registering duplicate WebSocket handlers
  useEffect(() => {
    // Only set up event listeners if we have a user
    if (!userName) return

    console.log("Setting up notification event listeners in MainPage")

    // Listen for the custom notification event that Sidebar dispatches
    const handleNewNotification = () => {
      // Increment notification count when we receive any notification
      setUnreadCount((prev) => prev + 1)
    }

    // Listen for notifications being marked as read
    const handleNotificationsRead = () => {
      // Reset the unread count to zero
      setUnreadCount(0)
    }

    // Add event listeners for custom notification events
    window.addEventListener("new-notification", handleNewNotification)
    window.addEventListener("notifications-read", handleNotificationsRead)

    // Cleanup function
    return () => {
      console.log("Removing notification event listeners in MainPage")
      window.removeEventListener("new-notification", handleNewNotification)
      window.removeEventListener("notifications-read", handleNotificationsRead)
    }
  }, [userName])

  const handleOptionsClick = (id: string | null) => {
    setActiveOptionsId(id)
  }

  return (
    <div className="py-6">
      {/* Mobile Header - Only visible on mobile */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
            MemeVault
          </h1>
          <div className="relative">
            <button
              onClick={() => {
                if (userName) {
                  navigate(`/notifications/${userName}`)
                }
              }}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Bell className="w-6 h-6 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main content with padding for mobile header */}
      <div className="mt-12 lg:mt-0 w-full mx-auto px-2 sm:px-4">
        {error ? (
          <div className="text-center text-red-600 p-4">{error}</div>
        ) : (
          <TrueMasonryGrid className="px-2 sm:px-4">
            {isLoading ? (
              // Show skeleton cards in masonry grid style
              <>
                {Array.from({ length: 15 }, (_, index) => (
                  <SkeletonCard key={`skeleton-${index}`} index={index} />
                ))}
              </>
            ) : memes.length > 0 ? (
              // Show actual meme cards in masonry grid
              <>
                {memes.map((meme) => (
                  <MemeCard
                    key={meme.id}
                    meme={meme}
                    activeOptionsId={activeOptionsId}
                    onOptionsClick={handleOptionsClick}
                  />
                ))}
              </>
            ) : (
              // Show empty state
              <div className="col-span-full text-center py-8 sm:py-12 w-full">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bell className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No memes found</h3>
                  <p className="text-gray-500">Be the first to share something amazing!</p>
                </div>
              </div>
            )}
          </TrueMasonryGrid>
        )}
      </div>
    </div>
  )
}
