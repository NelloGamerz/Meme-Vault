package com.example.Meme.Website.repository;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.example.Meme.Website.models.userModel;

@Repository
public interface userRepository extends MongoRepository<userModel, String> {
    Optional<userModel> findByEmail(String email);
    Optional<userModel> findByUsername(String username);
    Optional<userModel> findByUserId(String userId);
    boolean existsByEmail(String email);
    boolean existsByUsername(String username);
}
