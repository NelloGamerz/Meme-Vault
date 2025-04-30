package com.example.Meme.Website.controller;

import com.example.Meme.Website.models.Comments;
import com.example.Meme.Website.services.memeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
public class CommentController {

    @Autowired
    private memeService memeService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/comment")
    public void handleComment(@Payload Comments comment) {
        Comments savedComment = memeService.addCommentsToMeme(comment);

        messagingTemplate.convertAndSend("/topic/meme/" + savedComment.getMemeId(), savedComment);
    }
}
