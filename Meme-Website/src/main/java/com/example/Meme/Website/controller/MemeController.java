package com.example.Meme.Website.controller;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.Meme.Website.models.Comments;
import com.example.Meme.Website.models.Meme;
import com.example.Meme.Website.services.memeService;

@RestController
@RequestMapping("/memes")
public class MemeController {

    @Autowired
    private memeService memeService;

    @GetMapping("/{username}")
    public ResponseEntity<?> getUserData(@PathVariable String username) {
        return memeService.getUserData(username);
    }


    @GetMapping("/uploaded/{username}")
    public ResponseEntity<?> getUploadedMemesByUsername(@PathVariable String username) {
        return memeService.getUserUploadedMemes(username);
    }

    @GetMapping
    public ResponseEntity<List<Meme>> getAllMemes() {
        return memeService.getAllMemes();
    }

    @PostMapping("/{memeId}/like")
    public ResponseEntity<?> toggleLikeMeme(
            @RequestParam String username,
            @PathVariable String memeId,
            @RequestParam boolean like) { // `true` for like, `false` for unlike
        return memeService.likedMemes(username, memeId, like);

    }

    @PostMapping("/{memeId}/save")
    public ResponseEntity<?> toggleSaveMeme(
            @RequestParam String username,
            @PathVariable String memeId,
            @RequestParam boolean save){
                return memeService.saveMeme(username, memeId, save);
            }

    @GetMapping("/memepage/{memeId}")
    public ResponseEntity<?> getMemeById(@PathVariable String memeId) {
        return memeService.getMemeById(memeId);
    }

    @GetMapping("/uploaded")
    public ResponseEntity<Optional<Meme>> getUploadedMemes(@RequestParam String userId) {
        return memeService.getUserUploadedMemes(userId);
    }

    @GetMapping("/saves")
    public ResponseEntity<List<Meme>> getSavedMemes() {
        return memeService.getAllMemes();
    }

    // Upload a meme
    @PostMapping
    public ResponseEntity<?> uploadMeme(
            @RequestParam("file") MultipartFile file,
            @RequestParam("title") String title,
            @RequestParam("uploader") String uploader,
            @RequestParam("profilePictureUrl") String profilePictureUrl,
            @RequestParam("userId") String userId) throws Exception {
        return memeService.uploadMeme(file, title, uploader, profilePictureUrl, userId);
    }

    @GetMapping("/liked/{username}")
    public ResponseEntity<?> getLikedMemes(@PathVariable String username) {
        return memeService.getAllLikedMemes(username);
    }

    @GetMapping("saved/{username}")
    public ResponseEntity<?> getSavedMemes(@PathVariable String username) {
        return memeService.getAllSavedMemes(username);
    }


    @GetMapping("/commnets")
    public ResponseEntity<List<Comments>> getMemeComments(@RequestParam String memeID) {
        return memeService.getMemeComments(memeID);
    }

    @PostMapping("/{memeId}/comments")
    public ResponseEntity<?> addComment(@RequestBody Comments comment, @PathVariable String memeId) {
        return memeService.addComments(comment, memeId);
    }

    @GetMapping("/{memeId}/comments")
    public ResponseEntity<List<Comments>> getCommentById(@PathVariable String memeId) {
        return memeService.getMemeComments(memeId);
    }

    @GetMapping("/search")
    public ResponseEntity<List<Meme>> searchMemes(
            @RequestParam(required = false) String query,       // Search text
            @RequestParam(required = false) String startDate,   // Optional start date
            @RequestParam(required = false) String endDate,     // Optional end date
            @RequestParam(defaultValue = "10") int limit,       // Pagination limit
            @RequestParam(defaultValue = "0") int page,         // Pagination page number
            @RequestParam(defaultValue = "desc") String sort    // Sort order
    ) {
        return memeService.searchMemes(query, startDate, endDate, limit, page, sort);
    }


    @DeleteMapping("/delete/{memeId}")
    public ResponseEntity<?> deleteMeme(@PathVariable String memeId) throws Exception {
        return memeService.deleteMeme(memeId);
    }
}
