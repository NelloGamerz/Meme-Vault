import { useEffect, useRef } from 'react';
import WebSocketService from '../../services/WebSocketService';
import { useWebSocketStore } from '../../hooks/useWebSockets';

/**
 * WebSocketManager - A component that initializes and maintains WebSocket connections at the app level
 * This component doesn't render anything visible, it just ensures the WebSocketService
 * is properly initialized and maintained throughout the application lifecycle.
 */
export const WebSocketManager: React.FC = () => {
  // Use a ref to track if we've already initialized
  const isInitializedRef = useRef(false);
  
  // Initialize WebSocket connections
  useEffect(() => {
    console.log("Initializing WebSocket service...");
    
    // Attempt to restore any existing connection
    // This is the only place we should explicitly call restoreConnection during initialization
    WebSocketService.restoreConnection();
    
    // Register this component as active with the WebSocketService
    // This lets the service know that the app is running and connections should be maintained
    const unregisterAppActive = WebSocketService.registerApplicationActive();
    
    // Set initialized flag
    isInitializedRef.current = true;
    
    // Clean up when the component unmounts
    return () => {
      if (unregisterAppActive) {
        unregisterAppActive();
      }
    };
  }, []);
  
  // Track the last time we dispatched a reconnection event to prevent duplicates
  const lastReconnectEventRef = useRef<number>(0);
  
  // Listen for route changes to ensure connection is maintained across navigation
  useEffect(() => {
    // Use a debounced version of the route change handler to prevent multiple rapid checks
    let routeChangeTimeout: NodeJS.Timeout | null = null;
    
    const handleRouteChange = () => {
      // Clear any existing timeout to debounce multiple rapid navigation events
      if (routeChangeTimeout) {
        clearTimeout(routeChangeTimeout);
      }
      
      // Set a new timeout with a small delay to let the new page initialize
      routeChangeTimeout = setTimeout(() => {
        // Only check connection if we think we're connected
        const wsStore = useWebSocketStore.getState();
        if (wsStore.isConnected && wsStore.client) {
          // Just do a quick check without triggering the full reconnection logic
          if (wsStore.client.readyState !== WebSocket.OPEN) {
            console.log("WebSocketManager: Connection check after route change - reconnecting");
            WebSocketService.restoreConnection();
            
            // Set a timeout to dispatch the reconnection event after the connection is restored
            setTimeout(() => {
              const newClient = WebSocketService.getClient();
              if (newClient && newClient.readyState === WebSocket.OPEN) {
                dispatchReconnectEvent(newClient);
              }
            }, 1000);
          } else {
            console.log("WebSocketManager: Connection check after route change - already connected");
            
            // Only dispatch the event if we haven't recently dispatched one
            const now = Date.now();
            if (now - lastReconnectEventRef.current > 2000) {
              dispatchReconnectEvent(wsStore.client);
            }
          }
        }
      }, 300); // Reduced delay for better responsiveness
    };
    
    // Helper function to dispatch the reconnection event
    const dispatchReconnectEvent = (client: WebSocket) => {
      console.log("WebSocketManager: Dispatching websocket-reconnected event");
      
      // Update the last reconnect event timestamp
      lastReconnectEventRef.current = Date.now();
      
      // Dispatch a custom event that components can listen for
      const event = new CustomEvent('websocket-reconnected', { 
        detail: { client } 
      });
      window.dispatchEvent(event);
    };
    
    // Listen for history changes (route changes)
    window.addEventListener('popstate', handleRouteChange);
    
    // Also listen for React Router's programmatic navigation
    window.addEventListener('navigation', handleRouteChange);
    
    return () => {
      // Clean up event listeners and any pending timeout
      window.removeEventListener('popstate', handleRouteChange);
      window.removeEventListener('navigation', handleRouteChange);
      if (routeChangeTimeout) {
        clearTimeout(routeChangeTimeout);
      }
    };
  }, []);
  
  // This component doesn't render anything
  return null;
};