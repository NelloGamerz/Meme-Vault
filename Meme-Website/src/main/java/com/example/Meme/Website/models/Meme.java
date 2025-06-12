package com.example.Meme.Website.models;

import java.util.Date;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Document(collection = "memes")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Meme {
    @Id
    private String id;
    private String UserId;
    private String mediaUrl;
    private String mediaType;
    private String caption;
    private String uploader;
    private int likecount;
    private int saveCount;
    private Date memeCreated;
    private int commentsCount;
    @DBRef(lazy = false)
    private List<Comments> comments;
    private List<String> tags;
    private String profilePictureUrl;
}
