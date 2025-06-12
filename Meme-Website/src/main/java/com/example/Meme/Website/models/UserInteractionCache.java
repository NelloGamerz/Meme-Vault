package com.example.Meme.Website.models;

import java.util.ArrayList;
import java.util.List;

import lombok.Data;

@Data
public class UserInteractionCache {
    private List<Interaction> interactions = new ArrayList<>();
}
