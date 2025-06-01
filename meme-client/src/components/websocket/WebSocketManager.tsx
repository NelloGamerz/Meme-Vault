// import { useEffect, useRef } from 'react';
// import { useWebSocketStore } from '../../hooks/useWebSockets';

// /**
//  * WebSocketManager - A component that manages WebSocket connections without causing UI re-renders
//  * This component doesn't render anything visible, it just manages WebSocket connections
//  */
// export const WebSocketManager: React.FC = () => {
//   // Use refs to store connection state to prevent re-renders
//   const isInitializedRef = useRef(false);
//   const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  
//   // Initialize WebSocket connections only once
//   useEffect(() => {
//     if (isInitializedRef.current) return;
//     isInitializedRef.current = true;
    
//     // Function to initialize WebSocket connection
//     const initializeWebSockets = () => {
//       console.log("Initializing WebSocket connection...");
      
//       try {
//         // Connect using the WebSocketStore
//         useWebSocketStore.getState().restoreConnection();
//       } catch (error) {
//         console.error("Error initializing WebSocket:", error);
//       }
//     };
    
//     // Set up a periodic connection check that doesn't cause re-renders
//     const setupPeriodicCheck = () => {
//       // Clear any existing timer
//       if (reconnectTimerRef.current) {
//         clearInterval(reconnectTimerRef.current);
//       }
      
//       // Check connection less frequently to reduce potential for cascading effects
//       reconnectTimerRef.current = setInterval(() => {
//         const wsStore = useWebSocketStore.getState();
//         if (!wsStore.isConnected) {
//           console.log("Periodic check: WebSocket disconnected, attempting to reconnect...");
//           initializeWebSockets();
//         }
//       }, 60000); // 60 seconds
//     };
    
//     // Initialize connections immediately
//     initializeWebSockets();
//     setupPeriodicCheck();
    
//     // Also set up a visibility change listener to reconnect when the page becomes visible again
//     const handleVisibilityChange = () => {
//       if (document.visibilityState === 'visible') {
//         console.log("Page became visible, checking WebSocket connections...");
//         initializeWebSockets();
//       }
//     };
    
//     document.addEventListener('visibilitychange', handleVisibilityChange);
    
//     // Cleanup on unmount
//     return () => {
//       document.removeEventListener('visibilitychange', handleVisibilityChange);
//       if (reconnectTimerRef.current) {
//         clearInterval(reconnectTimerRef.current);
//       }
//       // Don't disconnect on unmount - we want to keep the connection alive
//     };
//   }, []);
  
//   // This component doesn't render anything
//   return null;
// };