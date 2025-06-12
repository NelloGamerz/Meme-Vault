package com.example.Meme.Website.services;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationContext;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.Meme.Website.Security.CookieUtil;
import com.example.Meme.Website.dto.AuthRequest;
import com.example.Meme.Website.dto.AuthResponse;
import com.example.Meme.Website.dto.PasswordResetRequest;
import com.example.Meme.Website.dto.RegisterResponse;
import com.example.Meme.Website.models.userModel;
import com.example.Meme.Website.repository.userRepository;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class AuthService {
    @Autowired
    private userRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JWTService jwtservice;

    @Autowired
    private EmailService emailService;

    @Autowired
    private UserDetailsServiceImpl userDetailsService;

    @Autowired
    private RedisService redisService;

    @Autowired
    private ApplicationContext context;

    @Autowired
    private CookieUtil cookieUtil;

    @Value("${frontend.url}")
    private String frontendUrl;


    @Transactional
    public ResponseEntity<RegisterResponse> registerUser(userModel user) {
        try {
            log.info("Attempting to register user with {} ", user.getUsername());

            boolean usernameExists = userRepository.existsByUsername(user.getUsername());
            boolean emailExists = userRepository.existsByEmail(user.getEmail());

            if (usernameExists && emailExists) {
                log.warn("Registration Failed: Username {} and Email {} already exist.", user.getUsername(),
                        user.getEmail());
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(new RegisterResponse("Username and Email already exist", null, null, null));
            }

            if (usernameExists) {
                log.warn("Registration failed: Username {} already registered", user.getUsername());
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(new RegisterResponse("Username already exists", null, null, null));
            }

            if (emailExists) {
                log.warn("Registration failed: Email {} already registered", user.getEmail());
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(new RegisterResponse("Email already exists", null, null, null));
            }

            user.setPassword(passwordEncoder.encode(user.getPassword()));
            user.setUserCreated(new Date());
            user.setUserUpdated(new Date());
            user.setMemeList(new ArrayList<>());
            user.setSavedMemes(new ArrayList<>());
            user.setLikedMemes(new ArrayList<>());
            user.setSeenMemes(new ArrayList<>());
            user.setTagInteractions(new HashMap<>());
            user.setProfilePictureUrl("");
            user.setFollowersCount(0L);
            user.setFollowingCount(0L);
            user.setFollowers(new ArrayList<>());
            user.setFollowing(new ArrayList<>());

            userModel savedUser = userRepository.save(user);

            // Token Expiry
            long accessTokenExpiry = 1; // in minutes
            long refreshTokenExpiry = 60 * 24 * 7; // in minutes (7 days)

            String accessToken = jwtservice.generateToken(savedUser.getUsername(), accessTokenExpiry, "accessToken");
            String refreshToken = jwtservice.generateToken(savedUser.getUsername(), refreshTokenExpiry, "refreshToken");

            // ✅ Store refresh token in Redis
            redisService.setToken("refresh_token", savedUser.getUsername(), refreshToken, refreshTokenExpiry * 60); // seconds

            log.info("User registered successfully with username {}", savedUser.getUsername());

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(new RegisterResponse(savedUser.getUsername(), accessToken, refreshToken,
                            savedUser.getUserId()));

        } catch (Exception e) {
            log.error("Error during registration {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new RegisterResponse("Registration failed! Please try again later.", null, null, null));
        }
    }


    @Transactional
    public AuthResponse authenticate(AuthRequest request) {
        log.info("Authentication attempt for username: {}", request.getUsername());

        userModel user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> {
                    log.warn("Authentication failed: User {} not found", request.getUsername());
                    return new UsernameNotFoundException("User not found");
                });

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            log.warn("Authentication failed: Invalid password for username {}", request.getUsername());
            throw new BadCredentialsException("Invalid username or password");
        }

        long accessTokenExpiry = 1; // in minutes
        long refreshTokenExpiry = request.isRememberMe() ? 60 * 24 * 7 : 60 * 24; 

        String accessToken = jwtservice.generateToken(request.getUsername(), accessTokenExpiry, "accessToken");
        String refreshToken = jwtservice.generateToken(request.getUsername(), refreshTokenExpiry, "refreshToken");

        redisService.setToken("refresh_token", request.getUsername(), refreshToken, refreshTokenExpiry * 60);

        log.info("Authentication successful for username: {}", request.getUsername());

        return new AuthResponse(accessToken, refreshToken, user.getUsername(), user.getUserId());
    }

    @Transactional
    public ResponseEntity<?> forgotPassword(Map<String, String> request) {
        String email = request.get("email");

        log.info("Password reset request received for email: {}", email);

        Optional<userModel> userOptional = userRepository.findByEmail(email);

        if (!userOptional.isPresent()) {
            log.warn("User not found for email: {}", email);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Collections.singletonMap("message", "User not found"));
        }

        userModel user = userOptional.get();
        String passwordResetToken = jwtservice.generateToken(user.getUsername(), 15, "password_reset_token"); // 15-min expiry
        String resetId = UUID.randomUUID().toString();

        log.info("Generated reset token for user: {}", user.getUsername());

        // String redisKey = "reset:" + resetId;
        redisService.setToken("reset", resetId, passwordResetToken, 15 * 60); // Store in Redis for 15 minutes
        // redisTemplate.opsForValue().set(redisKey, passwordResetToken, 15, TimeUnit.MINUTES); 
        log.info("Stored reset token in Redis with key: {}", "reset: "+ resetId);

        // String resetLink = "http://localhost:5173/reset-password?token=" + resetToken;
        // emailService.sendEmail(user.getEmail(), "Password Reset Request",
        //         "Click the link below to reset your password:\n" + resetLink +
        //                 "\n\nThis link will expire in 15 minutes.");

        String resetLink = frontendUrl + "/reset-password/" + resetId;
        emailService.sendEmail(
            user.getEmail(),
            "Password ResetRequest",
            "Click the link below to reset your password:\n" + resetLink +
            "\n\nThis link will expire in 15 minutes."
        );

        log.info("Reset email sent to: {}", user.getEmail());

        return ResponseEntity.ok(Collections.singletonMap("message", "Password reset link sent!"));
    }

    @Transactional
    public ResponseEntity<?> resetPassword(PasswordResetRequest request) {
        String resetId = request.getResetId();
        String newPassword = request.getNewPassword();

        log.info("Received password reset request.");
        String token = redisService.getToken("reset", resetId);

        String username = jwtservice.extractUserName(token);
        log.info("Extracted username from token: {}", username);

        userModel user = userRepository.findByUsername(username)
                .orElseThrow(() -> {
                    log.warn("User not found for username: {}", username);
                    return new ResponseStatusException(HttpStatus.BAD_REQUEST, "User not found");
                });

        UserDetails userDetails = userDetailsService.loadUserByUsername(username);
        if (!jwtservice.validateToken(token, userDetails)) {
            log.warn("Invalid or expired token for user: {}", username);
            return ResponseEntity.badRequest().body("Invalid or expired token");
        }

        log.info("JWT token validated successfully for user: {}", username);

        if (passwordEncoder.matches(newPassword, user.getPassword())) {
            log.warn("User {} attempted to reset with the same password", username);
            return ResponseEntity.badRequest().body("New password cannot be the same as the old password");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        log.info("Password reset successful for user: {}", username);

        return ResponseEntity.ok("Password reset successful");
    }


    public void refreshAccessToken(HttpServletRequest request, HttpServletResponse response) throws Exception {
        String accessToken = jwtservice.extractTokenFromCookies(request);
        String username = null;

        if (accessToken != null) {
            try {
                username = jwtservice.extractUserName(accessToken);
            } catch (Exception ignored) {
            }
        }

        // Fallback to username cookie
        if (username == null) {
            username = jwtservice.extractUsernameFromCookie(request); // Custom method
            if (username == null) {
                throw new Exception("No username available to refresh access token.");
            }
        }

        UserDetails userDetails = context.getBean(UserDetailsServiceImpl.class).loadUserByUsername(username);
        String storedRefreshToken = redisService.getToken("refresh_token", username);

        if (storedRefreshToken != null && jwtservice.validateToken(storedRefreshToken, userDetails)) {
            // ✅ New access token
            String newAccessToken = jwtservice.generateToken(username, 60, "access_token");
            cookieUtil.addCookie(response, "access_token", newAccessToken, 60);

            // 🔁 Rotate refresh token if expiring soon
            if (jwtservice.willExpireSoon(storedRefreshToken, 10)) {
                String newRefreshToken = jwtservice.generateToken(username, 60 * 24 * 7, "refresh_token");
                redisService.setToken("refresh_token", username, newRefreshToken, 60 * 24 * 7 * 60);
            }

            // ✅ Refresh username cookie too (sliding expiration)
            cookieUtil.addCookie(response, "username", username, 60 * 60 * 24 * 7); // 7 days again
        } else {
            redisService.deleteToken("refresh_token", username);
            throw new Exception("Refresh token invalid or expired.");
        }
    }

}
