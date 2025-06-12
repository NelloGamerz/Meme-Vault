import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { createSelectors } from "./createSelectors";
import api from "../hooks/api";
// import type { AxiosProgressEvent } from "axios";
import type { Followers, Following, Meme } from "../types/mems";

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
  likedMemes: Meme[];
  savedMemes: Meme[];
  memeList: Meme[];
}

// Helper function to get user from localStorage
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

// Define the store interface
interface UserState {
  // User profile state
  loggedInUserProfile: UserProfile | null;
  isLoggedInUserProfileLoaded: boolean;
  
  // Current user info
  profilePictureUrl: string;
  userName: string;
  userCreated: Date;
  
  // Viewed profile info
  viewedProfilePictureUrl: string;
  viewedUserName: string;
  
  // Social connections
  isFollowing?: boolean;
  Followers: Followers[];
  Following: Following[];
  followersCount: number;
  followingCount: number;
  
  // Meme collections
  likedMemes: Meme[];
  savedMemes: Meme[];
  memeList: Meme[];
  
  // Profile cache to store previously loaded profiles
  profileCache: Record<string, {
    profile: UserProfile;
    timestamp: number;
  }>;
  
  // UI state
  isLoading: boolean;
  error: string | null;
}

interface UserActions {
  // Profile operations
  fetchUserProfile: (username: string) => Promise<void>;
  updateProfilePicture: (file: File, userId: string) => Promise<void>;
  updateUserName: (userId: string, newUsername: string) => Promise<void>;
  
  // Social operations
  handleFollowToggle: (isFollowing: boolean) => Promise<void>;
  addFollower: (follower: Followers) => void;
  removeFollower: (userId: string) => void;
}

type UserStore = UserState & UserActions;

// Create the store with immer middleware for more efficient updates
const useRawUserStore = create<UserStore>()(
  immer((set, get) => ({
    // Initial state
    loggedInUserProfile: null,
    isLoggedInUserProfileLoaded: false,
    profilePictureUrl: "",
    userName: getUserFromLocalStorage().username || "",
    userCreated: new Date(),
    viewedProfilePictureUrl: "",
    viewedUserName: "",
    isFollowing: undefined,
    Followers: [],
    Following: [],
    followersCount: 0,
    followingCount: 0,
    likedMemes: [],
    savedMemes: [],
    memeList: [],
    profileCache: {},
    isLoading: false,
    error: null,

    // Profile operations
    fetchUserProfile: async (username: string) => {
      try {
        // Check if we have a cached profile that's less than 5 minutes old
        const now = Date.now();
        const cachedProfile = get().profileCache[username];
        if (
          cachedProfile &&
          now - cachedProfile.timestamp < 5 * 60 * 1000 // 5 minutes
        ) {
          // Use cached profile
          const isLoggedInUser = username === getUserFromLocalStorage().username;
          
          set((state) => {
            if (isLoggedInUser) {
              state.loggedInUserProfile = cachedProfile.profile;
              state.isLoggedInUserProfileLoaded = true;
              state.profilePictureUrl = cachedProfile.profile.profilePictureUrl;
              state.userName = cachedProfile.profile.username;
              state.userCreated = cachedProfile.profile.userCreated;
              state.followersCount = cachedProfile.profile.followersCount;
              state.followingCount = cachedProfile.profile.followingCount;
              state.Followers = cachedProfile.profile.followers;
              state.Following = cachedProfile.profile.following;
              state.likedMemes = cachedProfile.profile.likedMemes;
              state.savedMemes = cachedProfile.profile.savedMemes;
              state.memeList = cachedProfile.profile.memeList;
            } else {
              state.viewedProfilePictureUrl = cachedProfile.profile.profilePictureUrl;
              state.viewedUserName = cachedProfile.profile.username;
              state.followersCount = cachedProfile.profile.followersCount;
              state.followingCount = cachedProfile.profile.followingCount;
              state.Followers = cachedProfile.profile.followers;
              state.Following = cachedProfile.profile.following;
              state.likedMemes = cachedProfile.profile.likedMemes;
              state.savedMemes = cachedProfile.profile.savedMemes;
              state.memeList = cachedProfile.profile.memeList;
            }
          });
          
          return;
        }
        
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        // Use a single API call to fetch the user profile with all meme collections
        const response = await api.get(`/profile/${username}?includeMemes=true`);
        
        // Debug the API response
        console.log("UserStore: API response for profile:", response.data);
        console.log("UserStore: memeList in API response:", response.data.memeList);
        
        // Map the memeList to ensure it has the correct structure
        const mappedMemeList = response.data.memeList?.map((meme: Partial<Meme> & { mediaUrl?: string }) => {
          if (meme.url) {
            return meme;
          }
          
          if (meme.mediaUrl) {
            return {
              ...meme,
              url: meme.mediaUrl
            };
          }
          
          return meme;
        }) || [];
        
        const userProfile: UserProfile = {
          userId: response.data.userId,
          username: response.data.username,
          profilePictureUrl: response.data.profilePictureUrl,
          followersCount: response.data.followersCount,
          followingCount: response.data.followingCount,
          userCreated: new Date(response.data.userCreated),
          followers: response.data.followers || [],
          following: response.data.following || [],
          likedMemes: response.data.likedMemes || [],
          savedMemes: response.data.savedMemes || [],
          memeList: mappedMemeList, // Use the mapped memeList
        };
        
        const isLoggedInUser = username === getUserFromLocalStorage().username;
        
        // Cache the profile
        set((state) => {
          state.profileCache[username] = {
            profile: userProfile,
            timestamp: now,
          };
          
          if (isLoggedInUser) {
            state.loggedInUserProfile = userProfile;
            state.isLoggedInUserProfileLoaded = true;
            state.profilePictureUrl = userProfile.profilePictureUrl;
            state.userName = userProfile.username;
            state.userCreated = userProfile.userCreated;
            state.followersCount = userProfile.followersCount;
            state.followingCount = userProfile.followingCount;
            state.Followers = userProfile.followers;
            state.Following = userProfile.following;
            state.likedMemes = userProfile.likedMemes;
            state.savedMemes = userProfile.savedMemes;
            state.memeList = userProfile.memeList;
          } else {
            state.viewedProfilePictureUrl = userProfile.profilePictureUrl;
            state.viewedUserName = userProfile.username;
            state.followersCount = userProfile.followersCount;
            state.followingCount = userProfile.followingCount;
            state.Followers = userProfile.followers;
            state.Following = userProfile.following;
            state.likedMemes = userProfile.likedMemes;
            state.savedMemes = userProfile.savedMemes;
            state.memeList = userProfile.memeList;
            
            // Check if the logged-in user is following the viewed user
            const loggedInUser = getUserFromLocalStorage();
            if (loggedInUser.userId) {
              state.isFollowing = userProfile.followers.some(
                (follower: Followers) => follower.userId === loggedInUser.userId
              );
            }
          }
          
          state.isLoading = false;
        });
      } catch (error) {
        console.error(`Error fetching user profile for ${username}:`, error);
        set((state) => {
          state.error = `Failed to fetch user profile for ${username}`;
          state.isLoading = false;
        });
      }
    },

    updateProfilePicture: async (file: File, userId: string) => {
      try {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        const formData = new FormData();
        formData.append("file", file);
        formData.append("userId", userId);

        const response = await api.post("/profile/profile-picture", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        // Update the user in localStorage
        const user = getUserFromLocalStorage();
        user.profilePicture = response.data.profilePictureUrl;
        localStorage.setItem("user", JSON.stringify(user));

        set((state) => {
          state.profilePictureUrl = response.data.profilePictureUrl;
          
          // Update the logged-in user profile if it exists
          if (state.loggedInUserProfile) {
            state.loggedInUserProfile.profilePictureUrl = response.data.profilePictureUrl;
          }
          
          // Update the profile in the cache
          if (state.profileCache[user.username]) {
            state.profileCache[user.username].profile.profilePictureUrl = response.data.profilePictureUrl;
            
            // Also update the profile picture in all meme collections
            if (state.profileCache[user.username].profile.memeList) {
              state.profileCache[user.username].profile.memeList.forEach(meme => {
                if (meme.userId === userId) {
                  meme.profilePictureUrl = response.data.profilePictureUrl;
                }
              });
            }
          }
          
          // Update profile picture in meme collections
          state.memeList.forEach(meme => {
            if (meme.userId === userId) {
              meme.profilePictureUrl = response.data.profilePictureUrl;
            }
          });
          
          state.isLoading = false;
        });
      } catch (error) {
        console.error("Error updating profile picture:", error);
        set((state) => {
          state.error = "Failed to update profile picture";
          state.isLoading = false;
        });
      }
    },

    updateUserName: async (userId: string, newUsername: string) => {
      try {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        // Make API call and await response
        await api.put(`/profile/${userId}/username`, {
          newUsername,
        });

        // Update the user in localStorage
        const user = getUserFromLocalStorage();
        const oldUsername = user.username;
        user.username = newUsername;
        localStorage.setItem("user", JSON.stringify(user));

        set((state) => {
          state.userName = newUsername;
          
          // Update the logged-in user profile if it exists
          if (state.loggedInUserProfile) {
            state.loggedInUserProfile.username = newUsername;
          }
          
          // Update the profile in the cache
          if (state.profileCache[oldUsername]) {
            // Create a new cache entry with the new username
            state.profileCache[newUsername] = {
              ...state.profileCache[oldUsername],
              profile: {
                ...state.profileCache[oldUsername].profile,
                username: newUsername,
              },
            };
            
            // Update username in all meme collections in the cache
            if (state.profileCache[newUsername].profile.memeList) {
              state.profileCache[newUsername].profile.memeList.forEach(meme => {
                if (meme.userId === userId) {
                  meme.uploader = newUsername;
                }
              });
            }
            
            // Remove the old cache entry
            delete state.profileCache[oldUsername];
          }
          
          // Update username in meme collections
          state.memeList.forEach(meme => {
            if (meme.userId === userId) {
              meme.uploader = newUsername;
            }
          });
          
          state.isLoading = false;
        });
      } catch (error) {
        console.error("Error updating username:", error);
        set((state) => {
          state.error = "Failed to update username";
          state.isLoading = false;
        });
      }
    },

    // Social operations
    handleFollowToggle: async (isFollowing: boolean) => {
      try {
        const user = getUserFromLocalStorage();
        const targetUsername = get().viewedUserName;
        
        if (!user.userId || !targetUsername) {
          throw new Error("Missing user ID or target username");
        }
        
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        // Get the target user's ID from the cache if available
        let targetUserId: string;
        const state = get();
        
        // Check if we have the profile in cache
        if (state.profileCache[targetUsername]) {
          targetUserId = state.profileCache[targetUsername].profile.userId;
        } else {
          // If not in cache, we need to fetch it (this should be rare)
          console.log("Profile not in cache, fetching from API");
          const targetUserResponse = await api.get(`/users/${targetUsername}`);
          targetUserId = targetUserResponse.data.userId;
        }

        // Import the WebSocket store
        const { useWebSocketStore } = await import("../hooks/useWebSockets");
        
        // Use the WebSocket method to send the follow request
        // The WebSocket service expects the current state we want to set
        // We're passing the NEW state we want (opposite of current isFollowing)
        const success = useWebSocketStore.getState().sendFollowRequest(targetUserId, targetUsername, !isFollowing);
        
        if (!success) {
          throw new Error("Failed to send WebSocket follow request");
        }

        // Apply optimistic UI updates
        set((state) => {
          state.isFollowing = !isFollowing;
          
          // Update followers count
          if (!isFollowing) {
            state.followersCount += 1;
            
            // Add the current user to the followers list
            state.Followers.push({
              userId: user.userId,
              username: user.username,
              profilePictureUrl: user.profilePicture || "",
              isFollow: true,
            });
          } else {
            state.followersCount = Math.max(0, state.followersCount - 1);
            
            // Remove the current user from the followers list
            state.Followers = state.Followers.filter(
              (follower: Followers) => follower.userId !== user.userId
            );
          }
          
          // Update the profile in the cache
          if (state.profileCache[targetUsername]) {
            if (!isFollowing) {
              state.profileCache[targetUsername].profile.followersCount += 1;
              state.profileCache[targetUsername].profile.followers.push({
                userId: user.userId,
                username: user.username,
                profilePictureUrl: user.profilePicture || "",
                isFollow: true,
              });
            } else {
              state.profileCache[targetUsername].profile.followersCount = Math.max(
                0, 
                state.profileCache[targetUsername].profile.followersCount - 1
              );
              state.profileCache[targetUsername].profile.followers = 
                state.profileCache[targetUsername].profile.followers.filter(
                  (follower: Followers) => follower.userId !== user.userId
                );
            }
          }
          
          // Update the logged-in user's following list
          if (state.loggedInUserProfile) {
            if (!isFollowing) {
              state.loggedInUserProfile.followingCount += 1;
              state.loggedInUserProfile.following.push({
                userId: targetUserId,
                username: targetUsername,
                profilePictureUrl: state.viewedProfilePictureUrl,
                isFollow: true,
              });
            } else {
              state.loggedInUserProfile.followingCount = Math.max(
                0, 
                state.loggedInUserProfile.followingCount - 1
              );
              state.loggedInUserProfile.following = 
                state.loggedInUserProfile.following.filter(
                  (following: Following) => following.userId !== targetUserId
                );
            }
            
            // Update the profile in the cache
            if (state.profileCache[user.username]) {
              state.profileCache[user.username].profile = state.loggedInUserProfile;
            }
          }
          
          state.isLoading = false;
        });
      } catch (error) {
        console.error("Error toggling follow:", error);
        set((state) => {
          state.error = "Failed to toggle follow";
          state.isLoading = false;
        });
      }
    },
    
    // Add a follower to the current user's followers list
    addFollower: (follower: Followers) => {
      const user = getUserFromLocalStorage();
      
      set((state) => {
        // Check if the follower already exists
        const followerExists = state.Followers.some(f => f.userId === follower.userId);
        
        if (!followerExists) {
          // Update followers count and list
          state.followersCount += 1;
          state.Followers.push(follower);
          
          // Update the profile in the cache if it exists
          if (user.username && state.profileCache[user.username]) {
            state.profileCache[user.username].profile.followersCount += 1;
            state.profileCache[user.username].profile.followers.push(follower);
          }
          
          // Update the logged-in user profile if it exists
          if (state.loggedInUserProfile) {
            state.loggedInUserProfile.followersCount += 1;
            state.loggedInUserProfile.followers.push(follower);
          }
        }
      });
    },
    
    // Remove a follower from the current user's followers list
    removeFollower: (userId: string) => {
      const user = getUserFromLocalStorage();
      
      set((state) => {
        // Check if the follower exists
        const followerExists = state.Followers.some(f => f.userId === userId);
        
        if (followerExists) {
          // Update followers count and list
          state.followersCount = Math.max(0, state.followersCount - 1);
          state.Followers = state.Followers.filter(f => f.userId !== userId);
          
          // Update the profile in the cache if it exists
          if (user.username && state.profileCache[user.username]) {
            state.profileCache[user.username].profile.followersCount = 
              Math.max(0, state.profileCache[user.username].profile.followersCount - 1);
            state.profileCache[user.username].profile.followers = 
              state.profileCache[user.username].profile.followers.filter(f => f.userId !== userId);
          }
          
          // Update the logged-in user profile if it exists
          if (state.loggedInUserProfile) {
            state.loggedInUserProfile.followersCount = 
              Math.max(0, state.loggedInUserProfile.followersCount - 1);
            state.loggedInUserProfile.followers = 
              state.loggedInUserProfile.followers.filter(f => f.userId !== userId);
          }
        }
      });
    },
  }))
);

// Create a helper for selectors
export const useUserStore = createSelectors<UserState & UserActions>(useRawUserStore);