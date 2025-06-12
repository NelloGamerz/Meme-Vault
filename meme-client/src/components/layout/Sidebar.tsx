"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { Home, Search, PlusSquare, Settings, LogOut, User, Bell } from "lucide-react"
import { useAuth } from "../../hooks/useAuth"
import { Button } from "../ui/Button"
import { useUserStore } from "../../store/useUserStore"
import { useNotificationStore } from "../../store/useNotificationStore"
import { useWebSocketStore } from "../../hooks/useWebSockets"
// import { useWebSocketConnectionStore } from "../../store/useWebSocketConnectionStore"
import { Notification } from "../../types/mems"
import { getCurrentUser } from "../../utils/localStorageCache"
import { WebSocketMessage } from "../../services/WebSocketService"

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
  const fetchUserProfile = useUserStore.use.fetchUserProfile();
  const profilePictureUrl = useUserStore.use.profilePictureUrl();
  const notifications = useNotificationStore.use.notifications();
  const getNotifications = useNotificationStore.use.getNotifications();
  // const { client: wsClient } = useWebSocketStore();

  // Get user from cached localStorage once on component mount
  useEffect(() => {
    try {
      // Use the cached version instead of directly accessing localStorage
      const userData = getCurrentUser();
      
      // Make sure we have the profile picture from localStorage
      setUser({
        userId: userData.userId || "",
        username: userData.username || "",
        email: userData.email || "",
        profilePicture: userData.profilePicture || ""
      })
    } catch (error) {
      console.error("Error getting user from cache:", error)
    }
  }, [])

  // Use the loggedInUserProfile from the global state instead of fetching it again
  const loggedInUserProfile = useUserStore.use.loggedInUserProfile();
  const isLoggedInUserProfileLoaded = useUserStore.use.isLoggedInUserProfileLoaded();
  
  // Only fetch the profile if it's not already loaded in the global state
  useEffect(() => {
    if (user.userId && !profileFetched && !isLoggedInUserProfileLoaded) {
      // Fetch the logged-in user's profile to get their profile picture
      fetchUserProfile(user.username)
      setProfileFetched(true)
    } else if (user.userId && isLoggedInUserProfileLoaded && loggedInUserProfile) {
      // If the profile is already loaded in the global state, use it
      setProfileFetched(true)
    }
  }, [user.username, fetchUserProfile, profileFetched, user.userId, isLoggedInUserProfileLoaded, loggedInUserProfile])
  
  // Fetch notifications only once when component mounts or username changes
  useEffect(() => {
    if (user.username) {
      // Initial fetch only
      getNotifications(user.username)
    }
  }, [getNotifications, user.username])
  
  // We no longer need to explicitly restore the connection here
  // The WebSocketManager component handles this at the application level
  // This reduces duplicate connection checks across components

  // Listen for WebSocket notifications to update count in real-time without HTTP requests
  useEffect(() => {
    // Only register handlers if we have a user ID
    if (!user.userId) return;
    
    // Define a type for notification data
    interface NotificationData {
      type: string;
      senderUsername?: string;
      username?: string;
      followerUsername?: string;
      message?: string;
      memeId?: string;
      id?: string;
      senderId?: string;
      userId?: string;
      profilePictureUrl?: string;
      senderProfilePictureUrl?: string;
    }
    
    // Helper function to generate notification message based on type
    const getNotificationMessage = (data: NotificationData): string => {
      switch (data.type) {
        case 'FOLLOW':
          return `${data.senderUsername || data.username || data.followerUsername} started following you`
        case 'LIKE':
          return `${data.senderUsername || data.username} liked your meme`
        case 'COMMENT':
          return `${data.senderUsername || data.username} commented on your meme`
        default:
          return data.message || 'New notification'
      }
    }
    
    // Create a single handler for all notification types
    const handleNotification = (data: WebSocketMessage) => {
      // Cast the WebSocketMessage to our NotificationData type with recipient fields
      const notificationData = data as unknown as NotificationData & {
        recipientId?: string;
        recipientUsername?: string;
        receiverUsername?: string;
        targetUsername?: string;
      };
      // Only process notifications meant for the current user
      if ((notificationData.recipientId === user.userId || 
           notificationData.recipientUsername === user.username || 
           notificationData.receiverUsername === user.username || 
           notificationData.targetUsername === user.username)) {
        
        console.log('New notification received via WebSocket:', notificationData)
        
        // Directly increment the unread count without making an API call
        setUnreadCount(prevCount => prevCount + 1)
        
        // Add the notification to the store so it's available everywhere
        const newNotification: Partial<Notification> = {
          id: notificationData.id || crypto.randomUUID(),
          type: notificationData.type,
          message: notificationData.message || getNotificationMessage(notificationData),
          userId: notificationData.userId || notificationData.senderId,
          senderUsername: notificationData.username || notificationData.senderUsername,
          profilePictureUrl: notificationData.profilePictureUrl || notificationData.senderProfilePictureUrl,
          createdAt: new Date(),
          read: false,
          isRead: false,
          memeId: notificationData.memeId
        }
        
        // Add the notification to the store
        useNotificationStore.getState().addNotification(newNotification)
        
        // Dispatch a custom event to ensure all components are notified
        const notificationEvent = new CustomEvent('new-notification', {
          detail: { notification: newNotification }
        });
        window.dispatchEvent(notificationEvent);
      }
    };
    
    console.log('Registering WebSocket message handlers for notifications in Sidebar');
    
    // Register handlers for each notification type using the WebSocketService
    // This way, we don't need to worry about reconnections or client changes
    const unregisterHandlers = [
      useWebSocketStore.getState().registerMessageHandler('FOLLOW', handleNotification),
      useWebSocketStore.getState().registerMessageHandler('LIKE', handleNotification),
      useWebSocketStore.getState().registerMessageHandler('COMMENT', handleNotification),
      useWebSocketStore.getState().registerMessageHandler('NOTIFICATION', handleNotification)
    ];
    
    // Cleanup function
    return () => {
      console.log('Removing WebSocket message handlers for notifications in Sidebar');
      // Unregister all handlers
      unregisterHandlers.forEach(unregister => unregister());
    }
  }, [user.userId, user.username])
  
  // Set initial unread count from fetched notifications only once
  useEffect(() => {
    // Only set the initial count when notifications are first loaded and we haven't set it yet
    if (notifications.length > 0 && !initialCountSet) {
      const count = notifications.filter(notification => !notification.isRead && !notification.read).length
      setUnreadCount(count)
      setInitialCountSet(true)
    }
  }, [notifications, initialCountSet])
  
  // Update unread count whenever notifications change
  useEffect(() => {
    if (initialCountSet) {
      const count = notifications.filter(notification => !notification.isRead && !notification.read).length
      setUnreadCount(count)
    }
  }, [notifications, initialCountSet])
  
  // Listen for custom notification events from anywhere in the app
  useEffect(() => {
    const handleNewNotification = (event: Event) => {
      // Safely cast the event to CustomEvent
      const customEvent = event as CustomEvent<{ notification: Notification }>;
      
      if (customEvent.detail && customEvent.detail.notification) {
        const notification = customEvent.detail.notification;
        
        // Check if this notification is for the current user
        const user = getCurrentUser();
        
        // For custom events, we assume the notification is already filtered for the current user
        // The userId in the notification refers to the sender, not the recipient
        if (user.userId) {
          console.log('New notification event received in Sidebar:', notification);
          
          // Increment the unread count
          setUnreadCount(prevCount => prevCount + 1);
        }
      }
    };
    
    const handleNotificationsRead = (event: Event) => {
      // Safely cast the event to CustomEvent
      const customEvent = event as CustomEvent<{ count: number }>;
      
      if (customEvent.detail && typeof customEvent.detail.count === 'number') {
        console.log('Notifications read event received in Sidebar:', customEvent.detail.count);
        
        // Reset the unread count to zero
        setUnreadCount(0);
      }
    };
    
    // Add event listeners for custom notification events
    window.addEventListener('new-notification', handleNewNotification);
    window.addEventListener('notifications-read', handleNotificationsRead);
    
    // Clean up
    return () => {
      window.removeEventListener('new-notification', handleNewNotification);
      window.removeEventListener('notifications-read', handleNotificationsRead);
    };
  }, [])

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
    { 
      icon: Bell, 
      label: "Notifications", 
      path: `/notifications/${user.username}`,
      badge: unreadCount > 0 ? (unreadCount > 9 ? 9 : unreadCount) : undefined
    },
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
