import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { createSelectors } from "./createSelectors";
import api from "../hooks/api";
import type { Meme, Comment, ApiMeme } from "../types/mems";
import type { AxiosProgressEvent } from "axios";
import { useWebSocketStore } from "../hooks/useWebSockets";
import { mapApiMemeToMeme } from "../utils/memeMappers";

// Track the current meme being viewed
let currentMemeId: string | null = null;

// Define the store interface
interface MemeContentState {
  // Meme collections
  memes: Meme[];
  memeList: Meme[];
  likedMemes: Meme[];
  savedMemes: Meme[];
  selectedMeme: Meme | null;

  // UI state
  isLoading: boolean;
  error: string | null;
  uploadProgress: number | null;
  searchQuery: string;

  // Cache state
  userDataLoaded: boolean;

  // WebSocket related properties for meme sessions
  wsUnsubscribe: (() => void) | null;
}

interface MemeContentActions {
  // Fetch operations
  fetchMemes: () => Promise<void>;
  searchMemes: (query: string) => Promise<void>;
  fetchMemeById: (id: string) => Promise<Meme | null>;
  fetchMemeComments: (
    id: string,
    page: number,
    limit: number
  ) => Promise<{ comments: Comment[]; currentPage: number; totalItems: number; totalPages?: number }>;
  fetchUserMemes: (username: string) => Promise<void>;
  fetchLikedMemes: (username: string) => Promise<void>;
  fetchSavedMemes: (username: string) => Promise<void>;

  // Meme interactions
  toggleLike: (id: string, username: string) => Promise<void>;
  toggleSave: (id: string, username: string) => Promise<void>;
  addComment: (
    memeId: string,
    username: string,
    text: string,
    profilePictureUrl: string,
    userId: string
  ) => Promise<void>;

  // Meme management
  uploadMeme: (
    file: File,
    title: string,
    profilePictureUrl: string,
    username: string
  ) => Promise<void>;
  deleteMeme: (id: string) => Promise<void>;

  // UI actions
  setSelectedMeme: (meme: Meme | null) => void;
  setSearchQuery: (query: string) => void;

  // WebSocket session management
  joinPostSession: (memeId: string) => void;
  leavePostSession: (memeId: string) => void;

  // State updates
  updateMemeStats: (
    memeId: string,
    stats: { likes?: number; saves?: number }
  ) => void;
  updateCommentInStore: (comment: Comment) => void;
  forceAddComment: (comment: Comment) => void; // New function to force add a comment without duplicate checks

  // User data management
  resetUserData: () => void;
}

export type MemeContentStore = MemeContentState & MemeContentActions;

// Create the store with immer middleware for more efficient updates
const useRawMemeContentStore = create<MemeContentStore>()(
  immer((set) => ({
    // Initial state
    memes: [],
    memeList: [],
    likedMemes: [],
    savedMemes: [],
    selectedMeme: null,
    isLoading: false,
    error: null,
    uploadProgress: null,
    searchQuery: "",
    userDataLoaded: false,
    wsUnsubscribe: null,

    // Fetch operations
    fetchMemes: async () => {
      try {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });
        const user = JSON.parse(localStorage.getItem("user") || "{}");

        let memes: Meme[] = [];

        if (user && user.userId) {
          // Add excludeComments=true parameter to optimize response time
          const response = await api.get(
            `/memes?userId=${user.userId}&excludeComments=true`
          );
          memes = response.data.map((apiMeme: ApiMeme) =>
            mapApiMemeToMeme(apiMeme, false)
          );
        } else {
          // Add excludeComments=true parameter to optimize response time
          const response = await api.get(
            "/memes/trending?excludeComments=true"
          );
          memes = response.data.map((apiMeme: ApiMeme) =>
            mapApiMemeToMeme(apiMeme, false)
          );
        }

        // Get the current user

        // Check if user data has already been loaded
        let userDataLoaded = false;
        set((state) => {
          userDataLoaded = state.userDataLoaded;
        });

        // Try to initialize from user profile if available
        try {
          // Import the user store to check the current state
          const { useUserStore } = await import("../store/useUserStore");
          const userState = useUserStore.getState();

          if (userState.loggedInUserProfile) {
            const userLikedMemes = userState.likedMemes;
            const userSavedMemes = userState.savedMemes;

            console.log("Initializing liked/saved memes from user profile:", {
              likedMemes: userLikedMemes.length,
              savedMemes: userSavedMemes.length,
            });

            // Find the memes that are liked/saved in the fetched memes
            const likedMemeIds = userLikedMemes.map((m: Meme) => m.id);
            const savedMemeIds = userSavedMemes.map((m: Meme) => m.id);

            const likedMemes = memes.filter((meme: Meme) =>
              likedMemeIds.includes(meme.id)
            );
            const savedMemes = memes.filter((meme: Meme) =>
              savedMemeIds.includes(meme.id)
            );

            // Update the store with the liked/saved memes from user profile
            set((state) => {
              state.likedMemes = [...state.likedMemes, ...likedMemes];
              state.savedMemes = [...state.savedMemes, ...savedMemes];
            });
          }
        } catch (error) {
          console.error(
            "Error initializing liked/saved memes from user profile:",
            error
          );
        }

        if (user && user.userId && !userDataLoaded) {
          // Fetch liked and saved memes for the current user only once
          try {
            const [likedResponse, savedResponse] = await Promise.all([
              api.get(`/memes/liked/${user.username}`),
              api.get(`/memes/saved/${user.username}`),
            ]);

            // Map the API responses to get IDs
            // const likedMemeIds = likedResponse.data.map((meme: ApiMeme) => meme.id);
            // const savedMemeIds = savedResponse.data.map((meme: ApiMeme) => meme.id);

            // No longer storing in localStorage - using the store directly

            // Map the API responses to Meme objects
            const likedMemes = likedResponse.data.map(mapApiMemeToMeme);
            const savedMemes = savedResponse.data.map(mapApiMemeToMeme);

            set((state) => {
              // Replace the arrays completely to avoid duplicates
              state.likedMemes = likedMemes;
              state.savedMemes = savedMemes;
              state.memes = memes;
              state.isLoading = false;
              state.userDataLoaded = true; // Mark user data as loaded
            });
          } catch (error) {
            console.error("Error fetching liked/saved memes:", error);
            set((state) => {
              state.memes = memes;
              state.isLoading = false;
            });
          }
        } else {
          set((state) => {
            state.memes = memes;
            state.isLoading = false;
          });
        }
      } catch (error) {
        console.error("Error fetching memes:", error);
        set((state) => {
          state.error = "Failed to fetch memes";
          state.isLoading = false;
        });
      }
    },

    searchMemes: async (query: string) => {
      try {
        set((state) => {
          state.isLoading = true;
          state.error = null;
          state.searchQuery = query;
        });

        // Add excludeComments=true parameter to optimize response time
        const response = await api.get(
          `/memes/search?query=${query}&excludeComments=true`
        );
        const memes = response.data.map((apiMeme: ApiMeme) =>
          mapApiMemeToMeme(apiMeme, false)
        );

        set((state) => {
          state.memes = memes;
          state.isLoading = false;
        });
      } catch (error) {
        console.error("Error searching memes:", error);
        set((state) => {
          state.error = "Failed to search memes";
          state.isLoading = false;
        });
      }
    },

    fetchMemeById: async (id: string) => {
      try {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        // For meme detail page, we want to include basic meme info but not comments
        // We'll fetch comments separately with pagination
        const response = await api.get(
          `/memes/memepage/${id}?excludeComments=true`
        );
        const meme = mapApiMemeToMeme(response.data, false); // Don't include comments

        // Check if this meme is liked or saved using the user profile
        try {
          // Import the user store to check the current state
          const { useUserStore } = await import("../store/useUserStore");
          const userState = useUserStore.getState();

          if (userState.loggedInUserProfile) {
            const userLikedMemes = userState.likedMemes;
            const userSavedMemes = userState.savedMemes;

            const isLikedInUserProfile = userLikedMemes.some(
              (m) => m.id === id
            );
            const isSavedInUserProfile = userSavedMemes.some(
              (m) => m.id === id
            );

            console.log(
              `Meme ${id} liked status from user profile:`,
              isLikedInUserProfile
            );
            console.log(
              `Meme ${id} saved status from user profile:`,
              isSavedInUserProfile
            );

            // Update the store to match the user profile
            set((state) => {
              // Update liked status
              const isLikedInStore = state.likedMemes.some((m) => m.id === id);
              if (isLikedInUserProfile && !isLikedInStore) {
                // Add to liked memes
                state.likedMemes.push(meme);
                console.log(`Added meme ${id} to likedMemes in store`);
              } else if (!isLikedInUserProfile && isLikedInStore) {
                // Remove from liked memes
                state.likedMemes = state.likedMemes.filter((m) => m.id !== id);
                console.log(`Removed meme ${id} from likedMemes in store`);
              }

              // Update saved status
              const isSavedInStore = state.savedMemes.some((m) => m.id === id);
              if (isSavedInUserProfile && !isSavedInStore) {
                // Add to saved memes
                state.savedMemes.push(meme);
                console.log(`Added meme ${id} to savedMemes in store`);
              } else if (!isSavedInUserProfile && isSavedInStore) {
                // Remove from saved memes
                state.savedMemes = state.savedMemes.filter((m) => m.id !== id);
                console.log(`Removed meme ${id} from savedMemes in store`);
              }
            });
          }
        } catch (error) {
          console.error(
            "Error checking liked/saved status from user profile:",
            error
          );
        }

        set((state) => {
          state.selectedMeme = meme;
          state.isLoading = false;
        });

        return meme;
      } catch (error) {
        console.error(`Error fetching meme with ID ${id}:`, error);
        set((state) => {
          state.error = `Failed to fetch meme with ID ${id}`;
          state.isLoading = false;
        });
        return null;
      }
    },

    // fetchMemeComments: async (id: string, page: number, limit: number) => {
    //   try {
    //     // Fetch comments for a meme with pagination
    //     const response = await api.get(`/memes/${id}/comments?page=${page}&limit=${limit}`);
    //     return response.data;
    //   } catch (error) {
    //     console.error(`Error fetching comments for meme ${id}:`, error);
    //     return [];
    //   }
    // },

    fetchMemeComments: async (id: string, page: number, limit: number) => {
      try {
        const response = await api.get(
          `/memes/${id}/comments?page=${page}&limit=${limit}`
        );

        // Backend response now returns: { data: [...], totalItems, totalPages, currentPage }
        return {
          comments: response.data.data,
          currentPage: response.data.currentPage,
          totalPages: response.data.totalPages,
          totalItems: response.data.totalItems,
        };
      } catch (error) {
        console.error(`Error fetching comments for meme ${id}:`, error);
        return {
          comments: [],
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
        };
      }
    },

    fetchUserMemes: async (username: string) => {
      try {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        // Add excludeComments=true parameter to optimize response time
        const response = await api.get(
          `/memes/uploaded/${username}?excludeComments=true`
        );
        const memes = response.data.map((apiMeme: ApiMeme) =>
          mapApiMemeToMeme(apiMeme, false)
        );

        set((state) => {
          state.memeList = memes;
          state.isLoading = false;
        });
      } catch (error) {
        console.error(`Error fetching memes for user ${username}:`, error);
        set((state) => {
          state.error = `Failed to fetch memes for user ${username}`;
          state.isLoading = false;
        });
      }
    },

    fetchLikedMemes: async (username: string) => {
      // Check if user data has already been loaded
      let userDataLoaded = false;
      let currentUsername = "";

      set((state) => {
        userDataLoaded = state.userDataLoaded;
        // Get the current user from localStorage to compare with requested username
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        currentUsername = user.username || "";
      });

      // If user data is already loaded and the requested username is the current user,
      // we don't need to make an API call
      if (userDataLoaded && username === currentUsername) {
        console.log("Using cached liked memes data");
        return;
      }

      try {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        // Add excludeComments=true parameter to optimize response time
        const response = await api.get(
          `/memes/liked/${username}?excludeComments=true`
        );
        const memes = response.data.map((apiMeme: ApiMeme) =>
          mapApiMemeToMeme(apiMeme, false)
        );

        // If this is the current user, update the store cache
        if (username === currentUsername) {
          // No longer need to store in localStorage
          // const likedMemeIds = response.data.map((meme: ApiMeme) => meme.id);

          set((state) => {
            state.likedMemes = memes;
            state.isLoading = false;
            state.userDataLoaded = true; // Mark user data as loaded
          });
        } else {
          set((state) => {
            state.likedMemes = memes;
            state.isLoading = false;
          });
        }
      } catch (error) {
        console.error(
          `Error fetching liked memes for user ${username}:`,
          error
        );
        set((state) => {
          state.error = `Failed to fetch liked memes for user ${username}`;
          state.isLoading = false;
        });
      }
    },

    fetchSavedMemes: async (username: string) => {
      // Check if user data has already been loaded
      let userDataLoaded = false;
      let currentUsername = "";

      set((state) => {
        userDataLoaded = state.userDataLoaded;
        // Get the current user from localStorage to compare with requested username
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        currentUsername = user.username || "";
      });

      // If user data is already loaded and the requested username is the current user,
      // we don't need to make an API call
      if (userDataLoaded && username === currentUsername) {
        console.log("Using cached saved memes data");
        return;
      }

      try {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        // Add excludeComments=true parameter to optimize response time
        const response = await api.get(
          `/memes/saved/${username}?excludeComments=true`
        );
        const memes = response.data.map((apiMeme: ApiMeme) =>
          mapApiMemeToMeme(apiMeme, false)
        );

        // If this is the current user, update the store cache
        if (username === currentUsername) {
          // No longer need to store in localStorage
          // const savedMemeIds = response.data.map((meme: ApiMeme) => meme.id);

          set((state) => {
            state.savedMemes = memes;
            state.isLoading = false;
            state.userDataLoaded = true; // Mark user data as loaded
          });
        } else {
          set((state) => {
            state.savedMemes = memes;
            state.isLoading = false;
          });
        }
      } catch (error) {
        console.error(
          `Error fetching saved memes for user ${username}:`,
          error
        );
        set((state) => {
          state.error = `Failed to fetch saved memes for user ${username}`;
          state.isLoading = false;
        });
      }
    },

    // Meme interactions
    toggleLike: async (id: string) => {
      try {
        // Use WebSocket to send like request instead of Axios
        const { useWebSocketStore } = await import("../hooks/useWebSockets");

        // Do all state updates within a single set call to avoid proxy issues
        set((state) => {
          // Check if this meme is already in liked memes to determine if we're liking or unliking
          const isCurrentlyLiked = state.likedMemes.some(
            (m: Meme) => m.id === id
          );

          // Find the meme in any of our collections, including selectedMeme
          const meme =
            (state.selectedMeme && state.selectedMeme.id === id
              ? state.selectedMeme
              : undefined) ||
            state.memes.find((m: Meme) => m.id === id) ||
            state.memeList.find((m: Meme) => m.id === id) ||
            state.savedMemes.find((m: Meme) => m.id === id) ||
            state.likedMemes.find((m: Meme) => m.id === id);

          console.log(
            `Toggle like for meme ${id}: Currently liked = ${isCurrentlyLiked}`
          );

          if (!meme) {
            console.error(`Cannot find meme with ID ${id} in any collection`);
            return;
          }

          // Update the UI state optimistically
          const newLikeState = !isCurrentlyLiked;

          // Calculate the new like count
          const newLikeCount = newLikeState
            ? meme.likeCount + 1
            : Math.max(0, meme.likeCount - 1);

          // Update like status in the store
          if (newLikeState) {
            // Add to liked memes if not already there
            if (!state.likedMemes.some((m: Meme) => m.id === id)) {
              state.likedMemes.push({ ...meme });
              console.log(`Added meme ${id} to likedMemes in store`);
            }
          } else {
            // Remove from liked memes
            state.likedMemes = state.likedMemes.filter(
              (m: Meme) => m.id !== id
            );
            console.log(`Removed meme ${id} from likedMemes in store`);
          }

          // Update the meme in all collections with the optimistic like count
          const updateMemeInArray = (memes: Meme[]): Meme[] =>
            memes.map((m: Meme) =>
              m.id === id ? { ...m, likeCount: newLikeCount } : m
            );

          state.memes = updateMemeInArray(state.memes);
          state.memeList = updateMemeInArray(state.memeList);
          state.savedMemes = updateMemeInArray(state.savedMemes);
          state.likedMemes = updateMemeInArray(state.likedMemes);

          // Update the selected meme if it's the one being liked
          if (state.selectedMeme && state.selectedMeme.id === id) {
            state.selectedMeme = {
              ...state.selectedMeme,
              likeCount: newLikeCount,
            };
          }
        });

        // Send the like request via WebSocket
        // This will be processed in the background and any server updates will be handled
        // by the WebSocket message handlers
        const success = await useWebSocketStore.getState().sendLikeRequest(id);

        if (!success) {
          console.error("Failed to send like request via WebSocket");
          // If the WebSocket request fails, we could revert the optimistic update here
          // but for now we'll leave it as is since the UI is already updated
        }
      } catch (error) {
        console.error(`Error toggling like for meme ${id}:`, error);
        set((state) => {
          state.error = `Failed to toggle like for meme ${id}`;
        });
      }
    },

    toggleSave: async (id: string) => {
      try {
        // Use WebSocket to send save request instead of Axios
        const { useWebSocketStore } = await import("../hooks/useWebSockets");

        // Do all state updates within a single set call to avoid proxy issues
        set((state) => {
          // Check if this meme is already in saved memes to determine if we're saving or unsaving
          const isCurrentlySaved = state.savedMemes.some(
            (m: Meme) => m.id === id
          );

          // Find the meme in any of our collections, including selectedMeme
          const meme =
            (state.selectedMeme && state.selectedMeme.id === id
              ? state.selectedMeme
              : undefined) ||
            state.memes.find((m: Meme) => m.id === id) ||
            state.memeList.find((m: Meme) => m.id === id) ||
            state.likedMemes.find((m: Meme) => m.id === id) ||
            state.savedMemes.find((m: Meme) => m.id === id);

          console.log(
            `Toggle save for meme ${id}: Currently saved = ${isCurrentlySaved}`
          );

          if (!meme) {
            console.error(`Cannot find meme with ID ${id} in any collection`);
            return;
          }

          // Update the UI state optimistically
          const newSaveState = !isCurrentlySaved;

          // Calculate the new save count
          const newSaveCount = newSaveState
            ? meme.saveCount + 1
            : Math.max(0, meme.saveCount - 1);

          // Update save status in the store
          if (newSaveState) {
            // Add to saved memes if not already there
            if (!state.savedMemes.some((m: Meme) => m.id === id)) {
              state.savedMemes.push({ ...meme });
              console.log(`Added meme ${id} to savedMemes in store`);
            }
          } else {
            // Remove from saved memes
            state.savedMemes = state.savedMemes.filter(
              (m: Meme) => m.id !== id
            );
            console.log(`Removed meme ${id} from savedMemes in store`);
          }

          // Update the meme in all collections with the optimistic save count
          const updateMemeInArray = (memes: Meme[]): Meme[] =>
            memes.map((m: Meme) =>
              m.id === id ? { ...m, saveCount: newSaveCount } : m
            );

          state.memes = updateMemeInArray(state.memes);
          state.memeList = updateMemeInArray(state.memeList);
          state.likedMemes = updateMemeInArray(state.likedMemes);
          state.savedMemes = updateMemeInArray(state.savedMemes);

          // Update the selected meme if it's the one being saved
          if (state.selectedMeme && state.selectedMeme.id === id) {
            state.selectedMeme = {
              ...state.selectedMeme,
              saveCount: newSaveCount,
            };
          }
        });

        // Send the save request via WebSocket
        // This will be processed in the background and any server updates will be handled
        // by the WebSocket message handlers
        const success = await useWebSocketStore.getState().sendSaveRequest(id);

        if (!success) {
          console.error("Failed to send save request via WebSocket");
          // If the WebSocket request fails, we could revert the optimistic update here
          // but for now we'll leave it as is since the UI is already updated
        }
      } catch (error) {
        console.error(`Error toggling save for meme ${id}:`, error);
        set((state) => {
          state.error = `Failed to toggle save for meme ${id}`;
        });
      }
    },

    addComment: async (
      memeId: string,
      username: string,
      text: string,
      profilePictureUrl: string,
      userId: string
    ) => {
      try {
        // First, make the API call to save the comment to the database
        const response = await api.post(`/memes/${memeId}/comment`, {
          username,
          text,
          profilePictureUrl,
          userId,
        });

        // Create a comment object with the data from the server response
        const newComment: Comment = {
          id: response.data.id,
          memeId,
          userId,
          text,
          username,
          createdAt: new Date().toISOString(),
          profilePictureUrl,
        };

        // Use the forceAddComment function to update the UI immediately
        // This ensures the comment appears in the UI right away without waiting for WebSocket
        const store = useRawMemeContentStore.getState();
        store.forceAddComment(newComment);

        // Note: The WebSocket message will be sent by the server to all clients
        // including the sender, and will be handled by the WebSocket message handler
        // The duplicate detection in updateCommentInStore will prevent duplicates

        // Log success message
        console.log("Comment added successfully and UI updated:", newComment);
      } catch (error) {
        console.error(`Error adding comment to meme ${memeId}:`, error);
        set((state) => {
          state.error = `Failed to add comment to meme ${memeId}`;
        });
      }
    },

    // Meme management
    uploadMeme: async (
      file: File,
      title: string,
      profilePictureUrl: string,
      username: string
    ) => {
      try {
        set((state) => {
          state.isLoading = true;
          state.error = null;
          state.uploadProgress = 0;
        });

        const formData = new FormData();
        formData.append("file", file);
        formData.append("title", title);
        formData.append("profilePictureUrl", profilePictureUrl);
        formData.append("username", username);

        const response = await api.post("/memes", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent: AxiosProgressEvent) => {
            if (progressEvent.total) {
              const progress = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              set((state) => {
                state.uploadProgress = progress;
              });
            }
          },
        });

        const newMeme = mapApiMemeToMeme(response.data);

        set((state) => {
          state.memes = [newMeme, ...state.memes];
          state.memeList = [newMeme, ...state.memeList];
          state.isLoading = false;
          state.uploadProgress = null;
        });
      } catch (error) {
        console.error("Error uploading meme:", error);
        set((state) => {
          state.error = "Failed to upload meme";
          state.isLoading = false;
          state.uploadProgress = null;
        });
      }
    },

    deleteMeme: async (id: string) => {
      try {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        await api.delete(`/memes/${id}`);

        set((state) => {
          state.memes = state.memes.filter((meme: Meme) => meme.id !== id);
          state.memeList = state.memeList.filter(
            (meme: Meme) => meme.id !== id
          );
          state.likedMemes = state.likedMemes.filter(
            (meme: Meme) => meme.id !== id
          );
          state.savedMemes = state.savedMemes.filter(
            (meme: Meme) => meme.id !== id
          );

          // Clear selected meme if it's the one being deleted
          if (state.selectedMeme && state.selectedMeme.id === id) {
            state.selectedMeme = null;
          }

          state.isLoading = false;
        });
      } catch (error) {
        console.error(`Error deleting meme ${id}:`, error);
        set((state) => {
          state.error = `Failed to delete meme ${id}`;
          state.isLoading = false;
        });
      }
    },

    // UI actions
    setSelectedMeme: (meme: Meme | null) => {
      set((state) => {
        state.selectedMeme = meme;
      });
    },

    setSearchQuery: (query: string) => {
      set((state) => {
        state.searchQuery = query;
      });
    },

    // WebSocket session management
    joinPostSession: (memeId: string) => {
      // Check if we're already in this session to prevent duplicate joins
      if (currentMemeId === memeId) {
        console.log(
          `Already in post session for meme: ${memeId}, skipping join`
        );
        return;
      }

      // Store the current meme ID
      currentMemeId = memeId;

      // Get the WebSocketStore state
      const wsState = useWebSocketStore.getState();

      // Check if WebSocket is connected
      if (
        wsState.isConnected &&
        wsState.client &&
        wsState.client.readyState === WebSocket.OPEN
      ) {
        console.log(`Joining post session for meme: ${memeId}`);
        wsState.sendJoinPostRequest(memeId);
      } else {
        console.log(
          `WebSocket not connected, attempting to reconnect before joining post session for meme: ${memeId}`
        );

        // Try to restore the connection first
        wsState.restoreConnection();

        // Queue the join request to be sent after reconnection
        setTimeout(() => {
          // Double-check we still want to join this session
          if (currentMemeId === memeId) {
            console.log(
              `Sending delayed join post request for meme: ${memeId} after reconnection attempt`
            );
            useWebSocketStore.getState().sendJoinPostRequest(memeId);
          } else {
            console.log(
              `Meme ID changed during reconnection, not joining session for: ${memeId}`
            );
          }
        }, 1000); // Wait 1 second for the connection to be established
      }
    },

    leavePostSession: (memeId: string) => {
      // Check if we're actually in this session
      if (currentMemeId !== memeId) {
        console.log(`Not in post session for meme: ${memeId}, skipping leave`);
        return;
      }

      // Clear the current meme ID
      currentMemeId = null;

      // Get the WebSocketStore state
      const wsState = useWebSocketStore.getState();

      // Only send the leave message if the WebSocket is connected
      if (
        wsState.isConnected &&
        wsState.client &&
        wsState.client.readyState === WebSocket.OPEN
      ) {
        console.log(`Leaving post session for meme: ${memeId}`);
        wsState.sendLeavePostRequest(memeId);
      } else {
        console.log(
          `WebSocket not connected, skipping leave post session for meme: ${memeId}`
        );
        // No need to reconnect just to leave a session
      }
    },

    // State updates
    updateMemeStats: (
      memeId: string,
      stats: { likes?: number; saves?: number }
    ) => {
      set((state) => {
        const updateMemeInArray = (memes: Meme[]): Meme[] =>
          memes.map((meme: Meme) =>
            meme.id === memeId
              ? {
                  ...meme,
                  likeCount:
                    stats.likes !== undefined ? stats.likes : meme.likeCount,
                  saveCount:
                    stats.saves !== undefined ? stats.saves : meme.saveCount,
                }
              : meme
          );

        state.memes = updateMemeInArray(state.memes);
        state.memeList = updateMemeInArray(state.memeList);
        state.likedMemes = updateMemeInArray(state.likedMemes);
        state.savedMemes = updateMemeInArray(state.savedMemes);

        // Update the selected meme if it's the one being updated
        if (state.selectedMeme && state.selectedMeme.id === memeId) {
          state.selectedMeme = {
            ...state.selectedMeme,
            likeCount:
              stats.likes !== undefined
                ? stats.likes
                : state.selectedMeme.likeCount,
            saveCount:
              stats.saves !== undefined
                ? stats.saves
                : state.selectedMeme.saveCount,
          };
        }
      });
    },

    // Note: updateLikeStatus and updateSaveStatus have been inlined into toggleLike and toggleSave

    updateCommentInStore: (comment: Comment) => {
      console.log("Updating UI with comment:", comment);

      // Ensure the comment has an ID
      if (!comment.id) {
        comment.id = `temp-${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 9)}`;
        console.log("Generated temporary ID for comment:", comment.id);
      }

      // Check if this comment already exists in any of the memes
      // to prevent duplicate comments
      let isDuplicate = false;

      set((state) => {
        // Check if this comment already exists in the selected meme
        if (state.selectedMeme && state.selectedMeme.id === comment.memeId) {
          isDuplicate = (state.selectedMeme.comments || []).some(
            (existingComment) => existingComment.id === comment.id
          );

          if (isDuplicate) {
            console.log("Duplicate comment detected, skipping UI update");
            return; // Exit early if it's a duplicate
          }
        }

        const updateMemeInArray = (memes: Meme[]): Meme[] =>
          memes.map((meme: Meme) => {
            if (meme.id === comment.memeId) {
              // Check if this comment already exists in this meme
              const commentExists = (meme.comments || []).some(
                (existingComment) => existingComment.id === comment.id
              );

              if (commentExists) {
                return meme; // Don't add duplicate comment
              }

              // Create a new array with the comment added
              const updatedComments = [...(meme.comments || []), comment];

              // Sort comments by creation date (newest first)
              updatedComments.sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime()
              );

              return {
                ...meme,
                comments: updatedComments,
              };
            }
            return meme;
          });

        // Update all meme collections
        state.memes = updateMemeInArray(state.memes);
        state.memeList = updateMemeInArray(state.memeList);
        state.likedMemes = updateMemeInArray(state.likedMemes);
        state.savedMemes = updateMemeInArray(state.savedMemes);

        // Update the selected meme if it's the one being commented on
        if (
          state.selectedMeme &&
          state.selectedMeme.id === comment.memeId &&
          !isDuplicate
        ) {
          // Create a new array with the comment added
          const updatedComments = [
            ...(state.selectedMeme.comments || []),
            comment,
          ];

          // Sort comments by creation date (newest first)
          updatedComments.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );

          state.selectedMeme = {
            ...state.selectedMeme,
            comments: updatedComments,
          };
          console.log("Selected meme updated with new comment");
        }
      });

      // Return whether the comment was a duplicate
      return !isDuplicate;
    },

    // Force add a comment without duplicate checks
    forceAddComment: (comment: Comment) => {
      console.log("Force adding comment to UI:", comment);

      // Ensure the comment has an ID
      if (!comment.id) {
        comment.id = `temp-${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 9)}`;
        console.log("Generated temporary ID for forced comment:", comment.id);
      }

      set((state) => {
        // First, ensure we're working with a valid comment object
        if (!comment || !comment.memeId) {
          console.error("Invalid comment object:", comment);
          return;
        }

        // Log the current state for debugging
        console.log("Current state before update:", {
          selectedMemeId: state.selectedMeme?.id,
          commentMemeId: comment.memeId,
          selectedMemeComments: state.selectedMeme?.comments?.length || 0,
        });

        const updateMemeInArray = (memes: Meme[]): Meme[] =>
          memes.map((meme: Meme) => {
            if (meme.id === comment.memeId) {
              console.log(`Updating meme ${meme.id} with new comment`);

              // Check if this comment already exists in this meme
              const commentExists = (meme.comments || []).some(
                (existingComment) => existingComment.id === comment.id
              );

              if (commentExists) {
                console.log(
                  `Comment with ID ${comment.id} already exists in meme ${meme.id}, skipping`
                );
                return meme; // Don't add duplicate comment
              }

              // Create a new array with the comment added
              const updatedComments = [...(meme.comments || []), comment];

              // Sort comments by creation date (newest first)
              updatedComments.sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime()
              );

              console.log(
                `Meme ${meme.id} comments updated: ${updatedComments.length} comments`
              );

              return {
                ...meme,
                comments: updatedComments,
                commentCount: updatedComments.length, // Update comment count
              };
            }
            return meme;
          });

        // Update all meme collections
        state.memes = updateMemeInArray(state.memes);
        state.memeList = updateMemeInArray(state.memeList);
        state.likedMemes = updateMemeInArray(state.likedMemes);
        state.savedMemes = updateMemeInArray(state.savedMemes);

        // Update the selected meme if it's the one being commented on
        if (state.selectedMeme && state.selectedMeme.id === comment.memeId) {
          console.log("Updating selected meme with new comment");

          // Check if this comment already exists in the selected meme
          const commentExists = (state.selectedMeme.comments || []).some(
            (existingComment) => existingComment.id === comment.id
          );

          if (!commentExists) {
            // Create a new array with the comment added
            const updatedComments = [
              ...(state.selectedMeme.comments || []),
              comment,
            ];

            // Sort comments by creation date (newest first)
            updatedComments.sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            );

            // Create a completely new object to ensure React detects the change
            state.selectedMeme = {
              ...state.selectedMeme,
              comments: updatedComments,
              // commentCount: updatedComments.length, // Update comment count
            };

            console.log(
              "Selected meme updated with forced comment, new comment count:",
              updatedComments.length
            );
          } else {
            console.log(
              `Comment with ID ${comment.id} already exists in selected meme, skipping`
            );
          }
        } else {
          console.log(
            "Selected meme does not match comment meme ID or is null"
          );
          console.log("Selected meme ID:", state.selectedMeme?.id);
          console.log("Comment meme ID:", comment.memeId);
        }
      });
    },

    // User data management
    resetUserData: () => {
      set((state) => {
        state.memeList = [];
        state.likedMemes = [];
        state.savedMemes = [];
        state.userDataLoaded = false;

        // Clear localStorage cache for liked and saved memes
        localStorage.removeItem("likedMemes");
        localStorage.removeItem("savedMemes");
      });
    },
  }))
);

// Create a helper for selectors
export const useMemeContentStore = createSelectors<
  MemeContentState,
  MemeContentActions
>(useRawMemeContentStore);
