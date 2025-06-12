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
  private connectionMonitorTimer: NodeJS.Timeout | null = null;
  private error: string | null = null;
  private isApplicationActive = false;
  
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
    
    // Start the connection monitor
    this.startConnectionMonitor();
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
   * Start the connection monitor to periodically check and maintain the WebSocket connection
   * This is the main timer that handles both connection monitoring and heartbeat
   */
  private startConnectionMonitor(): void {
    // Clear any existing monitor
    this.stopConnectionMonitor();
    
    // Start a new monitor that checks the connection status periodically
    this.connectionMonitorTimer = setInterval(() => {
      // Only attempt to reconnect if the application is active
      if (this.isApplicationActive) {
        try {
          // Get the current user from localStorage if we don't have a userId
          if (!this.userId) {
            const user = JSON.parse(localStorage.getItem("user") || "{}");
            if (user && user.userId) {
              this.userId = user.userId;
            }
          }
          
          // Check if we need to restore the connection
          if (this.userId && 
              (this.connectionState !== 'CONNECTED' || 
               !this.client || 
               (this.client && this.client.readyState !== WebSocket.OPEN))) {
            
            console.log("WebSocketService: Connection monitor detected disconnection, restoring...");
            this.restoreConnection();
          } else if (this.connectionState === 'CONNECTED' && this.client) {
            // If connected, perform a lightweight check (replaces separate heartbeat)
            this.checkConnection();
          }
        } catch (error) {
          console.error("Error in WebSocketService connection monitor:", error);
        }
      }
    }, 30000); // Check every 30 seconds (compromise between 10s and 60s)
  }
  
  /**
   * Stop the connection monitor
   */
  private stopConnectionMonitor(): void {
    if (this.connectionMonitorTimer) {
      clearInterval(this.connectionMonitorTimer);
      this.connectionMonitorTimer = null;
    }
  }
  
  /**
   * Register the application as active, which enables automatic reconnection
   * @returns A function to unregister the application as active
   */
  public registerApplicationActive(): () => void {
    this.isApplicationActive = true;
    
    // Start the connection monitor if it's not already running
    if (!this.connectionMonitorTimer) {
      this.startConnectionMonitor();
    }
    
    // Return a function to unregister
    return () => {
      this.isApplicationActive = false;
    };
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
    
    // We no longer need to start a separate heartbeat
    // The connection monitor now handles both connection monitoring and heartbeat
  };
  
  // Track the last reconnection to prevent duplicates
  private lastReconnection: { timestamp: number; code: number } | null = null;
  
  // Track recent messages to prevent duplicates
  private recentMessages: Map<string, number> = new Map();
  
  /**
   * Handle WebSocket close event
   */
  private handleClose = (event: CloseEvent): void => {
    console.log(`WebSocket connection closed with code: ${event.code}`);
    
    // Store the client reference before nullifying it
    // const oldClient = this.client;
    
    // Update state
    this.client = null;
    this.updateConnectionState('DISCONNECTED');
    
    // Prevent duplicate reconnections for the same close code within a short time window
    const now = Date.now();
    if (this.lastReconnection && 
        this.lastReconnection.code === event.code && 
        now - this.lastReconnection.timestamp < 1000) {
      console.log(`Ignoring duplicate reconnection for code ${event.code} within 1 second`);
      return;
    }
    
    // Record this reconnection attempt
    this.lastReconnection = { 
      timestamp: now,
      code: event.code
    };
    
    // Handle different close codes
    if (event.code === 1000) {
      // Normal closure - no need to reconnect
      console.log("WebSocket closed normally");
    } else if (event.code === 1006) {
      // Abnormal closure - likely a network issue or server restart
      console.log("WebSocket closed abnormally (code 1006), attempting reconnect");
      // Use a shorter delay for abnormal closures
      setTimeout(() => this.reconnect(), 500);
    } else if (event.code === 1011) {
      // Server error (1011) - often happens after like/save operations
      console.log("WebSocket closed due to server error (code 1011), attempting reconnect with delay");
      
      // For code 1011, we need to:
      // 1. Reconnect quickly to maintain app functionality
      // 2. Notify components to re-register their listeners
      
      // Use a short delay for server errors to recover quickly
      setTimeout(() => {
        // Reconnect with the same userId
        if (this.userId) {
          console.log("Reconnecting with same userId after code 1011 error");
          this.connect(this.userId);
          
          // After a short delay, dispatch a custom event to notify components to re-register listeners
          setTimeout(() => {
            if (this.client && this.client.readyState === WebSocket.OPEN) {
              console.log("Dispatching websocket-reconnected event after code 1011 error");
              
              // Dispatch a custom event that components can listen for
              const event = new CustomEvent('websocket-reconnected', { 
                detail: { client: this.client } 
              });
              window.dispatchEvent(event);
            }
          }, 500);
        } else {
          // If we don't have a userId, use the standard reconnect method
          this.reconnect();
        }
      }, 500); // Use a shorter delay to recover faster
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
      
      // First, publish to the centralized event bus
      // Import dynamically to avoid circular dependencies
      import('./WebSocketEventBus').then(({ webSocketEventBus }) => {
        webSocketEventBus.publish(data);
      }).catch(error => {
        console.error("Error importing WebSocketEventBus:", error);
      });
      
      // Then, call the direct handlers (legacy approach)
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
    // Clear any reconnection attempts and connection monitor
    this.clearReconnect();
    this.stopConnectionMonitor(); // This now handles both connection monitoring and heartbeat
    
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
    this.isApplicationActive = false;
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
   * Note: This no longer creates its own timer, as the connection monitor handles this
   */
  private startHeartbeat(): void {
    // We no longer need a separate heartbeat timer
    // The connection monitor now handles both connection monitoring and heartbeat
    // This is just a placeholder to maintain API compatibility
    console.log('WebSocket heartbeat functionality now handled by connection monitor');
  }
  
  /**
   * Stop the heartbeat timer
   */
  private stopHeartbeat(): void {
    // No-op as we no longer have a separate heartbeat timer
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
      (this.connectionState === 'CONNECTED' && 
       this.client && 
       this.client.readyState === WebSocket.OPEN) ||
      this.connectionState === 'CONNECTING'
    ) {
      console.log(`WebSocket already ${this.connectionState === 'CONNECTING' ? 'connecting' : 'connected and open'}, skipping restore`);
      return;
    }
    
    // If we have a client but it's not in OPEN state, close it first
    if (this.client && this.client.readyState !== WebSocket.OPEN) {
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
        
        // Store the userId for future reconnections
        this.userId = user.userId;
      } else {
        console.log('No user found, cannot restore WebSocket connection');
      }
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
    }
  }
  
  /**
   * Generate a unique message ID to track duplicates
   * @param message The message to generate an ID for
   * @returns A string ID that uniquely identifies this message
   */
  private generateMessageId(message: WebSocketMessage): string {
    // For LIKE messages, use only type and memeId (ignore action/isLiked)
    // This ensures we treat all like operations on the same meme as duplicates
    // regardless of whether they're like or unlike
    if (message.type === 'LIKE') {
      return `${message.type}-${message.memeId}`;
    }
    
    // For SAVE messages, use only type and memeId (ignore action/isSaved)
    if (message.type === 'SAVE') {
      return `${message.type}-${message.memeId}`;
    }
    
    // For JOIN_POST and LEAVE_POST, use type and postId
    if (message.type === 'JOIN_POST' || message.type === 'LEAVE_POST') {
      return `${message.type}-${message.postId}`;
    }
    
    // For other messages, use a combination of all properties
    return `${message.type}-${JSON.stringify(message)}`;
  }
  
  /**
   * Check if a message was recently sent to prevent duplicates
   * @param message The message to check
   * @returns True if the message was recently sent, false otherwise
   */
  private wasRecentlySent(message: WebSocketMessage): boolean {
    const messageId = this.generateMessageId(message);
    const now = Date.now();
    
    // For JOIN_POST and LEAVE_POST messages, use a special deduplication strategy
    if (message.type === 'JOIN_POST' || message.type === 'LEAVE_POST') {
      // For JOIN_POST, we need to be more careful about deduplication
      // We want to allow rejoining after a certain period (e.g., after a reconnection)
      const lastSent = this.recentMessages.get(messageId);
      
      // Use a shorter deduplication window for JOIN_POST (500ms) to allow reconnection attempts
      // but still prevent rapid duplicate calls
      const deduplicationWindow = message.type === 'JOIN_POST' ? 500 : 2000;
      
      if (lastSent && now - lastSent < deduplicationWindow) {
        console.log(`Ignoring duplicate ${message.type} message for post: ${message.postId}`);
        return true;
      }
    }
    // For LIKE and SAVE messages, use a more aggressive deduplication strategy
    else if (message.type === 'LIKE' || message.type === 'SAVE') {
      // Check if we've sent this message recently (within 2 seconds)
      const lastSent = this.recentMessages.get(messageId);
      if (lastSent && now - lastSent < 2000) {
        console.log(`Ignoring duplicate ${message.type} message for meme: ${message.memeId}`);
        return true;
      }
      
      // For LIKE/SAVE messages, also check the operation tracking
      if (message.type === 'LIKE' && this.lastLikeOperation && 
          this.lastLikeOperation.memeId === message.memeId && 
          now - this.lastLikeOperation.timestamp < 2000 &&
          this.lastLikeOperation.sent) {
        console.log(`Ignoring duplicate LIKE message based on operation tracking: ${message.memeId}`);
        return true;
      }
      
      if (message.type === 'SAVE' && this.lastSaveOperation && 
          this.lastSaveOperation.memeId === message.memeId && 
          now - this.lastSaveOperation.timestamp < 2000 &&
          this.lastSaveOperation.sent) {
        console.log(`Ignoring duplicate SAVE message based on operation tracking: ${message.memeId}`);
        return true;
      }
    } else {
      // For other message types, use the standard deduplication
      const lastSent = this.recentMessages.get(messageId);
      if (lastSent && now - lastSent < 1000) {
        console.log(`Ignoring duplicate message: ${messageId}`);
        return true;
      }
    }
    
    // Record this message as sent
    this.recentMessages.set(messageId, now);
    
    // For LIKE/SAVE messages, also update the operation tracking
    if (message.type === 'LIKE' && this.lastLikeOperation && 
        this.lastLikeOperation.memeId === message.memeId) {
      this.lastLikeOperation.sent = true;
    }
    
    if (message.type === 'SAVE' && this.lastSaveOperation && 
        this.lastSaveOperation.memeId === message.memeId) {
      this.lastSaveOperation.sent = true;
    }
    
    // Clean up old messages (older than 5 seconds)
    this.recentMessages.forEach((timestamp, id) => {
      if (now - timestamp > 5000) {
        this.recentMessages.delete(id);
      }
    });
    
    return false;
  }
  
  /**
   * Send a message through the WebSocket connection
   * @param message The message to send
   * @returns True if the message was sent successfully, false otherwise
   */
  public sendMessage(message: WebSocketMessage): boolean {
    // Check for duplicate messages
    if (this.wasRecentlySent(message)) {
      // Return true to prevent UI inconsistencies
      return true;
    }
    
    // Store the message for potential retry
    const messageToSend = JSON.stringify(message);
    
    // If we're not connected, try to reconnect first
    // But only if we're not already in the process of connecting
    if ((this.connectionState !== 'CONNECTED' && this.connectionState !== 'CONNECTING') || !this.client) {
      console.log(`WebSocket not connected (state: ${this.connectionState}), attempting to reconnect before sending ${message.type} message`);
      
      // Try to restore the connection
      this.restoreConnection();
      
      // Queue the message to be sent when connection is established
      // This is a simple approach - in a more robust implementation, we would use a proper message queue
      setTimeout(() => {
        // Check again for duplicates before sending
        if (this.wasRecentlySent(message)) {
          return;
        }
        
        if (this.client && this.client.readyState === WebSocket.OPEN) {
          try {
            this.client.send(messageToSend);
            console.log(`${message.type} message sent via WebSocket after reconnection:`, message);
          } catch (error) {
            console.error(`Error sending ${message.type} message after reconnection:`, error);
          }
        } else {
          console.error(`Failed to send ${message.type} message: WebSocket still not connected after reconnection attempt`);
        }
      }, 1000); // Wait 1 second for the connection to be established
      
      // Return true to indicate we're handling the message (even though it's queued)
      // This prevents the UI from showing an error and gives the reconnection a chance to work
      return true;
    }
    
    // Check if the connection is open
    if (this.client.readyState === WebSocket.OPEN) {
      try {
        this.client.send(messageToSend);
        console.log(`${message.type} message sent via WebSocket:`, message);
        return true;
      } catch (error) {
        console.error(`Error sending ${message.type} message via WebSocket:`, error);
        
        // If sending fails, try to reconnect, but only if we're not already connecting
        if (this.connectionState !== 'CONNECTING') {
          this.reconnect();
        }
        return false;
      }
    } else if (this.client.readyState === WebSocket.CONNECTING) {
      // If the WebSocket is connecting, queue the message to be sent when the connection is established
      console.log(`WebSocket is connecting, queueing ${message.type} message`);
      
      // Queue the message to be sent when connection is established
      setTimeout(() => {
        if (this.client && this.client.readyState === WebSocket.OPEN) {
          try {
            this.client.send(messageToSend);
            console.log(`${message.type} message sent via WebSocket after connection established:`, message);
          } catch (error) {
            console.error(`Error sending ${message.type} message after connection established:`, error);
          }
        }
      }, 1000); // Wait 1 second for the connection to be established
      
      // Return true to indicate we're handling the message (even though it's queued)
      return true;
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
   * @param isFollowing The NEW follow state to set (true = follow, false = unfollow)
   * @returns True if the message was sent successfully, false otherwise
   */
  public sendFollowRequest(targetUserId: string, targetUsername: string, isFollowing: boolean): boolean {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    
    // Check if we have a valid user
    if (!user.userId) {
      console.error('Cannot send follow request: no user ID available');
      return false;
    }
    
    // Check if we're connected or connecting
    if (this.connectionState !== 'CONNECTED' && this.connectionState !== 'CONNECTING') {
      console.log(`WebSocket not ready (state: ${this.connectionState}), attempting to reconnect before sending FOLLOW message`);
      this.restoreConnection();
    }
    
    const message = {
      type: 'FOLLOW' as WebSocketMessageType,
      followerId: user.userId,
      followerUsername: user.username,
      followingUserId: targetUserId,
      followingUsername: targetUsername,
      isFollowing: isFollowing, // Use the provided state directly (not toggled)
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
    // First check if we're connected
    if (this.connectionState !== 'CONNECTED' || !this.client || this.client.readyState !== WebSocket.OPEN) {
      console.log(`Cannot join post session for ${postId}: WebSocket not connected, attempting to reconnect`);
      
      // Try to restore the connection first
      this.restoreConnection();
      
      // Queue the join request to be sent after reconnection
      setTimeout(() => {
        if (this.connectionState === 'CONNECTED' && this.client && this.client.readyState === WebSocket.OPEN) {
          console.log(`Sending delayed join post request for ${postId} after reconnection`);
          this.sendMessage({
            type: 'JOIN_POST' as WebSocketMessageType,
            postId
          });
        } else {
          console.error(`Failed to join post session for ${postId}: WebSocket still not connected after reconnection attempt`);
        }
      }, 1000); // Wait 1 second for the connection to be established
      
      // Return true to prevent UI errors, even though we're queuing the request
      return true;
    }
    
    // If we're connected, send the message immediately
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
    // Only send the message if we're connected
    if (this.connectionState === 'CONNECTED' && this.client && this.client.readyState === WebSocket.OPEN) {
      return this.sendMessage({
        type: 'LEAVE_POST' as WebSocketMessageType,
        postId
      });
    }
    return false;
  }

  // Track the last like operation to prevent duplicates
  private lastLikeOperation: { memeId: string; timestamp: number; sent: boolean } | null = null;
  
  /**
   * Send a like/unlike request for a meme
   * @param memeId The ID of the meme to like/unlike
   * @returns True if the message was sent successfully, false otherwise
   */
  public async sendLikeRequest(memeId: string): Promise<boolean> {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    
    // Check if we have a valid user
    if (!user.userId || !user.username) {
      console.error('Cannot send like request: no user ID or username available');
      return false;
    }
    
    // Prevent duplicate like operations within a short time window (1 second)
    const now = Date.now();
    if (this.lastLikeOperation && 
        this.lastLikeOperation.memeId === memeId && 
        now - this.lastLikeOperation.timestamp < 1000 &&
        this.lastLikeOperation.sent) {
      console.log('Ignoring duplicate like request for meme:', memeId);
      return true; // Return true to prevent UI inconsistencies
    }
    
    // Check if the meme is already liked by looking at the likedMemes in the store
    // Import the store to check the current state
    const { useMemeContentStore } = await import("../store/useMemeContentStore");
    const memeContentStore = useMemeContentStore.getState();
    const likedMemes = memeContentStore.likedMemes;
    const isCurrentlyLiked = likedMemes.some(m => m.id === memeId);
    
    console.log(`WebSocketService: Meme ${memeId} is currently liked: ${isCurrentlyLiked}`);
    
    // Create the message using the current state from the store
    // The action should be what we want to do, not the current state
    // If it's currently liked, we want to UNLIKE it, and vice versa
    const message = {
      type: 'LIKE' as WebSocketMessageType,
      memeId,
      userId: user.userId,
      username: user.username,
      // If it's currently liked, we want to UNLIKE it, and vice versa
      action: isCurrentlyLiked ? 'LIKE' : 'UNLIKE',
    };
    
    // Record this like operation
    this.lastLikeOperation = { 
      memeId, 
      timestamp: now,
      sent: false
    };
    
    // We no longer need to update the UI state here
    // The toggleLike function in useMemeContentStore already handles the optimistic update
    
    // Use the sendMessage method to send the message
    // This will handle all the connection checks and message deduplication
    return this.sendMessage(message);
  }

  // Track the last save operation to prevent duplicates
  private lastSaveOperation: { memeId: string; timestamp: number; sent: boolean } | null = null;
  
  /**
   * Send a save/unsave request for a meme
   * @param memeId The ID of the meme to save/unsave
   * @returns True if the message was sent successfully, false otherwise
   */
  public async sendSaveRequest(memeId: string): Promise<boolean> {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    
    // Check if we have a valid user
    if (!user.userId || !user.username) {
      console.error('Cannot send save request: no user ID or username available');
      return false;
    }
    
    // Prevent duplicate save operations within a short time window (1 second)
    const now = Date.now();
    if (this.lastSaveOperation && 
        this.lastSaveOperation.memeId === memeId && 
        now - this.lastSaveOperation.timestamp < 1000 &&
        this.lastSaveOperation.sent) {
      console.log('Ignoring duplicate save request for meme:', memeId);
      return true; // Return true to prevent UI inconsistencies
    }
    
    // Check if the meme is already saved by looking at the savedMemes in the store
    // Import the store to check the current state
    const { useMemeContentStore } = await import("../store/useMemeContentStore");
    const memeContentStore = useMemeContentStore.getState();
    const savedMemes = memeContentStore.savedMemes;
    const isCurrentlySaved = savedMemes.some(m => m.id === memeId);
    
    console.log(`WebSocketService: Meme ${memeId} is currently saved: ${isCurrentlySaved}`);
    
    // Create the message using the current state from the store
    // The action should be what we want to do, not the current state
    // If it's currently saved, we want to UNSAVE it, and vice versa
    const message = {
      type: 'SAVE' as WebSocketMessageType,
      memeId,
      userId: user.userId,
      username: user.username,
      // If it's currently saved, we want to UNSAVE it, and vice versa
      action: isCurrentlySaved ? 'SAVE' : 'UNSAVE'
    };
    
    // Record this save operation
    this.lastSaveOperation = { 
      memeId, 
      timestamp: now,
      sent: false
    };
    
    // We no longer need to update the UI state here
    // The toggleSave function in useMemeContentStore already handles the optimistic update
    
    // Use the sendMessage method to send the message
    // This will handle all the connection checks and message deduplication
    return this.sendMessage(message);
  }

  // Track the last comment operation to prevent duplicates
  private lastCommentOperation: { memeId: string; text: string; timestamp: number; sent: boolean } | null = null;

  /**
   * Send a comment for a meme via WebSocket
   * @param memeId The ID of the meme to comment on
   * @param text The comment text
   * @param profilePictureUrl The URL of the user's profile picture
   * @returns true if the message was sent successfully, false otherwise
   */
  public sendCommentRequest(memeId: string, text: string, profilePictureUrl: string): boolean {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    
    // Check if we have a valid user
    if (!user.userId || !user.username) {
      console.error('Cannot send comment request: no user ID or username available');
      return false;
    }
    
    // Prevent duplicate comment operations within a short time window (1 second)
    const now = Date.now();
    if (this.lastCommentOperation && 
        this.lastCommentOperation.memeId === memeId && 
        this.lastCommentOperation.text === text &&
        now - this.lastCommentOperation.timestamp < 1000 &&
        this.lastCommentOperation.sent) {
      console.log('Ignoring duplicate comment request for meme:', memeId);
      return true; // Return true to prevent UI inconsistencies
    }
    
    // Create the comment message
    const message = {
      type: 'COMMENT' as WebSocketMessageType,
      memeId,
      userId: user.userId,
      username: user.username,
      text,
      profilePictureUrl,
      createdAt: new Date().toISOString()
    };
    
    // Record this comment operation
    this.lastCommentOperation = { 
      memeId,
      text,
      timestamp: now,
      sent: false
    };
    
    // Use the sendMessage method to send the message
    // This will handle all the connection checks and message deduplication
    return this.sendMessage(message);
  }
}

// Export the singleton instance
export default WebSocketService.getInstance();