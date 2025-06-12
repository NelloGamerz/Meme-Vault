import React, { useEffect, useState, useRef, memo } from 'react';
import WebSocketService from '../../services/WebSocketService';
import { Wifi, WifiOff } from 'lucide-react';

// Use memo to prevent unnecessary re-renders
export const ConnectionStatus: React.FC = memo(() => {
  // State for UI
  const [showStatus, setShowStatus] = useState<boolean>(false);
  const [fadeOut, setFadeOut] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(WebSocketService.isConnected());
  const timersRef = useRef<{fadeTimer?: NodeJS.Timeout, hideTimer?: NodeJS.Timeout}>({});
  
  // Function to manually check connection and reconnect if needed
  const checkAndReconnect = () => {
    try {
      // Check connection and reconnect if needed
      WebSocketService.checkConnection();
      
      // Update UI state based on current connection state
      setIsConnected(WebSocketService.isConnected());
      
      // If not connected, try to restore the connection
      if (!WebSocketService.isConnected()) {
        console.log("Connection status check: Not connected, attempting to restore connection");
        WebSocketService.restoreConnection();
        
        // Also try to reconnect the WebSocket connection store
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        if (user && user.userId) {
          import("../../store/useWebSocketConnectionStore.ts").then((module) => {
            // Explicitly type the store to include the connectWebSocket method
            const store = module.useWebSocketConnectionStore.getState() as {
              connectWebSocket: () => void;
            };
            store.connectWebSocket();
          }).catch(err => {
            console.error("Error importing useWebSocketConnectionStore:", err);
          });
        }
      }
    } catch (error) {
      console.error("Error in checkAndReconnect:", error);
    }
  };

  // Set up subscription to connection state changes
  useEffect(() => {
    // Register a listener for connection state changes
    const unsubscribe = WebSocketService.registerConnectionStateListener((state) => {
      setIsConnected(state === 'CONNECTED');
    });
    
    return () => {
      unsubscribe();
    };
  }, []);

  // Show/hide the status indicator when connection state changes
  useEffect(() => {
    // Clear any existing timers
    if (timersRef.current.fadeTimer) {
      clearTimeout(timersRef.current.fadeTimer);
    }
    if (timersRef.current.hideTimer) {
      clearTimeout(timersRef.current.hideTimer);
    }
    
    if (!isConnected) {
      setShowStatus(true);
      setFadeOut(false);
    } else {
      // When connected, show for 3 seconds then fade out
      setShowStatus(true);
      setFadeOut(false);
      
      const timer = setTimeout(() => {
        setFadeOut(true);
        
        // After fade animation, hide completely
        const hideTimer = setTimeout(() => {
          setShowStatus(false);
        }, 1000); // match the CSS transition duration
        
        timersRef.current.hideTimer = hideTimer;
      }, 3000);
      
      timersRef.current.fadeTimer = timer;
    }
    
    // Cleanup on unmount or when effect reruns
    return () => {
      if (timersRef.current.fadeTimer) {
        clearTimeout(timersRef.current.fadeTimer);
      }
      if (timersRef.current.hideTimer) {
        clearTimeout(timersRef.current.hideTimer);
      }
    };
  }, [isConnected]);

  // Don't render anything if we don't need to show status
  if (!showStatus) return null;

  return (
    <div 
      className={`fixed bottom-4 right-4 z-50 flex items-center space-x-2 rounded-full px-3 py-2 text-sm font-medium shadow-lg transition-opacity duration-1000 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      } ${
        isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}
      onClick={checkAndReconnect} // Allow manual reconnection by clicking the indicator
    >
      {isConnected ? (
        <>
          <Wifi className="h-4 w-4" />
          <span>Connected</span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4" />
          <span>Reconnecting...</span>
        </>
      )}
    </div>
  );
});