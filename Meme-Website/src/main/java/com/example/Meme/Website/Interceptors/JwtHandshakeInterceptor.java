// package com.example.Meme.Website.Interceptors;

// import com.example.Meme.Website.services.JWTService;

// import jakarta.servlet.http.Cookie;
// import jakarta.servlet.http.HttpServletRequest;
// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.http.server.ServerHttpRequest;
// import org.springframework.http.server.ServerHttpResponse;
// import org.springframework.http.server.ServletServerHttpRequest;
// import org.springframework.security.core.userdetails.UserDetails;
// import org.springframework.security.core.userdetails.UserDetailsService;
// import org.springframework.stereotype.Component;
// import org.springframework.web.socket.WebSocketHandler;
// import org.springframework.web.socket.server.HandshakeInterceptor;

// import java.util.Map;

// @Component
// public class JwtHandshakeInterceptor implements HandshakeInterceptor {

//     @Autowired
//     private JWTService jwtService;

//     @Autowired
//     private UserDetailsService userDetailsService;

//     @Override
//     // public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse
//     // response, WebSocketHandler wsHandler, Map<String, Object> attributes) throws
//     // Exception {
//     // if (request instanceof ServletServerHttpRequest servletRequest) {
//     // HttpServletRequest httpServletRequest = servletRequest.getServletRequest();
//     // String token = httpServletRequest.getParameter("token"); // Token from URL
//     // query param ?token=xxx
//     //
//     // if (token != null) {
//     // String username = jwtService.extractUserName(token);
//     // if (username != null) {
//     // UserDetails userDetails = userDetailsService.loadUserByUsername(username);
//     // if (jwtService.validateToken(token, userDetails)) {
//     // attributes.put("username", username); // Save to WebSocket session
//     // return true;
//     // }
//     // }
//     // else{
//     // System.out.println("Username not found");
//     // }
//     // }
//     // }
//     // return false;
//     // }

//     // public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse
//     // response, WebSocketHandler wsHandler, Map<String, Object> attributes) throws
//     // Exception {
//     // try {
//     // if (request instanceof ServletServerHttpRequest servletRequest) {
//     // HttpServletRequest httpServletRequest = servletRequest.getServletRequest();
//     // String token = httpServletRequest.getParameter("token"); // Token from URL
//     // query param ?token=xxx

//     // if (token != null) {
//     // String username = jwtService.extractUserName(token);
//     // if (username != null) {
//     // UserDetails userDetails = userDetailsService.loadUserByUsername(username);
//     // if (jwtService.validateToken(token, userDetails)) {
//     // attributes.put("username", username); // Save to WebSocket session
//     // return true;
//     // }
//     // } else {
//     // System.out.println("Username not found");
//     // }
//     // }
//     // }
//     // } catch (Exception e) {
//     // // Log the exception and handle it as needed
//     // System.err.println("Error during WebSocket handshake: " + e.getMessage());
//     // // Optionally, you can return a specific response to indicate failure
//     // }
//     // return false;
//     // }

//     // @Override
//     // public void afterHandshake(ServerHttpRequest request, ServerHttpResponse
//     // response, WebSocketHandler wsHandler, Exception exception) {

//     // }

//     public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
//             WebSocketHandler wsHandler, Map<String, Object> attributes) throws Exception {
//         try {
//             if (request instanceof ServletServerHttpRequest servletRequest) {
//                 HttpServletRequest httpServletRequest = servletRequest.getServletRequest();

//                 // 🔍 1. Try to get token from cookies
//                 String token = null;
//                 Cookie[] cookies = httpServletRequest.getCookies();
//                 if (cookies != null) {
//                     for (Cookie cookie : cookies) {
//                         if ("token".equals(cookie.getName())) {
//                             token = cookie.getValue();
//                             break;
//                         }
//                     }
//                 }

//                 // 🛑 Fallback: Try to get token from query param if cookie is not present
//                 if (token == null) {
//                     token = httpServletRequest.getParameter("token");
//                 }

//                 // 🔐 2. Validate token and extract username
//                 if (token != null) {
//                     String username = jwtService.extractUserName(token);
//                     if (username != null) {
//                         UserDetails userDetails = userDetailsService.loadUserByUsername(username);
//                         if (jwtService.validateToken(token, userDetails)) {
//                             attributes.put("username", username); // Save to WebSocket session
//                             return true;
//                         }
//                     }
//                 }
//             }
//         } catch (Exception e) {
//             System.err.println("Error during WebSocket handshake: " + e.getMessage());
//         }

//         return false; // Reject handshake if validation fails
//     }

//     @Override
//     public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response, WebSocketHandler wsHandler, Exception exception) {

//     }

// }
