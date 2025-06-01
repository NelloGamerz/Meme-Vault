// This file is now deprecated as the sidebar functionality has been integrated into Layout.tsx
// Keeping this file for reference but it's no longer used in the application

/**
 * Original Sidebar component - kept for reference
 * 
"use client"

import type React from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { Home, Search, PlusSquare, Settings, LogOut, User, X, Bell } from "lucide-react"
import { Button } from "../ui/Button"
import { useAuth } from "../../hooks/useAuth"
import { useMemeStore } from "../../store/useMemeStore"

interface SidebarProps {
  onClose?: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout } = useAuth()
  const { profilePictureUrl, userName } = useMemeStore()
  
  // Get user from localStorage
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}")
    } catch (error) {
      console.error("Error parsing user from localStorage:", error)
      return { userId: "", username: "" }
    }
  })()

  const handleLogout = async () => {
    await logout()
    navigate("/auth")
  }

  const handleNavigation = (path: string) => {
    navigate(path)
    onClose?.()
  }

  const isActive = (path: string) => location.pathname === path

  const menuItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Search, label: "Explore", path: "/explore" },
    { icon: PlusSquare, label: "Create with AI", path: "/create" },
    { icon: Bell, label: "Notifications", path: "/notifications", badge: 3 },
    { icon: Settings, label: "Settings", path: "/settings" },
  ]

  return (
    <div className="h-full w-80 bg-white/95 backdrop-blur-xl border-r border-gray-200/50 flex flex-col shadow-xl lg:shadow-none">
      // Header
      <div className="flex items-center justify-between p-6 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">M</span>
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
              MemeVault
            </h1>
            <p className="text-xs text-gray-500">Create & Share</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="lg:hidden hover:bg-gray-100">
          <X className="w-5 h-5" />
        </Button>
      </div>

      // User Profile Section
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          {profilePictureUrl ? (
            <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-blue-100">
              <img 
                src={profilePictureUrl} 
                alt={userName || user.username} 
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center ring-2 ring-blue-100">
              <span className="text-white font-semibold text-sm">
                {(userName || user.username || "U")
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 truncate">{userName || user.username}</p>
            <p className="text-sm text-gray-500 truncate">{user.email}</p>
          </div>
        </div>
      </div>

      // Navigation
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {menuItems.map((item) => (
            <Button
              key={item.path}
              variant={isActive(item.path) ? "primary" : "ghost"}
              onClick={() => handleNavigation(item.path)}
              className={`w-full justify-start h-12 px-4 ${
                isActive(item.path)
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25"
                  : "hover:bg-gray-100 text-gray-700"
              }`}
            >
              <item.icon className="w-5 h-5 mr-3" />
              <span className="font-medium">{item.label}</span>
              {item.badge && (
                <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                  {item.badge}
                </span>
              )}
            </Button>
          ))}
        </div>
      </nav>

      // Footer Actions
      <div className="p-4 border-t border-gray-100 space-y-2">
        <Button
          variant="ghost"
          onClick={() => handleNavigation(`/profile/${user.userId || ""}`)}
          className="w-full justify-start h-12 px-4 hover:bg-gray-100 text-gray-700"
        >
          <User className="w-5 h-5 mr-3" />
          <span className="font-medium">My Profile</span>
        </Button>
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start h-12 px-4 hover:bg-red-50 text-red-600 hover:text-red-700"
        >
          <LogOut className="w-5 h-5 mr-3" />
          <span className="font-medium">Logout</span>
        </Button>
      </div>
    </div>
  )
}
 */


"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { Home, Search, PlusSquare, Settings, LogOut, User, Bell } from "lucide-react"
import { useAuth } from "../../hooks/useAuth"
import { Button } from "../ui/Button"
import { useMemeStore } from "../../store/useMemeStore"
import { useWebSocketStore } from "../../hooks/useWebSockets"

interface SidebarProps {
  onNavigate: (path: string) => void
  currentPath: string
}

interface MenuItem {
  icon: React.ElementType
  label: string
  path: string
  badge?: number
}

interface UserData {
  userId: string
  username: string
  email?: string
  profilePicture?: string
}

export const Sidebar: React.FC<SidebarProps> = ({ onNavigate, currentPath }) => {
  // No longer need sidebar open state for mobile as we're removing the hamburger menu
  const [user, setUser] = useState<UserData>({ userId: "", username: "" })
  const [profileFetched, setProfileFetched] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [initialCountSet, setInitialCountSet] = useState(false)

  const { logout } = useAuth()
  const fetchUserProfile = useMemeStore(state => state.fetchUserProfile);
  const profilePictureUrl = useMemeStore(state => state.profilePictureUrl);
  const notifications = useMemeStore(state => state.notifications);
  const getNotifications = useMemeStore(state => state.getNotifications);
  const { client: wsClient } = useWebSocketStore();

  // Get user from localStorage once on component mount
  useEffect(() => {
    try {
      const userData = JSON.parse(localStorage.getItem("user") || "{}")
      
      // Make sure we have the profile picture from localStorage
      setUser({
        userId: userData.userId || "",
        username: userData.username || "",
        email: userData.email || "",
        profilePicture: userData.profilePicture || ""
      })
    } catch (error) {
      console.error("Error parsing user from localStorage:", error)
    }
  }, [])

  // Fetch user profile only once when component mounts and user is available
  useEffect(() => {
    if (user.userId && !profileFetched) {
      // Fetch the logged-in user's profile to get their profile picture
      fetchUserProfile(user.username)
      setProfileFetched(true)
    }
  }, [user.username, fetchUserProfile, profileFetched, user.userId])
  
  // Fetch notifications only once when component mounts or username changes
  useEffect(() => {
    if (user.username) {
      // Initial fetch only
      getNotifications(user.username)
    }
  }, [getNotifications, user.username])
  
  // Listen for WebSocket notifications to update count in real-time without HTTP requests
  useEffect(() => {
    const handleWebSocketMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data)
        
        // Only process notifications meant for the current user
        if ((data.recipientId === user.userId || data.recipientUsername === user.username) && 
            (data.type === 'FOLLOW' || data.type === 'FOLLOW_REQUEST' || 
             data.type === 'LIKE' || data.type === 'COMMENT')) {
          
          // Directly increment the unread count without making an API call
          setUnreadCount(prevCount => prevCount + 1)
          
          // Optionally, you can add the notification to the local state if needed
          // This would require modifying the useMemeStore to expose an addNotification method
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
      }
    }

    if (wsClient && user.userId) {
      wsClient.addEventListener('message', handleWebSocketMessage)
      return () => {
        wsClient.removeEventListener('message', handleWebSocketMessage)
      }
    }
  }, [wsClient, user.userId, user.username])
  
  // Set initial unread count from fetched notifications only once
  useEffect(() => {
    // Only set the initial count when notifications are first loaded and we haven't set it yet
    if (notifications.length > 0 && !initialCountSet) {
      const count = notifications.filter(notification => !notification.isRead && !notification.read).length
      setUnreadCount(count)
      setInitialCountSet(true)
    }
  }, [notifications, initialCountSet])

  const handleLogout = async () => {
    await logout()
    onNavigate("/auth")
  }

  const handleNavigation = useCallback(
    (path: string) => {
      onNavigate(path)
    },
    [onNavigate]
  )

  const isActive = useCallback((path: string) => currentPath === path, [currentPath])

  const menuItems: MenuItem[] = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Search, label: "Search", path: "/explore" },
    { icon: PlusSquare, label: "Create", path: "/create" },
    { 
      icon: Bell, 
      label: "Notifications", 
      path: `/notifications/${user.username}`,
      badge: unreadCount > 0 ? (unreadCount > 9 ? 9 : unreadCount) : undefined
    },
    { icon: Settings, label: "Settings", path: "/settings" },
  ]

  const bottomNavItems: MenuItem[] = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Search, label: "Search", path: "/explore" },
    { icon: PlusSquare, label: "Create", path: "/create" },
    // { 
    //   icon: Bell, 
    //   label: "Notifications", 
    //   path: `/notifications/${user.username}`,
    //   badge: unreadCount > 0 ? (unreadCount > 9 ? 9 : unreadCount) : undefined
    // },
    { icon: User, label: "Profile", path: `/profile/${user.username || ""}` },
  ]

  return (
    <>
      {/* Desktop Sidebar - Fixed position, hidden on mobile */}
      <div className="hidden lg:block fixed top-0 left-0 bottom-0 z-50">
      
        <div className="h-full w-64 bg-white border-r border-gray-100 flex flex-col">
          {/* Header */}
          <div className="flex items-center p-6">
            <h1 className="text-2xl font-bold text-blue-600">Meme Vault</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-6">
            <div className="space-y-1 px-3">
              {menuItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
                  className={`w-full flex items-center h-12 px-3 rounded-lg text-left font-normal border-0 
                    transition-all duration-200 ease-in-out transform 
                    hover:scale-[1.02] active:scale-[0.98] 
                    ${isActive(item.path) 
                      ? "text-black font-medium bg-blue-50" 
                      : "text-gray-700 hover:text-black hover:bg-gray-50"
                    }
                    hover:shadow-sm active:shadow-inner
                  `}
                >
                  <item.icon className={`w-6 h-6 mr-3 transition-all duration-200 
                    ${isActive(item.path) ? "stroke-[2] text-blue-600" : "stroke-[1.5]"}
                    group-hover:rotate-3
                  `} />
                  <span className="transition-all duration-200">{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full min-w-[20px] text-center
                      transition-all duration-200 hover:bg-red-600 active:bg-red-700">
                      {unreadCount > 9 ? "9+" : item.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </nav>

          {/* User Profile Section */}
          <div className="border-t border-gray-100 p-4">
            <button 
              onClick={() => handleNavigation(`/profile/${user.username || ""}`)}
              className="flex items-center space-x-3 mb-4 w-full text-left 
                transition-all duration-200 ease-in-out transform 
                hover:scale-[1.02] active:scale-[0.98] 
                hover:bg-gray-50 p-2 rounded-lg
                hover:shadow-sm active:shadow-inner"
            >
              {profilePictureUrl ? (
                <img
                  src={profilePictureUrl}
                  alt={user.username || "User"}
                  className="w-10 h-10 rounded-full object-cover border border-gray-200"
                  onError={(e) => {
                    e.currentTarget.onerror = null; // Prevent infinite loop
                    e.currentTarget.src = "/placeholder.svg";
                  }}
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center border border-gray-200">
                  <span className="text-gray-600 font-medium text-sm">
                    {(user.username || "U")
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-black text-sm truncate">{user.username}</p>
                <p className="text-gray-500 text-xs truncate">{user.email}</p>
              </div>
            </button>

            <div className="space-y-1">
              <button
                onClick={handleLogout}
                className="w-full flex items-center h-10 px-3 rounded-lg 
                  text-gray-700 hover:text-red-600 hover:bg-red-50 
                  transition-all duration-200 ease-in-out transform 
                  hover:scale-[1.02] active:scale-[0.98]
                  hover:shadow-sm active:shadow-inner"
              >
                <LogOut className="w-5 h-5 mr-3 transition-transform duration-200 group-hover:rotate-12" />
                <span className="text-sm transition-all duration-200">Log out</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation (Mobile Only) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40">
        <div className="bg-white border-t border-gray-200">
          <div className="flex items-center justify-around py-2">
            {bottomNavItems.map((item) => (
              <Button
                key={item.path}
                variant="ghost"
                onClick={() => handleNavigation(item.path)}
                className={`flex flex-col items-center justify-center h-12 w-12 relative border-0 shadow-none 
                  transition-all duration-200 ease-in-out transform 
                  hover:scale-110 active:scale-95
                  hover:bg-gray-50 active:bg-gray-100 rounded-full
                  ${isActive(item.path) ? "text-blue-600 font-medium" : "text-gray-500"}
                `}
              >
                {item.path.includes('/profile') ? (
                  profilePictureUrl ? (
                    <div className="w-6 h-6 rounded-full overflow-hidden transition-all duration-200 hover:ring-2 hover:ring-blue-200">
                      <img
                        src={profilePictureUrl}
                        alt={user.username || "User"}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                        onError={(e) => {
                          e.currentTarget.onerror = null; // Prevent infinite loop
                          e.currentTarget.src = "/placeholder.svg";
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center transition-all duration-200 hover:bg-blue-100">
                      <span className="text-gray-600 font-medium text-xs transition-all duration-200">
                        {(user.username || "U")
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")}
                      </span>
                    </div>
                  )
                ) : (
                  <item.icon className={`w-6 h-6 transition-all duration-200 
                    ${isActive(item.path) ? "stroke-[2] text-blue-600" : "stroke-[1.5]"}
                  `} />
                )}
                {item.badge && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs min-w-5 h-5 px-1 rounded-full flex items-center justify-center font-medium">
                    {unreadCount > 9 ? "9+" : item.badge}
                  </span>
                )}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
