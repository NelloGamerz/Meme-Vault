package com.example.Meme.Website.services;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.example.Meme.Website.Exceptions.CustomExceptions;
import com.example.Meme.Website.Security.CookieUtil;
import com.example.Meme.Website.models.Comments;
import com.example.Meme.Website.models.FollowersModel;
import com.example.Meme.Website.models.Meme;
import com.example.Meme.Website.models.userModel;
import com.example.Meme.Website.repository.userRepository;

import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;

import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@Slf4j
public class ProfileService {

    @Autowired
    private Cloudinary cloudinary;

    @Autowired
    private userRepository userRepository;

    @Autowired
    private MongoTemplate mongoTemplate;

    @Autowired
    private JWTService jwtService;

    @Autowired
    private CookieUtil cookieUtil;

    @Autowired
    private RedisService redisService;

    @Autowired
    private UserDetailsServiceImpl userDetailsService;

    @Autowired
    private NotificationService notificationService;

    @SuppressWarnings("unchecked")
    @Transactional
    public ResponseEntity<?> uploadProfilePicture(String userId, MultipartFile file) {
        String oldImageUrl = null;
        boolean cloudinaryDeleted = false;

        try {
            // 🔹 Set max file size (1MB)
            final long MAX_SIZE = 1 * 1024 * 1024; // 1MB
            if (file.getSize() > MAX_SIZE) {
                throw new CustomExceptions.FileSizeExceededException("File size exceeds the maximum limit of 1MB");
            }

            // 🔹 Check if user exists
            Optional<userModel> userOptional = userRepository.findById(userId);
            if (userOptional.isEmpty()) {
                throw new CustomExceptions.UserNotFoundException("User not found");
            }

            userModel user = userOptional.get();
            oldImageUrl = user.getProfilePictureUrl(); // Store previous profile picture URL

            // 🔹 Delete previous profile picture from Cloudinary (if exists)
            if (oldImageUrl != null && !oldImageUrl.isEmpty()) {
                try {
                    String publicId = extractPublicIdFromUrl(oldImageUrl);
                    if (publicId != null && !publicId.isEmpty()) {
                        Map<String, Object> result = cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
                        if ("ok".equals(result.get("result"))) {
                            cloudinaryDeleted = true; // Mark as successfully deleted
                        } else {
                            throw new CustomExceptions.CloudinaryException(
                                    "Failed to delete old profile picture from Cloudinary");
                        }
                    }
                } catch (Exception e) {
                    throw new CustomExceptions.CloudinaryException(
                            "Exception occurred while deleting old profile picture: " + e.getMessage());
                }
            }

            // 🔹 Upload new picture to Cloudinary
            Map<String, Object> uploadResult = cloudinary.uploader().upload(file.getBytes(),
                    ObjectUtils.asMap(
                            "folder", "profile_pictures",
                            "use_filename", true,
                            "unique_filename", true,
                            "overwrite", true));

            String newImageUrl = uploadResult.get("secure_url").toString();

            // 🔹 Update User Profile Image
            user.setProfilePictureUrl(newImageUrl);
            userRepository.save(user);

            // ✅ Update profile picture in all memes uploaded by this user
            List<Meme> memes = mongoTemplate.find(new Query(Criteria.where("UserId").is(userId)), Meme.class);
            for (Meme meme : memes) {
                meme.setProfilePictureUrl(newImageUrl);
                mongoTemplate.save(meme);
            }

            // ✅ Update profile picture in all comments by this user
            List<Comments> comments = mongoTemplate.find(new Query(Criteria.where("userId").is(userId)),
                    Comments.class);
            for (Comments comment : comments) {
                comment.setProfilePictureUrl(newImageUrl);
                mongoTemplate.save(comment);
            }

            Query followersQuery = new Query(Criteria.where("Followers.userId").is(userId));
            Update followersUpdate = new Update().set("Followers.$.profilePictureUrl", newImageUrl);
            mongoTemplate.updateMulti(followersQuery, followersUpdate, FollowersModel.class);

            Query followingQuery = new Query(Criteria.where("Following.userId").is(userId));
            Update followingUpdate = new Update().set("Following.$.profilePictureUrl", newImageUrl);
            mongoTemplate.updateMulti(followingQuery, followingUpdate, FollowersModel.class);

            // 🔹 Return success response
            return ResponseEntity
                    .ok(Map.of("message", "Profile picture updated successfully", "imageUrl", newImageUrl));

        } catch (CustomExceptions.UserNotFoundException | CustomExceptions.FileSizeExceededException
                | CustomExceptions.CloudinaryException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "error", e.getMessage(),
                    "exception", e.getClass().getSimpleName(),
                    "status", HttpStatus.BAD_REQUEST.value()));
        } catch (Exception e) {
            // 🔄 Rollback: Restore old profile picture in case of failure
            if (cloudinaryDeleted && oldImageUrl != null) {
                try {
                    cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap("folder", "profile_pictures"));
                } catch (Exception cloudinaryRollbackException) {
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                            "error", "Failed to rollback Cloudinary deletion",
                            "exception", cloudinaryRollbackException.getClass().getSimpleName(),
                            "status", HttpStatus.INTERNAL_SERVER_ERROR.value()));
                }
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "error", "Unexpected error occurred",
                    "exception", e.getClass().getSimpleName(),
                    "status", HttpStatus.INTERNAL_SERVER_ERROR.value()));
        }
    }

    @Transactional
    private String extractPublicIdFromUrl(String imageUrl) {
        try {
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
    public void updateProfilePictureInFollowersAndFollowing(String userId, String newProfilePictureUrl) {
        Query followersQuery = new Query(Criteria.where("Followers.userId").is(userId));

        Update followersUpdate = new Update()
                .set("Followers.$[elem].profilePictureUrl", newProfilePictureUrl)
                .filterArray(Criteria.where("elem.userId").is(userId)); // Correct way to apply array filter

        mongoTemplate.updateMulti(followersQuery, followersUpdate, userModel.class);

        // Update profile picture in Following list
        Query followingQuery = new Query(Criteria.where("Following.userId").is(userId));
        Update followingUpdate = new Update()
                .set("Following.$[elem].profilePictureUrl", newProfilePictureUrl)
                .filterArray(Criteria.where("elem.userId").is(userId));
        mongoTemplate.updateMulti(followingQuery, followingUpdate, userModel.class);
    }

    @Transactional
    public ResponseEntity<?> userProfile(String username) {
        Optional<userModel> OptionalUser = userRepository.findByUsername(username);
        if (OptionalUser.isEmpty()) {
            return ResponseEntity.status(404).body("User not found");
        }
        userModel user = OptionalUser.get();
        Map<String, Object> userProfile = new HashMap<>();

        userProfile.put("userId", user.getUserId());
        userProfile.put("username", user.getUsername());
        userProfile.put("profilePictureUrl", user.getProfilePictureUrl());
        userProfile.put("userCreated", user.getUserCreated());
        userProfile.put("memeList", user.getMemeList());
        userProfile.put("savedMemes", user.getSavedMemes());
        userProfile.put("likedMemes", user.getLikedMemes());
        userProfile.put("following", user.getFollowing());
        userProfile.put("followers", user.getFollowers());
        userProfile.put("followingCount", user.getFollowing().size());
        userProfile.put("followersCount", user.getFollowers().size());

        return ResponseEntity.ok(userProfile);
    }

    @Transactional
    public ResponseEntity<?> getFollowers(String userId) {
        Optional<userModel> userOpt = userRepository.findById(userId);

        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "User not found!"));
        }

        userModel user = userOpt.get();
        return ResponseEntity.ok(Map.of("followers", user.getFollowers(), "followersCount", user.getFollowersCount()));
    }

    @Transactional
    public ResponseEntity<?> changeUsername(String userId, Map<String, String> request,
            HttpServletResponse httpResponse) {
        Optional<userModel> userOpt = userRepository.findById(userId);

        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "User not found."));
        }

        userModel user = userOpt.get();
        String previousUsername = user.getUsername();
        String newUsername = request.get("newUsername");

        if (newUsername == null || newUsername.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "New username cannot be empty."));
        }

        // Check if new username already exists
        if (userRepository.findByUsername(newUsername).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Username already taken."));
        }

        // Update username in DB
        user.setUsername(newUsername);
        userRepository.save(user);

        // Invalidate old refresh token from Redis
        redisService.deleteToken("refresh_token", previousUsername);

        // Generate new tokens
        long accessExpiryMinutes = 15;
        long refreshExpiryMinutes = 60 * 24 * 7; // 7 days

        String newAccessToken = jwtService.generateToken(newUsername, accessExpiryMinutes, "access_token");
        String newRefreshToken = jwtService.generateToken(newUsername, refreshExpiryMinutes, "refresh_token");

        // Store refresh token in Redis
        redisService.setToken("refresh_token", newUsername, newRefreshToken, refreshExpiryMinutes * 60); // in seconds

        // Add new access_token cookie
        cookieUtil.addCookie(httpResponse, "access_token", newAccessToken, (int) (accessExpiryMinutes * 60));

        // Add new username cookie (used by JWTFilter if access_token is missing)
        cookieUtil.addCookie(httpResponse, "username", newUsername, (int) (refreshExpiryMinutes * 60));

        // Return response
        Map<String, String> response = new HashMap<>();
        response.put("previousUsername", previousUsername);
        response.put("newUsername", newUsername);
        response.put("message", "Username changed successfully. Access token rotated.");

        return ResponseEntity.ok(response);
    }

    @Transactional
    public ResponseEntity<?> getFollowing(String userId) {
        Optional<userModel> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body("User not found.");
        }

        userModel user = userOpt.get();
        List<FollowersModel> followingList = user.getFollowing(); // Directly retrieve the list

        return ResponseEntity.ok(followingList);
    }

    @Transactional
    public ResponseEntity<?> followUserByUsername(String followerUsername, String targetUsername, Map<String, Boolean> requestBody) {
        log.info("Received follow request: followerId='{}', targetUserId='{}', requestBody={}", followerUsername,
                targetUsername, requestBody);

        boolean isFollowing = requestBody.getOrDefault("isFollowing", false);
        Optional<userModel> followerOpt = userRepository.findByUsername(followerUsername);
        Optional<userModel> targetUserOpt = userRepository.findByUsername(targetUsername);

        if (followerOpt.isEmpty() || targetUserOpt.isEmpty()) {
            log.warn("User not found: followerId='{}' found={}, targetUserId='{}' found={}",
                    followerUsername, followerOpt.isPresent(),
                    targetUsername, targetUserOpt.isPresent());
            return ResponseEntity.status(404).body("User not found.");
        }

        userModel follower = followerOpt.get();
        userModel targetUser = targetUserOpt.get();

        if (!isFollowing) {
            log.info("'{}' is unfollowing '{}'", follower.getUsername(), targetUser.getUsername());

            // Unfollow logic
            long beforeFollowingCount = follower.getFollowingCount();
            long beforeFollowersCount = targetUser.getFollowersCount();

            follower.getFollowing().removeIf(f -> f.getUserId().equals(targetUser.getUserId()));
            follower.setFollowingCount(Math.max(0, beforeFollowingCount - 1));

            targetUser.getFollowers().removeIf(f -> f.getUserId().equals(follower.getUserId()));
            targetUser.setFollowersCount(Math.max(0, beforeFollowersCount - 1));

            userRepository.save(follower);
            userRepository.save(targetUser);

            log.info("Unfollow successful: {} -> {}. New counts - followerFollowingCount={}, targetFollowersCount={}",
                    follower.getUsername(), targetUser.getUsername(),
                    follower.getFollowingCount(), targetUser.getFollowersCount());

            return ResponseEntity.ok("Unfollowed successfully.");
        } else {
            log.info("'{}' is following '{}'", follower.getUsername(), targetUser.getUsername());

            // Follow logic
            FollowersModel followerInfo = new FollowersModel(null, follower.getUserId(), follower.getUsername(),
                    follower.getProfilePictureUrl(), false);
            FollowersModel followingInfo = new FollowersModel(null, targetUser.getUserId(), targetUser.getUsername(),
                    targetUser.getProfilePictureUrl(), false);

            follower.getFollowing().add(followingInfo);
            follower.setFollowingCount(follower.getFollowingCount() + 1);

            targetUser.getFollowers().add(followerInfo);
            targetUser.setFollowersCount(targetUser.getFollowersCount() + 1);

            userRepository.save(follower);
            userRepository.save(targetUser);

            log.info("Follow successful: {} -> {}. New counts - followerFollowingCount={}, targetFollowersCount={}",
                    follower.getUsername(), targetUser.getUsername(),
                    follower.getFollowingCount(), targetUser.getFollowersCount());

            notificationService.sendNotification(
                    follower.getUsername(),
                    targetUser.getUsername(),
                    "FOLLOW",
                    follower.getUsername() + " started following you",
                    follower.getProfilePictureUrl(),
                    null);

            log.info("Notification sent to '{}': {} started following you", targetUser.getUsername(),
                    follower.getUsername());

            return ResponseEntity.ok("Followed successfully.");
        }
    }

}
