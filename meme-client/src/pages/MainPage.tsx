import type React from "react"
import { useEffect, useState } from "react"
import { Bell } from "lucide-react"
import { useMemeStore } from "../store/useMemeStore"
import { MemeCard } from "../components/mainPage/MemeCard"
import { useWebSocketStore } from "../hooks/useWebSockets"
import { useNavigate } from "react-router-dom"
import api from "../hooks/api"
import { ApiNotifications } from "../types/mems"

export const MainPage: React.FC = () => {
  const {
    memes,
    fetchMemes,
    isLoading,
    error,
    userName
  } = useMemeStore()
  
  const navigate = useNavigate()
  const [unreadCount, setUnreadCount] = useState(0)
  const { client: wsClient } = useWebSocketStore()

  // WebSocket connection is now handled in the Layout component

  // Fetch notifications to get unread count
  const fetchNotificationCount = async () => {
    try {
      if (!userName) return
      
      const response = await api.get(`/notifications/${userName}`)
      const unreadNotifications = response.data.filter((notification: ApiNotifications) => !notification.read)
      setUnreadCount(unreadNotifications.length)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  useEffect(() => {
    fetchMemes()
    if (userName) {
      fetchNotificationCount()
    }
  }, [fetchMemes, userName])
  
  // Handle WebSocket notifications
  useEffect(() => {
    const handleWebSocketMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data)
        // Handle all notification types
        if (data.type === 'FOLLOW' || data.type === 'FOLLOW_REQUEST' || 
            data.type === 'LIKE' || data.type === 'COMMENT') {
          // Refresh notification count when we receive any notification
          if (userName) {
            fetchNotificationCount()
          } else {
            // Fallback if userName is not available
            setUnreadCount(prev => prev + 1)
          }
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
      }
    }

    if (wsClient) {
      wsClient.addEventListener('message', handleWebSocketMessage)
      return () => {
        wsClient.removeEventListener('message', handleWebSocketMessage)
      }
    }
  }, [wsClient, userName])

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
                  navigate(`/notifications/${userName}`);
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
      <div className="mt-12 lg:mt-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="text-center text-red-600 p-4">{error}</div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:gap-6 md:gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {memes.map((meme) => (
              <MemeCard key={meme.id} meme={meme} />
            ))}
            {memes.length === 0 && (
              <div className="col-span-full text-center py-8 sm:py-12">
                <p className="text-gray-500 text-lg">No memes found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}