package com.example.Meme.Website.config;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.cloudinary.Cloudinary;

@Configuration
public class CloudinaryConfig {

    @Value("${cloudinary.cloudname}")
    private String cloudName; 

    @Value("${cloudinary.api-key}")
    private String apiKey;

    @Value("${cloudinary.api-secret}")
    private String apiSecret; 
    
    @Bean
    public Cloudinary cloudinary(){
        Map<String, String> config = new HashMap<>();
        config.put("cloud_name", cloudName);  // Replace with Cloudinary cloud name
        config.put("api_key", apiKey);        // Replace with Cloudinary API key
        config.put("api_secret", apiSecret); 
        return new Cloudinary(config);
    }
}
