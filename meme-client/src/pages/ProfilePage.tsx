// import type React from "react"
// import { useState, useRef, useEffect } from "react"
// import { useMemeContentStore } from "../store/useMemeContentStore"
// import { useUserStore } from "../store/useUserStore"
// import { MemeCard } from "../components/mainPage/MemeCard"
// import { toast } from "react-hot-toast"
// import {
//   Upload,
//   Heart,
//   Bookmark,
//   Edit2,
//   // Home,
//   CameraIcon,
//   X,
//   ImagePlus,
//   User,
//   UserPlus,
//   UserCheck,
//   Search,
// } from "lucide-react"
// import { useNavigate, useParams } from "react-router-dom"
// import { mapApiMemeToMeme } from "../utils/memeMappers"
// import { cn } from "../hooks/utils"

// type TabType = "uploaded" | "liked" | "saved"
// type MediaType = "image" | "video" | null

// const validateProfilePicture = (file: File): { valid: boolean; message: string } => {
//   if (file.size > 1024 * 1024) {
//     return { valid: false, message: "Profile picture must be less than 1MB" }
//   }

//   if (!file.type.startsWith("image/")) {
//     return { valid: false, message: "File must be an image" }
//   }

//   return { valid: true, message: "" }
// }

// const validateMeme = async (file: File): Promise<{ valid: boolean; message: string }> => {
//   if (file.size > 5 * 1024 * 1024) {
//     return { valid: false, message: "Meme file must be less than 5MB" }
//   }

//   if (file.type.startsWith("image/")) {
//     return new Promise((resolve) => {
//       const img = new Image()
//       img.onload = () => {
//         if (img.width < 200 || img.height < 200) {
//           resolve({ valid: false, message: "Image dimensions must be at least 200x200 pixels" })
//         } else {
//           resolve({ valid: true, message: "" })
//         }
//       }
//       img.onerror = () => {
//         resolve({ valid: false, message: "Invalid image file" })
//       }
//       img.src = URL.createObjectURL(file)
//     })
//   }

//   if (file.type.startsWith("video/")) {
//     return { valid: true, message: "" }
//   }

//   return { valid: false, message: "Unsupported file format" }
// }

// export const ProfilePage: React.FC = () => {
//   const navigate = useNavigate()
//   // Get meme-related state and actions from useMemeContentStore
//   const memeList = useMemeContentStore.use.memeList();
//   const likedMemes = useMemeContentStore.use.likedMemes();
//   const savedMemes = useMemeContentStore.use.savedMemes();
//   const isLoading = useMemeContentStore.use.isLoading();
//   const uploadMeme = useMemeContentStore.use.uploadMeme();
//   const uploadProgress = useMemeContentStore.use.uploadProgress();
  
//   // Get user-related state and actions from useUserStore
//   const updateProfilePicture = useUserStore.use.updateProfilePicture();
//   const fetchUserProfile = useUserStore.use.fetchUserProfile();
//   const profilePictureUrl = useUserStore.use.profilePictureUrl();
//   const userName = useUserStore.use.userName();
//   const viewedProfilePictureUrl = useUserStore.use.viewedProfilePictureUrl();
//   const viewedUserName = useUserStore.use.viewedUserName();
//   const updateUserName = useUserStore.use.updateUserName();
//   const followersCount = useUserStore.use.followersCount();
//   const followingCount = useUserStore.use.followingCount();
//   const Followers = useUserStore.use.Followers();
//   const Following = useUserStore.use.Following();
//   const handleFollowToggle = useUserStore.use.handleFollowToggle();

//   const [activeTab, setActiveTab] = useState<TabType>("uploaded")
//   const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
//   const [previewUrl, setPreviewUrl] = useState<string | null>(null)
//   const [profilePreviewUrl, setProfilePreviewUrl] = useState<string | null>(null)
//   const fileInputRef = useRef<HTMLInputElement>(null)
//   const profilePictureInputRef = useRef<HTMLInputElement>(null)
//   const [selectedFile, setSelectedFile] = useState<File | null>(null)
//   const [selectedProfilePicture, setSelectedProfilePicture] = useState<File | null>(null)
//   const [isProfilePictureModalOpen, setIsProfilePictureModalOpen] = useState(false)
//   const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false)
//   const [title, setTitle] = useState("")
//   const [activeOptionsId, setActiveOptionsId] = useState<string | null>(null)
//   const [mediaType, setMediaType] = useState<MediaType>(null)

//   const [isTabChanging, setIsTabChanging] = useState(false)
//   const [animationDirection, setAnimationDirection] = useState<"left" | "right">("right")
//   const [searchTerm, setSearchTerm] = useState("")

//   const { username } = useParams<{ username: string }>()
//   const loggedInUser = JSON.parse(localStorage.getItem("user") || "{}")
//   // Determine if this is the user's own profile
//   const isOwnProfile = loggedInUser.username === username

//   // Determine if the current user is following the viewed profile
//   // Example: If Pooja (current user) is viewing Karan's profile, this checks if Pooja follows Karan
//   const isUserFollowing = () => {
//     // If it's the user's own profile, they can't follow themselves
//     if (!username || isOwnProfile || !Array.isArray(Followers)) return false;
    
//     console.log("ProfilePage: Checking if current user follows viewed profile");
//     console.log("ProfilePage: Followers list of viewed profile:", Followers);
//     console.log("ProfilePage: Looking for loggedInUser.userId:", loggedInUser.userId);
    
//     // When viewing someone else's profile (e.g., Karan), we need to check if the current user (Pooja)
//     // is in the viewed profile's followers list (Karan's followers)
//     const result = Followers.some((follower) => follower.userId === loggedInUser.userId);
//     console.log("ProfilePage: isUserFollowing result:", result);
//     return result;
//   }
  
//   // Determine if the viewed profile is following the current user
//   // Example: If Karan (current user) is viewing Pooja's profile, this checks if Pooja follows Karan
//   const isViewedProfileFollowingUser = () => {
//     // If it's the user's own profile, this check doesn't apply
//     if (!username || isOwnProfile || !Array.isArray(Following)) return false;
    
//     console.log("ProfilePage: Checking if viewed profile follows current user");
//     console.log("ProfilePage: Following list of viewed profile:", Following);
//     console.log("ProfilePage: Looking for loggedInUser.userId:", loggedInUser.userId);
    
//     // When viewing someone else's profile (e.g., Pooja), we need to check if the current user (Karan)
//     // is in the viewed profile's following list (users that Pooja follows)
//     const result = Following.some((following) => following.userId === loggedInUser.userId);
//     console.log("ProfilePage: isViewedProfileFollowingUser result:", result);
//     return result;
//   }

//   const [editName, setEditName] = useState("")
//   const [followersLoading, setFollowersLoading] = useState(false)
//   const [isFollowersModalOpen, setIsFollowersModalOpen] = useState(false)
//   const [followingLoading, setFollowingLoading] = useState(false)
//   const [isFollowingModalOpen, setIsFollowingModalOpen] = useState(false)

//   // Get the loggedInUserProfile from the global state
//   const loggedInUserProfile = useUserStore.use.loggedInUserProfile();
//   const isLoggedInUserProfileLoaded = useUserStore.use.isLoggedInUserProfileLoaded();
  
//   // Reference to track if we've initiated profile loading
//   const profileLoadingInitiatedRef = useRef(false);
  
//   // State to track the currently displayed profile username
//   const [displayedUsername, setDisplayedUsername] = useState<string | null>(null);
  
//   // Get the profile cache from the store
//   const profileCache = useUserStore.use.profileCache();
  
//   // Fetch the profile data when the component mounts or when the username changes
//   useEffect(() => {
//     if (!username) return;
    
//     // Always ensure we're displaying the correct profile for the URL
//     // This is critical for page refreshes
//     if (displayedUsername !== username) {
//       console.log(`ProfilePage: URL username (${username}) doesn't match displayed username (${displayedUsername}), forcing profile update`);
      
//       // Force the store to display the profile for the URL username
//       // This prevents the logged-in user profile from showing after refresh
//       if (!isOwnProfile) {
//         useUserStore.setState({
//           viewedUserName: username, // Set to URL username to prevent flashing
//         });
//       }
      
//       setDisplayedUsername(username);
//       profileLoadingInitiatedRef.current = false; // Reset to allow loading
//     }
    
//     // Check if we already have this profile in the cache
//     const cachedProfile = profileCache[username];
//     const isCacheValid = cachedProfile && 
//                         (Date.now() - cachedProfile.timestamp < 5 * 60 * 1000);
    
//     // If we're already loading, don't fetch again
//     if (profileLoadingInitiatedRef.current) {
//       console.log("ProfilePage: Profile loading already initiated");
//       return;
//     }
    
//     console.log("ProfilePage: Checking profile for username:", username);
//     console.log("ProfilePage: isOwnProfile:", isOwnProfile);
//     console.log("ProfilePage: Cache status:", isCacheValid ? "Valid cache" : "No valid cache");
    
//     // Set the flag to prevent duplicate fetches
//     profileLoadingInitiatedRef.current = true;
    
//     // If we have a valid cache or it's the user's own profile and already loaded, we don't need to fetch
//     if (isCacheValid || (isOwnProfile && isLoggedInUserProfileLoaded && loggedInUserProfile)) {
//       console.log("ProfilePage: Using cached profile");
      
//       // If it's the user's own profile and we have the loggedInUserProfile, use that data
//       if (isOwnProfile && isLoggedInUserProfileLoaded && loggedInUserProfile) {
//         console.log("ProfilePage: Using logged-in user profile data");
        
//         // Map the memes to ensure they have the correct structure
//         const mapMemeData = (memeArray) => {
//           return (memeArray || []).map(meme => {
//             // If the meme already has a url property, use it
//             if (meme.url) {
//               return meme;
//             }
            
//             // If the meme has a mediaUrl property but no url, map it to url
//             if (meme.mediaUrl) {
//               return {
//                 ...meme,
//                 url: meme.mediaUrl
//               };
//             }
            
//             // If neither url nor mediaUrl exists, return the meme as is
//             return meme;
//           });
//         };
        
//         const mappedMemes = mapMemeData(loggedInUserProfile.memeList);
//         const mappedLikedMemes = mapMemeData(loggedInUserProfile.likedMemes);
//         const mappedSavedMemes = mapMemeData(loggedInUserProfile.savedMemes);
        
//         console.log("ProfilePage: Mapped memes from logged-in profile:", mappedMemes);
//         console.log("ProfilePage: Mapped liked memes from logged-in profile:", mappedLikedMemes);
//         console.log("ProfilePage: Mapped saved memes from logged-in profile:", mappedSavedMemes);
        
//         useMemeContentStore.setState({
//           memeList: mappedMemes,
//           likedMemes: mappedLikedMemes,
//           savedMemes: mappedSavedMemes,
//         });
//       }
      
//       // Even with cache, ensure the correct profile is displayed
//       if (cachedProfile) {
//         console.log("ProfilePage: Applying cached profile data to ensure correct display");
//         if (isOwnProfile) {
//           // Update user store
//           useUserStore.setState({
//             userName: cachedProfile.profile.username,
//             profilePictureUrl: cachedProfile.profile.profilePictureUrl,
//             viewedUserName: cachedProfile.profile.username,
//             viewedProfilePictureUrl: cachedProfile.profile.profilePictureUrl,
//           });
          
//           // Update meme content store
//           // Map the memes to ensure they have the correct structure
//           const mapMemeData = (memeArray) => {
//             return (memeArray || []).map(meme => {
//               // If the meme already has a url property, use it
//               if (meme.url) {
//                 return meme;
//               }
              
//               // If the meme has a mediaUrl property but no url, map it to url
//               if (meme.mediaUrl) {
//                 return {
//                   ...meme,
//                   url: meme.mediaUrl
//                 };
//               }
              
//               // If neither url nor mediaUrl exists, return the meme as is
//               return meme;
//             });
//           };
          
//           const mappedMemes = mapMemeData(cachedProfile.profile.memeList);
//           const mappedLikedMemes = mapMemeData(cachedProfile.profile.likedMemes);
//           const mappedSavedMemes = mapMemeData(cachedProfile.profile.savedMemes);
          
//           console.log("ProfilePage: Mapped memes for own profile:", mappedMemes);
//           console.log("ProfilePage: Mapped liked memes for own profile:", mappedLikedMemes);
//           console.log("ProfilePage: Mapped saved memes for own profile:", mappedSavedMemes);
          
//           useMemeContentStore.setState({
//             memeList: mappedMemes,
//             likedMemes: mappedLikedMemes,
//             savedMemes: mappedSavedMemes,
//           });
//         } else {
//           useUserStore.setState({
//             viewedUserName: cachedProfile.profile.username,
//             viewedProfilePictureUrl: cachedProfile.profile.profilePictureUrl,
//             Followers: cachedProfile.profile.followers,
//             Following: cachedProfile.profile.following,
//             followersCount: cachedProfile.profile.followersCount,
//             followingCount: cachedProfile.profile.followingCount,
//           });
          
//           // Set the memes in the MemeContentStore
//           // Map the memes to ensure they have the correct structure
//           const mapMemeData = (memeArray) => {
//             return (memeArray || []).map(meme => {
//               // If the meme already has a url property, use it
//               if (meme.url) {
//                 return meme;
//               }
              
//               // If the meme has a mediaUrl property but no url, map it to url
//               if (meme.mediaUrl) {
//                 return {
//                   ...meme,
//                   url: meme.mediaUrl
//                 };
//               }
              
//               // If neither url nor mediaUrl exists, return the meme as is
//               return meme;
//             });
//           };
          
//           const mappedMemes = mapMemeData(cachedProfile.profile.memeList);
//           const mappedLikedMemes = mapMemeData(cachedProfile.profile.likedMemes);
//           const mappedSavedMemes = mapMemeData(cachedProfile.profile.savedMemes);
          
//           console.log("ProfilePage: Mapped memes for viewed profile:", mappedMemes);
//           console.log("ProfilePage: Mapped liked memes for viewed profile:", mappedLikedMemes);
//           console.log("ProfilePage: Mapped saved memes for viewed profile:", mappedSavedMemes);
          
//           useMemeContentStore.setState({
//             memeList: mappedMemes,
//             likedMemes: mappedLikedMemes,
//             savedMemes: mappedSavedMemes,
//           });
//         }
//       }
//     } else {
//       // This will fetch the profile data for the username in the URL
//       console.log("ProfilePage: Fetching profile from API");
//       fetchUserProfile(username);
//     }
    
//     // Reset the flag when the component unmounts or username changes
//     return () => {
//       profileLoadingInitiatedRef.current = false;
//     };
//   }, [fetchUserProfile, username, isOwnProfile, isLoggedInUserProfileLoaded, loggedInUserProfile, profileCache, displayedUsername])
  
//   // Debug effect to log followers and following data when they change
//   useEffect(() => {
//     console.log("ProfilePage: Followers data updated:", Followers);
//     console.log("ProfilePage: Following data updated:", Following);
    
//     // Check if the current user is following the viewed profile
//     if (Array.isArray(Followers) && Followers.length > 0) {
//       const isCurrentUserFollowing = Followers.some(follower => follower.userId === loggedInUser.userId);
//       console.log("ProfilePage: Is current user following viewed profile:", isCurrentUserFollowing);
//     }
    
//     // Check if the viewed profile is following the current user
//     if (Array.isArray(Following) && Following.length > 0) {
//       const isViewedProfileFollowing = Following.some(following => following.userId === loggedInUser.userId);
//       console.log("ProfilePage: Is viewed profile following current user:", isViewedProfileFollowing);
//     }
    
//     // Log the follow button state that will be shown
//     const followButtonState = isUserFollowing() 
//       ? "Following" 
//       : isViewedProfileFollowingUser() 
//         ? "Follow Back" 
//         : "Follow";
//     console.log("ProfilePage: Follow button will show:", followButtonState);
    
//   }, [Followers, Following, loggedInUser.userId])

//   const tabs = [
//     { id: "uploaded" as TabType, label: "Uploaded", icon: Upload },
//     ...(isOwnProfile
//       ? [
//           { id: "liked" as TabType, label: "Liked", icon: Heart },
//           { id: "saved" as TabType, label: "Saved", icon: Bookmark },
//         ]
//       : []),
//   ]

//   useEffect(() => {
//     if (!isOwnProfile && (activeTab === "liked" || activeTab === "saved")) {
//       setActiveTab("uploaded")
//     }
//   }, [isOwnProfile, activeTab])

//   // Debug the meme lists
//   console.log("ProfilePage: memeList:", memeList);
//   console.log("ProfilePage: likedMemes:", likedMemes);
//   console.log("ProfilePage: savedMemes:", savedMemes);
  
//   // Get the user store's liked and saved memes
//   const userStoreLikedMemes = useUserStore.use.likedMemes();
//   const userStoreSavedMemes = useUserStore.use.savedMemes();
  
//   // Sync user store memes with meme content store
//   useEffect(() => {
//     if (isOwnProfile && userStoreLikedMemes && userStoreLikedMemes.length > 0 && 
//         (!likedMemes || likedMemes.length === 0)) {
//       console.log("ProfilePage: Syncing liked memes from user store to meme content store");
//       useMemeContentStore.setState({
//         likedMemes: userStoreLikedMemes
//       });
//     }
//   }, [isOwnProfile, userStoreLikedMemes, likedMemes]);
  
//   useEffect(() => {
//     if (isOwnProfile && userStoreSavedMemes && userStoreSavedMemes.length > 0 && 
//         (!savedMemes || savedMemes.length === 0)) {
//       console.log("ProfilePage: Syncing saved memes from user store to meme content store");
//       useMemeContentStore.setState({
//         savedMemes: userStoreSavedMemes
//       });
//     }
//   }, [isOwnProfile, userStoreSavedMemes, savedMemes]);
  
//   const currentMemes = activeTab === "uploaded" ? (memeList || []) : activeTab === "liked" ? (likedMemes || []) : (savedMemes || [])

//   const handleTabChange = (tab: TabType) => {
//     if (tab === activeTab) return

//     const currentIndex = tabs.findIndex((t) => t.id === activeTab)
//     const newIndex = tabs.findIndex((t) => t.id === tab)
//     const direction = newIndex > currentIndex ? "right" : "left"

//     setAnimationDirection(direction)
//     setIsTabChanging(true)

//     setTimeout(() => {
//       setActiveTab(tab)
//       setTimeout(() => {
//         setIsTabChanging(false)
//       }, 50)
//     }, 200)
//   }

//   const handleUpload = async () => {
//     if (!selectedFile || !title.trim()) return

//     try {
//       // Always use the logged-in user's profile picture for uploads
//       await uploadMeme(selectedFile, title, profilePictureUrl, loggedInUser.userId)
      
//       // Refresh the profile data to show the new meme
//       if (isOwnProfile) {
//         console.log("ProfilePage: Refreshing profile after meme upload");
//         fetchUserProfile(username || "")
//       }
      
//       setIsUploadModalOpen(false)
//       resetUpload()
//       toast.success("Meme uploaded successfully!")
//     } catch (error) {
//       console.error("Upload failed:", error)
//       toast.error("Failed to upload meme. Please try again.")
//     }
//   }

//   const handleProfilePictureSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
//     const file = event.target.files?.[0]
//     if (file) {
//       const validation = validateProfilePicture(file)
//       if (!validation.valid) {
//         toast.error(validation.message)
//         return
//       }

//       setSelectedProfilePicture(file)
//       setProfilePreviewUrl(URL.createObjectURL(file))
//     }
//   }

//   const handleProfilePictureUpload = async () => {
//     if (!selectedProfilePicture) return

//     try {
//       await updateProfilePicture(selectedProfilePicture, loggedInUser.userId)
      
//       // Always fetch the profile after updating the profile picture
//       // This is necessary to update the cached profile in the global state
//       console.log("ProfilePage: Refreshing profile after profile picture update");
//       fetchUserProfile(username || "")
      
//       setProfilePreviewUrl(null)
//       setSelectedProfilePicture(null)
//       setIsProfilePictureModalOpen(false)
//       toast.success("Profile picture updated successfully!")
//     } catch (error) {
//       console.error("Profile picture update failed:", error)
//       toast.error("Failed to update profile picture. Please try again.")
//     }
//   }

//   const handleUpdateProfile = async () => {
//     if (!editName.trim()) return
//     try {
//       await updateUserName(loggedInUser.userId, editName)
      
//       // Always fetch the profile after updating the username
//       // This is necessary to update the cached profile in the global state
//       console.log("ProfilePage: Refreshing profile after username update");
//       fetchUserProfile(username || "")
      
//       setIsEditProfileModalOpen(false)
//       toast.success("Profile updated successfully!")
//     } catch (error) {
//       console.error("Profile update failed:", error)
//       toast.error(error instanceof Error ? error.message : "Failed to update profile. Please try again.")
//     }
//   }

//   const openFollowersModal = () => {
//     setFollowersLoading(true)
//     setIsFollowersModalOpen(true)
//     setSearchTerm("")

//     try {
//       if (Followers.length === 0) {
//         console.warn("No followers data available")
//       }
//     } catch (error) {
//       console.error("Error processing followers data:", error)
//     } finally {
//       setFollowersLoading(false)
//     }
//   }

//   const openFollowingModal = async () => {
//     setFollowingLoading(true)
//     setIsFollowingModalOpen(true)
//     setSearchTerm("")
//     try {
//       if (Following.length === 0) {
//         console.warn("No following data available")
//       }
//     } catch (error) {
//       console.error("Error fetching following:", error)
//     } finally {
//       setFollowingLoading(false)
//     }
//   }

//   const resetUpload = () => {
//     setSelectedFile(null)
//     setPreviewUrl(null)
//     setMediaType(null)
//     if (fileInputRef.current) fileInputRef.current.value = ""
//   }

//   const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
//     const file = event.target.files?.[0]
//     if (!file) return

//     try {
//       if (file.type.startsWith("image/")) {
//         const validation = await validateMeme(file)
//         if (!validation.valid) {
//           toast.error(validation.message)
//           return
//         }

//         setMediaType("image")
//         setSelectedFile(file)
//         setPreviewUrl(URL.createObjectURL(file))
//       }
//       else if (file.type.startsWith("video/")) {
//         const validation = await validateMeme(file)
//         if (!validation.valid) {
//           toast.error(validation.message)
//           return
//         }

//         setMediaType("video")
//         setSelectedFile(file)
//         setPreviewUrl(URL.createObjectURL(file))
//       }
//       else {
//         toast.error("Please select an image or video file")
//       }
//     } catch (error) {
//       console.error("File validation error:", error)
//       toast.error("Error validating file. Please try again.")
//     }
//   }

//   const resetProfilePictureUpload = () => {
//     setSelectedProfilePicture(null)
//     setProfilePreviewUrl(null)
//     if (profilePictureInputRef.current) {
//       profilePictureInputRef.current.value = ""
//     }
//   }

//   const getContentAnimationClasses = () => {
//     if (isTabChanging) {
//       return animationDirection === "right" ? "opacity-0 transform translate-x-8" : "opacity-0 transform -translate-x-8"
//     }
//     return "opacity-100 transform translate-x-0"
//   }

//   const filteredFollowers = Followers.filter((follower) => follower.username.includes(searchTerm.toLowerCase()))

//   const filteredFollowing = Following.filter((follow) => follow.username.includes(searchTerm.toLowerCase()))

//   const navigateToProfile = (userId: string) => {
//     navigate(`/profile/${userId}`)
//     setIsFollowersModalOpen(false)
//     setIsFollowingModalOpen(false)
//   }

//   const handleFollow = async () => {
//     if (!username || isOwnProfile) return

//     const isFollowing = isUserFollowing()
//     const isBeingFollowed = isViewedProfileFollowingUser()
    
//     console.log("ProfilePage: handleFollow - Current user:", loggedInUser.username);
//     console.log("ProfilePage: handleFollow - Viewed profile username:", username);
//     console.log("ProfilePage: handleFollow - isFollowing:", isFollowing);
//     console.log("ProfilePage: handleFollow - isBeingFollowed:", isBeingFollowed);
    
//     setFollowersLoading(true)

//     try {
//       // Use the handleFollowToggle function from useMemeStore
//       // This will handle the WebSocket connection internally
//       await handleFollowToggle(isFollowing)
      
//       // Don't refresh the profile data - rely on WebSocket updates and optimistic UI updates
//       console.log("ProfilePage: Relying on optimistic UI updates for follow/unfollow");
      
//       // Show a toast notification
//       if (isFollowing) {
//         toast.success('Unfollowed user');
//       } else if (isBeingFollowed) {
//         toast.success('Followed back');
//       } else {
//         toast.success('Following user');
//       }
//     } catch (error) {
//       console.error("Error toggling follow status:", error)
//       toast.error('Failed to update follow status');
//     } finally {
//       setFollowersLoading(false)
//     }
//   }

//   console.log("ProfilePage: Rendering with isOwnProfile:", isOwnProfile);
//   console.log("ProfilePage: viewedUserName:", viewedUserName);
//   console.log("ProfilePage: userName:", userName);
  
//   // Determine if we have the correct profile data loaded
//   const isCorrectProfileLoaded = isOwnProfile 
//     ? !!userName 
//     : viewedUserName === username;
  
//   // Get loading state from the store
//   const isStoreLoading = isLoading; // Using the isLoading state from useMemeContentStore
  
//   // Only show full-page loading on initial load when we have no data
//   const showFullPageLoading = isStoreLoading && !isCorrectProfileLoaded;
  
//   // If we're still loading and don't have the correct profile data, show a minimal loading indicator
//   if (showFullPageLoading) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
//       </div>
//     );
//   }
  
//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* Header */}
//       <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white relative overflow-hidden">
//         <div className="absolute inset-0 bg-black opacity-10"></div>
//         <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12 md:py-16 relative">
//           <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
//             <div className="flex flex-col sm:flex-row items-center sm:items-start md:items-center gap-4 sm:gap-8">
//               <div className="relative group">
//                 <div className="w-24 h-24 sm:w-32 sm:h-32 bg-white rounded-full flex items-center justify-center shadow-xl overflow-hidden">
//                   {isOwnProfile ? (
//                     // Show logged-in user's profile picture when viewing own profile
//                     profilePictureUrl ? (
//                       <img
//                         src={profilePictureUrl || "/placeholder.svg"}
//                         alt={userName}
//                         className="w-full h-full object-cover"
//                       />
//                     ) : (
//                       <span className="text-3xl sm:text-5xl font-bold text-blue-600">
//                         {userName?.[0]?.toUpperCase() || "U"}
//                       </span>
//                     )
//                   ) : (
//                     // Show viewed user's profile picture when viewing other profiles
//                     viewedProfilePictureUrl ? (
//                       <img
//                         src={viewedProfilePictureUrl || "/placeholder.svg"}
//                         alt={viewedUserName}
//                         className="w-full h-full object-cover"
//                       />
//                     ) : (
//                       <span className="text-3xl sm:text-5xl font-bold text-blue-600">
//                         {viewedUserName?.[0]?.toUpperCase() || "U"}
//                       </span>
//                     )
//                   )}
//                 </div>
//                 {isOwnProfile && (
//                   <button
//                     onClick={() => setIsProfilePictureModalOpen(true)}
//                     className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
//                   >
//                     <Edit2 className="w-4 h-4" />
//                   </button>
//                 )}
//               </div>
//               <div className="text-center sm:text-left">
//                 <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
//                   {isOwnProfile ? (userName || "User") : (viewedUserName || "User")}
//                 </h2>
//                 <div className="flex items-center justify-center sm:justify-start space-x-4 sm:space-x-6 mt-3 sm:mt-4">
//                   <div className="text-center">
//                     <span className="block text-xl sm:text-2xl font-bold">{memeList?.length || 0}</span>
//                     <span className="text-blue-100 text-sm">Uploads</span>
//                   </div>
//                   <div
//                     className="text-center cursor-pointer hover:bg-white/10 px-2 py-1 rounded-lg transition-colors"
//                     onClick={openFollowersModal}
//                   >
//                     <span className="block text-xl sm:text-2xl font-bold">{followersCount}</span>
//                     <span className="text-blue-100 text-sm">Followers</span>
//                   </div>
//                   <div
//                     className="text-center cursor-pointer hover:bg-white/10 px-2 py-1 rounded-lg transition-colors"
//                     onClick={openFollowingModal}
//                   >
//                     <span className="block text-xl sm:text-2xl font-bold">{followingCount}</span>
//                     <span className="text-blue-100 text-sm">Following</span>
//                   </div>
//                 </div>
//               </div>
//             </div>
//             <div className="flex flex-col sm:flex-row gap-2">
//               {isOwnProfile ? (
//                 <button
//                   onClick={() => {
//                     setEditName(userName || "")
//                     setIsEditProfileModalOpen(true)
//                   }}
//                   className="bg-white/10 backdrop-blur-sm text-white py-2 px-4 rounded-lg flex items-center justify-center space-x-2 hover:bg-white/20 transition-colors border border-white/20 w-full sm:w-auto"
//                 >
//                   <User className="w-5 h-5" />
//                   <span>Edit Profile</span>
//                 </button>
//               ) : (
//                 <button
//                   onClick={handleFollow}
//                   disabled={followersLoading}
//                   className={`${isUserFollowing() ? "bg-blue-700" : "bg-white/10"} backdrop-blur-sm text-white py-2 px-4 rounded-lg flex items-center justify-center space-x-2 hover:bg-blue-700 transition-colors border border-white/20 w-full sm:w-auto ${followersLoading ? "opacity-70 cursor-not-allowed" : ""}`}
//                 >
//                   {(() => {
//                     // Calculate these values once to ensure consistency
//                     const isFollowing = isUserFollowing();
//                     const isBeingFollowed = isViewedProfileFollowingUser();
                    
//                     console.log("ProfilePage: Render button - isFollowing:", isFollowing);
//                     console.log("ProfilePage: Render button - isBeingFollowed:", isBeingFollowed);
                    
//                     if (followersLoading) {
//                       return <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>;
//                     } else if (isFollowing) {
//                       return (
//                         <>
//                           <UserCheck className="w-5 h-5" />
//                           <span>Following</span>
//                         </>
//                       );
//                     } else if (isBeingFollowed) {
//                       return (
//                         <>
//                           <UserPlus className="w-5 h-5" />
//                           <span>Follow Back</span>
//                         </>
//                       );
//                     } else {
//                       return (
//                         <>
//                           <UserPlus className="w-5 h-5" />
//                           <span>Follow</span>
//                         </>
//                       );
//                     }
//                   })()}
//                 </button>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Tabs */}
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
//         <div className="rounded-xl shadow-md backdrop-blur-lg bg-white/80">
//           <nav className="flex min-w-full px-4 sm:px-6" aria-label="Tabs">
//             {tabs.map(({ id, label, icon: Icon }) => (
//               <button
//                 key={id}
//                 onClick={() => handleTabChange(id)}
//                 className={cn(
//                   "py-4 sm:py-6 px-3 sm:px-6 border-b-2 font-medium text-sm whitespace-nowrap flex items-center space-x-1.5 transition-all duration-300 flex-1 sm:flex-none justify-center",
//                   activeTab === id
//                     ? "border-blue-600 text-blue-600 scale-105"
//                     : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300",
//                 )}
//               >
//                 <Icon className={cn("w-4 h-4 transition-transform duration-300", activeTab === id && "scale-110")} />
//                 <span>{label}</span>
//               </button>
//             ))}
//           </nav>
//         </div>

//         {/* Content */}
//         <div className="mt-6 sm:mt-8">
//           <div className={cn("transition-all duration-300 ease-in-out", getContentAnimationClasses())}>
//             {isLoading ? (
//               <div className="flex items-center justify-center py-12">
//                 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
//               </div>
//             ) : (
//               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
//                 {currentMemes.map((meme, index) => (
//                   <div
//                     key={meme.id}
//                     className="transition-all duration-300 ease-in-out"
//                     style={{
//                       animationDelay: `${index * 50}ms`,
//                       opacity: isTabChanging ? 0 : 1,
//                       transform: isTabChanging ? `translateY(20px)` : `translateY(0px)`,
//                       zIndex: 2,
//                     }}
//                   >
//                     <MemeCard meme={meme} activeOptionsId={activeOptionsId} onOptionsClick={setActiveOptionsId} />
//                   </div>
//                 ))}
//                 {currentMemes.length === 0 && !isLoading && (
//                   <div className="col-span-full bg-white rounded-xl shadow-md p-8 sm:p-12 text-center">
//                     <ImagePlus className="mx-auto h-10 sm:h-12 w-10 sm:w-12 text-gray-400" />
//                     <p className="mt-4 text-gray-500 text-base sm:text-lg">No memes found in this section</p>
//                     <p className="text-gray-400 mt-2 text-sm sm:text-base">
//                       Start uploading or interacting with memes!
//                     </p>
//                   </div>
//                 )}
//               </div>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Upload Button - Only show for own profile */}
//       {isOwnProfile && (
//         <button
//           onClick={() => setIsUploadModalOpen(true)}
//           className="fixed bottom-4 sm:bottom-8 right-4 sm:right-8 bg-blue-600 text-white p-3 sm:p-4 rounded-full shadow-lg hover:bg-blue-700 transition-all hover:scale-110"
//         >
//           <CameraIcon className="w-5 h-5 sm:w-6 sm:h-6" />
//         </button>
//       )}

//       {/* Upload Modal */}
//       {isUploadModalOpen && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-fadeIn">
//           <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-4 sm:p-6 m-4 animate-scaleIn">
//             <div className="flex justify-between items-center mb-4 sm:mb-6">
//               <h3 className="text-lg sm:text-xl font-semibold">Upload Meme</h3>
//               <button
//                 onClick={() => {
//                   setIsUploadModalOpen(false)
//                   resetUpload()
//                 }}
//                 className="text-gray-400 hover:text-gray-600 transition-colors"
//               >
//                 <X className="w-6 h-6" />
//               </button>
//             </div>

//             <div className="space-y-4">
//               {previewUrl ? (
//                 <div className="relative">
//                   {mediaType === "image" ? (
//                     <div className="relative w-full h-48 sm:h-64 rounded-lg bg-gray-100 overflow-hidden">
//                       <img
//                         src={previewUrl || "/placeholder.svg"}
//                         alt="Preview"
//                         className="absolute inset-0 w-full h-full rounded-lg object-contain"
//                         style={{ objectPosition: "center" }}
//                       />
//                     </div>
//                   ) : mediaType === "video" ? (
//                     <div className="relative w-full h-48 sm:h-64 rounded-lg bg-gray-100 overflow-hidden">
//                       <video
//                         src={previewUrl}
//                         className="absolute inset-0 w-full h-full rounded-lg object-contain"
//                         style={{ objectPosition: "center" }}
//                         autoPlay
//                         loop
//                       />
//                     </div>
//                   ) : null}
//                   <button
//                     onClick={resetUpload}
//                     className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
//                   >
//                     <X className="w-5 h-5" />
//                   </button>
//                 </div>
//               ) : (
//                 <div
//                   onClick={() => fileInputRef.current?.click()}
//                   className="border-2 border-dashed border-gray-300 rounded-lg p-6 sm:p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
//                 >
//                   <ImagePlus className="mx-auto h-10 sm:h-12 w-10 sm:w-12 text-gray-400" />
//                   <p className="mt-2 text-sm text-gray-600">Click to select an image or video</p>
//                   <p className="mt-1 text-xs text-gray-400">Supported formats: Images and Videos</p>
//                 </div>
//               )}
//               <input
//                 ref={fileInputRef}
//                 type="file"
//                 accept="image/*, video/*"
//                 onChange={handleFileSelect}
//                 className="hidden"
//               />
//               <input
//                 type="text"
//                 placeholder="Enter meme title"
//                 value={title}
//                 onChange={(e) => setTitle(e.target.value)}
//                 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
//               />
//               <button
//                 onClick={handleUpload}
//                 disabled={!selectedFile || !title.trim()}
//                 className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
//               >
//                 Upload Meme
//               </button>
//               {uploadProgress !== null && (
//                 <div className="w-full bg-gray-200 rounded-full h-2">
//                   <div
//                     className="bg-blue-600 h-2 rounded-full transition-all duration-300"
//                     style={{ width: `${uploadProgress}%` }}
//                   ></div>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Profile Picture Modal */}
//       {isProfilePictureModalOpen && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-fadeIn">
//           <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-4 sm:p-6 m-4 animate-scaleIn">
//             <div className="flex justify-between items-center mb-4 sm:mb-6">
//               <h3 className="text-lg sm:text-xl font-semibold">Update Profile Picture</h3>
//               <button
//                 onClick={() => {
//                   setIsProfilePictureModalOpen(false)
//                   resetProfilePictureUpload()
//                 }}
//                 className="text-gray-400 hover:text-gray-600 transition-colors"
//               >
//                 <X className="w-6 h-6" />
//               </button>
//             </div>

//             <div className="space-y-4">
//               {profilePreviewUrl ? (
//                 <div className="relative">
//                   <img
//                     src={profilePreviewUrl || "/placeholder.svg"}
//                     alt="Profile Preview"
//                     className="w-24 h-24 sm:w-32 sm:h-32 mx-auto rounded-full object-cover"
//                   />
//                   <button
//                     onClick={resetProfilePictureUpload}
//                     className="absolute top-0 right-1/2 transform translate-x-12 sm:translate-x-16 -translate-y-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
//                   >
//                     <X className="w-5 h-5" />
//                   </button>
//                 </div>
//               ) : (
//                 <div
//                   onClick={() => profilePictureInputRef.current?.click()}
//                   className="border-2 border-dashed border-gray-300 rounded-full w-24 h-24 sm:w-32 sm:h-32 mx-auto flex items-center justify-center cursor-pointer hover:border-blue-500 transition-colors"
//                 >
//                   <CameraIcon className="w-8 h-8 text-gray-400" />
//                 </div>
//               )}
//               <input
//                 ref={profilePictureInputRef}
//                 type="file"
//                 accept="image/*"
//                 onChange={handleProfilePictureSelect}
//                 className="hidden"
//               />
//               <button
//                 onClick={handleProfilePictureUpload}
//                 disabled={!selectedProfilePicture}
//                 className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
//               >
//                 Update Profile Picture
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Edit Profile Modal */}
//       {isEditProfileModalOpen && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-fadeIn">
//           <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-4 sm:p-6 m-4 animate-scaleIn">
//             <div className="flex justify-between items-center mb-4 sm:mb-6">
//               <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Edit Profile</h3>
//               <button
//                 onClick={() => {
//                   setIsEditProfileModalOpen(false)
//                 }}
//                 className="text-gray-400 hover:text-gray-600 transition-colors"
//               >
//                 <X className="w-6 h-6" />
//               </button>
//             </div>

//             <div className="space-y-4">
//               <div className="space-y-2">
//                 <label htmlFor="name" className="block text-sm font-medium text-gray-700">
//                   Name
//                 </label>
//                 <input
//                   type="text"
//                   id="name"
//                   value={editName}
//                   onChange={(e) => setEditName(e.target.value)}
//                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
//                 />
//               </div>
//               <button
//                 onClick={handleUpdateProfile}
//                 disabled={!editName.trim()}
//                 className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
//               >
//                 Save Changes
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Followers Modal */}
//       {isFollowersModalOpen && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-fadeIn">
//           <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-4 sm:p-6 m-4 animate-scaleIn">
//             <div className="flex justify-between items-center mb-4 sm:mb-6">
//               <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Followers</h3>
//               <button
//                 onClick={() => setIsFollowersModalOpen(false)}
//                 className="text-gray-400 hover:text-gray-600 transition-colors"
//               >
//                 <X className="w-6 h-6" />
//               </button>
//             </div>

//             <div className="space-y-4">
//               <div className="relative">
//                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                   <Search className="h-5 w-5 text-gray-400" />
//                 </div>
//                 <input
//                   type="text"
//                   placeholder="Search followers..."
//                   value={searchTerm}
//                   onChange={(e) => setSearchTerm(e.target.value)}
//                   className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
//                 />
//               </div>

//               <div className="max-h-80 overflow-y-auto">
//                 {followersLoading ? (
//                   <div className="flex justify-center py-8">
//                     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
//                   </div>
//                 ) : filteredFollowers.length > 0 ? (
//                   <ul className="divide-y divide-gray-200">
//                     {filteredFollowers.map((follower) => (
//                       <li
//                         key={follower.userId}
//                         className="py-3 flex items-center hover:bg-gray-50 rounded-lg px-2 cursor-pointer"
//                         onClick={() => navigateToProfile(follower.username)}
//                       >
//                         <div className="flex-shrink-0 h-10 w-10">
//                           {follower.profilePictureUrl ? (
//                             <img
//                               className="h-10 w-10 rounded-full object-cover"
//                               src={follower.profilePictureUrl || "/placeholder.svg"}
//                               alt={follower.userId}
//                             />
//                           ) : (
//                             <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
//                               {follower.username[0].toUpperCase()}
//                             </div>
//                           )}
//                         </div>
//                         <div className="ml-3 flex-1">
//                           <p className="text-sm font-medium text-gray-900">{follower.username}</p>
//                         </div>
//                       </li>
//                     ))}
//                   </ul>
//                 ) : (
//                   <div className="text-center py-8 text-gray-500">
//                     {searchTerm ? "No followers match your search" : "No followers yet"}
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Following Modal */}
//       {isFollowingModalOpen && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-fadeIn">
//           <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-4 sm:p-6 m-4 animate-scaleIn">
//             <div className="flex justify-between items-center mb-4 sm:mb-6">
//               <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Following</h3>
//               <button
//                 onClick={() => setIsFollowingModalOpen(false)}
//                 className="text-gray-400 hover:text-gray-600 transition-colors"
//               >
//                 <X className="w-6 h-6" />
//               </button>
//             </div>

//             <div className="space-y-4">
//               <div className="relative">
//                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                   <Search className="h-5 w-5 text-gray-400" />
//                 </div>
//                 <input
//                   type="text"
//                   placeholder="Search following..."
//                   value={searchTerm}
//                   onChange={(e) => setSearchTerm(e.target.value)}
//                   className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
//                 />
//               </div>

//               <div className="max-h-80 overflow-y-auto">
//                 {followingLoading ? (
//                   <div className="flex justify-center py-8">
//                     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
//                   </div>
//                 ) : filteredFollowing.length > 0 ? (
//                   <ul className="divide-y divide-gray-200">
//                     {filteredFollowing.map((following) => (
//                       <li
//                         key={following.userId}
//                         className="py-3 flex items-center hover:bg-gray-50 rounded-lg px-2 cursor-pointer"
//                         onClick={() => navigateToProfile(following.username)}
//                       >
//                         <div className="flex-shrink-0 h-10 w-10">
//                           {following.profilePictureUrl ? (
//                             <img
//                               className="h-10 w-10 rounded-full object-cover"
//                               src={following.profilePictureUrl || "/placeholder.svg"}
//                               alt={following.userId}
//                             />
//                           ) : (
//                             <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
//                               {following.username[0].toUpperCase()}
//                             </div>
//                           )}
//                         </div>
//                         <div className="ml-3 flex-1">
//                           <p className="text-sm font-medium text-gray-900">{following.username}</p>
//                         </div>
//                       </li>
//                     ))}
//                   </ul>
//                 ) : (
//                   <div className="text-center py-8 text-gray-500">
//                     {searchTerm ? "No users match your search" : "Not following anyone yet"}
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }

// export default ProfilePage




"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { useMemeContentStore } from "../store/useMemeContentStore"
import { useUserStore } from "../store/useUserStore"
import { toast } from "react-hot-toast"
import { CameraIcon } from "lucide-react"
import { useNavigate, useParams } from "react-router-dom"
import { ProfileHeader } from "../components/profile/ProfileHeader"
import { ProfileTabs } from "../components/profile/ProfileTabs"
import { MemeGrid } from "../components/profile/MemeGrid"
import { UploadModal } from "../components/profile/UploadModal"
import { ProfilePictureModal } from "../components/profile/ProfilePictureModal"
import { EditProfileModal } from "../components/profile/EditProfileModal"
import { FollowersModal } from "../components/profile/FollowersModal"
import { FollowingModal } from "../components/profile/FollowingModal"
import { Meme } from "../types/mems"

type TabType = "uploaded" | "liked" | "saved"

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate()
  const { username } = useParams<{ username: string }>()
  const loggedInUser = JSON.parse(localStorage.getItem("user") || "{}")
  const isOwnProfile = loggedInUser.username === username

  // Store hooks
  const memeList = useMemeContentStore.use.memeList()
  const likedMemes = useMemeContentStore.use.likedMemes()
  const savedMemes = useMemeContentStore.use.savedMemes()
  const isLoading = useMemeContentStore.use.isLoading()
  const uploadMeme = useMemeContentStore.use.uploadMeme()
  const uploadProgress = useMemeContentStore.use.uploadProgress()

  const updateProfilePicture = useUserStore.use.updateProfilePicture()
  const fetchUserProfile = useUserStore.use.fetchUserProfile()
  const profilePictureUrl = useUserStore.use.profilePictureUrl()
  const userName = useUserStore.use.userName()
  const viewedProfilePictureUrl = useUserStore.use.viewedProfilePictureUrl()
  const viewedUserName = useUserStore.use.viewedUserName()
  const updateUserName = useUserStore.use.updateUserName()
  const followersCount = useUserStore.use.followersCount()
  const followingCount = useUserStore.use.followingCount()
  const Followers = useUserStore.use.Followers()
  const Following = useUserStore.use.Following()
  const handleFollowToggle = useUserStore.use.handleFollowToggle()

  // Local state
  const [activeTab, setActiveTab] = useState<TabType>("uploaded")
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isProfilePictureModalOpen, setIsProfilePictureModalOpen] = useState(false)
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false)
  const [isFollowersModalOpen, setIsFollowersModalOpen] = useState(false)
  const [isFollowingModalOpen, setIsFollowingModalOpen] = useState(false)
  const [activeOptionsId, setActiveOptionsId] = useState<string | null>(null)
  const [isTabChanging, setIsTabChanging] = useState(false)
  const [animationDirection, setAnimationDirection] = useState<"left" | "right">("right")
  const [followersLoading, setFollowersLoading] = useState(false)
  const [followingLoading, setFollowingLoading] = useState(false)

  // Profile loading state
  const profileLoadingInitiatedRef = useRef(false)
  const [displayedUsername, setDisplayedUsername] = useState<string | null>(null)
  const profileCache = useUserStore.use.profileCache()
  const loggedInUserProfile = useUserStore.use.loggedInUserProfile()
  const isLoggedInUserProfileLoaded = useUserStore.use.isLoggedInUserProfileLoaded()

  // Follow state helpers
  const isUserFollowing = () => {
    if (!username || isOwnProfile || !Array.isArray(Followers)) return false
    return Followers.some((follower) => follower.userId === loggedInUser.userId)
  }

  const isViewedProfileFollowingUser = () => {
    if (!username || isOwnProfile || !Array.isArray(Following)) return false
    return Following.some((following) => following.userId === loggedInUser.userId)
  }

  // Tab management
  const tabs = [
    { id: "uploaded" as TabType, label: "Uploaded" },
    ...(isOwnProfile
      ? [
          { id: "liked" as TabType, label: "Liked" },
          { id: "saved" as TabType, label: "Saved" },
        ]
      : []),
  ]

  useEffect(() => {
    if (!isOwnProfile && (activeTab === "liked" || activeTab === "saved")) {
      setActiveTab("uploaded")
    }
  }, [isOwnProfile, activeTab])

  // Profile data fetching
  useEffect(() => {
    if (!username) return

    if (displayedUsername !== username) {
      if (!isOwnProfile) {
        useUserStore.setState({
          viewedUserName: username,
        })
      }
      setDisplayedUsername(username)
      profileLoadingInitiatedRef.current = false
    }

    const cachedProfile = profileCache[username]
    const isCacheValid = cachedProfile && Date.now() - cachedProfile.timestamp < 5 * 60 * 1000

    if (profileLoadingInitiatedRef.current) return

    profileLoadingInitiatedRef.current = true

    if (isCacheValid || (isOwnProfile && isLoggedInUserProfileLoaded && loggedInUserProfile)) {
      // Use cached data or logged-in user profile
      if (isOwnProfile && isLoggedInUserProfileLoaded && loggedInUserProfile) {
        const mapMemeData = (memeArray: Meme[]) => {
          return (memeArray || []).map((meme) => ({
            ...meme,
            url: meme.url || meme.mediaUrl,
          }))
        }

        useMemeContentStore.setState({
          memeList: mapMemeData(loggedInUserProfile.memeList),
          likedMemes: mapMemeData(loggedInUserProfile.likedMemes),
          savedMemes: mapMemeData(loggedInUserProfile.savedMemes),
        })
      }
    } else {
      fetchUserProfile(username)
    }

    return () => {
      profileLoadingInitiatedRef.current = false
    }
  }, [
    fetchUserProfile,
    username,
    isOwnProfile,
    isLoggedInUserProfileLoaded,
    loggedInUserProfile,
    profileCache,
    displayedUsername,
  ])

  // Get current memes based on active tab
  const currentMemes =
    activeTab === "uploaded" ? memeList || [] : activeTab === "liked" ? likedMemes || [] : savedMemes || []

  // Tab change handler
  const handleTabChange = (tab: TabType) => {
    if (tab === activeTab) return

    const currentIndex = tabs.findIndex((t) => t.id === activeTab)
    const newIndex = tabs.findIndex((t) => t.id === tab)
    const direction = newIndex > currentIndex ? "right" : "left"

    setAnimationDirection(direction)
    setIsTabChanging(true)

    setTimeout(() => {
      setActiveTab(tab)
      setTimeout(() => {
        setIsTabChanging(false)
      }, 50)
    }, 200)
  }

  // Upload handlers
  const handleUpload = async (file: File, title: string) => {
    await uploadMeme(file, title, profilePictureUrl, loggedInUser.userId)

    if (isOwnProfile) {
      fetchUserProfile(username || "")
    }

    toast.success("Meme uploaded successfully!")
  }

  const handleProfilePictureUpload = async (file: File) => {
    await updateProfilePicture(file, loggedInUser.userId)
    fetchUserProfile(username || "")
    toast.success("Profile picture updated successfully!")
  }

  const handleUpdateProfile = async (name: string) => {
    await updateUserName(loggedInUser.userId, name)
    fetchUserProfile(username || "")
    toast.success("Profile updated successfully!")
  }

  // Follow handler
  const handleFollow = async () => {
    if (!username || isOwnProfile) return

    const isFollowing = isUserFollowing()
    const isBeingFollowed = isViewedProfileFollowingUser()

    setFollowersLoading(true)

    try {
      await handleFollowToggle(isFollowing)

      if (isFollowing) {
        toast.success("Unfollowed user")
      } else if (isBeingFollowed) {
        toast.success("Followed back")
      } else {
        toast.success("Following user")
      }
    } catch (error) {
      console.error("Error toggling follow status:", error)
      toast.error("Failed to update follow status")
    } finally {
      setFollowersLoading(false)
    }
  }

  // Modal handlers
  const openFollowersModal = () => {
    setFollowersLoading(true)
    setIsFollowersModalOpen(true)
    try {
      if (Followers.length === 0) {
        console.warn("No followers data available")
      }
    } catch (error) {
      console.error("Error processing followers data:", error)
    } finally {
      setFollowersLoading(false)
    }
  }

  const openFollowingModal = () => {
    setFollowingLoading(true)
    setIsFollowingModalOpen(true)
    try {
      if (Following.length === 0) {
        console.warn("No following data available")
      }
    } catch (error) {
      console.error("Error fetching following:", error)
    } finally {
      setFollowingLoading(false)
    }
  }

  const navigateToProfile = (userId: string) => {
    navigate(`/profile/${userId}`)
    setIsFollowersModalOpen(false)
    setIsFollowingModalOpen(false)
  }

  // Loading state
  const isCorrectProfileLoaded = isOwnProfile ? !!userName : viewedUserName === username
  const showFullPageLoading = isLoading && !isCorrectProfileLoaded

  if (showFullPageLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ProfileHeader
        isOwnProfile={isOwnProfile}
        profilePictureUrl={profilePictureUrl}
        viewedProfilePictureUrl={viewedProfilePictureUrl}
        userName={userName}
        viewedUserName={viewedUserName}
        memeCount={memeList?.length || 0}
        followersCount={followersCount}
        followingCount={followingCount}
        followersLoading={followersLoading}
        isUserFollowing={isUserFollowing()}
        isViewedProfileFollowingUser={isViewedProfileFollowingUser()}
        onEditProfile={() => {
          setIsEditProfileModalOpen(true)
        }}
        onUpdateProfilePicture={() => setIsProfilePictureModalOpen(true)}
        onOpenFollowers={openFollowersModal}
        onOpenFollowing={openFollowingModal}
        onFollow={handleFollow}
      />

      <ProfileTabs activeTab={activeTab} isOwnProfile={isOwnProfile} onTabChange={handleTabChange} />

      <MemeGrid
        memes={currentMemes}
        isLoading={isLoading}
        isTabChanging={isTabChanging}
        animationDirection={animationDirection}
        activeOptionsId={activeOptionsId}
        onOptionsClick={setActiveOptionsId}
      />

      {/* Upload Button - Only show for own profile */}
      {isOwnProfile && (
        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="fixed bottom-4 sm:bottom-8 right-4 sm:right-8 bg-blue-600 text-white p-3 sm:p-4 rounded-full shadow-lg hover:bg-blue-700 transition-all hover:scale-110"
        >
          <CameraIcon className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      )}

      {/* Modals */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={handleUpload}
        uploadProgress={uploadProgress}
      />

      <ProfilePictureModal
        isOpen={isProfilePictureModalOpen}
        onClose={() => setIsProfilePictureModalOpen(false)}
        onUpload={handleProfilePictureUpload}
      />

      <EditProfileModal
        isOpen={isEditProfileModalOpen}
        onClose={() => setIsEditProfileModalOpen(false)}
        onSave={handleUpdateProfile}
        currentName={userName || ""}
      />

      <FollowersModal
        isOpen={isFollowersModalOpen}
        onClose={() => setIsFollowersModalOpen(false)}
        followers={Followers}
        isLoading={followersLoading}
        onNavigateToProfile={navigateToProfile}
      />

      <FollowingModal
        isOpen={isFollowingModalOpen}
        onClose={() => setIsFollowingModalOpen(false)}
        following={Following}
        isLoading={followingLoading}
        onNavigateToProfile={navigateToProfile}
      />
    </div>
  )
}

export default ProfilePage
