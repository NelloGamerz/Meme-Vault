package com.example.Meme.Website.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.example.Meme.Website.services.ProfileService;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    @Autowired
    private ProfileService profileService;

    @PostMapping("/upload/{userId}")
    public ResponseEntity<?> uploadProfilePicture(@PathVariable String userId,
            @RequestParam("file") MultipartFile file) throws Exception {
        return profileService.uploadProfilePicture(userId, file);
    }

    @GetMapping("/{userId}")
    public ResponseEntity<?> userProfile(@PathVariable String userId) {
        return profileService.userProfile(userId);
    }

    @GetMapping("/{userId}/followers")
    public ResponseEntity<?> getFollowers(@PathVariable String userId) {
        return profileService.getFollowers(userId);
    }

    @PostMapping("/{userId}/follow/{targetUserId}")
    public ResponseEntity<?> followUser(@PathVariable String userId, @PathVariable String targetUserId, @RequestBody Map<String, Boolean> requestBody ) {
        return profileService.followUser(userId, targetUserId, requestBody);
    }

    @GetMapping("/{userId}/following")
    public ResponseEntity<?> getFollowing(@PathVariable String userId) {
        return profileService.getFollowing(userId);
    }

    @PutMapping("/{userId}/update-username")
    public ResponseEntity<?> changeUsername(@PathVariable String userId,
            @RequestBody Map<String, String> request) {
        return profileService.changeUsername(userId, request);
    }

}
