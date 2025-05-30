package com.example.Meme.Website.services;

import  java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.example.Meme.Website.models.UserPrincipal;
import com.example.Meme.Website.models.userModel;
import com.example.Meme.Website.repository.userRepository;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {
    @Autowired
    private userRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Optional<userModel> user = userRepository.findByUsername(username);
        if (user == null) {
            System.out.println("User Not Found");
            throw new UsernameNotFoundException("user not found");
        }
        
        return new UserPrincipal(user.orElseThrow(() -> new UsernameNotFoundException("User not found")));

    }
    
}
