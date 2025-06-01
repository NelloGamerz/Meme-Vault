import { create } from "zustand";

const WS_URL = import.meta.env.VITE_WEBSOCKET_URL

interface WebSocketStore {
  client: WebSocket | null;
  isConnected: boolean;
  error: string | null;
  reconnectAttempts: number;
  reconnectTimer: NodeJS.Timeout | null;
  heartbeatTimer: NodeJS.Timeout | null;
  userId: string | null;
  connect: (userId: string) => void;
  disconnect: () => void;
  restoreConnection: () => void;
  reconnect: () => void;
  clearReconnect: () => void;
  startHeartbeat: () => void;
  stopHeartbeat: () => void;
  checkConnection: () => void;
  sendFollowRequest: (targetUserId: string, isFollowing: boolean) => void;
}

export const useWebSocketStore = create<WebSocketStore>((set, get) => ({
  client: null,
  isConnected: false,
  error: null,
  reconnectAttempts: 0,
  reconnectTimer: null,
  heartbeatTimer: null,
  userId: null,

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

        // Only attempt to reconnect if this wasn't a normal closure
        if (event.code !== 1000) {
          get().reconnect();
        }
      };

      socket.onerror = (error) => {
        console.error("WebSocket error:", error);
        set({ error: "WebSocket connection error" });
      };

      socket.onmessage = (event) => {
        try {
          // Try to parse the message
          const data = JSON.parse(event.data);
          
          // Skip processing ping/pong messages
          if (data.type === 'PONG' || data.type === 'PING') {
            return;
          }
          
          console.log("WebSocket message received:", data);
          // Global message handling is done in the NotificationPanel component
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
    const { reconnectAttempts, userId, reconnectTimer } = get();
    
    // Clear any existing reconnect timer
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
    }
    
    // Use a fixed delay for reconnection to ensure it happens quickly
    const delay = 2000; // 2 seconds
    
    console.log(`Scheduling reconnect attempt in ${delay}ms`);
    
    // Set a new reconnect timer
    const timer = setTimeout(() => {
      if (!get().isConnected && userId) {
        console.log(`Attempting to reconnect (attempt ${reconnectAttempts + 1})`);
        set({ reconnectAttempts: reconnectAttempts + 1 });
        get().connect(userId);
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
  
  sendFollowRequest: (targetUserId: string, isFollowing: boolean) => {
    const { client, isConnected } = get();
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    
    // If we're not connected, try to reconnect first
    if (!isConnected || !client) {
      console.log('WebSocket not connected, attempting to reconnect before sending follow request');
      get().restoreConnection();
      
      // Return false to indicate the message wasn't sent immediately
      return false;
    }
    
    // Check if the connection is open and we have a valid user
    if (client.readyState === WebSocket.OPEN && user.userId) {
      const message = {
        type: 'FOLLOW',
        followerId: user.userId,
        followerUsername: user.username,
        followingUserId: targetUserId,
        isFollowing: !isFollowing, // Toggle the current state
        profilePictureUrl: user.profilePicture || ''
      };
      
      try {
        client.send(JSON.stringify(message));
        console.log('Follow request sent via WebSocket:', message);
        return true;
      } catch (error) {
        console.error('Error sending follow request via WebSocket:', error);
        
        // If sending fails, try to reconnect
        get().reconnect();
        return false;
      }
    }
    
    return false;
  },
}));
