package com.example.Meme.Website.models;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Document(collection = "Tokens")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RefreshToken {

    @Id
    private String id;
    private String username;
    private String tokenHash;

}
