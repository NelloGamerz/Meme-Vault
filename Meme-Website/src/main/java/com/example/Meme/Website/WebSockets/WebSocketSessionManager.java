package com.example.Meme.Website.WebSockets;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketSession;

import com.example.Meme.Website.models.userModel;
import com.example.Meme.Website.repository.userRepository;

@Component
public class WebSocketSessionManager {

    @Autowired
    private userRepository userRepository;

    // public WebSocketSessionManager(userRepository userRepository) {
    //     this.userRepository = userRepository;
    // }

    private static final Map<String, WebSocketSession> userSession = new ConcurrentHashMap<>();
    private static final Map<String, Set<WebSocketSession>> postSession = new ConcurrentHashMap<>();

    public static void registerUserSession(String userId, WebSocketSession session) {
        userSession.put(userId, session);
    }

    public static WebSocketSession getSession(String userId) {
        return userSession.get(userId);
    }

    public static void removeUserSession(WebSocketSession session) {
        userSession.entrySet().removeIf(entry -> entry.getValue().getId().equals(session.getId()));
    }

    public boolean hasUserSession(String userId) {
        return userSession.containsKey(userId);
    }

    public static void sendToUser(String userId, String message) throws IOException {
        WebSocketSession session = userSession.get(userId);
        if (session != null && session.isOpen()) {
            try {
                session.sendMessage(new org.springframework.web.socket.TextMessage(message));
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }

    public static Set<WebSocketSession> getPostSessions(String postId) {
        return postSession.getOrDefault(postId, Collections.emptySet());
    }

    public void registerPostSession(String postId, WebSocketSession session){
        postSession.computeIfAbsent(postId, k -> ConcurrentHashMap.newKeySet()).add(session);

        Object userIdObject = session.getAttributes().get("userId");
        if(userIdObject != null) {
            String userId = userIdObject.toString();
            Optional<userModel> user = userRepository.findByUserId(userId);
            if(user.isPresent()){
                userModel userModel = user.get();
                if(userModel.getSeenMemes() == null){
                    userModel.setSeenMemes(new ArrayList<>());
                }
                if(!userModel.getSeenMemes().contains(postId)){
                    userModel.getSeenMemes().add(postId);
                    userRepository.save(userModel);
                    System.out.println("Added postId to seenMemes: " + postId);
                }
            }
        }
    }

    public void removePostSession(String postId, WebSocketSession session) {
        Set<WebSocketSession> sessions = postSession.get(postId);
        if (sessions != null) {
            sessions.remove(session);

            if (sessions.isEmpty()) {
                postSession.remove(postId);
            }
        } else {
        }
    }

    public static void broadcastToPost(String postId, String message) {
        Set<WebSocketSession> sessions = postSession.get(postId);
        if (sessions != null) {
            for (WebSocketSession session : sessions) {
                if (session.isOpen()) {
                    try {
                        session.sendMessage(new org.springframework.web.socket.TextMessage(message));
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }
            }
        }
    }

    public static boolean hasPostViewers(String postId) {
        Set<WebSocketSession> sessions = postSession.get(postId);
        return sessions != null && !sessions.isEmpty();
    }

    public static void removeSessions(WebSocketSession session) {
        userSession.entrySet().removeIf(entry -> entry.getValue().getId().equals(session.getId()));

        postSession.entrySet().removeIf(entry -> {
            Set<WebSocketSession> sessions = entry.getValue();
            sessions.remove(session);
            return sessions.isEmpty();
        });
    }
}
