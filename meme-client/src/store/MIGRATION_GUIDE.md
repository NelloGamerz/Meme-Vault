# Store Migration Guide

This guide explains how to migrate from the monolithic `useMemeStore` to the new modular stores.

## Overview of New Stores

We've split the original `useMemeStore` into several specialized stores:

1. **useMemeContentStore**: Handles meme-related operations (fetching, uploading, liking, saving, commenting)
2. **useUserStore**: Manages user profile operations (fetching profiles, updating profile picture, username)
3. **useNotificationStore**: Handles notifications
4. **useWebSocketConnectionStore**: Manages WebSocket connection for real-time features
5. **useWebSocketStore**: (Existing) Provides access to the WebSocket service

## Benefits of the New Architecture

- **Better separation of concerns**: Each store focuses on a specific domain
- **Reduced re-renders**: Components only subscribe to the state they need
- **Improved performance**: More efficient state updates with immer
- **Better type safety**: More specific types for each store
- **Easier testing**: Smaller, more focused stores are easier to test

## How to Migrate

### 1. Update Imports

Replace:
```typescript
import { useMemeStore } from "../store/useMemeStore";
```

With the appropriate store(s) for your component:
```typescript
import { useMemeContentStore } from "../store/useMemeContentStore";
import { useUserStore } from "../store/useUserStore";
import { useNotificationStore } from "../store/useNotificationStore";
import { useWebSocketConnectionStore } from "../store/useWebSocketConnectionStore";
```

### 2. Use Selectors for Efficient Rendering

Instead of destructuring the entire store:
```typescript
const { memes, fetchMemes, isLoading } = useMemeStore();
```

Use selectors to only subscribe to what you need:
```typescript
// Subscribe to individual state properties
const memes = useMemeContentStore.use.memes();
const isLoading = useMemeContentStore.use.isLoading();

// Subscribe to actions
const fetchMemes = useMemeContentStore.use.fetchMemes();

// Or subscribe to multiple properties at once
const { memes, isLoading } = useMemeContentStore.use.state('memes', 'isLoading');
const { fetchMemes, searchMemes } = useMemeContentStore.use.actions('fetchMemes', 'searchMemes');
```

### 3. Store Mapping Reference

Here's a quick reference for where to find properties and methods from the old store:

#### Meme-Related
- `memes`, `userMemes`, `likedMemes`, `savedMemes`, `selectedMeme` → `useMemeContentStore`
- `fetchMemes`, `searchMemes`, `fetchMemeById`, `fetchUserMemes` → `useMemeContentStore`
- `fetchLikedMemes`, `fetchSavedMemes` → `useMemeContentStore`
- `toggleLike`, `toggleSave`, `addComment` → `useMemeContentStore`
- `uploadMeme`, `deleteMeme` → `useMemeContentStore`
- `setSelectedMeme`, `setSearchQuery` → `useMemeContentStore`
- `joinPostSession`, `leavePostSession` → `useMemeContentStore`
- `updateMemeStats`, `updateCommentInStore` → `useMemeContentStore`

#### User-Related
- `profilePictureUrl`, `userName`, `userCreated` → `useUserStore`
- `viewedProfilePictureUrl`, `viewedUserName` → `useUserStore`
- `loggedInUserProfile`, `isLoggedInUserProfileLoaded` → `useUserStore`
- `fetchUserProfile` → `useUserStore`
- `updateProfilePicture`, `updateUserName` → `useUserStore`

#### Social-Related
- `isFollowing`, `Followers`, `Following` → `useUserStore`
- `followersCount`, `followingCount` → `useUserStore`
- `handleFollowToggle` → `useUserStore`

#### Notification-Related
- `notifications` → `useNotificationStore`
- `getNotifications`, `addNotification` → `useNotificationStore`
- `markAsRead`, `clearAllNotifications` → `useNotificationStore`

#### WebSocket-Related
- `connectWebSocket`, `disconnectWebSocket` → `useWebSocketConnectionStore`
- `wsClient` → `useWebSocketStore.client`

### 4. Example Migration

#### Before:
```typescript
import { useMemeStore } from "../store/useMemeStore";

function MemeList() {
  const { memes, fetchMemes, isLoading, error } = useMemeStore();
  
  useEffect(() => {
    fetchMemes();
  }, [fetchMemes]);
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      {memes.map(meme => (
        <MemeCard key={meme.id} meme={meme} />
      ))}
    </div>
  );
}
```

#### After:
```typescript
import { useMemeContentStore } from "../store/useMemeContentStore";

function MemeList() {
  // Use selectors to only subscribe to what we need
  const memes = useMemeContentStore.use.memes();
  const isLoading = useMemeContentStore.use.isLoading();
  const error = useMemeContentStore.use.error();
  const fetchMemes = useMemeContentStore.use.fetchMemes();
  
  useEffect(() => {
    fetchMemes();
  }, [fetchMemes]);
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      {memes.map(meme => (
        <MemeCard key={meme.id} meme={meme} />
      ))}
    </div>
  );
}
```

## Handling WebSocket Connections

The WebSocket connection is now managed by the `useWebSocketConnectionStore`. To initialize the connection:

```typescript
import { useWebSocketConnectionStore } from "../store/useWebSocketConnectionStore";

// In your authentication flow
useWebSocketConnectionStore.getState().connectWebSocket();

// To disconnect
useWebSocketConnectionStore.getState().disconnectWebSocket();
```

## Accessing the WebSocket Client

To access the WebSocket client directly:

```typescript
import { useWebSocketStore } from "../hooks/useWebSockets";

function Component() {
  // Use the client property from the WebSocketStore
  const wsClient = useWebSocketStore(state => state.client);
  
  // ...
}
```

## Questions?

If you have any questions about the migration, please reach out to the team.