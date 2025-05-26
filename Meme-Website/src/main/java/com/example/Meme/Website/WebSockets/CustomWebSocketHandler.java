package com.example.Meme.Website.WebSockets;

import java.io.IOException;
import java.util.Date;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;

import com.example.Meme.Website.models.Comments;
import com.example.Meme.Website.services.memeService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

@Component
public class CustomWebSocketHandler implements WebSocketHandler {

    private final memeService memeService;

    public CustomWebSocketHandler(memeService memeService) {
        this.memeService = memeService;
    }

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        Map<String, Object> attributes = session.getAttributes();
        String username = (String) attributes.get("username");

        if (username != null) {
            WebSocketSessionManager.registerUserSession(username, session);
        } else {
            try {
                session.close(CloseStatus.NOT_ACCEPTABLE.withReason("Unauthorized"));
            } catch (IOException ignored) {
            }
        }
    }

    @Override
    public void handleMessage(WebSocketSession session, WebSocketMessage<?> message) throws IOException {
        JsonNode json = objectMapper.readTree(message.getPayload().toString());

        String type = json.get("type").asText();
        String username = (String) session.getAttributes().get("username");

        switch (type) {
            case "JOIN_POST":
                WebSocketSessionManager.registerPostSession(json.get("postId").asText(), session);
                break;

            case "LEAVE_POST":
                WebSocketSessionManager.removePostSession(json.get("postId").asText(), session);
                break;

            case "LIKE":
                handleLikeEvent(json, username);
                break;

            case "SAVE":
                handleSaveEvent(json, username);
                break;

            case "COMMENT":
                Comments comment = new Comments();
                comment.setMemeId(json.get("memeId").asText());
                String userId = json.has("userId") ? json.get("userId").asText()
                        : (String) session.getAttributes().get("userId");
                comment.setUserId(userId);
                comment.setUsername(username);
                comment.setText(json.get("text").asText());
                comment.setCreatedAt(new Date());
                String profilePictureUrl = json.has("profilePictureUrl") ? json.get("profilePictureUrl").asText()
                        : null;
                comment.setProfilePictureUrl(profilePictureUrl);
                memeService.addCommentsToMeme(comment);
                break;

            default:
                session.sendMessage(new TextMessage("{\"error\":\"Unknown type: " + type + "\"}"));
        }
    }

    private void handleLikeEvent(JsonNode json, String username) throws IOException {
        String memeId = json.get("memeId").asText();
        String action = json.get("action").asText();
        boolean isLike = action.equalsIgnoreCase("LIKE");

        ResponseEntity<?> response = memeService.likedMemes(username, memeId, isLike);        ObjectNode likePayload = objectMapper.createObjectNode();
        likePayload.put("type", "LIKE");
        likePayload.put("memeId", memeId);
        likePayload.put("username", username);
        likePayload.put("action", action);
        likePayload.put("status", response.getStatusCode().value());

        if (response.getStatusCode().is2xxSuccessful() && response.getBody() instanceof JsonNode) {
            JsonNode responseBody = (JsonNode) response.getBody();
            likePayload.put("message", responseBody.get("message").asText());
            likePayload.put("likeCount", responseBody.get("likeCount").asInt());
        } else {
            likePayload.put("message", response.getBody().toString());
        }

        String payload = objectMapper.writeValueAsString(likePayload);
        System.out.println("Broadcast payload: " + payload);

        WebSocketSessionManager.broadcastToPost(memeId, payload);
        System.out.println("Broadcasted LIKE event to post viewers of memeId: " + memeId);
    }

    private void handleSaveEvent(JsonNode json, String username) throws IOException {
        String memeId = json.get("memeId").asText();
        boolean isSave = json.get("action").asText().equalsIgnoreCase("SAVE");

        ResponseEntity<?> response = memeService.saveMeme(username, memeId, isSave);
        System.out.println("Service response - status: " + response.getStatusCode() + ", body: " + response.getBody());

        ObjectNode savePayload = objectMapper.createObjectNode();
        savePayload.put("type", "SAVE");
        savePayload.put("memeId", memeId);
        savePayload.put("username", username);
        savePayload.put("action", isSave ? "SAVE" : "UNSAVE");
        savePayload.put("status", response.getStatusCode().value());

        if (response.getStatusCode().is2xxSuccessful() && response.getBody() instanceof JsonNode) {
            JsonNode responseBody = (JsonNode) response.getBody();
            savePayload.put("message", responseBody.get("message").asText());
            savePayload.put("saveCount", responseBody.get("saveCount").asInt());
        } else {
            savePayload.put("message", response.getBody().toString());
        }

        String payload = objectMapper.writeValueAsString(savePayload);
        WebSocketSessionManager.broadcastToPost(memeId, payload);
        System.out.println("Broadcasted SAVE event to post viewers of memeId: " + memeId);
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) {
        WebSocketSessionManager.removeSessions(session);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        WebSocketSessionManager.removeSessions(session);
    }

    @Override
    public boolean supportsPartialMessages() {
        return false;
    }
}
