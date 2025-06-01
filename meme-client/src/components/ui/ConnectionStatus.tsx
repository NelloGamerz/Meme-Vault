import React, { useEffect, useState, useRef, memo } from 'react';
import { useWebSocketStore } from '../../hooks/useWebSockets';
import { Wifi, WifiOff } from 'lucide-react';

// Use memo to prevent unnecessary re-renders
export const ConnectionStatus: React.FC = memo(() => {
  // Use a ref to track connection state to minimize re-renders
  const connectionStateRef = useRef<boolean>(useWebSocketStore.getState().isConnected);
  const [showStatus, setShowStatus] = useState<boolean>(false);
  const [fadeOut, setFadeOut] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(connectionStateRef.current);
  const timersRef = useRef<{fadeTimer?: NodeJS.Timeout, hideTimer?: NodeJS.Timeout, checkTimer?: NodeJS.Timeout}>({});
  
  // Function to manually check connection and reconnect if needed
  const checkAndReconnect = () => {
    try {
      const wsStore = useWebSocketStore.getState();
      const currentConnectionState = wsStore.isConnected;
      
      // Only update state if connection state has changed
      if (currentConnectionState !== connectionStateRef.current) {
        connectionStateRef.current = currentConnectionState;
        setIsConnected(currentConnectionState);
      }
      
      if (!currentConnectionState) {
        console.log("Connection status check: Not connected, attempting to restore connection");
        wsStore.restoreConnection();
        
        // Also try to reconnect the meme store WebSocket
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        if (user && user.userId) {
          import("../../store/useMemeStore").then(({ useMemeStore }) => {
            useMemeStore.getState().connectWebSocket();
          }).catch(err => {
            console.error("Error importing useMemeStore:", err);
          });
        }
      }
    } catch (error) {
      console.error("Error in checkAndReconnect:", error);
    }
  };

  // Set up subscription to connection state changes
  useEffect(() => {
    // Initial check
    checkAndReconnect();
    
    // Subscribe to connection state changes
    const unsubscribe = useWebSocketStore.subscribe((state) => {
      // Only update if the connection state has actually changed
      const connected = state.isConnected;
      if (connected !== connectionStateRef.current) {
        connectionStateRef.current = connected;
        setIsConnected(connected);
      }
    });
    
    // Set up a periodic connection check that doesn't cause re-renders
    // Use a longer interval to reduce frequency of checks
    timersRef.current.checkTimer = setInterval(checkAndReconnect, 60000); // 60 seconds
    
    return () => {
      unsubscribe();
      if (timersRef.current.checkTimer) {
        clearInterval(timersRef.current.checkTimer);
      }
    };
  }, []);

  // Handle visibility changes to update connection status
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkAndReconnect();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
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