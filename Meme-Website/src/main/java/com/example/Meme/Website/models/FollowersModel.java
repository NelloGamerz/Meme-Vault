package com.example.Meme.Website.models;

import org.springframework.data.annotation.Id;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FollowersModel {
    @Id
    private String id;
    private String userId;
    private String username;
    private String profilePictureUrl;
    private boolean isFollow;
}
