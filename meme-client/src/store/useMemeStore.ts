import { create } from "zustand";
import api from "../hooks/api";
import type {
  Meme,
  ApiMeme,
  Comment,
  Followers,
  Following,
  ApiFollowers,
  ApiFollowing,
  Notification,
  // ApiNotifications,
} from "../types/mems";
import type { AxiosProgressEvent } from "axios";

let wsClient: WebSocket | null = null;
let currentMemeId: string | null = null;
let reconnectTimeout: NodeJS.Timeout | null = null;
let lastJoinedPostId: string | null = null;

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
  currentPage: "home" | "profile";
  selectedMeme: Meme | null;
  isLoading: boolean;
  error: string | null;
  uploadProgress: number | null;
  searchQuery: string;
  userCreated: Date;
  fetchMemes: () => Promise<void>;
  searchMemes: (query: string) => Promise<void>;
  fetchMemeById: (id: string) => Promise<Meme | null>;
  fetchUserMemes: (username: string) => Promise<void>;
  fetchLikedMemes: (username: string) => Promise<void>;
  fetchSavedMemes: (username: string) => Promise<void>;
  fetchUserProfile: (username: string) => Promise<void>;
  toggleLike: (id: string, username: string) => Promise<void>;
  toggleSave: (id: string, username: string) => Promise<void>;
  setPage: (page: "home" | "profile") => void;
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
    followingUser: string,
    isFollowing: boolean
  ) => Promise<void>;
  disconnectWebSocket: () => void;
  connectWebSocket: () => void;
  joinPostSession: (memeId: string) => void;
  leavePostSession: (memeId: string) => void;
  wsClient: WebSocket | null;
  getNotifications: (username : string) => void;
  addNotification: (notification: Partial<Notification>) => void;
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

// const WS_URL = "ws://localhost:8080/ws";
const WS_URL = import.meta.env.VITE_WEBSOCKET_URL;

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
  wsClient: null,

  connectWebSocket: () => {
    if (wsClient && wsClient.readyState === WebSocket.OPEN) return;

    // Get user info for connection
    const user = getUserFromLocalStorage();
    if (!user || !user.userId) {
      console.error("Cannot connect WebSocket: No user found in localStorage");
      return;
    }

    // Use the userId as a query parameter for authentication
    const wsUrlWithAuth = `${WS_URL}?userId=${user.userId}`;
    wsClient = new WebSocket(wsUrlWithAuth);
    console.log("Connecting to WebSocket:", wsUrlWithAuth);

    wsClient.onopen = () => {
      console.log("WebSocket connection established successfully");
      set({ wsClient });
      if (lastJoinedPostId) {
        get().joinPostSession(lastJoinedPostId);
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
      }
    };

    wsClient.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Skip processing ping/pong messages
        if (data.type === 'PONG' || data.type === 'PING') {
          return;
        }
        
        console.log("WebSocket message received:", data);
        if (data.type === "COMMENT" && data.memeId) {
          const newComment = {
            id: data.id,
            memeId: data.memeId,
            userId: data.userId,
            text: data.text,
            username: data.username,
            createdAt: data.createdAt,
            profilePictureUrl: data.profilePictureUrl,
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

        if (data.type === "LIKE" && data.memeId) {
          set((state) => {
            const updateLikeCount = (arr: Meme[]) =>
              arr.map((meme) =>
                meme.id === data.memeId
                  ? { ...meme, likeCount: data.likeCount }
                  : meme
              );

            let likedMemes = state.likedMemes;
            const user = getUserFromLocalStorage();
            if (data.likedUserIds && user.username) {
              const memeObj =
                state.memes.find((m) => m.id === data.memeId) ||
                state.userMemes.find((m) => m.id === data.memeId) ||
                state.savedMemes.find((m) => m.id === data.memeId);
              likedMemes = data.likedUserIds.includes(user.username)
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

        if (data.type === "SAVE" && data.memeId) {
          set((state) => {
            const updateSaveCount = (arr: Meme[]) =>
              arr.map((meme) =>
                meme.id === data.memeId
                  ? { ...meme, saveCount: data.saveCount }
                  : meme
              );

            let savedMemes = state.savedMemes;
            const user = getUserFromLocalStorage();
            if (data.savedUserIds && user.username) {
              const memeObj = state.memes.find((m) => m.id === data.memeId);
              savedMemes = data.savedUserIds.includes(user.username)
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

        if (data.type === "FOLLOW") {
          const user = getUserFromLocalStorage();
          console.log("WebSocket FOLLOW event received:", data);
          console.log("Current user:", user);
          console.log("Current viewedUserName:", get().viewedUserName);

          // Update followers and following counts
          if (data.followingUsername === user.username) {
            // Someone followed/unfollowed the current user
            // data.isFollowing is the new state - true means they are now following, false means they unfollowed
            console.log("Someone followed/unfollowed the current user:", data.followerUsername);
            console.log("New follow state:", data.isFollowing);
            
            set((state) => {
              // Check if we're viewing the profile of the user who just followed/unfollowed us
              const isViewingFollowerProfile = data.followerUsername === state.viewedUserName;
              console.log("Is viewing follower profile:", isViewingFollowerProfile);
              
              // If we're viewing the profile of the user who just followed/unfollowed us,
              // we need to update the following count and list
              // const newFollowingCount = isViewingFollowerProfile
              //   ? (data.isFollowing
              //       ? state.followingCount + 1
              //       : Math.max(0, state.followingCount - 1))
              //   : state.followingCount;
              
              // Update the Following list if we're viewing the profile of the user who just followed/unfollowed us
              const updatedFollowing = isViewingFollowerProfile
                ? (data.isFollowing
                    ? [
                        ...state.Following.filter(
                          (f) => f.userId !== data.followerId
                        ),
                        {
                          userId: data.followerId,
                          username: data.followerUsername,
                          profilePictureUrl: data.profilePictureUrl || "",
                          isFollow: data.isFollowing,
                        },
                      ]
                    : state.Following.filter(
                        (f) => f.userId !== data.followerId
                      ))
                : state.Following;
              
              const newState = {
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
                        userId: data.followerId,
                        username: data.followerUsername,
                        profilePictureUrl: data.profilePictureUrl || "",
                        isFollow: data.isFollowing, // Use the actual follow state from the message
                      },
                    ]
                  : state.Followers.filter(
                      (f) => f.userId !== data.followerId
                    ),
                Following: updatedFollowing,
              };
              
              console.log("Updated state for someone following current user:", newState);
              return newState;
            });
          }

          if (data.followerUsername === user.username) {
            // Current user followed/unfollowed someone
            // data.isFollowing is the new state - true means current user is now following, false means unfollowed
            console.log("Current user followed/unfollowed someone:", data.followingUsername);
            console.log("New follow state:", data.isFollowing);
            
            set((state) => {
              // Check if we're viewing the profile of the user we just followed/unfollowed
              const isViewingFollowedProfile = data.followingUsername === state.viewedUserName;
              console.log("Is viewing followed profile:", isViewingFollowedProfile);
              
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
                          userId: user.userId,
                          username: user.username,
                          profilePictureUrl: user.profilePicture || "",
                          isFollow: data.isFollowing,
                        },
                      ]
                    : state.Followers.filter(
                        (f) => f.userId !== user.userId
                      ))
                : state.Followers;
              
              const newState = {
                // Only update the followers count, not the following count
                followersCount: newFollowersCount,
                Following: data.isFollowing
                  ? [
                      ...state.Following.filter(
                        (f) => f.userId !== data.followingId
                      ),
                      {
                        userId: data.followingId || "",
                        username: data.followingUsername,
                        profilePictureUrl: data.profilePictureUrl || "",
                        isFollow: data.isFollowing, // Use the actual follow state from the message
                      },
                    ]
                  : state.Following.filter(
                      (f) => f.userId !== data.followingId
                    ),
                Followers: updatedFollowers,
                isFollowing: isViewingFollowedProfile
                  ? data.isFollowing  // Update isFollowing based on the viewed profile
                  : state.isFollowing,
              };
              
              console.log("Updated state for current user following someone:", newState);
              return newState;
            });
          }
          
          // Log the current state for debugging
          console.log("Current state after WebSocket FOLLOW event:", {
            followersCount: get().followersCount,
            followingCount: get().followingCount,
            isFollowing: get().isFollowing,
            Followers: get().Followers.length,
            Following: get().Following.length
          });
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    wsClient.onclose = (event) => {
      console.log(`WebSocket connection closed with code: ${event.code}`);
      wsClient = null;
      set({ wsClient: null });
      
      // Always attempt to reconnect unless it was a normal closure (code 1000)
      if (event.code !== 1000) {
        // Set up reconnection with a fixed delay
        const reconnectDelay = 2000; // 2 seconds
        console.log(`Scheduling reconnect in ${reconnectDelay}ms`);
        
        // Clear any existing timeout
        if (reconnectTimeout) {
          clearTimeout(reconnectTimeout);
        }
        
        reconnectTimeout = setTimeout(() => {
          console.log("Attempting to reconnect WebSocket...");
          reconnectTimeout = null;
          get().connectWebSocket();
        }, reconnectDelay);
      }
    };

    wsClient.onerror = (err) => {
      console.error("WebSocket error", err);
      // Don't close here, let the onclose handler deal with reconnection
    };
  },

  disconnectWebSocket: () => {
    // Clear any reconnection attempts
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }
    
    if (wsClient) {
      if (currentMemeId) {
        try {
          wsClient.send(
            JSON.stringify({ type: "leavePost", postId: currentMemeId })
          );
        } catch (error) {
          console.error("Error sending leavePost message:", error);
        }
        currentMemeId = null;
      }
      
      try {
        // Use code 1000 for normal closure
        wsClient.close(1000, "User logged out");
      } catch (error) {
        console.error("Error closing WebSocket:", error);
      }
      
      wsClient = null;
      set({ wsClient: null });
    }
  },

  joinPostSession: (postId: string) => {
    if (wsClient && wsClient.readyState === WebSocket.OPEN) {
      if (currentMemeId && currentMemeId !== postId) {
        wsClient.send(
          JSON.stringify({ type: "LEAVE_POST", postId: currentMemeId })
        );
      }

      wsClient.send(JSON.stringify({ type: "JOIN_POST", postId }));
      currentMemeId = postId;
      lastJoinedPostId = postId;
    } else {
      lastJoinedPostId = postId;
      get().connectWebSocket();
    }
  },

  leavePostSession: (postId: string) => {
    if (wsClient && wsClient.readyState === WebSocket.OPEN) {
      wsClient.send(JSON.stringify({ type: "LEAVE_POST", postId }));

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
  set({ isLoading: true, error: null });

  try {
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
    const loggedInUser = getUserFromLocalStorage();
    const isOwnProfile = username === loggedInUser.username;

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

    // Update state based on whether this is the user's own profile or not
    if (isOwnProfile) {
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
      });
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

      if (wsClient && wsClient.readyState === WebSocket.OPEN) {
        const message = {
          type: "LIKE",
          memeId: id,
          action,
          username,
        };
        wsClient.send(JSON.stringify(message));
      } else {
        console.error("WebSocket is not connected. Cannot toggle like.");
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

      if (wsClient && wsClient.readyState === WebSocket.OPEN) {
        const message = {
          type: "SAVE",
          memeId: id,
          action,
          username,
        };
        wsClient.send(JSON.stringify(message));
      } else {
        console.error("WebSocket is not connected. Cannot toggle save.");
      }
    } catch (error) {
      console.error("Error toggling save via WebSocket:", error);
    }
  },

  setPage: (page) => set({ currentPage: page }),
  setSelectedMeme: (meme) => set({ selectedMeme: meme }),

  addComment: async (
    memeId: string,
    username: string,
    text: string,
    profilePictureUrl: string,
    userId: string
  ) => {
    try {
      if (!wsClient || wsClient.readyState !== WebSocket.OPEN) {
        console.error("WebSocket not connected. Cannot add comment.");
        return;
      }
      const comment = {
        type: "COMMENT",
        memeId,
        username,
        text,
        profilePictureUrl,
        userId,
        createdAt: new Date().toISOString(),
      };

      wsClient.send(JSON.stringify(comment));
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

  handleFollowToggle: async (followingUsername: string, isFollowing: boolean) => {
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
        type: "FOLLOW",
        followerId: loggedInUser.userId,
        followerUsername: loggedInUser.username,
        // followingId: followingUserId,
        followingUsername: followingUsername,
        isFollowing: newFollowState, // Use the new follow state
        profilePictureUrl: loggedInUser.profilePicture || "",
        followingProfilePictureUrl: followingProfilePicture || "",
      };

      // Use the existing WebSocket connection from useMemeStore
      if (wsClient && wsClient.readyState === WebSocket.OPEN) {
        wsClient.send(JSON.stringify(followMessage));
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
          if (wsClient && wsClient.readyState === WebSocket.OPEN) {
            wsClient.send(JSON.stringify(followMessage));
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
                  : state.Following.filter((f) => f.userId !== followingUsername);
                
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
        // Add the new notification at the beginning of the array (newest first)
        return {
          notifications: [newNotification, ...state.notifications]
        };
      }
      
      return state; // No changes if notification already exists
    });
  }
}));



