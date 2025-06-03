import { create } from "zustand";

const WS_URL = import.meta.env.VITE_WEBSOCKET_URL

// Define message types for type safety
export type WebSocketMessageType = 
  | 'PING' 
  | 'PONG' 
  | 'FOLLOW' 
  | 'COMMENT' 
  | 'LIKE' 
  | 'SAVE' 
  | 'NOTIFICATION';

// Base message interface
export interface WebSocketMessage {
  type: WebSocketMessageType;
  [key: string]: unknown;
}

// Type for message handlers
export type MessageHandler = (message: WebSocketMessage) => void;

interface WebSocketStore {
  // Connection state
  client: WebSocket | null;
  isConnected: boolean;
  error: string | null;
  reconnectAttempts: number;
  reconnectTimer: NodeJS.Timeout | null;
  heartbeatTimer: NodeJS.Timeout | null;
  userId: string | null;
  
  // Message handling
  messageHandlers: Record<WebSocketMessageType, MessageHandler[]>;
  registerMessageHandler: (type: WebSocketMessageType, handler: MessageHandler) => () => void;
  unregisterMessageHandler: (type: WebSocketMessageType, handler: MessageHandler) => void;
  
  // Connection management
  connect: (userId: string) => void;
  disconnect: () => void;
  restoreConnection: () => void;
  reconnect: () => void;
  clearReconnect: () => void;
  startHeartbeat: () => void;
  stopHeartbeat: () => void;
  checkConnection: () => void;
  
  // Message sending
  sendMessage: (message: WebSocketMessage) => boolean;
  sendFollowRequest: (targetUserId: string, isFollowing: boolean) => boolean;
  sendJoinPostRequest: (postId: string) => boolean;
  sendLeavePostRequest: (postId: string) => boolean;
}

export const useWebSocketStore = create<WebSocketStore>((set, get) => ({
  // Connection state
  client: null,
  isConnected: false,
  error: null,
  reconnectAttempts: 0,
  reconnectTimer: null,
  heartbeatTimer: null,
  userId: null,
  
  // Initialize empty message handlers for each message type
  messageHandlers: {
    'PING': [],
    'PONG': [],
    'FOLLOW': [],
    'COMMENT': [],
    'LIKE': [],
    'SAVE': [],
    'NOTIFICATION': []
  },
  
  // Register a handler for a specific message type
  registerMessageHandler: (type: WebSocketMessageType, handler: MessageHandler) => {
    const handlers = [...get().messageHandlers[type], handler];
    set(state => ({
      messageHandlers: {
        ...state.messageHandlers,
        [type]: handlers
      }
    }));
    
    // Return an unsubscribe function
    return () => get().unregisterMessageHandler(type, handler);
  },
  
  // Unregister a handler for a specific message type
  unregisterMessageHandler: (type: WebSocketMessageType, handler: MessageHandler) => {
    const handlers = get().messageHandlers[type].filter(h => h !== handler);
    set(state => ({
      messageHandlers: {
        ...state.messageHandlers,
        [type]: handlers
      }
    }));
  },

  connect: (userId: string) => {
    // Store the userId for reconnection purposes
    set({ userId });
    
    // Clear any existing connection
    if (get().client) {
      get().disconnect();
    }
    
    // Clear any pending reconnect timers
    get().clearReconnect();

    try {
      console.log(`Connecting to WebSocket: ${WS_URL}?userId=${userId}`);
      const socket = new WebSocket(`${WS_URL}?userId=${userId}`);

      socket.onopen = () => {
        console.log('WebSocket connection established');
        set({ 
          isConnected: true, 
          error: null,
          reconnectAttempts: 0 // Reset reconnect attempts on successful connection
        });
        
        // Start the connection monitoring (without sending pings)
        get().startHeartbeat();
      };

      socket.onclose = (event) => {
        console.log(`WebSocket connection closed with code: ${event.code}`);
        set({ isConnected: false, client: null });

        // Handle different close codes
        if (event.code === 1000) {
          // Normal closure - no need to reconnect
          console.log("WebSocket closed normally");
        } else if (event.code === 1006) {
          // Abnormal closure - likely a network issue or server restart
          console.log("WebSocket closed abnormally (code 1006), attempting reconnect");
          // Use a shorter delay for abnormal closures
          setTimeout(() => get().reconnect(), 500);
        } else {
          // Other non-normal closures
          console.log(`WebSocket closed with code ${event.code}, attempting reconnect`);
          get().reconnect();
        }
      };

      socket.onerror = (error) => {
        console.error("WebSocket error:", error);
        set({ error: "WebSocket connection error" });
        
        // Don't immediately try to reconnect here, as the onclose handler will be called
        // after an error and will handle the reconnection
        console.log("WebSocket error occurred, waiting for close event to handle reconnection");
      };

      socket.onmessage = (event) => {
        try {
          // Try to parse the message
          const data = JSON.parse(event.data) as WebSocketMessage;
          
          // Log all messages except ping/pong
          if (data.type !== 'PONG' && data.type !== 'PING') {
            console.log("WebSocket message received:", data);
          }
          
          // Get handlers for this message type
          const handlers = get().messageHandlers[data.type as WebSocketMessageType] || [];
          
          // Call all registered handlers for this message type
          if (handlers.length > 0) {
            handlers.forEach(handler => {
              try {
                handler(data);
              } catch (handlerError) {
                console.error(`Error in message handler for type ${data.type}:`, handlerError);
              }
            });
          } else if (data.type !== 'PONG' && data.type !== 'PING') {
            console.log(`No handlers registered for message type: ${data.type}`);
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      set({ client: socket });
    } catch (error) {
      console.error("Error creating WebSocket connection:", error);
      set({ 
        error: "Failed to establish WebSocket connection",
        client: null,
        isConnected: false
      });
      
      // Attempt to reconnect after error
      get().reconnect();
    }
  },
  
  reconnect: () => {
    const { reconnectAttempts, reconnectTimer } = get();
    
    // Clear any existing reconnect timer
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
    }
    
    // Use an exponential backoff strategy with a maximum delay
    const baseDelay = 1000; // 1 second base
    const maxDelay = 10000; // 10 seconds maximum
    const maxAttempts = 10; // Maximum number of attempts
    
    // Calculate delay with exponential backoff, but cap it
    const exponentialDelay = Math.min(
      baseDelay * Math.pow(1.5, Math.min(reconnectAttempts, 8)), // Exponential growth
      maxDelay // Cap at max delay
    );
    
    // If we've reached max attempts, use a longer, fixed interval
    const delay = reconnectAttempts >= maxAttempts ? maxDelay : exponentialDelay;
    
    console.log(`Scheduling reconnect attempt ${reconnectAttempts + 1} in ${delay}ms`);
    
    // Set a new reconnect timer
    const timer = setTimeout(() => {
      // Double-check we're still not connected before attempting
      if (!get().isConnected) {
        // Check if we have a userId to connect with
        const currentUserId = get().userId || (() => {
          try {
            const user = JSON.parse(localStorage.getItem("user") || "{}");
            return user.userId;
          } catch (e) {
            console.error("Error parsing user from localStorage:", e);
            return null;
          }
        })();
        
        if (currentUserId) {
          console.log(`Attempting to reconnect (attempt ${reconnectAttempts + 1})`);
          set({ reconnectAttempts: reconnectAttempts + 1 });
          get().connect(currentUserId);
        } else {
          console.log("Cannot reconnect: no user ID available");
        }
      } else {
        console.log("Connection already restored, skipping reconnect attempt");
      }
    }, delay);
    
    set({ reconnectTimer: timer });
  },
  
  clearReconnect: () => {
    const { reconnectTimer } = get();
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      set({ reconnectTimer: null });
    }
  },

  restoreConnection: () => {
    // Check if we're already connected with a valid client
    const { client, isConnected } = get();
    if (isConnected && client && client.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected and open, skipping restore');
      return;
    }
    
    // If we have a client but it's not in OPEN state, close it first
    if (client) {
      try {
        console.log(`Closing existing WebSocket in state ${client.readyState}`);
        client.close();
      } catch (error) {
        console.error('Error closing existing WebSocket:', error);
      }
      
      // Reset the client to null to ensure we create a new one
      set({ client: null, isConnected: false });
    }
    
    // Check if we have a stored userId
    const storedUserId = get().userId;
    if (storedUserId) {
      console.log('Restoring connection with stored userId');
      get().connect(storedUserId);
      return;
    }
    
    // Otherwise try to get the user from localStorage
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (user && user.userId) {
        console.log('Restoring connection with userId from localStorage');
        // Store the userId for future reconnections
        set({ userId: user.userId });
        get().connect(user.userId);
      } else {
        console.log('No user found, cannot restore WebSocket connection');
      }
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
    }
  },

  disconnect: () => {
    // Clear any reconnection attempts and heartbeat
    get().clearReconnect();
    get().stopHeartbeat();
    
    const { client } = get();
    if (client) {
      try {
        client.close(1000, "User logged out");
      } catch (error) {
        console.error('Error closing WebSocket:', error);
      }
    }
    
    // Reset the store state
    set({ 
      client: null, 
      isConnected: false,
      reconnectAttempts: 0,
      userId: null
    });
  },
  
  startHeartbeat: () => {
    // Clear any existing heartbeat
    get().stopHeartbeat();
    
    // Start a new heartbeat timer that only checks connection status
    // without sending pings to the server
    const timer = setInterval(() => {
      // Only check the connection status
      get().checkConnection();
    }, 60000); // Check every 60 seconds
    
    set({ heartbeatTimer: timer });
  },
  
  stopHeartbeat: () => {
    const { heartbeatTimer } = get();
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      set({ heartbeatTimer: null });
    }
  },
  
  checkConnection: () => {
    const { isConnected, client } = get();
    
    // Only check if we think we're connected but the WebSocket is actually closed or closing
    if (isConnected && client && (
        client.readyState === WebSocket.CLOSED || 
        client.readyState === WebSocket.CLOSING
    )) {
      console.warn('WebSocket connection is closed but state shows connected, reconnecting...');
      
      // Mark as disconnected and trigger reconnect
      set({ isConnected: false, client: null });
      get().reconnect();
    }
  },
  
  // Generic method to send any WebSocket message
  sendMessage: (message: WebSocketMessage) => {
    const { client, isConnected } = get();
    
    // If we're not connected, try to reconnect first
    if (!isConnected || !client) {
      console.log(`WebSocket not connected, attempting to reconnect before sending ${message.type} message`);
      get().restoreConnection();
      
      // Return false to indicate the message wasn't sent immediately
      return false;
    }
    
    // Check if the connection is open
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(JSON.stringify(message));
        console.log(`${message.type} message sent via WebSocket:`, message);
        return true;
      } catch (error) {
        console.error(`Error sending ${message.type} message via WebSocket:`, error);
        
        // If sending fails, try to reconnect
        get().reconnect();
        return false;
      }
    }
    
    return false;
  },
  
  // Send a follow/unfollow request
  sendFollowRequest: (targetUserId: string, isFollowing: boolean) => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    
    // Check if we have a valid user
    if (!user.userId) {
      console.error('Cannot send follow request: no user ID available');
      return false;
    }
    
    const message = {
      type: 'FOLLOW' as WebSocketMessageType,
      followerId: user.userId,
      followerUsername: user.username,
      followingUserId: targetUserId,
      isFollowing: !isFollowing, // Toggle the current state
      profilePictureUrl: user.profilePicture || ''
    };
    
    return get().sendMessage(message);
  },
  
  // Send a request to join a post session
  sendJoinPostRequest: (postId: string) => {
    return get().sendMessage({
      type: 'JOIN_POST' as WebSocketMessageType,
      postId
    });
  },
  
  // Send a request to leave a post session
  sendLeavePostRequest: (postId: string) => {
    return get().sendMessage({
      type: 'LEAVE_POST' as WebSocketMessageType,
      postId
    });
  },
}));
