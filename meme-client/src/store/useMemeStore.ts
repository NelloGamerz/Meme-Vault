import { create } from "zustand";
import api from "../hooks/api";
import { useWebSocketStore } from "../hooks/useWebSockets";
import type { WebSocketMessageType } from "../services/WebSocketService";
import type {
  Meme,
  ApiMeme,
  Comment,
  Followers,
  Following,
  ApiFollowers,
  ApiFollowing,
  Notification,
} from "../types/mems";
import type { AxiosProgressEvent } from "axios";

// Track the current meme being viewed
let currentMemeId: string | null = null;
let lastJoinedPostId: string | null = null;

// Define a user profile interface
interface UserProfile {
  userId: string;
  username: string;
  profilePictureUrl: string;
  followersCount: number;
  followingCount: number;
  userCreated: Date;
  followers: Followers[];
  following: Following[];
}

interface MemeStore {
  isFollowing?: boolean;
  memes: Meme[];
  userMemes: Meme[];
  likedMemes: Meme[];
  profilePictureUrl: string;
  userName: string;
  viewedProfilePictureUrl: string;
  viewedUserName: string;
  savedMemes: Meme[];
  Followers: Followers[];
  Following: Following[];
  notifications: Notification[];
  followingCount: number;
  followersCount: number;
  selectedMeme: Meme | null;
  isLoading: boolean;
  error: string | null;
  uploadProgress: number | null;
  searchQuery: string;
  userCreated: Date;
  // User profile state
  loggedInUserProfile: UserProfile | null;
  isLoggedInUserProfileLoaded: boolean;
  // Profile cache to store previously loaded profiles
  profileCache: Record<string, {
    profile: UserProfile;
    memes: Meme[];
    timestamp: number;
  }>;
  // WebSocket related properties
  wsMessageHandler: ((event: MessageEvent) => void) | null;
  wsUnsubscribe: (() => void) | null;
  // Methods
  fetchMemes: () => Promise<void>;
  searchMemes: (query: string) => Promise<void>;
  fetchMemeById: (id: string) => Promise<Meme | null>;
  fetchUserMemes: (username: string) => Promise<void>;
  fetchLikedMemes: (username: string) => Promise<void>;
  fetchSavedMemes: (username: string) => Promise<void>;
  fetchUserProfile: (username: string) => Promise<void>;
  toggleLike: (id: string, username: string) => Promise<void>;
  toggleSave: (id: string, username: string) => Promise<void>;
  setSelectedMeme: (meme: Meme | null) => void;
  setSearchQuery: (query: string) => void;
  addComment: (
    memeId: string,
    username: string,
    text: string,
    profilePictureUrl: string,
    userId: string
  ) => Promise<void>;
  uploadMeme: (
    file: File,
    title: string,
    profilePictureUrl: string,
    username: string
  ) => Promise<void>;
  updateProfilePicture: (file: File, userId: string) => Promise<void>;
  updateUserName: (userId: string, newUsername: string) => Promise<void>;
  deleteMeme: (id: string) => Promise<void>;
  handleFollowToggle: (
    isFollowing: boolean
  ) => Promise<void>;
  disconnectWebSocket: () => void;
  connectWebSocket: () => void;
  joinPostSession: (memeId: string) => void;
  leavePostSession: (memeId: string) => void;
  getNotifications: (username : string) => void;
  addNotification: (notification: Partial<Notification>) => void;
  updateMemeStats: (memeId: string, stats: { likes?: number, saves?: number }) => void;
  updateCommentInStore: (comment: Comment) => void;
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
});

const getUserFromLocalStorage = (): {
  userId: string;
  username: string;
  profilePicture?: string;
  name?: string;
} => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch (error) {
    console.error("Error parsing user from localStorage:", error);
    return {
      userId: "",
      username: "",
    };
  }
};

const removeFromLocalStorage = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing ${key} from localStorage:`, error);
  }
};

const setInLocalStorage = (key: string, value: unknown): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error setting ${key} in localStorage:`, error);
  }
};

export const useMemeStore = create<MemeStore>((set, get) => ({
  memes: [],
  userMemes: [],
  likedMemes: [],
  savedMemes: [],
  Followers: [],
  Following: [],
  notifications: [],
  followersCount: 0,
  followingCount: 0,
  currentPage: "home",
  selectedMeme: null,
  isLoading: false,
  error: null,
  uploadProgress: null,
  searchQuery: "",
  profilePictureUrl: "",
  userName: getUserFromLocalStorage().username || "",
  viewedProfilePictureUrl: "",
  viewedUserName: "",
  userCreated: new Date(),
  // User profile state
  loggedInUserProfile: null,
  isLoggedInUserProfileLoaded: false,
  // Profile cache to store previously loaded profiles
  profileCache: {},
  wsMessageHandler: null,
  wsUnsubscribe: null,

  connectWebSocket: () => {
    // Get the WebSocket store from the centralized store
    const wsStore = useWebSocketStore.getState();
    
    // If we don't have a connection, try to establish one
    if (!wsStore.isConnected) {
      console.log("No active WebSocket connection, attempting to connect via WebSocketStore");
      wsStore.restoreConnection();
      
      // Set up a retry mechanism with multiple attempts
      let retryCount = 0;
      const maxRetries = 5;
      const retryInterval = 1000; // 1 second
      
      const checkConnection = () => {
        const updatedWsStore = useWebSocketStore.getState();
        if (updatedWsStore.isConnected) {
          console.log("WebSocket connection established after retry, setting up handlers");
          
          // Register message handlers
          registerMessageHandlers();
          
          // If we were previously viewing a meme, rejoin that session
          if (lastJoinedPostId) {
            get().joinPostSession(lastJoinedPostId);
          }
        } else {
          retryCount++;
          if (retryCount < maxRetries) {
            console.log(`WebSocket connection not ready, retry attempt ${retryCount}/${maxRetries}`);
            setTimeout(checkConnection, retryInterval);
          } else {
            console.log("Max retries reached, WebSocket connection failed");
          }
        }
      };
      
      // Start checking after a short delay
      setTimeout(checkConnection, retryInterval);
      
      return;
    }
    
    // If we have an active connection, set up message handling for meme-specific events
    if (wsStore.isConnected) {
      console.log("Using existing WebSocket connection from WebSocketStore");
      
      // Register message handlers
      registerMessageHandlers();
      
      // If we were previously viewing a meme, rejoin that session
      if (lastJoinedPostId) {
        get().joinPostSession(lastJoinedPostId);
      }
    }
    
    // Helper function to register message handlers with the WebSocketStore
    function registerMessageHandlers() {
      // Clean up any existing message handler subscriptions
      const { wsUnsubscribe } = get();
      if (wsUnsubscribe) {
        wsUnsubscribe();
      }
      
      // Set up a subscription to the WebSocketStore to handle connection changes
      const connectionUnsubscribe = useWebSocketStore.subscribe((state) => {
        // If we reconnected and were viewing a meme, rejoin that session
        if (state.isConnected && lastJoinedPostId) {
          get().joinPostSession(lastJoinedPostId);
        }
      });
      
      // Register handlers for each message type we're interested in
      const commentHandler = useWebSocketStore.getState().registerMessageHandler('COMMENT', (data) => {
        if (data.memeId) {
          const newComment: Comment = {
            id: data.id as string,
            memeId: data.memeId as string,
            userId: data.userId as string,
            text: data.text as string,
            username: data.username as string,
            createdAt: data.createdAt as string,
            profilePictureUrl: data.profilePictureUrl as string,
          };

          set((state) => {
            const updateMemeInArray = (memes: Meme[]): Meme[] =>
              memes.map((meme) =>
                meme.id === data.memeId
                  ? {
                      ...meme,
                      comments: [...(meme.comments || []), newComment],
                    }
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
      });
      
      const likeHandler = useWebSocketStore.getState().registerMessageHandler('LIKE', (data) => {
        if (data.memeId) {
          set((state) => {
            const updateLikeCount = (arr: Meme[]) =>
              arr.map((meme) =>
                meme.id === data.memeId
                  ? { ...meme, likeCount: Number(data.likeCount) }
                  : meme
              );

            let likedMemes = state.likedMemes;
            const user = getUserFromLocalStorage();
            if (data.likedUserIds && user.username) {
              const memeObj =
                state.memes.find((m) => m.id === data.memeId) ||
                state.userMemes.find((m) => m.id === data.memeId) ||
                state.savedMemes.find((m) => m.id === data.memeId);
              likedMemes = (data.likedUserIds as string[]).includes(user.username)
                ? memeObj
                  ? [
                      ...state.likedMemes.filter((m) => m.id !== data.memeId),
                      memeObj,
                    ]
                  : state.likedMemes
                : state.likedMemes.filter((m) => m.id !== data.memeId);
            }

            return {
              memes: updateLikeCount(state.memes),
              userMemes: updateLikeCount(state.userMemes),
              savedMemes: updateLikeCount(state.savedMemes),
              likedMemes,
            };
          });
        }
      });
      
      const saveHandler = useWebSocketStore.getState().registerMessageHandler('SAVE', (data) => {
        if (data.memeId) {
          set((state) => {
            const updateSaveCount = (arr: Meme[]) =>
              arr.map((meme) =>
                meme.id === data.memeId
                  ? { ...meme, saveCount: Number(data.saveCount) }
                  : meme
              );

            let savedMemes = state.savedMemes;
            const user = getUserFromLocalStorage();
            if (data.savedUserIds && user.username) {
              const memeObj = state.memes.find((m) => m.id === data.memeId);
              savedMemes = (data.savedUserIds as string[]).includes(user.username)
                ? memeObj
                  ? [
                      ...state.savedMemes.filter((m) => m.id !== data.memeId),
                      memeObj,
                    ]
                  : state.savedMemes
                : state.savedMemes.filter((m) => m.id !== data.memeId);
            }

            return {
              memes: updateSaveCount(state.memes),
              userMemes: updateSaveCount(state.userMemes),
              likedMemes: updateSaveCount(state.likedMemes),
              savedMemes,
            };
          });
        }
      });
      
      const followHandler = useWebSocketStore.getState().registerMessageHandler('FOLLOW', (data) => {
        const user = getUserFromLocalStorage();
        console.log("WebSocket FOLLOW event received:", data);
        
        // Update followers and following counts
        if (data.followingUsername === user.username) {
          // Someone followed/unfollowed the current user
          console.log("Someone followed/unfollowed the current user:", data.followerUsername);
          
          set((state) => {
            // Check if we're viewing the profile of the user who just followed/unfollowed us
            const isViewingFollowerProfile = data.followerUsername === state.viewedUserName;
            
            // Update the Following list if we're viewing the profile of the user who just followed/unfollowed us
            const updatedFollowing = isViewingFollowerProfile
              ? (data.isFollowing
                  ? [
                      ...state.Following.filter(
                        (f) => f.userId !== data.followerId
                      ),
                      {
                        userId: String(data.followerId),
                        username: String(data.followerUsername),
                        profilePictureUrl: String(data.profilePictureUrl || ""),
                        isFollow: Boolean(data.isFollowing),
                      } as Following,
                    ]
                  : state.Following.filter(
                      (f) => f.userId !== data.followerId
                    ))
              : state.Following;
            
            return {
              // Only update the followers count, not the following count
              followersCount: data.isFollowing
                ? state.followersCount + 1
                : Math.max(0, state.followersCount - 1),
              Followers: data.isFollowing
                ? [
                    ...state.Followers.filter(
                      (f) => f.userId !== data.followerId
                    ),
                    {
                      userId: String(data.followerId),
                      username: String(data.followerUsername),
                      profilePictureUrl: String(data.profilePictureUrl || ""),
                      isFollow: Boolean(data.isFollowing),
                    } as Followers,
                  ]
                : state.Followers.filter(
                    (f) => f.userId !== data.followerId
                  ),
              Following: updatedFollowing,
            };
          });
        }

        if (data.followerUsername === user.username) {
          // Current user followed/unfollowed someone
          console.log("Current user followed/unfollowed someone:", data.followingUsername);
          
          set((state) => {
            // Check if we're viewing the profile of the user we just followed/unfollowed
            const isViewingFollowedProfile = data.followingUsername === state.viewedUserName;
            
            // If we're viewing the profile of the user we just followed/unfollowed,
            // we need to update the followers count and list
            const newFollowersCount = isViewingFollowedProfile
              ? (data.isFollowing
                  ? state.followersCount + 1
                  : Math.max(0, state.followersCount - 1))
              : state.followersCount;
            
            // Update the Followers list if we're viewing the profile of the user we just followed/unfollowed
            const updatedFollowers = isViewingFollowedProfile
              ? (data.isFollowing
                  ? [
                      ...state.Followers.filter(
                        (f) => f.userId !== user.userId
                      ),
                      {
                        userId: String(user.userId),
                        username: String(user.username),
                        profilePictureUrl: String(user.profilePicture || ""),
                        isFollow: Boolean(data.isFollowing),
                      } as Followers,
                    ]
                  : state.Followers.filter(
                      (f) => f.userId !== user.userId
                    ))
              : state.Followers;
            
            return {
              // Only update the followers count, not the following count
              followersCount: newFollowersCount,
              Following: data.isFollowing
                ? [
                    ...state.Following.filter(
                      (f) => f.userId !== data.followingId
                    ),
                    {
                      userId: String(data.followingId || ""),
                      username: String(data.followingUsername),
                      profilePictureUrl: String(data.profilePictureUrl || ""),
                      isFollow: Boolean(data.isFollowing),
                    } as Following,
                  ]
                : state.Following.filter(
                    (f) => f.userId !== data.followingId
                  ),
              Followers: updatedFollowers,
              isFollowing: isViewingFollowedProfile
                ? Boolean(data.isFollowing)  // Update isFollowing based on the viewed profile
                : state.isFollowing,
            };
          });
        }
      });
      
      const notificationHandler = useWebSocketStore.getState().registerMessageHandler('NOTIFICATION', (data) => {
        // Handle notification
        get().addNotification(data);
      });
      
      // Store all unsubscribe functions for cleanup
      const unsubscribeFunctions = () => {
        connectionUnsubscribe();
        commentHandler();
        likeHandler();
        saveHandler();
        followHandler();
        notificationHandler();
      };
      
      // Store the unsubscribe function for cleanup
      set({ wsUnsubscribe: unsubscribeFunctions });
    }
  },

  disconnectWebSocket: () => {
    // Get the current state
    const { wsUnsubscribe } = get();
    
    // Leave any active meme session
    if (currentMemeId) {
      // Use the centralized WebSocketStore to send the leave message
      useWebSocketStore.getState().sendLeavePostRequest(currentMemeId);
    }
    
    // Unsubscribe from WebSocketStore updates
    if (wsUnsubscribe) {
      wsUnsubscribe();
    }
    
    // Reset WebSocket-related state
    set({ 
      wsMessageHandler: null,
      wsUnsubscribe: null
    });
    
    // Reset the current meme ID
    currentMemeId = null;
    lastJoinedPostId = null;
    
    // Note: We don't actually close the WebSocket connection here
    // since it's managed by the WebSocketStore at the app level
  },

  joinPostSession: (postId: string) => {
    const wsStore = useWebSocketStore.getState();
    
    if (wsStore.isConnected) {
      // Leave current post session if we're joining a different one
      if (currentMemeId && currentMemeId !== postId) {
        wsStore.sendLeavePostRequest(currentMemeId);
      }

      // Join the new post session
      wsStore.sendJoinPostRequest(postId);
      currentMemeId = postId;
      lastJoinedPostId = postId;
    } else {
      // Store the post ID to join after connection is established
      lastJoinedPostId = postId;
      get().connectWebSocket();
    }
  },

  leavePostSession: (postId: string) => {
    const wsStore = useWebSocketStore.getState();
    
    if (wsStore.isConnected) {
      wsStore.sendLeavePostRequest(postId);

      if (currentMemeId === postId) {
        currentMemeId = null;
        lastJoinedPostId = null;
      }
    }
  },

  setSearchQuery: (query: string) => set({ searchQuery: query }),

  searchMemes: async (query: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<ApiMeme[]>("/memes/search", {
        params: { query },
      });
      const memes = response.data || [];

      set({
        memes: Array.isArray(memes) ? memes.map(mapApiMemeToMeme) : [],
        searchQuery: query,
      });
    } catch (error) {
      set({
        error: "Failed to search memes",
        memes: [],
      });
      console.error("Error searching memes:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchMemes: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<ApiMeme[]>("/memes");
      const memes = response.data || [];

      set({
        memes: Array.isArray(memes) ? memes.map(mapApiMemeToMeme) : [],
      });
    } catch (error) {
      set({
        error: "Failed to fetch memes",
        memes: [],
      });
      console.error("Error fetching memes:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchMemeById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const memeResponse = await api.get<ApiMeme>(`/memes/memepage/${id}`);
      const meme = memeResponse.data;

      if (meme) {
        const commentsResponse = await api.get<Comment[]>(
          `/memes/${id}/comments`
        );
        const comments = commentsResponse.data || [];

        const mappedMeme = {
          ...mapApiMemeToMeme(meme),
          comments: comments,
        };

        return mappedMeme;
      }
      return null;
    } catch (error) {
      set({
        error: "Failed to fetch meme",
      });
      console.error("Error fetching meme by ID:", error);
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  fetchUserMemes: async (username: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<ApiMeme[]>(`/memes/uploaded/${username}`);
      const memes = response.data || [];

      set({
        userMemes: Array.isArray(memes) ? memes.map(mapApiMemeToMeme) : [],
      });
    } catch (error) {
      set({
        error: "Failed to fetch user memes",
        userMemes: [],
      });
      console.error("Error fetching user memes:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchLikedMemes: async (username: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<ApiMeme[]>(`/memes/liked/${username}`);
      const memes = response.data || [];

      set({
        likedMemes: Array.isArray(memes) ? memes.map(mapApiMemeToMeme) : [],
      });
    } catch (error) {
      set({
        error: "Failed to fetch liked memes",
        likedMemes: [],
      });
      console.error("Error fetching liked memes:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchSavedMemes: async (username: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<ApiMeme[]>(`/memes/saved/${username}`);
      const memes = response.data || [];

      set({
        savedMemes: Array.isArray(memes) ? memes.map(mapApiMemeToMeme) : [],
      });
    } catch (error) {
      set({
        error: "Failed to fetch saved memes",
        savedMemes: [],
      });
      console.error("Error fetching saved memes:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  // fetchUserProfile: async (userId: string) => {
  //   set({ isLoading: true, error: null });

  //   try {
  //     const response = await api.get<{
  //       profilePictureUrl: string;
  //       savedMemes: ApiMeme[];
  //       followers: Followers[];
  //       memeList: ApiMeme[];
  //       likedMemes: ApiMeme[];
  //       following: Following[];
  //       followersCount: number;
  //       followingCount: number;
  //       username: string;
  //       userId: string;
  //       userCreated: string;
  //     }>(`/profile/${userId}`);

  //     const data = response.data;

  //     const mapToMeme = (memes: ApiMeme[]): Meme[] =>
  //       memes.map((meme) => ({
  //         id: meme.id,
  //         url: meme.mediaUrl,
  //         title: meme.caption,
  //         uploader: meme.uploader,
  //         likeCount: meme.likecount,
  //         saveCount: meme.saveCount,
  //         createdAt: meme.memeCreated ? new Date(meme.memeCreated) : new Date(),
  //         comments: meme.comments || [],
  //         profilePictureUrl: meme.profilePictureUrl,
  //         userId: meme.userId,
  //       }));

  //     const mapToFollowers = (followers: ApiFollowers[]): Followers[] =>
  //       followers.map((follower) => ({
  //         userId: follower.userId,
  //         username: follower.username || "",
  //         profilePictureUrl: follower.profilePictureUrl || "",
  //         isFollow: follower.isFollow,
  //       }));

  //     const mapToFollowing = (following: ApiFollowing[]): Following[] =>
  //       following.map((followingUser) => ({
  //         userId: followingUser.userId,
  //         username: followingUser.username || "",
  //         profilePictureUrl: followingUser.profilePictureUrl || "",
  //         isFollow: followingUser.isFollow,
  //       }));

  //     const mapToUser = (userData: {
  //       userId: string;
  //       username: string;
  //       profilePictureUrl: string;
  //       followersCount: number;
  //       followingCount: number;
  //       userCreated: string;
  //       followers: Followers[];
  //       following: Following[];
  //     }): User => ({
  //       userId: userData.userId,
  //       username: userData.username || "",
  //       profilePictureUrl: userData.profilePictureUrl || "",
  //       followersCount: userData.followersCount || 0,
  //       followingCount: userData.followingCount || 0,
  //       userCreated: new Date(userData.userCreated),
  //       followers: mapToFollowers(userData.followers),
  //       following: mapToFollowing(userData.following),
  //       memeList: [],
  //       likedMeme: [],
  //       savedMeme: [],
  //     });

  //     const userProfile = mapToUser(data);
  //     const userMemes = mapToMeme(data.memeList || []);
  //     const likedMemes = mapToMeme(data.likedMemes || []);
  //     const savedMemes = mapToMeme(data.savedMemes || []);

  //     // Get the logged-in user from localStorage
  //     const loggedInUser = getUserFromLocalStorage();

  //     // Always set the viewed profile information based on the requested userId
  //     set({
  //       viewedUserName: userProfile.username,
  //       viewedProfilePictureUrl: userProfile.profilePictureUrl,
  //     });

  //     // Only update the global userName and profilePictureUrl if viewing own profile
  //     if (userId === loggedInUser.userId) {
  //       set({
  //         userName: userProfile.username,
  //         profilePictureUrl: userProfile.profilePictureUrl,
  //         userCreated: userProfile.userCreated,
  //       });
  //     }

  //     // Always update these fields regardless of whose profile is being viewed
  //     set({
  //       Followers: userProfile.followers,
  //       Following: userProfile.following,
  //       followersCount: userProfile.followersCount,
  //       followingCount: userProfile.followingCount,
  //       userMemes,
  //       likedMemes,
  //       savedMemes,
  //     });
  //   } catch (error) {
  //     set({
  //       error: "Failed to fetch user data",
  //       userMemes: [],
  //       likedMemes: [],
  //       savedMemes: [],
  //     });
  //     console.error("Error fetching user data:", error);
  //   } finally {
  //     set({ isLoading: false });
  //   }
  // },


  fetchUserProfile: async (username: string) => {
  // Check if we have a cached version of this profile
  const currentState = get();
  const cachedProfile = currentState.profileCache[username];
  const loggedInUser = getUserFromLocalStorage();
  const isOwnProfile = username === loggedInUser?.username;
  
  // Get the current URL path to determine context
  const path = window.location.pathname;
  const isProfilePage = path.startsWith('/profile/');
  const urlUsername = isProfilePage ? path.split('/').pop() : null;
  
  // Determine if we're on a profile page for a different user
  const isViewingOtherUserProfile = isProfilePage && urlUsername !== loggedInUser?.username;
  
  console.log(`fetchUserProfile: Called for ${username}`);
  console.log(`fetchUserProfile: Current URL username: ${urlUsername}`);
  console.log(`fetchUserProfile: isViewingOtherUserProfile: ${isViewingOtherUserProfile}`);
  
  // Cache is valid if it exists and is less than 5 minutes old
  const isCacheValid = cachedProfile && 
                      (Date.now() - cachedProfile.timestamp < 5 * 60 * 1000);
  
  // If we have a valid cached profile, use it
  if (isCacheValid) {
    console.log(`Using cached profile for ${username}`);
    
    // CRITICAL: If we're viewing another user's profile page, and this function was called
    // for the logged-in user (e.g., by UserProfileInitializer), DO NOT update viewedUserName
    // This prevents the logged-in user's profile from overriding the viewed profile
    if (isOwnProfile && isViewingOtherUserProfile && username !== urlUsername) {
      console.log(`fetchUserProfile: On ${urlUsername}'s profile page, updating logged-in user data WITHOUT changing viewed profile`);
      
      // Only update the logged-in user data, not the viewed profile
      set({
        userName: cachedProfile.profile.username,
        profilePictureUrl: cachedProfile.profile.profilePictureUrl,
        loggedInUserProfile: cachedProfile.profile,
        isLoggedInUserProfileLoaded: true,
        isLoading: false
      });
    } 
    // Normal case: update all relevant data
    else if (isOwnProfile) {
      set({
        userName: cachedProfile.profile.username,
        profilePictureUrl: cachedProfile.profile.profilePictureUrl,
        viewedUserName: cachedProfile.profile.username,
        viewedProfilePictureUrl: cachedProfile.profile.profilePictureUrl,
        userCreated: cachedProfile.profile.userCreated,
        Followers: cachedProfile.profile.followers,
        Following: cachedProfile.profile.following,
        followersCount: cachedProfile.profile.followersCount,
        followingCount: cachedProfile.profile.followingCount,
        userMemes: cachedProfile.memes,
        loggedInUserProfile: cachedProfile.profile,
        isLoggedInUserProfileLoaded: true,
        isLoading: false
      });
    } else {
      set({
        viewedUserName: cachedProfile.profile.username,
        viewedProfilePictureUrl: cachedProfile.profile.profilePictureUrl,
        Followers: cachedProfile.profile.followers,
        Following: cachedProfile.profile.following,
        followersCount: cachedProfile.profile.followersCount,
        followingCount: cachedProfile.profile.followingCount,
        userMemes: cachedProfile.memes,
        isLoading: false
      });
    }
    
    // Set the isFollowing state
    const isFollowing = cachedProfile.profile.followers.some(
      follower => follower.userId === loggedInUser.userId
    );
    set({ isFollowing });
    
    return;
  }
  
  // If no valid cache, fetch from API
  set({ isLoading: true, error: null });

  try {
    console.log(`Fetching profile for ${username} from API`);
    const response = await api.get<{
      profilePictureUrl: string;
      savedMemes: ApiMeme[];
      followers: Followers[];
      memeList: ApiMeme[];
      likedMemes: ApiMeme[];
      following: Following[];
      followersCount: number;
      followingCount: number;
      username: string;
      userId: string;
      userCreated: string;
    }>(`/profile/${username}`);

    const data = response.data;

    // Map the data as before...
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
      }));

    const mapToFollowers = (followers: ApiFollowers[]): Followers[] =>
      followers.map((follower) => ({
        userId: follower.userId,
        username: follower.username || "",
        profilePictureUrl: follower.profilePictureUrl || "",
        isFollow: follower.isFollow,
      }));

    const mapToFollowing = (following: ApiFollowing[]): Following[] =>
      following.map((followingUser) => ({
        userId: followingUser.userId,
        username: followingUser.username || "",
        profilePictureUrl: followingUser.profilePictureUrl || "",
        isFollow: followingUser.isFollow,
      }));

    const userProfile = {
      userId: data.userId,
      username: data.username || "",
      profilePictureUrl: data.profilePictureUrl || "",
      followersCount: data.followersCount || 0,
      followingCount: data.followingCount || 0,
      userCreated: new Date(data.userCreated),
      followers: mapToFollowers(data.followers),
      following: mapToFollowing(data.following),
    };

    const userMemes = mapToMeme(data.memeList || []);
    const likedMemes = mapToMeme(data.likedMemes || []);
    const savedMemes = mapToMeme(data.savedMemes || []);

    // Get the current URL path to determine context
    const path = window.location.pathname;
    const isProfilePage = path.startsWith('/profile/');
    const urlUsername = isProfilePage ? path.split('/').pop() : null;
    
    // Determine if we're on a profile page for a different user
    const isViewingOtherUserProfile = isProfilePage && urlUsername !== loggedInUser?.username;
    
    console.log(`fetchUserProfile API: Called for ${username}`);
    console.log(`fetchUserProfile API: Current URL username: ${urlUsername}`);
    console.log(`fetchUserProfile API: isViewingOtherUserProfile: ${isViewingOtherUserProfile}`);
    
    // CRITICAL: If we're viewing another user's profile page, and this function was called
    // for the logged-in user (e.g., by UserProfileInitializer), DO NOT update viewedUserName
    if (isOwnProfile && isViewingOtherUserProfile && username !== urlUsername) {
      console.log(`fetchUserProfile API: On ${urlUsername}'s profile page, updating logged-in user data WITHOUT changing viewed profile`);
      
      // Only update the logged-in user data, not the viewed profile
      set({
        userName: userProfile.username,
        profilePictureUrl: userProfile.profilePictureUrl,
        loggedInUserProfile: userProfile,
        isLoggedInUserProfileLoaded: true,
        likedMemes,
        savedMemes,
      });
      
      // Update the user in localStorage with the latest profile picture
      const updatedUser = {
        ...loggedInUser,
        profilePicture: userProfile.profilePictureUrl
      };
      setInLocalStorage('user', updatedUser);
    }
    // Normal case: update all relevant data
    else if (isOwnProfile) {
      // Update both viewed and own profile info when viewing own profile
      set({
        userName: userProfile.username,
        profilePictureUrl: userProfile.profilePictureUrl,
        viewedUserName: userProfile.username,
        viewedProfilePictureUrl: userProfile.profilePictureUrl,
        userCreated: userProfile.userCreated,
        Followers: userProfile.followers,
        Following: userProfile.following,
        followersCount: userProfile.followersCount,
        followingCount: userProfile.followingCount,
        userMemes,
        likedMemes,
        savedMemes,
        // Update the logged-in user profile in the global state
        loggedInUserProfile: userProfile,
        isLoggedInUserProfileLoaded: true,
      });
      
      // Update the user in localStorage with the latest profile picture
      const updatedUser = {
        ...loggedInUser,
        profilePicture: userProfile.profilePictureUrl
      };
      setInLocalStorage('user', updatedUser);
      
    } else {
      // Only update viewed profile info when viewing someone else's profile
      set({
        viewedUserName: userProfile.username,
        viewedProfilePictureUrl: userProfile.profilePictureUrl,
        Followers: userProfile.followers,
        Following: userProfile.following,
        followersCount: userProfile.followersCount,
        followingCount: userProfile.followingCount,
        userMemes,
        // Don't update likedMemes and savedMemes when viewing other profiles
        ...(isOwnProfile ? { likedMemes, savedMemes } : {}),
      });
    }

    // Set the isFollowing state
    const isFollowing = userProfile.followers.some(
      follower => follower.userId === loggedInUser.userId
    );
    set({ isFollowing });
    
    // Store the profile in the cache
    set(state => ({
      profileCache: {
        ...state.profileCache,
        [username]: {
          profile: userProfile,
          memes: userMemes,
          timestamp: Date.now()
        }
      }
    }));
    
    console.log(`Cached profile for ${username}`);

  } catch (error) {
    set({
      error: "Failed to fetch user data",
      userMemes: [],
      likedMemes: [],
      savedMemes: [],
    });
    console.error("Error fetching user data:", error);
  } finally {
    set({ isLoading: false });
  }
},


  uploadMeme: async (file: File, title: string, profilePictureUrl: string) => {
    const user = getUserFromLocalStorage();
    set({ uploadProgress: 0, error: null });
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title);
      formData.append("uploader", user.username || user.name || "Anonymous");
      formData.append("profilePictureUrl", profilePictureUrl);
      formData.append("userId", user.userId || "Anonymous");

      const response = await api.post<ApiMeme>("/memes", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent: AxiosProgressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            set({ uploadProgress: progress });
          }
        },
      });

      const newMeme = mapApiMemeToMeme(response.data);
      set((state) => ({
        memes: [newMeme, ...state.memes],
        userMemes: [newMeme, ...state.userMemes],
        uploadProgress: null,
      }));
    } catch (error) {
      set({
        error: "Failed to upload meme",
        uploadProgress: null,
      });
      console.error("Error uploading meme:", error);
    }
  },

  deleteMeme: async (id: string) => {
    const user = getUserFromLocalStorage();
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/memes/delete/${id}`);

      set((state) => ({
        memes: state.memes.filter((meme) => meme.id !== id),
        userMemes: state.userMemes.filter((meme) => meme.id !== id),
      }));

      if (user.userId) {
        await get().fetchUserProfile(user.username);
      }
    } catch (error) {
      set({ error: "Failed to delete meme" });
      console.error("Error deleting meme:", error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateProfilePicture: async (file: File, userId: string) => {
    set({ isLoading: true, error: null });

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await api.post<{ profilePictureUrl: string }>(
        `profile/upload/${userId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const user = getUserFromLocalStorage();
      user.profilePicture = response.data.profilePictureUrl;
      setInLocalStorage("user", user);
    } catch (error: unknown) {
      let errorMessage = "Failed to update profile picture";

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof (error as { response?: { data?: { error?: string } } })
          .response === "object"
      ) {
        const serverError = (
          error as { response: { data?: { error?: string } } }
        ).response.data;
        errorMessage = serverError?.error ?? errorMessage;
      }

      set({ error: errorMessage });
      console.error("Error updating profile picture:", errorMessage);
    } finally {
      set({ isLoading: false });
    }
  },

  toggleLike: async (id: string, username: string) => {
    try {
      const isLiked = get().likedMemes.some((meme) => meme.id === id);
      const action = isLiked ? "UNLIKE" : "LIKE";

      const memeObj =
        get().memes.find((m) => m.id === id) ||
        get().userMemes.find((m) => m.id === id) ||
        get().savedMemes.find((m) => m.id === id);

      set((state) => {
        const likedMemes = isLiked
          ? state.likedMemes.filter((m) => m.id !== id)
          : memeObj
          ? [...state.likedMemes.filter((m) => m.id !== id), memeObj]
          : state.likedMemes;

        const updateLikeCount = (arr: Meme[]) =>
          arr.map((meme) =>
            meme.id === id
              ? {
                  ...meme,
                  likeCount: Math.max(
                    (meme.likeCount || 0) + (isLiked ? -1 : 1),
                    0
                  ),
                }
              : meme
          );

        return {
          likedMemes,
          memes: updateLikeCount(state.memes),
          userMemes: updateLikeCount(state.userMemes),
          savedMemes: updateLikeCount(state.savedMemes),
        };
      });

      // Use the WebSocketStore to send the message
      const wsStore = useWebSocketStore.getState();
      if (wsStore.isConnected) {
        wsStore.sendMessage({
          type: 'LIKE' as const,
          memeId: id,
          action,
          username,
        });
      } else {
        console.log("WebSocket not connected, attempting to connect...");
        get().connectWebSocket();
        // Try to send the message after a short delay to allow connection to establish
        setTimeout(() => {
          const updatedWsStore = useWebSocketStore.getState();
          if (updatedWsStore.isConnected) {
            updatedWsStore.sendMessage({
              type: 'LIKE' as WebSocketMessageType,
              memeId: id,
              action,
              username,
            });
          } else {
            console.error("WebSocket is still not connected. Cannot toggle like.");
          }
        }, 1000);
      }
    } catch (error) {
      console.error("Error toggling like via WebSocket:", error);
    }
  },

  toggleSave: async (id: string, username: string) => {
    try {
      const isSaved = get().savedMemes.some((meme) => meme.id === id);
      const action = isSaved ? "UNSAVE" : "SAVE";

      const memeObj =
        get().memes.find((m) => m.id === id) ||
        get().userMemes.find((m) => m.id === id) ||
        get().likedMemes.find((m) => m.id === id);

      set((state) => {
        const savedMemes = isSaved
          ? state.savedMemes.filter((m) => m.id !== id)
          : memeObj
          ? [...state.savedMemes.filter((m) => m.id !== id), memeObj]
          : state.savedMemes;

        const updateSaveCount = (arr: Meme[]) =>
          arr.map((meme) =>
            meme.id === id
              ? {
                  ...meme,
                  saveCount: Math.max(
                    (meme.saveCount || 0) + (isSaved ? -1 : 1),
                    0
                  ),
                }
              : meme
          );

        return {
          savedMemes,
          memes: updateSaveCount(state.memes),
          userMemes: updateSaveCount(state.userMemes),
          likedMemes: updateSaveCount(state.likedMemes),
        };
      });

      // Use the WebSocketStore to send the message
      const wsStore = useWebSocketStore.getState();
      if (wsStore.isConnected) {
        wsStore.sendMessage({
          type: 'SAVE' as const,
          memeId: id,
          action,
          username,
        });
      } else {
        console.log("WebSocket not connected, attempting to connect...");
        get().connectWebSocket();
        // Try to send the message after a short delay to allow connection to establish
        setTimeout(() => {
          const updatedWsStore = useWebSocketStore.getState();
          if (updatedWsStore.isConnected) {
            updatedWsStore.sendMessage({
              type: 'SAVE' as WebSocketMessageType,
              memeId: id,
              action,
              username,
            });
          } else {
            console.error("WebSocket is still not connected. Cannot toggle save.");
          }
        }, 1000);
      }
    } catch (error) {
      console.error("Error toggling save via WebSocket:", error);
    }
  },

  setSelectedMeme: (meme) => set({ selectedMeme: meme }),

  addComment: async (
    memeId: string,
    username: string,
    text: string,
    profilePictureUrl: string,
    userId: string
  ) => {
    try {
      const wsStore = useWebSocketStore.getState();
      
      if (wsStore.isConnected) {
        const comment = {
          type: 'COMMENT' as const,
          memeId,
          username,
          text,
          profilePictureUrl,
          userId,
          createdAt: new Date().toISOString(),
        };

        wsStore.sendMessage(comment);
      } else {
        console.log("WebSocket not connected, attempting to connect...");
        get().connectWebSocket();
        // Try to send the message after a short delay to allow connection to establish
        setTimeout(() => {
          const updatedWsStore = useWebSocketStore.getState();
          if (updatedWsStore.isConnected) {
            updatedWsStore.sendMessage({
              type: 'COMMENT' as WebSocketMessageType,
              memeId,
              username,
              text,
              profilePictureUrl,
              userId,
              createdAt: new Date().toISOString(),
            });
          } else {
            console.error("WebSocket is still not connected. Cannot add comment.");
          }
        }, 1000);
      }
    } catch (error) {
      console.error("Error adding comment via WebSocket:", error);
    }
  },

  updateUserName: async (userId: string, newUsername: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.put(`/profile/${userId}/update-username`, {
        newUsername: newUsername,
      });

      if (response.status === 200) {
        const { newToken } = response.data;

        set({ userName: newUsername });

        const storedUser = localStorage.getItem("user");

        if (storedUser) {
          const user = JSON.parse(storedUser);
          user.username = newUsername;
          setInLocalStorage("user", user);
        }

        removeFromLocalStorage("token");
        setInLocalStorage("token", newToken);
      }
    } catch (error) {
      set({ error: "Failed to update username" });
      console.error("Error updating username:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  handleFollowToggle: async (isFollowing: boolean) => {
    // Get the WebSocket store from the centralized store
    const wsStore = useWebSocketStore.getState();
    const loggedInUser = getUserFromLocalStorage();
    set({ isLoading: true, error: null });

    try {
      // Get the username and profile picture of the user being followed/unfollowed
      const followingUsername = get().viewedUserName;
      const followingProfilePicture = get().viewedProfilePictureUrl;
      
      console.log("handleFollowToggle - Current user:", loggedInUser.username);
      console.log("handleFollowToggle - Following user:", followingUsername);
      console.log("handleFollowToggle - Current follow state:", isFollowing);
      
      // The isFollowing parameter indicates the current state
      // If isFollowing is true, user is already following and wants to unfollow
      // If isFollowing is false, user is not following and wants to follow
      // We need to NEGATE the current state to get the desired new state
      const newFollowState = !isFollowing;
      
      console.log("handleFollowToggle - New follow state to send:", newFollowState);

      // Create the WebSocket message
      const followMessage = {
        type: 'FOLLOW' as WebSocketMessageType,
        followerId: loggedInUser.userId,
        followerUsername: loggedInUser.username,
        // followingId: followingUserId,
        followingUsername: followingUsername,
        isFollowing: newFollowState, // Use the new follow state
        profilePictureUrl: loggedInUser.profilePicture || "",
        followingProfilePictureUrl: followingProfilePicture || "",
      };

      // Use the WebSocketStore to send the message
      if (wsStore.isConnected) {
        wsStore.sendMessage(followMessage);
        console.log("WebSocket message sent:", followMessage);

        // Optimistically update the UI state
        if (followingUsername) {
          set((state) => {
            console.log("Optimistically updating UI state - WebSocket open");
            
            // Update the Followers list if the current user is following the viewed profile
            const updatedFollowers = newFollowState
              ? [
                  ...state.Followers.filter(
                    (f) => f.userId !== loggedInUser.userId
                  ),
                  {
                    userId: loggedInUser.userId,
                    username: loggedInUser.username,
                    profilePictureUrl: loggedInUser.profilePicture || "",
                    isFollow: newFollowState, // Use the actual follow state
                  },
                ]
              : state.Followers.filter((f) => f.userId !== loggedInUser.userId);
            
            // Update the Following list if the current user is following the viewed profile
            const updatedFollowing = newFollowState
              ? [
                  ...state.Following.filter(
                    (f) => f.username !== followingUsername
                  ),
                  {
                    // userId: followingUserId,
                    username: followingUsername,
                    profilePictureUrl: get().viewedProfilePictureUrl || "",
                    isFollow: newFollowState, // Use the actual follow state
                  },
                ]
              : state.Following.filter((f) => f.username !== followingUsername);
            
            // We're only updating the followers count of the viewed profile, not our own following count
            // When we follow someone, we increment their followers count
            // When we unfollow someone, we decrement their followers count
            const newFollowersCount = newFollowState
              ? state.followersCount + 1  // We're following, so increment the follower count
              : Math.max(0, state.followersCount - 1);  // We're unfollowing, so decrement the follower count
            
            console.log("Optimistic UI update - Old follower count:", state.followersCount);
            console.log("Optimistic UI update - New follower count:", newFollowersCount);
            
            return {
              // Only update the followers count, not the following count
              followersCount: newFollowersCount,
              Following: updatedFollowing,
              Followers: updatedFollowers,
              isFollowing: newFollowState,
            };
          });
        }
      } else {
        // If WebSocket is not connected, try to connect and then send
        console.log("WebSocket not connected, attempting to connect...");
        get().connectWebSocket();
        setTimeout(() => {
          // Get the updated WebSocket store
          const updatedWsStore = useWebSocketStore.getState();
          if (updatedWsStore.isConnected) {
            updatedWsStore.sendMessage(followMessage);
            console.log("WebSocket message sent after reconnect:", followMessage);

            // Optimistically update the UI state
            if (followingUsername) {
              set((state) => {
                console.log("Optimistically updating UI state - after reconnect");
                
                // Update the Followers list if the current user is following the viewed profile
                const updatedFollowers = newFollowState
                  ? [
                      ...state.Followers.filter(
                        (f) => f.userId !== loggedInUser.userId
                      ),
                      {
                        userId: loggedInUser.userId,
                        username: loggedInUser.username,
                        profilePictureUrl: loggedInUser.profilePicture || "",
                        isFollow: newFollowState, // Use the actual follow state
                      },
                    ]
                  : state.Followers.filter((f) => f.userId !== loggedInUser.userId);
                
                // Update the Following list if the current user is following the viewed profile
                const updatedFollowing = newFollowState
                  ? [
                      ...state.Following.filter(
                        (f) => f.username !== followingUsername
                      ),
                      {
                        // userId: followingUserId,
                        username: followingUsername,
                        profilePictureUrl: get().viewedProfilePictureUrl || "",
                        isFollow: newFollowState, // Use the actual follow state
                      },
                    ]
                  : state.Following.filter((f) => f.username !== followingUsername);
                
                // We're only updating the followers count of the viewed profile, not our own following count
                // When we follow someone, we increment their followers count
                // When we unfollow someone, we decrement their followers count
                const newFollowersCount = newFollowState
                  ? state.followersCount + 1  // We're following, so increment the follower count
                  : Math.max(0, state.followersCount - 1);  // We're unfollowing, so decrement the follower count
                
                console.log("Optimistic UI update after reconnect - Old follower count:", state.followersCount);
                console.log("Optimistic UI update after reconnect - New follower count:", newFollowersCount);
                
                return {
                  // Only update the followers count, not the following count
                  followersCount: newFollowersCount,
                  Following: updatedFollowing,
                  Followers: updatedFollowers,
                  isFollowing: newFollowState,
                };
              });
            }
          } else {
            console.error(
              "WebSocket connection failed, cannot send follow request"
            );
            set({ error: "Failed to toggle follow status - connection issue" });
          }
        }, 500);
      }
    } catch (error) {
      set({ error: "Failed to toggle follow status" });
      console.error("Error sending follow request:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  getNotifications: async (username : string) => {
    set({ isLoading: true, error: null})
    try {
      const response = await api.get<Notification[]>(`/notifications/${username}`);
      const notifications = response.data || [];

      // Sort notifications by createdAt date (newest first)
      const sortedNotifications = [...notifications].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      set({
        notifications: sortedNotifications.map((notification) => ({
          id: notification.id || crypto.randomUUID(),
          type: notification.type,
          message: notification.message,
          userId: notification.userId,
          senderUsername: notification.senderUsername,
          profilePictureUrl: notification.profilePictureUrl,
          createdAt: new Date(notification.createdAt),
          read: notification.read,
          isRead: notification.isRead || false,
          memeId: notification.memeId
        })),
        isLoading: false,
      });
    } catch (error) {
      set({
        error: "Failed to fetch notifications",
        isLoading: false,
      });
      console.error("Error fetching notifications:", error);
    }
  },
  
  // Add a new notification to the state in real-time
  addNotification: (notification) => {
    set((state) => {
      // Create a new notification object with default values for missing fields
      const newNotification: Notification = {
        id: notification.id || crypto.randomUUID(),
        type: notification.type || 'info',
        message: notification.message || '',
        userId: notification.userId || '',
        senderUsername: notification.senderUsername || '',
        profilePictureUrl: notification.profilePictureUrl || '',
        createdAt: notification.createdAt || new Date(),
        read: notification.read || false,
        isRead: notification.isRead || false,
        memeId: notification.memeId
      };
      
      // Check if this notification already exists (by ID)
      const exists = state.notifications.some(n => n.id === newNotification.id);
      
      if (!exists) {
        console.log('Adding new notification to store:', newNotification);
        
        // Dispatch a custom event that components can listen for
        try {
          const notificationEvent = new CustomEvent('new-notification', { 
            detail: { notification: newNotification } 
          });
          window.dispatchEvent(notificationEvent);
        } catch (error) {
          console.error('Error dispatching notification event:', error);
        }
        
        // Add the new notification at the beginning of the array (newest first)
        return {
          notifications: [newNotification, ...state.notifications]
        };
      }
      
      return state; // No changes if notification already exists
    });
  },

  // Update meme statistics (likes and saves)
  updateMemeStats: (memeId: string, stats: { likes?: number, saves?: number }) => {
    set((state) => {
      const updateMemeStats = (memes: Meme[]): Meme[] =>
        memes.map((meme) =>
          meme.id === memeId
            ? {
                ...meme,
                likeCount: stats.likes !== undefined ? stats.likes : meme.likeCount,
                saveCount: stats.saves !== undefined ? stats.saves : meme.saveCount,
              }
            : meme
        );

      return {
        memes: updateMemeStats(state.memes),
        userMemes: updateMemeStats(state.userMemes),
        likedMemes: updateMemeStats(state.likedMemes),
        savedMemes: updateMemeStats(state.savedMemes),
      };
    });
  },
  
  // Add a comment directly to the store (used for real-time updates)
  updateCommentInStore: (comment: Comment) => {
    set((state) => {
      const updateMemeInArray = (memes: Meme[]): Meme[] =>
        memes.map((meme) =>
          meme.id === comment.memeId
            ? {
                ...meme,
                comments: [...(meme.comments || []), comment],
              }
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
}));