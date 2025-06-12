/**
 * A utility for caching localStorage values in memory to reduce frequent reads
 * which can impact performance.
 */

// Cache to store values from localStorage
const memoryCache: Record<string, unknown> = {};

// Track when values were last read from localStorage
const lastReadTime: Record<string, number> = {};

// Default cache expiration time (5 minutes)
const DEFAULT_CACHE_EXPIRATION = 5 * 60 * 1000;

/**
 * Gets a value from localStorage with memory caching
 * @param key The localStorage key
 * @param expirationMs Time in milliseconds before cache expires (default: 5 minutes)
 * @returns The parsed value from localStorage or cache
 */
export function getFromStorage<T>(key: string, expirationMs = DEFAULT_CACHE_EXPIRATION): T | null {
  const now = Date.now();
  
  // If we have a cached value that hasn't expired, return it
  if (
    memoryCache[key] !== undefined && 
    lastReadTime[key] && 
    now - lastReadTime[key] < expirationMs
  ) {
    return memoryCache[key] as T | null;
  }
  
  try {
    // Read from localStorage and update cache
    const item = localStorage.getItem(key);
    
    if (item === null) {
      memoryCache[key] = null;
      lastReadTime[key] = now;
      return null;
    }
    
    const value = JSON.parse(item) as T;
    memoryCache[key] = value;
    lastReadTime[key] = now;
    return value;
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error);
    return null;
  }
}

/**
 * Sets a value in both localStorage and memory cache
 * @param key The localStorage key
 * @param value The value to store
 */
export function setInStorage<T>(key: string, value: T): void {
  try {
    // Update localStorage
    localStorage.setItem(key, JSON.stringify(value));
    
    // Update memory cache
    memoryCache[key] = value;
    lastReadTime[key] = Date.now();
  } catch (error) {
    console.error(`Error setting ${key} in localStorage:`, error);
  }
}

/**
 * Removes a value from both localStorage and memory cache
 * @param key The localStorage key
 */
export function removeFromStorage(key: string): void {
  try {
    // Remove from localStorage
    localStorage.removeItem(key);
    
    // Remove from memory cache
    delete memoryCache[key];
    delete lastReadTime[key];
  } catch (error) {
    console.error(`Error removing ${key} from localStorage:`, error);
  }
}

/**
 * Gets the current user from localStorage with caching
 * @returns The user object or an empty object if not found
 */
export function getCurrentUser(): {
  userId: string;
  username: string;
  profilePicture?: string;
  email?: string;
  name?: string;
} {
  const user = getFromStorage<{
    userId: string;
    username: string;
    profilePicture?: string;
    email?: string;
    name?: string;
  }>('user');
  
  return user || {
    userId: "",
    username: "",
  };
}

/**
 * Updates the current user in localStorage and cache
 * @param userData The user data to update
 */
export function updateCurrentUser(userData: Partial<{
  userId: string;
  username: string;
  profilePicture?: string;
  email?: string;
  name?: string;
}>): void {
  const currentUser = getCurrentUser();
  setInStorage('user', { ...currentUser, ...userData });
}

/**
 * Gets liked meme IDs from localStorage with caching
 * @returns Array of liked meme IDs
 */
export function getLikedMemeIds(): string[] {
  return getFromStorage<string[]>('likedMemes') || [];
}

/**
 * Gets saved meme IDs from localStorage with caching
 * @returns Array of saved meme IDs
 */
export function getSavedMemeIds(): string[] {
  return getFromStorage<string[]>('savedMemes') || [];
}

/**
 * Updates liked meme IDs in localStorage and cache
 * @param memeIds Array of liked meme IDs
 */
export function updateLikedMemeIds(memeIds: string[]): void {
  setInStorage('likedMemes', memeIds);
}

/**
 * Updates saved meme IDs in localStorage and cache
 * @param memeIds Array of saved meme IDs
 */
export function updateSavedMemeIds(memeIds: string[]): void {
  setInStorage('savedMemes', memeIds);
}

/**
 * Invalidates a specific cache entry, forcing the next read to fetch from localStorage
 * @param key The localStorage key to invalidate
 */
export function invalidateCache(key: string): void {
  delete memoryCache[key];
  delete lastReadTime[key];
}

/**
 * Invalidates all cache entries, forcing the next reads to fetch from localStorage
 */
export function invalidateAllCache(): void {
  Object.keys(memoryCache).forEach(key => {
    delete memoryCache[key];
    delete lastReadTime[key];
  });
}