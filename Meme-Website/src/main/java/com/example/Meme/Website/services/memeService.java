package com.example.Meme.Website.services;

import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.example.Meme.Website.WebSockets.WebSocketSessionManager;
import com.example.Meme.Website.models.Comments;
import com.example.Meme.Website.models.Meme;
import com.example.Meme.Website.models.userModel;
import com.example.Meme.Website.repository.commentRepository;
import com.example.Meme.Website.repository.memeRepository;
import com.example.Meme.Website.repository.userRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

import io.jsonwebtoken.io.IOException;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class memeService {

    @Autowired
    private userRepository userRepository;
    @Autowired
    private memeRepository memeRepository;
    @Autowired
    private commentRepository commentRepository;
    @Autowired
    private Cloudinary cloudinary;
    @Autowired
    private MongoTemplate mongoTemplate;
    @Autowired
    private RedisService redisService;
    @Autowired
    private ObjectMapper objectMapper;
    @Autowired
    private NotificationService notificationService;


    @Transactional
    public ResponseEntity<List<Meme>> getAllMemes() {
        List<Meme> memes = redisService.getList("AllMemes", Meme.class);

        if (memes != null && !memes.isEmpty()) {
            System.out.println("✅ Returning memes from Redis cache");
            return ResponseEntity.ok(memes);
        }

        memes = memeRepository.findAll();

        if (!memes.isEmpty()) {
            redisService.set("AllMemes", memes, 10, TimeUnit.MINUTES);
            System.out.println("🔄 Caching memes in Redis for 10 minutes");
        }

        return ResponseEntity.ok(memes);
    }

    @Transactional
    public ResponseEntity<Optional<Meme>> getUserUploadedMemes(String userId) {
        Optional<Meme> memes = memeRepository.findById(userId);
        if (memes.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(memes);
    }

    // @Transactional
    public ResponseEntity<Meme> getMemeById(String id) {
        Optional<Meme> meme = memeRepository.findById(id);
        if (meme.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(meme.get());
    }

    @Transactional
    public Map<String, Object> getUserStats(userModel user) {
        Map<String, Object> response = new HashMap<>();

        response.put("username", user.getUsername());
        response.put("email", user.getEmail());
        response.put("userCreated", user.getUserCreated());
        response.put("userUpdated", user.getUserUpdated());

        response.put("uploadedCount", user.getMemeList() != null ? user.getMemeList().size() : 0);
        response.put("likedCount", user.getLikedMemes() != null ? user.getLikedMemes().size() : 0);
        response.put("savedCount", user.getSavedMemes() != null ? user.getSavedMemes().size() : 0);

        return response;
    }

    @Transactional
    public ResponseEntity<?> likedMemes(String username, String memeId, boolean like) {
        try {
            Optional<userModel> optionalUser = userRepository.findByUsername(username);
            if (optionalUser.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Error: User not found");
            }

            Optional<Meme> optionalMeme = memeRepository.findById(memeId);
            if (optionalMeme.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Error: Meme not found");
            }

            userModel user = optionalUser.get();
            Meme meme = optionalMeme.get();

            List<Meme> likedMemes = user.getLikedMemes();
            if (likedMemes == null) {
                likedMemes = new ArrayList<>();
            }

            String message;
            if (like) {
                if (!likedMemes.contains(meme)) {
                    likedMemes.add(meme);
                    meme.setLikecount(meme.getLikecount() + 1);
                    message = "Meme liked successfully";
                    System.out.println("Meme liked by user: " + username);

                    if(!username.equals(meme.getUploader())){
                        String sender = username;
                        String recepient = meme.getUploader();
                        String type = "LIKE";
                        String notificationMessage = sender + " liked your meme";
                        String profilePictureUrl = user.getProfilePictureUrl();
                        String memeIdForNotification = meme.getId();
                        notificationService.sendNotification(sender, recepient, type, notificationMessage, profilePictureUrl, memeIdForNotification);
                    }
                } else {
                    message = "Meme already liked";
                }
            } else {
                if (likedMemes.contains(meme)) {
                    likedMemes.remove(meme);
                    meme.setLikecount(Math.max(0, meme.getLikecount() - 1));
                    message = "Meme unliked successfully";
                    System.out.println("Meme unliked by user: " + username);
                } else {
                    message = "Meme was not previously liked";
                }
            }

            user.setLikedMemes(likedMemes);
            userRepository.save(user);
            memeRepository.save(meme);

            // Return structured response with likeCount
            ObjectNode response = new ObjectMapper().createObjectNode();
            response.put("message", message);
            response.put("likeCount", meme.getLikecount());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("An error occurred while updating liked memes: " + e.getMessage());
        }
    }

    @Transactional
    public ResponseEntity<?> saveMeme(String username, String memeId, boolean save) {
        try {
            Optional<userModel> optionalUser = userRepository.findByUsername(username);
            if (optionalUser.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Error: User not found");
            }

            Optional<Meme> optionalMeme = memeRepository.findById(memeId);
            if (optionalMeme.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Error: Meme not found");
            }

            userModel user = optionalUser.get();
            Meme meme = optionalMeme.get();

            List<Meme> savedMemes = user.getSavedMemes();
            if (savedMemes == null) {
                savedMemes = new ArrayList<>();
            }

            String message;
            if (save) {
                if (!savedMemes.contains(meme)) {
                    savedMemes.add(meme);
                    meme.setSaveCount(meme.getSaveCount() + 1);
                    message = "Meme saved successfully";
                    System.out.println("Meme saved by user: " + username);
                } else {
                    message = "Meme already saved";
                }
            } else {
                if (savedMemes.contains(meme)) {
                    savedMemes.remove(meme);
                    meme.setSaveCount(Math.max(0, meme.getLikecount() - 1));
                    message = "Meme unsaved successfully";
                    System.out.println("Meme unsaved by user: " + username);
                } else {
                    message = "Meme was not previously saved";
                }
            }

            user.setSavedMemes(savedMemes);
            userRepository.save(user);
            memeRepository.save(meme);

            ObjectNode response = new ObjectMapper().createObjectNode();
            response.put("message", message);
            response.put("saveCount", meme.getSaveCount());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("An error occurred while updating saved memes: " + e.getMessage());
        }
    }

    @Transactional
    public ResponseEntity<?> uploadMeme(MultipartFile file, String caption, String uploader, String profilePictureUrl,
            String userId)
            throws java.io.IOException {
        try {
            // 🔹 Define max file size (Images ≤ 5MB, Videos ≤ 50MB)
            final long MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB
            final long MAX_VIDEO_SIZE = 10 * 1024 * 1024; // 10MB

            // 🔹 Check file size before upload
            String contentType = file.getContentType();
            if (contentType == null) {
                return ResponseEntity.badRequest().body("Invalid file format");
            }

            boolean isImage = contentType.startsWith("image/");
            boolean isVideo = contentType.startsWith("video/");

            if (isImage && file.getSize() > MAX_IMAGE_SIZE) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Image size exceeds the 5MB limit");
            }
            if (isVideo && file.getSize() > MAX_VIDEO_SIZE) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Video size exceeds the 50MB limit");
            }
            if (!isImage && !isVideo) {
                return ResponseEntity.badRequest().body("Only image and video formats are allowed");
            }

            // 🔹 Upload file to Cloudinary inside "memes/" folder
            @SuppressWarnings("unchecked")
            Map<String, Object> uploadResult = cloudinary.uploader().upload(file.getBytes(),
                    ObjectUtils.asMap(
                            "folder", "memes",
                            "resource_type", isVideo ? "video" : "image", // Correctly categorize files
                            "use_filename", true,
                            "unique_filename", true,
                            "overwrite", true));

            String mediaUrl = uploadResult.get("secure_url").toString();
            uploadResult.get("format").toString();
            String mediaType = isVideo ? "video" : "image";

            // 🔹 Fetch the user from MongoDB
            Optional<userModel> optionalUser = userRepository.findById(userId);
            if (optionalUser.isEmpty()) {
                return ResponseEntity.badRequest().body("User not found");
            }
            userModel user = optionalUser.get();

            // 🔹 Save meme details in MongoDB
            Meme meme = new Meme(null, user.getUserId(), mediaUrl, mediaType, caption, uploader, 0, 0, new Date(),
                    new ArrayList<>(), profilePictureUrl);
            memeRepository.save(meme);

            // 🔹 Store meme ID in user's meme list
            user.getMemeList().add(meme);
            userRepository.save(user);

            String redisKey = "AllMemes"; // Key to store memes by user
            List<Meme> memeList = redisService.getList(redisKey, Meme.class);
            memeList.add(meme);
            redisService.set(redisKey, memeList, 10, TimeUnit.MINUTES); // Cache for 10 min

            return ResponseEntity.ok(meme);

            // return ResponseEntity.ok(meme);
        } catch (IOException e) {
            return ResponseEntity.badRequest().body("File Upload failed: " + e.getMessage());
        }
    }

    @Transactional
    public ResponseEntity<?> getAllLikedMemes(String username) {
        Optional<userModel> optionalUser = userRepository.findByUsername(username);
        if (optionalUser.isEmpty()) {
            return ResponseEntity.badRequest().body("User not found");
        }

        userModel user = optionalUser.get();
        List<Meme> LikedMemes = user.getLikedMemes();

        return ResponseEntity.ok(LikedMemes);
    }

    @Transactional
    public ResponseEntity<?> getAllSavedMemes(String username) {
        Optional<userModel> optionalUser = userRepository.findByUsername(username);
        if (optionalUser.isEmpty()) {
            return ResponseEntity.badRequest().body("User not found");
        }

        userModel user = optionalUser.get();
        List<Meme> savedMemes = user.getSavedMemes();

        return ResponseEntity.ok(savedMemes);
    }

    @Transactional
    public Comments addCommentsToMeme(Comments comment) throws IOException, java.io.IOException {
        System.out.println("Starting addCommentsToMeme()...");

        Optional<Meme> optionalMeme = memeRepository.findById(comment.getMemeId());

        if (optionalMeme.isEmpty()) {
            System.out.println("Meme not found with ID: " + comment.getMemeId());
            throw new RuntimeException("Meme not found");
        }

        Meme meme = optionalMeme.get();
        System.out.println("Found meme with ID: " + meme.getId());

        // Save the new comment
        Comments savedComment = commentRepository.save(comment);
        System.out.println("Saved comment with ID: " + savedComment.getId());

        // Update meme's comment list
        if (meme.getComments() == null) {
            System.out.println("Meme has no existing comments. Initializing comment list...");
            meme.setComments(new ArrayList<>());
        }

        meme.getComments().add(savedComment);
        Meme updatedMeme = memeRepository.save(meme);
        System.out.println("Updated meme with new comment. Meme ID: " + updatedMeme.getId());

        // Update Redis cache
        String redisKey = "AllMemes";
        List<Meme> memeList = redisService.getList(redisKey, Meme.class);
        System.out.println("Fetched meme list from Redis. List size: " + (memeList != null ? memeList.size() : 0));

        if (memeList != null) {
            for (int i = 0; i < memeList.size(); i++) {
                if (memeList.get(i).getId().equals(updatedMeme.getId())) {
                    memeList.set(i, updatedMeme);
                    System.out.println("Updated meme in Redis list at index: " + i);
                    break;
                }
            }
            redisService.set(redisKey, memeList, 10, TimeUnit.MINUTES);
            System.out.println("Updated Redis cache with modified meme list.");
        }

        // --- WebSocket Broadcast Section ---
        ObjectNode messageNode = objectMapper.valueToTree(savedComment);
        messageNode.put("type", "COMMENT");
        String payload = objectMapper.writeValueAsString(messageNode);
        TextMessage message = new TextMessage(payload);
        System.out.println("Constructed WebSocket message payload.");

        // 1. Broadcast to post viewers
        Set<WebSocketSession> viewers = WebSocketSessionManager.getPostSessions(meme.getId());
        System.out.println("Broadcasting to " + viewers.size() + " post viewers...");
        for (WebSocketSession viewerSession : viewers) {
            if (viewerSession.isOpen()) {
                viewerSession.sendMessage(message);
            }
        }

        // 2. Notify post owner
        String ownerId = meme.getUserId();
        WebSocketSession ownerSession = WebSocketSessionManager.getSession(ownerId);
        if (ownerSession != null && ownerSession.isOpen()) {
            System.out.println("Sending WebSocket message to post owner with user ID: " + ownerId);
            ownerSession.sendMessage(message);
        } else {
            System.out.println("Post owner WebSocket session not found or not open for user ID: " + ownerId);
        }

        if(!comment.getUsername().equals(meme.getUploader())){
            String sender = comment.getUsername();
            String recepient = meme.getUploader();
            String type = "COMMENT";
            String notificationMessage = sender + " commented on your meme: " + meme.getCaption();
            String profilePictureUrl = comment.getProfilePictureUrl();
            String memeId = comment.getMemeId();
            notificationService.sendNotification(sender, recepient, type, notificationMessage, profilePictureUrl, memeId);
        }

        System.out.println("Finished addCommentsToMeme(). Returning saved comment.");
        return savedComment;
    }

    @Transactional
    public ResponseEntity<List<Comments>> getMemeComments(String memeId) {
        List<Comments> comments = commentRepository.findByMemeId(memeId);
        return ResponseEntity.ok(comments); // Always return 200 OK with the list (even if empty)
    }

    @Transactional
    public ResponseEntity<?> getUserData(String username) {
        Optional<userModel> optionalUser = userRepository.findByUsername(username);
        if (optionalUser.isEmpty()) {
            return ResponseEntity.status(404).body("User not found");
        }
        userModel user = optionalUser.get();
        return ResponseEntity.ok(user);
    }

    @Transactional
    public ResponseEntity<List<Meme>> searchMeme(String query) {
        List<Meme> memes = memeRepository.findByCaption(query, "i"); // Case-insensitive search
        return ResponseEntity.ok(memes); // Return all matching memes (even if empty, it'll return HTTP 200 with an
                                         // empty list)
    }

    @Transactional
    public ResponseEntity<List<Meme>> searchMemes(String query, String startDate, String endDate, int limit, int page,
            String sort) {
        PageRequest.of(page, limit,
                Sort.by(sort.equals("asc") ? Sort.Direction.ASC : Sort.Direction.DESC, "createdAt"));

        // Case-insensitive regex query
        String regexQuery = (query != null && !query.isEmpty()) ? ".*" + query + ".*" : ".*";

        List<Meme> memes = memeRepository.findByCaptionRegex(regexQuery);

        return ResponseEntity.ok(memes);
    }

    @Transactional(rollbackFor = Exception.class)
    public ResponseEntity<?> deleteMeme(String memeId) throws Exception {
        Optional<Meme> memeOptional = memeRepository.findById(memeId);
        if (memeOptional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Meme not found"));
        }
        Meme meme = memeOptional.get();

        String imageUrl = meme.getMediaUrl(); // Store image URL for rollback
        boolean cloudinaryDeleted = false;

        try {
            // Delete meme image from Cloudinary
            if (imageUrl != null && !imageUrl.isEmpty()) {
                String publicId = extractPublicIdFromUrl(imageUrl);
                if (publicId != null) {
                    cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
                    cloudinaryDeleted = true; // Mark Cloudinary deletion success
                }
            }

            // Remove meme from uploader's meme list
            userRepository.findById(meme.getUploader()).ifPresent(user -> {
                user.getMemeList().removeIf(m -> m.getId().equals(memeId));
                userRepository.save(user);
            });

            // Delete all comments related to this meme
            Query commentQuery = new Query(Criteria.where("memeId").is(memeId));
            mongoTemplate.remove(commentQuery, Comments.class);

            // Remove meme from all users' saved & liked lists
            Query userQuery = new Query(new Criteria().orOperator(
                    Criteria.where("savedMemes").is(memeId),
                    Criteria.where("likedMemes").is(memeId)));
            List<userModel> users = mongoTemplate.find(userQuery, userModel.class);
            for (userModel user : users) {
                user.getSavedMemes().removeIf(m -> m.getId().equals(memeId));
                user.getLikedMemes().removeIf(m -> m.getId().equals(memeId));
                userRepository.save(user);
            }

            // Delete the meme itself
            memeRepository.delete(meme);

            // String key = "AllMemes";
            // List<Meme> cashedMeme = redisService.getList(key, Meme.class);
            // cashedMeme.removeIf(meme -> meme.getId().equals(memeId));

            String redisKey = "AllMemes"; // Key to store memes by user
            List<Meme> memeList = redisService.getList(redisKey, Meme.class);
            memeList.removeIf(m -> m.getId().equals(memeId));
            // memeList.add(meme);
            redisService.set(redisKey, memeList, 10, TimeUnit.MINUTES);
            log.info("✅ Meme '{}' removed and Redis cache updated", memeId);

            return ResponseEntity.ok(Map.of("message", "Meme deleted successfully"));
        } catch (Exception e) {
            // Rollback Cloudinary deletion if DB transaction fails
            if (cloudinaryDeleted && imageUrl != null) {
                try {
                    cloudinary.uploader().upload(imageUrl, ObjectUtils.emptyMap()); // Restore image
                } catch (Exception cloudinaryRollbackException) {
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                            .body(Map.of("error", "Failed to rollback Cloudinary deletion"));
                }
            }
            throw e; // Ensure transaction rollback
        }
    }

    private String extractPublicIdFromUrl(String imageUrl) {
        try {
            // Example Cloudinary URL:
            String regex = ".*/upload/(?:v\\d+/)?(.+?)\\..*";
            Pattern pattern = Pattern.compile(regex);
            Matcher matcher = pattern.matcher(imageUrl);
            if (matcher.matches()) {
                return matcher.group(1); // Extracts 'folder/image' from URL
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    @Transactional
    public ResponseEntity<?> addComments(Comments comment, String memeId) {
        comment.setCreatedAt(new Date());

        // ✅ Find the meme by memeId
        Optional<Meme> memeOptional = memeRepository.findById(memeId);
        if (!memeOptional.isPresent()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Meme not found", null);
        }

        Meme meme = memeOptional.get();

        // ✅ Save comment to the global comments collection
        Comments savedComment = commentRepository.save(comment);

        // ✅ Add the comment to the meme's comment list
        meme.getComments().add(savedComment);
        memeRepository.save(meme);

        return ResponseEntity.ok(savedComment);
    }
}
