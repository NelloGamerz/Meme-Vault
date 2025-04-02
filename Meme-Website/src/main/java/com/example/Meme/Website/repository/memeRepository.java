package com.example.Meme.Website.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import com.example.Meme.Website.models.Meme;

@Repository
public interface memeRepository extends MongoRepository<Meme, String>{
    List<Meme> findByUploader(String uploader);
    List<Meme> findByCaption(String regex, String options);

    @Query("{ 'caption': { $regex: ?0, $options: 'i' } }") // Case-insensitive regex search
    List<Meme> findByCaptionRegex(String caption);
}
