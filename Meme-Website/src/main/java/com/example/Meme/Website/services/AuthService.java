package com.example.Meme.Website.services;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.Meme.Website.dto.AuthRequest;
import com.example.Meme.Website.dto.AuthResponse;
import com.example.Meme.Website.dto.PasswordResetRequest;
import com.example.Meme.Website.dto.RegisterResponse;
import com.example.Meme.Website.models.userModel;
import com.example.Meme.Website.repository.userRepository;

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

    @Transactional
    public ResponseEntity<RegisterResponse> registerUser(userModel user) {
        try {
            log.info("Attempting to register user with {} ", user.getUsername());

            if (userRepository.existsByUsername(user.getUsername()) && userRepository.existsByEmail(user.getEmail())) {
                log.warn("Registration Failed: Username {} and Email {} already exists. ", user.getUsername(),
                        user.getEmail());
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(new RegisterResponse("Username and Email already exists", null, null));
            }

            if (userRepository.existsByUsername(user.getUsername())) {
                log.warn("Registration failed: Username {} already registered", user.getUsername());
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(new RegisterResponse("Username already exists", null, null));
            }

            if (userRepository.existsByEmail(user.getEmail())) {
                log.warn("Registration failed: Email {} already registered", user.getEmail());
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(new RegisterResponse("Email already exists", null, null));
            }

            user.setPassword(passwordEncoder.encode(user.getPassword()));
            user.setUserCreated(new Date());
            user.setUserUpdated(new Date());
            user.setMemeList(new ArrayList<>());
            user.setSavedMemes(new ArrayList<>());
            user.setLikedMemes(new ArrayList<>());
            user.setProfilePictureUrl("");
            user.setFollowersCount(0L);
            user.setFollowingCount(0L);
            user.setFollowers(new ArrayList<>());
            user.setFollowing(new ArrayList<>());

            userModel savedUser = userRepository.save(user);
            String token = jwtservice.generateToken(savedUser.getUsername(), 60);

            log.info("User registered successfully with username {}", user.getUsername());
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(new RegisterResponse(savedUser.getUsername(), token, savedUser.getUserId()));
        } catch (Exception e) {
            log.error("Error during registration {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new RegisterResponse("Registration failed! Please try again later.", null, null));
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

        String token = jwtservice.generateToken(request.getUsername(), 60);

        log.info("Authentication successful for username: {}", request.getUsername());
        return new AuthResponse(token, user.getUsername(), user.getUserId());
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
        String resetToken = jwtservice.generateToken(user.getUsername(), 15); // 15-min expiry

        log.info("Generated reset token for user: {}", user.getUsername());

        String resetLink = "http://localhost:5173/reset-password?token=" + resetToken;
        emailService.sendEmail(user.getEmail(), "Password Reset Request",
                "Click the link below to reset your password:\n" + resetLink +
                        "\n\nThis link will expire in 15 minutes.");

        log.info("Reset email sent to: {}", user.getEmail());

        return ResponseEntity.ok(Collections.singletonMap("message", "Password reset link sent!"));
    }

    @Transactional
    public ResponseEntity<?> resetPassword(PasswordResetRequest request) {
        String token = request.getToken();
        String newPassword = request.getNewPassword();

        log.info("Received password reset request.");

        // Extract username from token
        String username = jwtservice.extractUserName(token);
        log.info("Extracted username from token: {}", username);

        // Fetch user and validate existence
        userModel user = userRepository.findByUsername(username)
                .orElseThrow(() -> {
                    log.warn("User not found for username: {}", username);
                    return new ResponseStatusException(HttpStatus.BAD_REQUEST, "User not found");
                });

        // Validate JWT Token
        UserDetails userDetails = userDetailsService.loadUserByUsername(username);
        if (!jwtservice.validateToken(token, userDetails)) {
            log.warn("Invalid or expired token for user: {}", username);
            return ResponseEntity.badRequest().body("Invalid or expired token");
        }

        log.info("JWT token validated successfully for user: {}", username);

        // Check if new password is the same as the old one
        if (passwordEncoder.matches(newPassword, user.getPassword())) {
            log.warn("User {} attempted to reset with the same password", username);
            return ResponseEntity.badRequest().body("New password cannot be the same as the old password");
        }

        // Hash new password and update user record
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        log.info("Password reset successful for user: {}", username);

        return ResponseEntity.ok("Password reset successful");
    }
}
