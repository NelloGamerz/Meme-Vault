package com.example.Meme.Website.services;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class RedisService {

    @Autowired
    private RedisTemplate redisTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    public <T> T get(String key, Class<T> entityClass) {
        try {
            Object o = redisTemplate.opsForValue().get(key);
            ObjectMapper mapper = new ObjectMapper();
            return mapper.readValue(o.toString(), entityClass);
        } catch (Exception e) {
            log.error("Exception " + e);
            return null;
        }
    }

    public void set(String key, Object o, Long till) {
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            String jsonvalue = objectMapper.writeValueAsString(o);
            redisTemplate.opsForValue().set(key, jsonvalue, till, TimeUnit.SECONDS);
        } catch (Exception e) {
            log.error("Exception " + e);
        }
    }

    // ✅ Store any object in Redis as JSON
    public void set(String key, Object o, long time, TimeUnit unit) {
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            String jsonValue = objectMapper.writeValueAsString(o);
            redisTemplate.opsForValue().set(key, jsonValue, unit.toSeconds(time), TimeUnit.SECONDS);
        } catch (Exception e) {
            System.err.println("Exception while saving to Redis: " + e.getMessage());
        }
    }

    public <T> List<T> getList(String key, Class<T> clazz) {
        Object obj = redisTemplate.opsForValue().get(key);

        if (obj == null) {
            System.out.println("🚫 Redis key '" + key + "' not found.");
            return new ArrayList<>(); // Return empty list if key doesn't exist
        }

        if (!(obj instanceof String)) {
            System.out.println("❌ Expected JSON string but found: " + obj.getClass());
            return new ArrayList<>();
        }

        String json = (String) obj; // Cast Object to String

        try {
            // System.out.println("📢 Retrieved JSON from Redis: " + json);
            return objectMapper.readValue(json,
                    objectMapper.getTypeFactory().constructCollectionType(List.class, clazz));
        } catch (JsonProcessingException e) {
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    public void setToken(String keyPrefix, String username, String token, long expirySecond) {
        try {
            String key = key(keyPrefix, username);
            redisTemplate.opsForValue().set(key, token, expirySecond, TimeUnit.SECONDS);
        } catch (Exception e) {
            log.error("Error setting token in Redis for user '{}': {}", username, e.getMessage());
        }
    }

    public String getToken(String keyPrefix, String username) {
        try {
            String key = key(keyPrefix, username);
            Object token = redisTemplate.opsForValue().get(key);
            return token != null ? token.toString() : null;
        } catch (Exception e) {
            log.error("Error getting token from Redis for user '{}': {}", username, e.getMessage());
            return null;
        }
    }

    public void deleteToken(String keyPrefix, String username){
        try{
            String key = key(keyPrefix, username);
            redisTemplate.delete(key);
            log.info("Token deleted for user '{}'", username);
        }
        catch(Exception e){
            log.error("Error deleting token from Redis for user '{}': {}", username, e.getMessage());
        }
    }

    public boolean tokenExists(String keyPrefix, String username){
        try{
            String key = key(keyPrefix, username);
            return Boolean.TRUE.equals(redisTemplate.hasKey(key));
        }
        catch(Exception e){
            log.error("🔴 Error checking token in Redis: {}", e.getMessage());
            return false;
        }

    }

    public String key(String keyPrefix, String username){
        return keyPrefix + ":" + username;
    }
}
