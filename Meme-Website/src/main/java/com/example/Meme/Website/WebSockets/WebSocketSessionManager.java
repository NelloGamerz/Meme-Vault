package com.example.Meme.Website.WebSockets;

import java.io.IOException;
import java.util.Collections;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.web.socket.WebSocketSession;

public class WebSocketSessionManager {
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

    public static void registerPostSession(String postId, WebSocketSession session) {
    postSession.computeIfAbsent(postId, k -> {
        return ConcurrentHashMap.newKeySet();
    }).add(session);
}

public static void removePostSession(String postId, WebSocketSession session) {
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
