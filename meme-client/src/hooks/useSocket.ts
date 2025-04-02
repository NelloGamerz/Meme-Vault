// import { useEffect, useRef } from 'react';
// import { io, Socket } from 'socket.io-client';
// import { useMemeStore } from '../store/useMemeStore';

// const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// export const useSocket = () => {
//   const socketRef = useRef<Socket | null>(null);
//   const { addCommentToMeme } = useMemeStore();

//   useEffect(() => {
//     // Initialize socket connection
//     socketRef.current = io(SOCKET_URL, {
//       withCredentials: true,
//       transports: ['websocket'],
//     });

//     // Listen for new comments
//     socketRef.current.on('newComment', (comment) => {
//       addCommentToMeme(comment.memeId, comment);
//     });

//     // Cleanup on unmount
//     return () => {
//       if (socketRef.current) {
//         socketRef.current.disconnect();
//       }
//     };
//   }, [addCommentToMeme]);

//   return socketRef.current;
// };


// import { useEffect, useRef } from 'react';
// import SockJS from 'sockjs-client';
// import Stomp from 'stompjs';
// import { useMemeStore } from '../store/useMemeStore';

// const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/ws';

// export const useSocket = () => {
//   const stompClientRef = useRef(null);
//   const { addCommentToMeme } = useMemeStore();

//   useEffect(() => {
//     // Initialize SockJS connection
//     const socket = new SockJS(SOCKET_URL);
//     const stompClient = Stomp.over(socket);
//     stompClientRef.current = stompClient;

//     stompClient.connect({}, () => {
//       console.log('Connected to WebSocket');

//       // Subscribe to the new comment topic
//       stompClient.subscribe('/topic/newComment', (message) => {
//         const comment = JSON.parse(message.body);
//         addCommentToMeme(comment.memeId, comment);
//       });
//     });

//     // Cleanup on unmount
//     return () => {
//       if (stompClientRef.current) {
//         stompClientRef.current.disconnect();
//       }
//     };
//   }, [addCommentToMeme]);

//   return stompClientRef.current;
// };



// import { useEffect, useRef } from 'react';
// import { Client, Message,} from '@stomp/stompjs';
// import SockJS from 'sockjs-client';
// import { useMemeStore } from '../store/useMemeStore';
// import { Comment } from '../types/mems';

// const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// export const useWebSocket = (memeId?: string) => {
//   const clientRef = useRef<Client | null>(null);
//   const { addCommentToMeme } = useMemeStore();

//   useEffect(() => {
//     const client = new Client({
//       webSocketFactory: () => new SockJS(`${SOCKET_URL}/ws-comments`),
//       debug: (str) => {
//         console.log(str);
//       },
//       reconnectDelay: 5000,
//       heartbeatIncoming: 4000,
//       heartbeatOutgoing: 4000,
//       onStompError: (frame) => {
//         console.error('STOMP error:', frame);
//       },
//       onWebSocketError: (event) => {
//         console.error('WebSocket error:', event);
//       },
//       onWebSocketClose: () => {
//         console.log('WebSocket connection closed');
//       }
//     });

//     const onConnect = () => {
//       console.log('Connected to WebSocket');
      
//       // Subscribe to global comments topic
//       client.subscribe('/topic/comments', (message: Message) => {
//         try {
//           const comment: Comment = JSON.parse(message.body);
//           addCommentToMeme(comment.memeId, comment);
//         } catch (error) {
//           console.error('Error parsing comment:', error);
//         }
//       });
//     };

//     client.onConnect = onConnect;

//     try {
//       client.activate();
//       clientRef.current = client;
//     } catch (error) {
//       console.error('Error activating STOMP client:', error);
//     }

//     return () => {
//       if (clientRef.current?.connected) {
//         clientRef.current.deactivate();
//       }
//     };
//   }, [memeId, addCommentToMeme]);

//   const sendComment = (comment: { memeId: string; text: string; username: string }) => {
//     if (!clientRef.current?.connected) {
//       console.warn('WebSocket not connected, unable to send comment');
//       return;
//     }

//     try {
//       clientRef.current.publish({
//         destination: '/app/HandleComment',
//         body: JSON.stringify({
//           memeId: comment.memeId,
//           text: comment.text,
//           username: comment.username
//         }),
//       });
//     } catch (error) {
//       console.error('Error sending comment:', error);
//     }
//   };

//   return { sendComment };
// };


// import { useEffect, useRef } from 'react';
// import { io, Socket } from 'socket.io-client';
// import { useMemeStore } from '../store/useMemeStore';
// import { Comment } from '../types/mems';

// const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// export const useWebSocket = (memeId?: string) => {
//   const socketRef = useRef<Socket | null>(null);
//   const { addCommentToMeme } = useMemeStore();

//   useEffect(() => {
//     const socket = io(SOCKET_URL, {
//       transports: ['websocket'],
//       autoConnect: true,
//       reconnection: true,
//       reconnectionDelay: 5000,
//     });

//     socket.on('connect', () => {
//       console.log('Connected to WebSocket');
//     });

//     socket.on('disconnect', () => {
//       console.log('WebSocket connection closed');
//     });

//     socket.on('error', (error) => {
//       console.error('Socket error:', error);
//     });

//     socket.on('comment', (comment: Comment) => {
//       try {
//         addCommentToMeme(comment.memeId, comment);
//       } catch (error) {
//         console.error('Error handling comment:', error);
//       }
//     });

//     socketRef.current = socket;

//     return () => {
//       if (socketRef.current) {
//         socketRef.current.disconnect();
//       }
//     };
//   }, [memeId, addCommentToMeme]);

//   const sendComment = (comment: { memeId: string; text: string; username: string }) => {
//     if (!socketRef.current?.connected) {
//       console.warn('WebSocket not connected, unable to send comment');
//       return;
//     }

//     try {
//       socketRef.current.emit('newComment', comment);
//     } catch (error) {
//       console.error('Error sending comment:', error);
//     }
//   };

//   return { sendComment };
// }; 