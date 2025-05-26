package com.example.Meme.Website.repository;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.example.Meme.Website.models.RefreshToken;

public interface RefreshTokenRepository extends MongoRepository<RefreshToken, String>{
    Optional<RefreshToken> findByUsername(String username);
}
