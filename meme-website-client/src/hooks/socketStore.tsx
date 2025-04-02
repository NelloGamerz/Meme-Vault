// import React, { useState, useEffect, useRef } from 'react';
// import SockJS from 'sockjs-client';
// import { Client } from '@stomp/stompjs';

// const socketStore = () => {
//     const [message, setMessage] = useState('');
//     const [name, setName] = useState('');
//     const stompClientRef = useRef(null);

//     useEffect(() => {
//         const socket = new SockJS('http://localhost:8080/ws');
//         const stompClient = new Client({
//             webSocketFactory: () => socket,
//             reconnectDelay: 5000,
//             debug: (str) => {
//                 console.log(str);
//             },
//             onConnect: () => {
//                 console.log('Connected to WebSocket');
//                 stompClient.subscribe('/topic/comments', (response) => {
//                     console.log('Received message:', response.body);
//                     setMessage(JSON.parse(response.body).content);
//                 });
//             },
//             onStompError: (frame) => {
//                 console.error('Broker reported error: ' + frame.headers['message']);
//                 console.error('Additional details: ' + frame.body);
//             },
//         });

//         stompClient.activate();
//         stompClientRef.current = stompClient;

//         return () => {
//             stompClient.deactivate();
//         };
//     }, []);

//     const sendMessage = () => {
//         const stompClient = stompClientRef.current;
//         if (stompClient && stompClient.connected) {
//             console.log('Sending message:', name);
//             stompClient.publish({
//                 destination: '/app/hello',
//                 body: name,
//             });
//         } else {
//             console.error('Stomp client is not connected');
//         }
//     };

//     return (
//         <div>
//             <input 
//                 type="text" 
//                 placeholder="Enter your name" 
//                 value={name} 
//                 onChange={(e) => setName(e.target.value)} 
//             />
//             <button onClick={sendMessage}>Send</button>
//             <p>{message}</p>
//         </div>
//     );
// };

// export default socketStore;




// import React, { useState, useEffect, useRef } from 'react';
// import SockJS from 'sockjs-client';
// import Stomp from 'stompjs';

// export const SocketStore = () => {
//     const [message, setMessage] = useState('');
//     const [name, setName] = useState('');
//     const stompClientRef = useRef(null);

//     useEffect(() => {
//         // Create SockJS connection
//         const socket = new SockJS('http://localhost:8080/ws-comments');
//         const stompClient = Stomp.over(socket);

//         // Enable debugging (optional)
//         stompClient.debug = (msg) => console.log(msg);

//         // Connect to WebSocket
//         stompClient.connect({}, () => {
//             console.log('Connected to WebSocket');

//             // Subscribe to topic
//             stompClient.subscribe('/topic/comments', (response) => {
//                 try {
//                     const data = JSON.parse(response.body);
//                     setMessage(data.content || 'No message received');
//                 } catch (error) {
//                     console.error('Error parsing message:', error);
//                 }
//             });
//         }, (error) => {
//             console.error('WebSocket connection error:', error);
//         });

//         // Store reference
//         stompClientRef.current = stompClient;

//         // Cleanup on unmount
//         return () => {
//             if (stompClientRef.current) {
//                 stompClientRef.current.disconnect();
//             }
//         };
//     }, []);

//     const sendMessage = () => {
//         const stompClient = stompClientRef.current;
//         if (stompClient && stompClient.connected) {
//             const payload = JSON.stringify({ name });
//             console.log('Sending message:', payload);
//             stompClient.send('/app/hello', {}, payload);
//         } else {
//             console.error('STOMP client is not connected');
//         }
//     };

//     return (
//         <div>
//             <input 
//                 type="text" 
//                 placeholder="Enter your name" 
//                 value={name} 
//                 onChange={(e) => setName(e.target.value)} 
//             />
//             <button onClick={sendMessage}>Send</button>
//             <p>{message}</p>
//         </div>
//     );
// };
