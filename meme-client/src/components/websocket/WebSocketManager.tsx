import { useEffect, useRef } from 'react';
import { useWebSocketStore } from '../../hooks/useWebSockets';

/**
 * WebSocketManager - A component that manages WebSocket connections at the app level
 * This component doesn't render anything visible, it just manages WebSocket connections
 */
export const WebSocketManager: React.FC = () => {
  // Use refs to store connection state to prevent re-renders
  const isInitializedRef = useRef(false);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const connectionCheckTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Initialize WebSocket connections only once
  useEffect(() => {
    // Function to initialize WebSocket connection
    const initializeWebSockets = () => {
      console.log("Initializing WebSocket connection...");
      
      try {
        // Connect using the WebSocketStore
        useWebSocketStore.getState().restoreConnection();
      } catch (error) {
        console.error("Error initializing WebSocket:", error);
      }
    };
    
    // Set up a periodic connection check that doesn't cause re-renders
    const setupPeriodicCheck = () => {
      // Clear any existing timer
      if (connectionCheckTimerRef.current) {
        clearInterval(connectionCheckTimerRef.current);
      }
      
      // Check connection status periodically
      connectionCheckTimerRef.current = setInterval(() => {
        const wsStore = useWebSocketStore.getState();
        
        // Check if we're logged in but not connected
        if (!wsStore.isConnected) {
          try {
            // Try to get user from localStorage
            const userStr = localStorage.getItem("user");
            if (userStr) {
              const user = JSON.parse(userStr);
              if (user && user.userId) {
                console.log("Periodic check: WebSocket disconnected, attempting to reconnect...");
                initializeWebSockets();
              }
            }
          } catch (error) {
            console.error("Error checking user in localStorage:", error);
          }
        }
      }, 30000); // 30 seconds
    };
    
    // Only initialize once
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      
      // Initialize connections immediately
      initializeWebSockets();
      setupPeriodicCheck();
      
      // Set up a reconnect mechanism when network status changes
      const handleOnline = () => {
        console.log("Network is online, checking WebSocket connection...");
        initializeWebSockets();
      };
      
      // Also set up a visibility change listener to reconnect when the page becomes visible again
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          console.log("Page became visible, checking WebSocket connections...");
          initializeWebSockets();
        }
      };
      
      // Add event listeners
      window.addEventListener('online', handleOnline);
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      // Set up a listener for auth state changes
      const checkAuthChanges = () => {
        // Set up a timer to periodically check for auth changes
        reconnectTimerRef.current = setInterval(() => {
          const wsStore = useWebSocketStore.getState();
          const userStr = localStorage.getItem("user");
          
          // If we have a user but no WebSocket connection
          if (userStr && !wsStore.isConnected) {
            try {
              const user = JSON.parse(userStr);
              if (user && user.userId && user.userId !== wsStore.userId) {
                console.log("User changed, reconnecting WebSocket...");
                initializeWebSockets();
              }
            } catch (error) {
              console.error("Error parsing user from localStorage:", error);
            }
          }
        }, 5000); // Check every 5 seconds
      };
      
      checkAuthChanges();
      
      // Cleanup on unmount
      return () => {
        window.removeEventListener('online', handleOnline);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        
        if (reconnectTimerRef.current) {
          clearInterval(reconnectTimerRef.current);
        }
        
        if (connectionCheckTimerRef.current) {
          clearInterval(connectionCheckTimerRef.current);
        }
        
        // Don't disconnect on unmount - we want to keep the connection alive
      };
    }
  }, []);
  
  // This component doesn't render anything
  return null;
};