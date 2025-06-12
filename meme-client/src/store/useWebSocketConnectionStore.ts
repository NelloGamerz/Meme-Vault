import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { createSelectors } from "./createSelectors";
import { useWebSocketStore } from "../hooks/useWebSockets";
import { useMemeContentStore } from "./useMemeContentStore";
import { useNotificationStore } from "./useNotificationStore";
// import { useMemeStore } from "./useMemeStore";
// import type { WebSocketMessageType } from "../services/WebSocketService";
import type { Comment, Meme } from "../types/mems";
import type { MemeContentStore } from "./useMemeContentStore";
import type { NotificationStore } from "./useNotificationStore";

// Define the store interface
interface WebSocketConnectionState {
  isConnected: boolean;
  wsUnsubscribe: (() => void) | null;
}

interface WebSocketConnectionActions {
  connectWebSocket: () => void;
  disconnectWebSocket: () => void;
  setupMessageHandlers: () => void;
}

type WebSocketConnectionStore = WebSocketConnectionState & WebSocketConnectionActions;

// Track the current meme being viewed
let lastJoinedPostId: string | null = null;

// Create the store with immer middleware for more efficient updates
const useRawWebSocketConnectionStore = create<WebSocketConnectionStore>()(
  immer((set, get) => ({
    // Initial state
    isConnected: false,
    wsUnsubscribe: null,

    // Connect to WebSocket
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
            get().setupMessageHandlers();
            
            // If we were previously viewing a meme, rejoin that session
            if (lastJoinedPostId) {
              const memeStore = useMemeContentStore.getState() as MemeContentStore;
              memeStore.joinPostSession(lastJoinedPostId);
            }
            
            set((state) => {
              state.isConnected = true;
            });
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
        get().setupMessageHandlers();
        
        // If we were previously viewing a meme, rejoin that session
        if (lastJoinedPostId) {
          const memeStore = useMemeContentStore.getState() as MemeContentStore;
          memeStore.joinPostSession(lastJoinedPostId);
        }
        
        set((state) => {
          state.isConnected = true;
        });
      }
    },

    // Disconnect from WebSocket
    disconnectWebSocket: () => {
      // Get the current state
      const { wsUnsubscribe } = get();
      
      // Leave any active meme session
      if (lastJoinedPostId) {
        // Use the centralized WebSocketStore to send the leave message
        useWebSocketStore.getState().sendLeavePostRequest(lastJoinedPostId);
      }
      
      // Unsubscribe from WebSocketStore updates
      if (wsUnsubscribe) {
        wsUnsubscribe();
      }
      
      // Reset WebSocket-related state
      set((state) => {
        state.wsUnsubscribe = null;
        state.isConnected = false;
      });
      
      // Reset the current meme ID
      lastJoinedPostId = null;
    },

    // Set up message handlers
    setupMessageHandlers: () => {
      // Clean up any existing message handler subscriptions
      const { wsUnsubscribe } = get();
      if (wsUnsubscribe) {
        wsUnsubscribe();
      }
      
      // Set up a subscription to the WebSocketStore to handle connection changes
      const connectionUnsubscribe = useWebSocketStore.subscribe((wsState) => {
        // If we reconnected and were viewing a meme, rejoin that session
        if (wsState.isConnected && lastJoinedPostId) {
          const memeStore = useMemeContentStore.getState() as MemeContentStore;
          memeStore.joinPostSession(lastJoinedPostId);
        }
        
        // Update our connection state to match WebSocketStore's connection state
        set((state) => {
          state.isConnected = wsState.isConnected;
        });
      });
      
      // Register handlers for each message type we're interested in
      const commentHandler = useWebSocketStore.getState().registerMessageHandler('COMMENT', (data) => {
        if (data.memeId) {
          console.log('WebSocket COMMENT message received:', data);
          
          // Ensure we have a valid ID for the comment
          const commentId = data.id || `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
          
          const newComment: Comment = {
            id: commentId.toString(),
            memeId: data.memeId as string,
            userId: data.userId as string,
            text: data.text as string,
            username: data.username as string,
            createdAt: data.createdAt as string,
            profilePictureUrl: data.profilePictureUrl as string,
          };
          
          console.log('Processed comment for UI update:', newComment);
          
          // Update both stores to ensure UI is updated regardless of which one is being used
          
          // 1. Update the MemeContentStore
          const memeContentStore = useMemeContentStore.getState() as MemeContentStore;
          
          // 2. Update the MemeStore (used by MemeDetailPage)
          // const memeStore = useMemeStore.getState();
          
          // Force update the UI with the new comment in both stores immediately
          console.log('Applying comment update to UI immediately');
          
          try {
            // Update MemeContentStore
            if (memeContentStore.forceAddComment) {
              memeContentStore.forceAddComment(newComment);
            } else {
              memeContentStore.updateCommentInStore(newComment);
            }
            
            // Update MemeStore
            // if (memeStore && typeof memeStore.updateCommentInStore === 'function') {
            //   memeStore.updateCommentInStore(newComment);
            // }
            
            // Show a toast notification for new comments (except our own)
            const user = JSON.parse(localStorage.getItem("user") || "{}");
            if (user.userId !== data.userId) {
              // Import toast dynamically to avoid circular dependencies
              import('react-hot-toast').then(toast => {
                toast.default.success(`${data.username} commented: ${data.text}`);
              });
            }
            
            console.log('Comment updates applied to both stores');
          } catch (error) {
            console.error('Error updating comment in stores:', error);
          }
        }
      });
      
      const likeHandler = useWebSocketStore.getState().registerMessageHandler('LIKE', (data) => {
        if (data.memeId) {
          // Get the current user from localStorage
          const user = JSON.parse(localStorage.getItem("user") || "{}");
          const isCurrentUserAction = data.userId === user.userId;
          
          // Update the meme stats in the MemeContentStore
          const memeStore = useMemeContentStore.getState() as MemeContentStore;
          
          // Update the like count
          memeStore.updateMemeStats(data.memeId as string, {
            likes: Number(data.likeCount)
          });
          
          // If this is the current user's action, we need to update the liked status
          // based on the action received from the server
          if (isCurrentUserAction && data.action !== undefined) {
            // Get the current state of the meme
            const memeState = memeStore;
            const isCurrentlyLiked = memeState.likedMemes.some((m: Meme) => m.id === data.memeId);
            
            // If the action is LIKE, the meme should be liked
            // If the action is UNLIKE, the meme should be unliked
            const shouldBeLiked = data.action === 'LIKE';
            
            // If the current state doesn't match what it should be, toggle it
            if (isCurrentlyLiked !== shouldBeLiked) {
              console.log(`Correcting like state for meme ${data.memeId}: ${isCurrentlyLiked} -> ${shouldBeLiked}`);
              memeStore.toggleLike(data.memeId as string, user.username);
            }
          }
        }
      });
      
      const saveHandler = useWebSocketStore.getState().registerMessageHandler('SAVE', (data) => {
        if (data.memeId) {
          // Get the current user from localStorage
          const user = JSON.parse(localStorage.getItem("user") || "{}");
          const isCurrentUserAction = data.userId === user.userId;
          
          // Update the meme stats in the MemeContentStore
          const memeStore = useMemeContentStore.getState() as MemeContentStore;
          
          // Update the save count
          memeStore.updateMemeStats(data.memeId as string, {
            saves: Number(data.saveCount)
          });
          
          // If this is the current user's action, we need to update the saved status
          // based on the action received from the server
          if (isCurrentUserAction && data.action !== undefined) {
            // Get the current state of the meme
            const memeState = memeStore;
            const isCurrentlySaved = memeState.savedMemes.some((m: Meme) => m.id === data.memeId);
            
            // If the action is SAVE, the meme should be saved
            // If the action is UNSAVE, the meme should be unsaved
            const shouldBeSaved = data.action === 'SAVE';
            
            // If the current state doesn't match what it should be, toggle it
            if (isCurrentlySaved !== shouldBeSaved) {
              console.log(`Correcting save state for meme ${data.memeId}: ${isCurrentlySaved} -> ${shouldBeSaved}`);
              memeStore.toggleSave(data.memeId as string, user.username);
            }
          }
        }
      });
      
      const notificationHandler = useWebSocketStore.getState().registerMessageHandler('NOTIFICATION', (data) => {
        // Add the notification to the NotificationStore
        const notificationStore = useNotificationStore.getState() as NotificationStore;
        notificationStore.addNotification({
          id: data.id as string,
          type: data.type as string,
          message: data.message as string,
          createdAt: new Date(data.createdAt as string), // Convert string to Date object
          isRead: false,
          userId: data.userId as string,
          targetId: data.targetId as string,
          sourceUserId: data.sourceUserId as string,
          sourceUsername: data.sourceUsername as string,
          sourceProfilePictureUrl: data.sourceProfilePictureUrl as string,
        });
      });
      
      // Add handler for FOLLOW messages
      const followHandler = useWebSocketStore.getState().registerMessageHandler('FOLLOW', (data) => {
        console.log('WebSocket FOLLOW message received:', data);
        
        // Import the UserStore dynamically to avoid circular dependencies
        import('../store/useUserStore').then(({ useUserStore }) => {
          const userStore = useUserStore.getState();
          
          // Get the current user from localStorage
          const user = JSON.parse(localStorage.getItem("user") || "{}");
          
          // Check if this is a follow/unfollow action for the current user's profile
          // or if the current user is following/unfollowing someone else
          const isCurrentUserProfile = data.followingUserId === user.userId;
          const isCurrentUserAction = data.followerId === user.userId;
          
          if (isCurrentUserProfile) {
            // Someone followed/unfollowed the current user
            console.log('Someone followed/unfollowed the current user');
            
            // Update the followers count and list in the user store
            // Check the isFollowing flag to determine the action
            if (data.isFollowing) {
              // Someone followed the current user
              userStore.addFollower({
                userId: data.followerId as string,
                username: data.followerUsername as string,
                profilePictureUrl: data.profilePictureUrl as string,
                isFollow: true
              });
            } else {
              // Someone unfollowed the current user
              userStore.removeFollower(data.followerId as string);
            }
          } else if (isCurrentUserAction) {
            // The current user followed/unfollowed someone else
            console.log('Current user followed/unfollowed someone else');
            
            // The UI is already updated optimistically in handleFollowToggle
            // This is just a confirmation from the server
          }
        }).catch(error => {
          console.error('Error importing useUserStore in FOLLOW handler:', error);
        });
      });
      
      // Create an unsubscribe function that calls all the individual unsubscribe functions
      const unsubscribeFunctions = () => {
        connectionUnsubscribe();
        commentHandler();
        likeHandler();
        saveHandler();
        notificationHandler();
        followHandler();
      };
      
      // Store the unsubscribe function for cleanup
      set((state) => {
        state.wsUnsubscribe = unsubscribeFunctions;
      });
    },
  }))
);

// Create a helper for selectors
export const useWebSocketConnectionStore = createSelectors(useRawWebSocketConnectionStore);