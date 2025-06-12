/**
 * WebSocketEventBus.ts
 * 
 * A centralized event bus for WebSocket events that components can subscribe to.
 * This helps avoid duplicate WebSocket message handlers across components.
 */

import { WebSocketMessageType, WebSocketMessage } from './WebSocketService';

// Define event types
type EventCallback = (data: WebSocketMessage) => void;

class WebSocketEventBus {
  private static instance: WebSocketEventBus;
  private eventListeners: Map<WebSocketMessageType, Set<EventCallback>>;
  
  private constructor() {
    this.eventListeners = new Map();
    
    // Initialize with empty sets for each message type
    const messageTypes: WebSocketMessageType[] = [
      'PING', 'PONG', 'FOLLOW', 'COMMENT', 'LIKE', 'SAVE', 
      'NOTIFICATION', 'JOIN_POST', 'LEAVE_POST'
    ];
    
    messageTypes.forEach(type => {
      this.eventListeners.set(type, new Set());
    });
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): WebSocketEventBus {
    if (!WebSocketEventBus.instance) {
      WebSocketEventBus.instance = new WebSocketEventBus();
    }
    return WebSocketEventBus.instance;
  }
  
  /**
   * Subscribe to a WebSocket message type
   * @param type The message type to subscribe to
   * @param callback The callback to execute when a message of this type is received
   * @returns A function to unsubscribe
   */
  public subscribe(type: WebSocketMessageType, callback: EventCallback): () => void {
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.add(callback);
    } else {
      this.eventListeners.set(type, new Set([callback]));
    }
    
    // Return an unsubscribe function
    return () => {
      const listeners = this.eventListeners.get(type);
      if (listeners) {
        listeners.delete(callback);
      }
    };
  }
  
  /**
   * Publish a WebSocket message to all subscribers
   * @param message The WebSocket message
   */
  public publish(message: WebSocketMessage): void {
    const type = message.type;
    const listeners = this.eventListeners.get(type);
    
    if (listeners && listeners.size > 0) {
      listeners.forEach(callback => {
        try {
          callback(message);
        } catch (error) {
          console.error(`Error in WebSocket event listener for type ${type}:`, error);
        }
      });
    }
  }
  
  /**
   * Clear all event listeners
   */
  public clear(): void {
    this.eventListeners.forEach(listeners => {
      listeners.clear();
    });
  }
}

// Export the singleton instance
export const webSocketEventBus = WebSocketEventBus.getInstance();

// Export a hook for components to use
export function useWebSocketEvent(type: WebSocketMessageType, callback: EventCallback): () => void {
  return webSocketEventBus.subscribe(type, callback);
}