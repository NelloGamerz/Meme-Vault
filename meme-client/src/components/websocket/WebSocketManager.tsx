import { useEffect, useRef } from 'react';
import WebSocketService from '../../services/WebSocketService';

/**
 * WebSocketManager - A component that initializes WebSocket connections at the app level
 * This component doesn't render anything visible, it just ensures the WebSocketService
 * is properly initialized when the app loads.
 */
export const WebSocketManager: React.FC = () => {
  // Use a ref to track if we've already initialized
  const isInitializedRef = useRef(false);
  
  // Initialize WebSocket connections only once
  useEffect(() => {
    // Only initialize once
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      
      console.log("Initializing WebSocket service...");
      
      // Attempt to restore any existing connection
      WebSocketService.restoreConnection();
      
      // The WebSocketService handles all reconnection logic internally,
      // including network status changes and visibility changes
    }
    
    // No cleanup needed - the WebSocketService manages its own lifecycle
  }, []);
  
  // This component doesn't render anything
  return null;
};