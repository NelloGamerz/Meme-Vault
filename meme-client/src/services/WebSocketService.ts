/**
 * WebSocketService.ts
 * 
 * A centralized service for managing WebSocket connections throughout the application.
 * This service handles connection establishment, reconnection, message handling, and cleanup.
 */

// Environment variables
const WS_URL = import.meta.env.VITE_WEBSOCKET_URL;

// Define message types for type safety
export type WebSocketMessageType = 
  | 'PING' 
  | 'PONG' 
  | 'FOLLOW' 
  | 'COMMENT' 
  | 'LIKE' 
  | 'SAVE' 
  | 'NOTIFICATION'
  | 'JOIN_POST'
  | 'LEAVE_POST';

// Base message interface
export interface WebSocketMessage {
  type: WebSocketMessageType;
  [key: string]: unknown;
}

// Type for message handlers
export type MessageHandler = (message: WebSocketMessage) => void;

// Connection state
type ConnectionState = 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'RECONNECTING';

class WebSocketService {
  // Singleton instance
  private static instance: WebSocketService;

  // WebSocket connection
  private client: WebSocket | null = null;
  private connectionState: ConnectionState = 'DISCONNECTED';
  private userId: string | null = null;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private error: string | null = null;
  
  // Message handling
  private messageHandlers: Record<WebSocketMessageType, Set<MessageHandler>> = {
    'PING': new Set(),
    'PONG': new Set(),
    'FOLLOW': new Set(),
    'COMMENT': new Set(),
    'LIKE': new Set(),
    'SAVE': new Set(),
    'NOTIFICATION': new Set(),
    'JOIN_POST': new Set(),
    'LEAVE_POST': new Set()
  };
  
  // Connection state change listeners
  private connectionStateListeners: Set<(state: ConnectionState) => void> = new Set();
  
  // Private constructor to enforce singleton pattern
  private constructor() {
    // Initialize event listeners for network and visibility changes
    this.setupEventListeners();
  }
  
  /**
   * Get the singleton instance of WebSocketService
   */
  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }
  
  /**
   * Set up event listeners for network and visibility changes
   */
  private setupEventListeners(): void {
    // Handle network status changes
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
    
    // Handle visibility changes
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }
  
  /**
   * Clean up event listeners
   */
  private cleanupEventListeners(): void {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }
  
  /**
   * Handle when the browser goes online
   */
  private handleOnline = (): void => {
    console.log('Network is online, checking WebSocket connection...');
    if (this.connectionState !== 'CONNECTED') {
      this.restoreConnection();
    }
  };
  
  /**
   * Handle when the browser goes offline
   */
  private handleOffline = (): void => {
    console.log('Network is offline, WebSocket connection may be disrupted');
    // We don't disconnect here, as the WebSocket will handle this automatically
  };
  
  /**
   * Handle visibility change events
   */
  private handleVisibilityChange = (): void => {
    if (document.visibilityState === 'visible') {
      console.log('Page became visible, checking WebSocket connection...');
      this.checkConnection();
    }
  };
  
  /**
   * Connect to the WebSocket server
   * @param userId The user ID to connect with
   */
  public connect(userId: string): void {
    // Store the userId for reconnection purposes
    this.userId = userId;
    
    // Clear any existing connection
    if (this.client) {
      this.disconnect();
    }
    
    // Clear any pending reconnect timers
    this.clearReconnect();
    
    try {
      console.log(`Connecting to WebSocket: ${WS_URL}?userId=${userId}`);
      this.updateConnectionState('CONNECTING');
      
      const socket = new WebSocket(`${WS_URL}?userId=${userId}`);
      
      socket.onopen = this.handleOpen;
      socket.onclose = this.handleClose;
      socket.onerror = this.handleError;
      socket.onmessage = this.handleMessage;
      
      this.client = socket;
    } catch (error) {
      console.error("Error creating WebSocket connection:", error);
      this.error = "Failed to establish WebSocket connection";
      this.updateConnectionState('DISCONNECTED');
      
      // Attempt to reconnect after error
      this.reconnect();
    }
  }
  
  /**
   * Handle WebSocket open event
   */
  private handleOpen = (): void => {
    console.log('WebSocket connection established');
    this.error = null;
    this.reconnectAttempts = 0;
    this.updateConnectionState('CONNECTED');
    
    // Start the connection monitoring
    this.startHeartbeat();
  };
  
  /**
   * Handle WebSocket close event
   */
  private handleClose = (event: CloseEvent): void => {
    console.log(`WebSocket connection closed with code: ${event.code}`);
    this.client = null;
    this.updateConnectionState('DISCONNECTED');
    
    // Handle different close codes
    if (event.code === 1000) {
      // Normal closure - no need to reconnect
      console.log("WebSocket closed normally");
    } else if (event.code === 1006) {
      // Abnormal closure - likely a network issue or server restart
      console.log("WebSocket closed abnormally (code 1006), attempting reconnect");
      // Use a shorter delay for abnormal closures
      setTimeout(() => this.reconnect(), 500);
    } else {
      // Other non-normal closures
      console.log(`WebSocket closed with code ${event.code}, attempting reconnect`);
      this.reconnect();
    }
  };
  
  /**
   * Handle WebSocket error event
   */
  private handleError = (event: Event): void => {
    console.error("WebSocket error:", event);
    this.error = "WebSocket connection error";
    
    // Don't immediately try to reconnect here, as the onclose handler will be called
    // after an error and will handle the reconnection
    console.log("WebSocket error occurred, waiting for close event to handle reconnection");
  };
  
  /**
   * Handle WebSocket message event
   */
  private handleMessage = (event: MessageEvent): void => {
    try {
      // Try to parse the message
      const data = JSON.parse(event.data) as WebSocketMessage;
      
      // Log all messages except ping/pong
      if (data.type !== 'PONG' && data.type !== 'PING') {
        console.log("WebSocket message received:", data);
      }
      
      // Get handlers for this message type
      const handlers = this.messageHandlers[data.type as WebSocketMessageType];
      
      // Call all registered handlers for this message type
      if (handlers && handlers.size > 0) {
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
  
  /**
   * Disconnect from the WebSocket server
   */
  public disconnect(): void {
    // Clear any reconnection attempts and heartbeat
    this.clearReconnect();
    this.stopHeartbeat();
    
    if (this.client) {
      try {
        this.client.close(1000, "User logged out");
      } catch (error) {
        console.error('Error closing WebSocket:', error);
      }
    }
    
    // Reset the state
    this.client = null;
    this.userId = null;
    this.reconnectAttempts = 0;
    this.updateConnectionState('DISCONNECTED');
  }
  
  /**
   * Attempt to reconnect to the WebSocket server
   */
  private reconnect(): void {
    // Clear any existing reconnect timer
    this.clearReconnect();
    
    // Update connection state
    this.updateConnectionState('RECONNECTING');
    
    // Use an exponential backoff strategy with a maximum delay
    const baseDelay = 1000; // 1 second base
    const maxDelay = 10000; // 10 seconds maximum
    const maxAttempts = 10; // Maximum number of attempts
    
    // Calculate delay with exponential backoff, but cap it
    const exponentialDelay = Math.min(
      baseDelay * Math.pow(1.5, Math.min(this.reconnectAttempts, 8)), // Exponential growth
      maxDelay // Cap at max delay
    );
    
    // If we've reached max attempts, use a longer, fixed interval
    const delay = this.reconnectAttempts >= maxAttempts ? maxDelay : exponentialDelay;
    
    console.log(`Scheduling reconnect attempt ${this.reconnectAttempts + 1} in ${delay}ms`);
    
    // Set a new reconnect timer
    this.reconnectTimer = setTimeout(() => {
      // Double-check we're still not connected before attempting
      if (this.connectionState !== 'CONNECTED') {
        // Check if we have a userId to connect with
        const currentUserId = this.userId || (() => {
          try {
            const user = JSON.parse(localStorage.getItem("user") || "{}");
            return user.userId;
          } catch (e) {
            console.error("Error parsing user from localStorage:", e);
            return null;
          }
        })();
        
        if (currentUserId) {
          console.log(`Attempting to reconnect (attempt ${this.reconnectAttempts + 1})`);
          this.reconnectAttempts++;
          this.connect(currentUserId);
        } else {
          console.log("Cannot reconnect: no user ID available");
        }
      } else {
        console.log("Connection already restored, skipping reconnect attempt");
      }
    }, delay);
  }
  
  /**
   * Clear any pending reconnect timers
   */
  private clearReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
  
  /**
   * Start the heartbeat timer to monitor connection status
   */
  private startHeartbeat(): void {
    // Clear any existing heartbeat
    this.stopHeartbeat();
    
    // Start a new heartbeat timer that only checks connection status
    this.heartbeatTimer = setInterval(() => {
      this.checkConnection();
    }, 60000); // Check every 60 seconds
  }
  
  /**
   * Stop the heartbeat timer
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
  
  /**
   * Check the current connection status
   */
  public checkConnection(): void {
    // Only check if we think we're connected but the WebSocket is actually closed or closing
    if (
      this.connectionState === 'CONNECTED' && 
      this.client && 
      (this.client.readyState === WebSocket.CLOSED || this.client.readyState === WebSocket.CLOSING)
    ) {
      console.warn('WebSocket connection is closed but state shows connected, reconnecting...');
      
      // Mark as disconnected and trigger reconnect
      this.client = null;
      this.updateConnectionState('DISCONNECTED');
      this.reconnect();
    }
  }
  
  /**
   * Restore the WebSocket connection
   */
  public restoreConnection(): void {
    // Check if we're already connected with a valid client
    if (
      this.connectionState === 'CONNECTED' && 
      this.client && 
      this.client.readyState === WebSocket.OPEN
    ) {
      console.log('WebSocket already connected and open, skipping restore');
      return;
    }
    
    // If we have a client but it's not in OPEN state, close it first
    if (this.client) {
      try {
        console.log(`Closing existing WebSocket in state ${this.client.readyState}`);
        this.client.close();
      } catch (error) {
        console.error('Error closing existing WebSocket:', error);
      }
      
      // Reset the client to null
      this.client = null;
      this.updateConnectionState('DISCONNECTED');
    }
    
    // Check if we have a stored userId
    if (this.userId) {
      console.log('Restoring connection with stored userId');
      this.connect(this.userId);
      return;
    }
    
    // Otherwise try to get the user from localStorage
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (user && user.userId) {
        console.log('Restoring connection with userId from localStorage');
        this.connect(user.userId);
      } else {
        console.log('No user found, cannot restore WebSocket connection');
      }
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
    }
  }
  
  /**
   * Send a message through the WebSocket connection
   * @param message The message to send
   * @returns True if the message was sent successfully, false otherwise
   */
  public sendMessage(message: WebSocketMessage): boolean {
    // If we're not connected, try to reconnect first
    if (this.connectionState !== 'CONNECTED' || !this.client) {
      console.log(`WebSocket not connected, attempting to reconnect before sending ${message.type} message`);
      this.restoreConnection();
      
      // Return false to indicate the message wasn't sent immediately
      return false;
    }
    
    // Check if the connection is open
    if (this.client.readyState === WebSocket.OPEN) {
      try {
        this.client.send(JSON.stringify(message));
        console.log(`${message.type} message sent via WebSocket:`, message);
        return true;
      } catch (error) {
        console.error(`Error sending ${message.type} message via WebSocket:`, error);
        
        // If sending fails, try to reconnect
        this.reconnect();
        return false;
      }
    }
    
    return false;
  }
  
  /**
   * Register a handler for a specific message type
   * @param type The message type to handle
   * @param handler The handler function
   * @returns A function to unregister the handler
   */
  public registerMessageHandler(type: WebSocketMessageType, handler: MessageHandler): () => void {
    // Add the handler to the set for this message type
    this.messageHandlers[type].add(handler);
    
    // Return an unsubscribe function
    return () => {
      this.messageHandlers[type].delete(handler);
    };
  }
  
  /**
   * Register a listener for connection state changes
   * @param listener The listener function
   * @returns A function to unregister the listener
   */
  public registerConnectionStateListener(listener: (state: ConnectionState) => void): () => void {
    this.connectionStateListeners.add(listener);
    
    // Immediately notify the listener of the current state
    listener(this.connectionState);
    
    // Return an unsubscribe function
    return () => {
      this.connectionStateListeners.delete(listener);
    };
  }
  
  /**
   * Update the connection state and notify listeners
   * @param state The new connection state
   */
  private updateConnectionState(state: ConnectionState): void {
    if (this.connectionState !== state) {
      this.connectionState = state;
      
      // Notify all listeners
      this.connectionStateListeners.forEach(listener => {
        try {
          listener(state);
        } catch (error) {
          console.error('Error in connection state listener:', error);
        }
      });
    }
  }
  
  /**
   * Get the current connection state
   * @returns The current connection state
   */
  public getConnectionState(): ConnectionState {
    return this.connectionState;
  }
  
  /**
   * Check if the WebSocket is currently connected
   * @returns True if connected, false otherwise
   */
  public isConnected(): boolean {
    return this.connectionState === 'CONNECTED';
  }
  
  /**
   * Get the WebSocket client instance
   * @returns The WebSocket client or null if not connected
   */
  public getClient(): WebSocket | null {
    return this.client;
  }
  
  /**
   * Send a follow/unfollow request
   * @param targetUserId The ID of the user to follow/unfollow
   * @param isFollowing Whether the user is currently being followed
   * @returns True if the message was sent successfully, false otherwise
   */
  public sendFollowRequest(targetUserId: string, isFollowing: boolean): boolean {
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
    
    return this.sendMessage(message);
  }
  
  /**
   * Send a request to join a post session
   * @param postId The ID of the post to join
   * @returns True if the message was sent successfully, false otherwise
   */
  public sendJoinPostRequest(postId: string): boolean {
    return this.sendMessage({
      type: 'JOIN_POST' as WebSocketMessageType,
      postId
    });
  }
  
  /**
   * Send a request to leave a post session
   * @param postId The ID of the post to leave
   * @returns True if the message was sent successfully, false otherwise
   */
  public sendLeavePostRequest(postId: string): boolean {
    return this.sendMessage({
      type: 'LEAVE_POST' as WebSocketMessageType,
      postId
    });
  }
}

// Export the singleton instance
export default WebSocketService.getInstance();