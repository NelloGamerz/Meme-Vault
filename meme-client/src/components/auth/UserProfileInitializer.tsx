import { useEffect, useRef } from 'react';
import { useUserStore } from '../../store/useUserStore.ts';

/**
 * UserProfileInitializer - A component that fetches the user profile once on app initialization
 * This component doesn't render anything visible, it just manages the user profile data
 */
export const UserProfileInitializer: React.FC = () => {
  // Use a ref to track if we've already initialized
  const isInitializedRef = useRef(false);
  
  // Get the necessary functions from the store
  const fetchUserProfile = useUserStore.use.fetchUserProfile();
  const isLoggedInUserProfileLoaded = useUserStore.use.isLoggedInUserProfileLoaded();
  
  // Initialize user profile only once when the app loads
  useEffect(() => {
    const initializeUserProfile = async () => {
      try {
        // Check if we're on a profile page
        const path = window.location.pathname;
        const isProfilePage = path.startsWith('/profile/');
        
        // IMPORTANT: If we're on ANY profile page, skip initialization completely
        // Let the ProfilePage component handle all profile loading
        if (isProfilePage) {
          console.log("UserProfileInitializer: On a profile page, skipping ALL automatic profile initialization");
          return;
        }
        
        // Only initialize on non-profile pages (home, explore, etc.)
        console.log("UserProfileInitializer: On a non-profile page, proceeding with initialization");
        
        // Try to get user from localStorage
        const userStr = localStorage.getItem("user");
        if (!userStr) return;
        
        const user = JSON.parse(userStr);
        if (!user || !user.username) return;
        
        // Get the profile cache from the store
        const profileCache = useUserStore.getState().profileCache;
        const cachedProfile = profileCache[user.username];
        const isCacheValid = cachedProfile && 
                            (Date.now() - cachedProfile.timestamp < 5 * 60 * 1000);
        
        // Only load if not already loaded and no valid cache
        if (!isLoggedInUserProfileLoaded && !isCacheValid) {
          console.log("UserProfileInitializer: Initializing user profile for:", user.username);
          await fetchUserProfile(user.username);
        } else {
          console.log("UserProfileInitializer: User profile already loaded or cached, skipping initialization");
        }
      } catch (error) {
        console.error("UserProfileInitializer: Error initializing user profile:", error);
      }
    };
    
    // Only initialize once
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      initializeUserProfile();
    }
  }, [fetchUserProfile, isLoggedInUserProfileLoaded]);
  
  // This component doesn't render anything
  return null;
};