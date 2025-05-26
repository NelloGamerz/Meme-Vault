package com.example.Meme.Website.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.Meme.Website.models.RefreshToken;
import com.example.Meme.Website.repository.RefreshTokenRepository;

@Service
public class RefreshTokenService {

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;

    public void saveRefreshToken(String username, String rawToken) {
        refreshTokenRepository.save(new RefreshToken(null, username, passwordEncoder.encode(rawToken)));
    }

    public boolean isValid(String username, String rawToken) {
        return refreshTokenRepository.findByUsername(username)
            .map(stored -> passwordEncoder.matches(rawToken, stored.getTokenHash()))
            .orElse(false);
    }

    public void rotateToken(String username, String oldRawToken, String newRawToken) {
        refreshTokenRepository.findByUsername(username).ifPresent(stored -> {
            if (passwordEncoder.matches(oldRawToken, stored.getTokenHash())) {
                stored.setTokenHash(passwordEncoder.encode(newRawToken));
                refreshTokenRepository.save(stored);
            }
        });
    }

    public void deleteToken(String username, String rawToken) {
        refreshTokenRepository.findByUsername(username).ifPresent(stored -> {
            if (passwordEncoder.matches(rawToken, stored.getTokenHash())) {
                refreshTokenRepository.delete(stored);
            }
        });
    }
}

