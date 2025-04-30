import { create } from "zustand"
import api from "../hooks/api"
import { Client } from "@stomp/stompjs";
import type { Meme, ApiMeme, Comment, User, Followers, Following, ApiFollowers, ApiFollowing } from "../types/mems"
import type { AxiosProgressEvent } from "axios"
// import SockJS from "sockjs-client";

let wsClient: WebSocket | null = null
let stompClient: Client | null = null;
let currentMemeId: string | null = null;

interface MemeStore {
  isFollowing?: boolean
  memes: Meme[]
  userMemes: Meme[]
  likedMemes: Meme[]
  profilePictureUrl: string
  userName: string
  savedMemes: Meme[]
  Followers: Followers[]
  Following: Following[]
  followingCount: number
  followersCount: number
  currentPage: "home" | "profile"
  selectedMeme: Meme | null
  isLoading: boolean
  error: string | null
  uploadProgress: number | null
  searchQuery: string
  userCreated: Date
  fetchMemes: () => Promise<void>
  searchMemes: (query: string) => Promise<void>
  fetchMemeById: (id: string) => Promise<Meme | null>
  fetchUserMemes: (username: string) => Promise<void>
  fetchLikedMemes: (username: string) => Promise<void>
  fetchSavedMemes: (username: string) => Promise<void>
  fetchUserProfile: (userId: string) => Promise<void>
  toggleLike: (id: string, username: string) => Promise<void>
  toggleSave: (id: string, username: string) => Promise<void>
  setPage: (page: "home" | "profile") => void
  setSelectedMeme: (meme: Meme | null) => void
  setSearchQuery: (query: string) => void
  addComment: (
    memeId: string,
    username: string,
    text: string,
    profilePictureUrl: string,
    userId: string,
  ) => Promise<void>
  uploadMeme: (file: File, title: string, profilePictureUrl: string, username: string) => Promise<void>
  updateProfilePicture: (file: File, userId: string) => Promise<void>
  updateUserName: (userId: string, newUsername: string) => Promise<void>
  deleteMeme: (id: string) => Promise<void>
  handleFollowToggle: (followingUser: string, isFollowing: boolean) => Promise<void>
  connectToWebSocket: (memeId: string) => void
  disconnectWebSocket: () => void
  wsClient: WebSocket | null
  
}

const mapApiMemeToMeme = (apiMeme: ApiMeme): Meme => ({
  id: apiMeme.id,
  url: apiMeme.mediaUrl,
  title: apiMeme.caption,
  uploadedBy: apiMeme.uploadedby,
  uploadDate: new Date(),
  comments: apiMeme.comments || [],
  likeCount: apiMeme.likecount,
  saveCount: apiMeme.saveCount,
  uploader: apiMeme.uploader,
  memeCreated: apiMeme.memeCreated,
  profilePictureUrl: apiMeme.profilePictureUrl,
  userId: apiMeme.userId,
})

// Helper function to get user from localStorage
const getUserFromLocalStorage = (): {
  userId: string
  username: string
  profilePicture?: string
  name?: string
} => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}")
  } catch (error) {
    console.error("Error parsing user from localStorage:", error)
    return {
      userId: "",
      username: "",
    }
  }
}

// Helper function to remove from localStorage
const removeFromLocalStorage = (key: string): void => {
  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.error(`Error removing ${key} from localStorage:`, error)
  }
}

// Helper function to set in localStorage
const setInLocalStorage = (key: string, value: unknown): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error(`Error setting ${key} in localStorage:`, error)
  }
}

// Get WebSocket server URL from environment or use default
const WS_URL = "https://meme-vault.onrender.com/ws"

export const useMemeStore = create<MemeStore>((set, get) => ({
  memes: [],
  userMemes: [],
  likedMemes: [],
  savedMemes: [],
  Followers: [],
  Following: [],
  followersCount: 0,
  followingCount: 0,
  currentPage: "home",
  selectedMeme: null,
  isLoading: false,
  error: null,
  uploadProgress: null,
  searchQuery: "",
  profilePictureUrl: "",
  userName: "",
  userCreated: new Date(),
  wsClient: null,

  connectToWebSocket: (memeId: string) => {
    if (stompClient && stompClient.active) {
      stompClient.deactivate();
      stompClient = null;
    }
  
    currentMemeId = memeId;
  
    const token = localStorage.getItem("token"); // Or use however you're storing the token
  
    stompClient = new Client({
      brokerURL: `${WS_URL}?token=${token}`, // 👈 Append token here
      reconnectDelay: 5000,
      onConnect: () => {
        console.log(`WebSocket connection established for meme ${memeId}`);
  
        stompClient?.subscribe(`/topic/meme/${memeId}`, (message) => {
          if (message.body) {
            try {
              const data = JSON.parse(message.body);
  
              if (data.memeId === currentMemeId) {
                const newComment = data;
  
                set((state) => {
                  const updateMemeInArray = (memes: Meme[]): Meme[] =>
                    memes.map((meme) =>
                      meme.id === data.memeId
                        ? { ...meme, comments: [...(meme.comments || []), newComment] }
                        : meme
                    );
  
                  return {
                    memes: updateMemeInArray(state.memes),
                    userMemes: updateMemeInArray(state.userMemes),
                    likedMemes: updateMemeInArray(state.likedMemes),
                    savedMemes: updateMemeInArray(state.savedMemes),
                  };
                });
              }
            } catch (error) {
              console.error("Error parsing WebSocket message:", error);
            }
          }
        });
  
        // ✅ Save native WebSocket
        set({ wsClient: stompClient?.webSocket as WebSocket });
      },
      onStompError: (frame) => {
        console.error("Broker reported error:", frame.headers["message"]);
        console.error("Additional details:", frame.body);
      },
      onWebSocketError: (error) => {
        console.error("WebSocket error:", error);
      },
      onDisconnect: () => {
        console.log(`WebSocket connection closed for meme ${memeId}`);
      },
    });
  
    stompClient.activate();
  },
  
  // Disconnect WebSocket
  disconnectWebSocket: () => {
    if (wsClient) {
      wsClient.close()
      wsClient = null
      currentMemeId = null
      set({ wsClient: null })
    }
  },

  setSearchQuery: (query: string) => set({ searchQuery: query }),

  searchMemes: async (query: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.get<ApiMeme[]>("/memes/search", {
        params: { query },
      })
      const memes = response.data || []

      set({
        memes: Array.isArray(memes) ? memes.map(mapApiMemeToMeme) : [],
        searchQuery: query,
      })
    } catch (error) {
      set({
        error: "Failed to search memes",
        memes: [],
      })
      console.error("Error searching memes:", error)
    } finally {
      set({ isLoading: false })
    }
  },

  fetchMemes: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.get<ApiMeme[]>("/memes")
      const memes = response.data || []

      set({
        memes: Array.isArray(memes) ? memes.map(mapApiMemeToMeme) : [],
      })
    } catch (error) {
      set({
        error: "Failed to fetch memes",
        memes: [],
      })
      console.error("Error fetching memes:", error)
    } finally {
      set({ isLoading: false })
    }
  },

  fetchMemeById: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      const memeResponse = await api.get<ApiMeme>(`/memes/memepage/${id}`)
      const meme = memeResponse.data

      if (meme) {
        const commentsResponse = await api.get<Comment[]>(`/memes/${id}/comments`)
        const comments = commentsResponse.data || []

        const mappedMeme = {
          ...mapApiMemeToMeme(meme),
          comments: comments,
        }

        return mappedMeme
      }
      return null
    } catch (error) {
      set({
        error: "Failed to fetch meme",
      })
      console.error("Error fetching meme by ID:", error)
      return null
    } finally {
      set({ isLoading: false })
    }
  },

  fetchUserMemes: async (username: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.get<ApiMeme[]>(`/memes/uploaded/${username}`)
      const memes = response.data || []

      set({
        userMemes: Array.isArray(memes) ? memes.map(mapApiMemeToMeme) : [],
      })
    } catch (error) {
      set({
        error: "Failed to fetch user memes",
        userMemes: [],
      })
      console.error("Error fetching user memes:", error)
    } finally {
      set({ isLoading: false })
    }
  },

  fetchLikedMemes: async (username: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.get<ApiMeme[]>(`/memes/liked/${username}`)
      const memes = response.data || []

      set({
        likedMemes: Array.isArray(memes) ? memes.map(mapApiMemeToMeme) : [],
      })
    } catch (error) {
      set({
        error: "Failed to fetch liked memes",
        likedMemes: [],
      })
      console.error("Error fetching liked memes:", error)
    } finally {
      set({ isLoading: false })
    }
  },

  fetchSavedMemes: async (username: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.get<ApiMeme[]>(`/memes/saved/${username}`)
      const memes = response.data || []

      set({
        savedMemes: Array.isArray(memes) ? memes.map(mapApiMemeToMeme) : [],
      })
    } catch (error) {
      set({
        error: "Failed to fetch saved memes",
        savedMemes: [],
      })
      console.error("Error fetching saved memes:", error)
    } finally {
      set({ isLoading: false })
    }
  },

  fetchUserProfile: async (userId: string) => {
    set({ isLoading: true, error: null })

    try {
      const response = await api.get<{
        profilePictureUrl: string
        savedMemes: ApiMeme[]
        followers: Followers[]
        memeList: ApiMeme[]
        likedMemes: ApiMeme[]
        following: Following[]
        followersCount: number
        followingCount: number
        username: string
        userId: string
        userCreated: string
      }>(`/profile/${userId}`)

      const data = response.data

      // Function to map memes
      const mapToMeme = (memes: ApiMeme[]): Meme[] =>
        memes.map((meme) => ({
          id: meme.id,
          url: meme.mediaUrl,
          title: meme.caption,
          uploader: meme.uploader,
          likeCount: meme.likecount,
          saveCount: meme.saveCount,
          createdAt: meme.memeCreated ? new Date(meme.memeCreated) : new Date(),
          comments: meme.comments || [],
          profilePictureUrl: meme.profilePictureUrl,
          userId: meme.userId,
        }))

      const mapToFollowers = (followers: ApiFollowers[]): Followers[] =>
        followers.map((follower) => ({
          userId: follower.userId,
          username: follower.username || "",
          profilePictureUrl: follower.profilePictureUrl || "",
          isFollow: follower.isFollow,
        }))

      const mapToFollowing = (following: ApiFollowing[]): Following[] =>
        following.map((followingUser) => ({
          userId: followingUser.userId,
          username: followingUser.username || "",
          profilePictureUrl: followingUser.profilePictureUrl || "",
          isFollow: followingUser.isFollow,
        }))

      // Function to map user profile data with followers & following embedded
      const mapToUser = (userData: {
        userId: string
        username: string
        profilePictureUrl: string
        followersCount: number
        followingCount: number
        userCreated: string
        followers: Followers[]
        following: Following[]
      }): User => ({
        userId: userData.userId,
        username: userData.username || "",
        profilePictureUrl: userData.profilePictureUrl || "",
        followersCount: userData.followersCount || 0,
        followingCount: userData.followingCount || 0,
        userCreated: new Date(userData.userCreated),
        followers: mapToFollowers(userData.followers),
        following: mapToFollowing(userData.following),
        memeList: [],
        likedMeme: [],
        savedMeme: [],
      })

      // Map data using respective functions
      const userProfile = mapToUser(data)
      const userMemes = mapToMeme(data.memeList || [])
      const likedMemes = mapToMeme(data.likedMemes || [])
      const savedMemes = mapToMeme(data.savedMemes || [])

      set({
        // User Data
        userName: userProfile.username,
        profilePictureUrl: userProfile.profilePictureUrl,
        userCreated: userProfile.userCreated,
        Followers: userProfile.followers,
        Following: userProfile.following,
        followersCount: userProfile.followersCount,
        followingCount: userProfile.followingCount,

        // Meme Data
        userMemes,
        likedMemes,
        savedMemes,
      })
    } catch (error) {
      set({
        error: "Failed to fetch user data",
        userMemes: [],
        likedMemes: [],
        savedMemes: [],
      })
      console.error("Error fetching user data:", error)
    } finally {
      set({ isLoading: false })
    }
  },

  uploadMeme: async (file: File, title: string, profilePictureUrl: string) => {
    const user = getUserFromLocalStorage()
    const token = localStorage.getItem('token')
    set({ uploadProgress: 0, error: null })
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("title", title)
      formData.append("uploader", user.username || user.name || "Anonymous")
      formData.append("profilePictureUrl", profilePictureUrl)
      formData.append("userId", user.userId || "Anonymous")

      const response = await api.post<ApiMeme>("/memes", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          "Authorization": `Bearer ${token}`
        },
        onUploadProgress: (progressEvent: AxiosProgressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            set({ uploadProgress: progress })
          }
        },
      })

      const newMeme = mapApiMemeToMeme(response.data)
      set((state) => ({
        memes: [newMeme, ...state.memes],
        userMemes: [newMeme, ...state.userMemes],
        uploadProgress: null,
      }))
    } catch (error) {
      set({
        error: "Failed to upload meme",
        uploadProgress: null,
      })
      console.error("Error uploading meme:", error)
    }
  },

  deleteMeme: async (id: string) => {
    const user = getUserFromLocalStorage()
    set({ isLoading: true, error: null })
    try {
      await api.delete(`/memes/delete/${id}`)

      // Update local state to remove the deleted meme
      set((state) => ({
        memes: state.memes.filter((meme) => meme.id !== id),
        userMemes: state.userMemes.filter((meme) => meme.id !== id),
      }))

      // Refresh user data to ensure everything is in sync
      if (user.userId) {
        await get().fetchUserProfile(user.userId)
      }
    } catch (error) {
      set({ error: "Failed to delete meme" })
      console.error("Error deleting meme:", error)
      throw error // Rethrow to handle in component
    } finally {
      set({ isLoading: false })
    }
  },

  updateProfilePicture: async (file: File, userId: string) => {
    set({ isLoading: true, error: null })

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await api.post<{ profilePictureUrl: string }>(`profile/upload/${userId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      // Update the profile picture in local storage
      const user = getUserFromLocalStorage()
      user.profilePicture = response.data.profilePictureUrl
      setInLocalStorage("user", user)
    } catch (error: unknown) {
      let errorMessage = "Failed to update profile picture"

      if (error instanceof Error) {
        errorMessage = error.message
      } else if (
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof (error as { response?: { data?: { error?: string } } }).response === "object"
      ) {
        const serverError = (error as { response: { data?: { error?: string } } }).response.data
        errorMessage = serverError?.error ?? errorMessage
      }

      set({ error: errorMessage })
      console.error("Error updating profile picture:", errorMessage)
    } finally {
      set({ isLoading: false })
    }
  },

  toggleLike: async (id: string, username: string) => {
    try {
      const isLiked = get().likedMemes.some((meme) => meme.id === id)

      await api.post(`/memes/${id}/like`, null, {
        params: { username, like: !isLiked },
      })

      const user = getUserFromLocalStorage()
      if (user.username) {
        get().fetchLikedMemes(user.username)
      }
    } catch (error) {
      console.error("Error toggling like:", error)
    }
  },

  toggleSave: async (id: string, username: string) => {
    try {
      const isSaved = get().savedMemes.some((meme) => meme.id === id)

      await api.post(`/memes/${id}/save`, null, {
        params: { username, save: !isSaved },
      })

      const user = getUserFromLocalStorage()
      if (user.username) {
        get().fetchSavedMemes(user.username)
      }
    } catch (error) {
      console.error("Error toggling save:", error)
    }
  },

  setPage: (page) => set({ currentPage: page }),
  setSelectedMeme: (meme) => set({ selectedMeme: meme }),

  addComment: async (memeId: string, username: string, text: string, profilePictureUrl: string, userId: string) => {
    try {
      if (!stompClient || !stompClient.connected) {
        console.error("WebSocket not connected. Cannot add comment.")
        return
      }
  
      const comment = {
        memeId,
        username,
        text,
        profilePictureUrl,
        userId,
        createdAt: new Date(),
      }
  
      stompClient.publish({
        destination: "/app/comment",
        body: JSON.stringify(comment),
      })
  
    } catch (error) {
      console.error("Error adding comment via WebSocket:", error)
    }
  },
  

  updateUserName: async (userId: string, newUsername: string) => {
    set({ isLoading: true, error: null })

    try {
      const response = await api.put(`/profile/${userId}/update-username`, {
        newUsername: newUsername,
      })

      if (response.status === 200) {
        const { newToken } = response.data // Extract new token

        set({ userName: newUsername })

        // Get existing user data from localStorage
        const storedUser = localStorage.getItem("user")

        if (storedUser) {
          const user = JSON.parse(storedUser)
          user.username = newUsername // Update username
          setInLocalStorage("user", user) // Save updated user back to localStorage
        }

        // Replace the old token with the new one
        removeFromLocalStorage("token") // Remove old token
        setInLocalStorage("token", newToken) // Save new token

        console.log("Username updated and token refreshed.")
      }
    } catch (error) {
      set({ error: "Failed to update username" })
      console.error("Error updating username:", error)
    } finally {
      set({ isLoading: false })
    }
  },

  handleFollowToggle: async (followingUser: string, isFollowing: boolean) => {
    const loggedInUser = getUserFromLocalStorage()
    set({ isLoading: true, error: null })

    try {
      await api.post(`/profile/${loggedInUser.userId}/follow/${followingUser}`, {
        isFollowing: isFollowing,
      })
      console.log("Follow request sent to backend.")
    } catch (error) {
      set({ error: "Failed to toggle follow status" })
      console.error("Error sending follow request:", error)
    } finally {
      set({ isLoading: false })
    }
  },
}))
