/**
 * useWebSockets.ts
 * 
 * A hook that provides access to the WebSocketService throughout the application.
 * This is a thin wrapper around the WebSocketService singleton that provides
 * React-friendly access to WebSocket functionality.
 */

import { create } from "zustand";
import WebSocketService, { 
  WebSocketMessageType, 
  WebSocketMessage, 
  MessageHandler 
} from "../services/WebSocketService";

// Define the store interface
interface WebSocketStore {
  // Connection state
  isConnected: boolean;
  userId: string | null;
  client: WebSocket | null; // Add client property to expose the WebSocket instance
  
  // Methods
  connect: (userId: string) => void;
  disconnect: () => void;
  restoreConnection: () => void;
  sendMessage: (message: WebSocketMessage) => boolean;
  registerMessageHandler: (type: WebSocketMessageType, handler: MessageHandler) => () => void;
  registerApplicationActive: () => () => void; // Add method to register app as active
  sendFollowRequest: (targetUserId: string, targetUsername: string, isFollowing: boolean) => boolean;
  sendJoinPostRequest: (postId: string) => boolean;
  sendLeavePostRequest: (postId: string) => boolean;
  sendLikeRequest: (memeId: string) => Promise<boolean>;
  sendSaveRequest: (memeId: string) => Promise<boolean>;
  sendCommentRequest: (memeId: string, text: string, profilePictureUrl: string) => boolean;
}

// Create the store
export const useWebSocketStore = create<WebSocketStore>((set) => ({
  // Connection state
  isConnected: WebSocketService.isConnected(),
  userId: null,
  client: WebSocketService.getClient(), // Expose the WebSocket client
  
  // Methods - these are thin wrappers around the WebSocketService methods
  connect: (userId: string) => {
    set({ userId });
    WebSocketService.connect(userId);
  },
  
  disconnect: () => {
    WebSocketService.disconnect();
    set({ userId: null });
  },
  
  restoreConnection: () => {
    WebSocketService.restoreConnection();
  },
  
  sendMessage: (message: WebSocketMessage) => {
    return WebSocketService.sendMessage(message);
  },
  
  registerMessageHandler: (type: WebSocketMessageType, handler: MessageHandler) => {
    return WebSocketService.registerMessageHandler(type, handler);
  },
  
  registerApplicationActive: () => {
    return WebSocketService.registerApplicationActive();
  },
  
  sendFollowRequest: (targetUserId: string, targetUsername: string, isFollowing: boolean) => {
    return WebSocketService.sendFollowRequest(targetUserId, targetUsername, isFollowing);
  },
  
  sendJoinPostRequest: (postId: string) => {
    return WebSocketService.sendJoinPostRequest(postId);
  },
  
  sendLeavePostRequest: (postId: string) => {
    return WebSocketService.sendLeavePostRequest(postId);
  },
  
  sendLikeRequest: (memeId: string) => {
    return WebSocketService.sendLikeRequest(memeId);
  },
  
  sendSaveRequest: (memeId: string) => {
    return WebSocketService.sendSaveRequest(memeId);
  },
  
  sendCommentRequest: (memeId: string, text: string, profilePictureUrl: string) => {
    return WebSocketService.sendCommentRequest(memeId, text, profilePictureUrl);
  }
}));

// Set up a subscription to the WebSocketService connection state
WebSocketService.registerConnectionStateListener((state) => {
  useWebSocketStore.setState({ 
    isConnected: state === 'CONNECTED',
    client: WebSocketService.getClient() // Update the client reference when connection state changes
  });
});

// Export the hook
export default useWebSocketStore;
