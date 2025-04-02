import { create } from "zustand";
import api from "../hooks/api";
import {
  Meme,
  ApiMeme,
  Comment,
  User,
  Followers,
  Following,
  ApiFollowers,
  ApiFollowing,
} from "../types/mems";
import { AxiosProgressEvent } from "axios";
// import { useParams } from "react-router-dom";

interface MemeStore {
  // [x: string]: unknown;
  isFollowing?: boolean;
  memes: Meme[];
  userMemes: Meme[];
  likedMemes: Meme[];
  profilePictureUrl: string;
  userName: string;
  savedMemes: Meme[];
  Followers: Followers[];
  Following: Following[];
  followingCount: number;
  followersCount: number;
  currentPage: "home" | "profile";
  selectedMeme: Meme | null;
  isLoading: boolean;
  error: string | null;
  uploadProgress: number | null;
  searchQuery: string;
  userCreated: Date;
  fetchMemes: () => Promise<void>;
  searchMemes: (query: string) => Promise<void>;
  fetchMemeById: (id: string) => Promise<Meme | null>;
  fetchUserMemes: (username: string) => Promise<void>;
  fetchLikedMemes: (username: string) => Promise<void>;
  fetchSavedMemes: (username: string) => Promise<void>;
  // fetchUserData: (username: string) => Promise<void>;
  fetchUserProfile: (userId: string) => Promise<void>;
  toggleLike: (id: string, username: string) => Promise<void>;
  toggleSave: (id: string, username: string) => Promise<void>;
  setPage: (page: "home" | "profile") => void;
  setSelectedMeme: (meme: Meme | null) => void;
  setSearchQuery: (query: string) => void;
  addComment: (
    memeId: string,
    username: string,
    text: string,
    profilePictureUrl: string,
    userId: string
  ) => Promise<void>;
  uploadMeme: (
    file: File,
    title: string,
    profilePictureUrl: string,
    username: string
  ) => Promise<void>;
  updateProfilePicture: (file: File, userId: string) => Promise<void>;
  updateUserName: (userId: string, newUsername: string) => Promise<void>;
  deleteMeme: (id: string) => Promise<void>;
  handleFollowToggle: (
    userId: string,
    followingUser: string,
    isFollowing: boolean
  ) => Promise<void>;
  // resetPassword:( password: string, token: string) => Promise<void>;
}

const mapApiMemeToMeme = (apiMeme: ApiMeme): Meme => ({
  id: apiMeme.id,
  url: apiMeme.mediaUrl,
  title: apiMeme.caption,
  uploadedBy: apiMeme.uploadedby,
  uploadDate: new Date(),
  comments: apiMeme.comments || [],
  likeCount: apiMeme.likecount,
  saveCount: apiMeme.saveCount,
  uploader: apiMeme.uploader,
  memeCreated: apiMeme.memeCreated,
  profilePictureUrl: apiMeme.profilePictureUrl,
  userId: apiMeme.userId,
});

export const useMemeStore = create<MemeStore>((set, get) => ({
  memes: [],
  userMemes: [],
  likedMemes: [],
  savedMemes: [],
  Followers: [],
  Following: [],
  followersCount: 0,
  followingCount: 0,
  currentPage: "home",
  selectedMeme: null,
  isLoading: false,
  error: null,
  uploadProgress: null,
  searchQuery: "",
  profilePictureUrl: "",
  userName: "",
  userCreated: new Date(),

  setSearchQuery: (query: string) => set({ searchQuery: query }),

  searchMemes: async (query: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<ApiMeme[]>("/memes/search", {
        params: { query },
      });
      const memes = response.data || [];

      set({
        memes: Array.isArray(memes) ? memes.map(mapApiMemeToMeme) : [],
        searchQuery: query,
      });
    } catch (error) {
      set({
        error: "Failed to search memes",
        memes: [],
      });
      console.error("Error searching memes:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchMemes: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<ApiMeme[]>("/memes");
      const memes = response.data || [];

      set({
        memes: Array.isArray(memes) ? memes.map(mapApiMemeToMeme) : [],
      });
    } catch (error) {
      set({
        error: "Failed to fetch memes",
        memes: [],
      });
      console.error("Error fetching memes:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchMemeById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const memeResponse = await api.get<ApiMeme>(`/memes/memepage/${id}`);
      const meme = memeResponse.data;

      if (meme) {
        const commentsResponse = await api.get<Comment[]>(
          `/memes/${id}/comments`
        );
        const comments = commentsResponse.data || [];

        const mappedMeme = {
          ...mapApiMemeToMeme(meme),
          comments: comments,
        };

        return mappedMeme;
      }
      return null;
    } catch (error) {
      set({
        error: "Failed to fetch meme",
      });
      console.error("Error fetching meme by ID:", error);
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  fetchUserMemes: async (username: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<ApiMeme[]>(`/memes/uploaded/${username}`);
      const memes = response.data || [];

      set({
        userMemes: Array.isArray(memes) ? memes.map(mapApiMemeToMeme) : [],
      });
    } catch (error) {
      set({
        error: "Failed to fetch user memes",
        userMemes: [],
      });
      console.error("Error fetching user memes:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchLikedMemes: async (username: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<ApiMeme[]>(`/memes/liked/${username}`);
      const memes = response.data || [];

      set({
        likedMemes: Array.isArray(memes) ? memes.map(mapApiMemeToMeme) : [],
      });
    } catch (error) {
      set({
        error: "Failed to fetch liked memes",
        likedMemes: [],
      });
      console.error("Error fetching liked memes:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchSavedMemes: async (username: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<ApiMeme[]>(`/memes/saved/${username}`);
      const memes = response.data || [];

      set({
        savedMemes: Array.isArray(memes) ? memes.map(mapApiMemeToMeme) : [],
      });
    } catch (error) {
      set({
        error: "Failed to fetch saved memes",
        savedMemes: [],
      });
      console.error("Error fetching saved memes:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchUserProfile: async (userId: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.get<{
        profilePictureUrl: string;
        savedMemes: ApiMeme[];
        followers: Followers[];
        memeList: ApiMeme[];
        likedMemes: ApiMeme[];
        following: Following[];
        followersCount: number;
        followingCount: number;
        username: string;
        userId: string;
        userCreated: string;
      }>(`/profile/${userId}`);

      const data = response.data;

      // Function to map memes
      const mapToMeme = (memes: ApiMeme[]): Meme[] =>
        memes.map((meme) => ({
          id: meme.id,
          url: meme.mediaUrl,
          title: meme.caption,
          uploader: meme.uploader,
          likeCount: meme.likecount,
          saveCount: meme.saveCount,
          createdAt: meme.memeCreated ? new Date(meme.memeCreated) : new Date(),
          comments: meme.comments || [],
          profilePictureUrl: meme.profilePictureUrl,
          userId: meme.userId,
        }));

      const mapToFollowers = (followers: ApiFollowers[]): Followers[] =>
        followers.map((follower) => ({
          userId: follower.userId,
          username: follower.username || "",
          profilePictureUrl: follower.profilePictureUrl || "",
          isFollow: follower.isFollow,
        }));

      // // Function to map following
      const mapToFollowing = (following: ApiFollowing[]): Following[] =>
        following.map((followingUser) => ({
          userId: followingUser.userId,
          username: followingUser.username || "",
          profilePictureUrl: followingUser.profilePictureUrl || "",
          isFollow: followingUser.isFollow,
        }));

      // Function to map user profile data with followers & following embedded
      const mapToUser = (userData: {
        userId: string;
        username: string;
        profilePictureUrl: string;
        followersCount: number;
        followingCount: number;
        userCreated: string;
        followers: Followers[];
        following: Following[];
      }): User => ({
        userId: userData.userId,
        username: userData.username || "",
        profilePictureUrl: userData.profilePictureUrl || "",
        followersCount: userData.followersCount || 0,
        followingCount: userData.followingCount || 0,
        userCreated: new Date(userData.userCreated),

        // Mapping followers & following inside user
        // followers: mapToFollowers(userData.followers),
        // following: mapToFollowing(userData.following),

        followers: mapToFollowers(userData.followers),
        following: mapToFollowing(userData.following),

        // Default values
        memeList: [],
        likedMeme: [],
        savedMeme: [],
      });

      // Map data using respective functions
      const userProfile = mapToUser(data);
      const userMemes = mapToMeme(data.memeList || []);
      const likedMemes = mapToMeme(data.likedMemes || []);
      const savedMemes = mapToMeme(data.savedMemes || []);
      // const followersList = mapToFollowers(data.followers|| []);
      // const follingList = mapToFollowing(data.followers|| []);

      set({
        // User Data
        // userId: userProfile.userId,
        userName: userProfile.username,
        profilePictureUrl: userProfile.profilePictureUrl,
        userCreated: userProfile.userCreated,
        Followers: userProfile.followers,
        Following: userProfile.following,
        followersCount: userProfile.followersCount,
        followingCount: userProfile.followingCount,

        // Meme Data
        userMemes,
        likedMemes,
        savedMemes,
      });
    } catch (error) {
      set({
        error: "Failed to fetch user data",
        userMemes: [],
        likedMemes: [],
        savedMemes: [],
      });
      console.error("Error fetching user data:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  uploadMeme: async (file: File, title: string, profilePictureUrl: string) => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    set({ uploadProgress: 0, error: null });
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title);
      formData.append("uploader", user.username || user.name || "Anonymous");
      formData.append("profilePictureUrl", profilePictureUrl);
      formData.append("userId", user.userId || "Anonymous");

      const response = await api.post<ApiMeme>("/memes", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent: AxiosProgressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            set({ uploadProgress: progress });
          }
        },
      });

      const newMeme = mapApiMemeToMeme(response.data);
      set((state) => ({
        memes: [newMeme, ...state.memes],
        userMemes: [newMeme, ...state.userMemes],
        uploadProgress: null,
      }));
    } catch (error) {
      set({
        error: "Failed to upload meme",
        uploadProgress: null,
      });
      console.error("Error uploading meme:", error);
    }
  },

  deleteMeme: async (id: string) => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/memes/delete/${id}`);

      // Update local state to remove the deleted meme
      set((state) => ({
        memes: state.memes.filter((meme) => meme.id !== id),
        userMemes: state.userMemes.filter((meme) => meme.id !== id),
      }));

      // Refresh user data to ensure everything is in sync
      if (user.userID) {
        await get().fetchUserProfile(user.userId);
      }
    } catch (error) {
      set({ error: "Failed to delete meme" });
      console.error("Error deleting meme:", error);
      throw error; // Rethrow to handle in component
    } finally {
      set({ isLoading: false });
    }
  },

  updateProfilePicture: async (file: File, userId: string) => {
    set({ isLoading: true, error: null });

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await api.post<{ profilePictureUrl: string }>(
        `profile/upload/${userId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // Update the profile picture in local storage
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      user.profilePicture = response.data.profilePictureUrl;
      localStorage.setItem("user", JSON.stringify(user));
    } catch (error: unknown) {
      let errorMessage = "Failed to update profile picture";

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof (error as { response?: { data?: { error?: string } } })
          .response === "object"
      ) {
        const serverError = (
          error as { response: { data?: { error?: string } } }
        ).response.data;
        errorMessage = serverError?.error ?? errorMessage;
      }

      set({ error: errorMessage });
      console.error("Error updating profile picture:", errorMessage);
    } finally {
      set({ isLoading: false });
    }
  },

  toggleLike: async (id: string, username: string) => {
    try {
      const isLiked = get().likedMemes.some((meme) => meme.id === id);

      await api.post(`/memes/${id}/like`, null, {
        params: { username, like: !isLiked },
      });

      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (user.username) {
        get().fetchLikedMemes(user.username);
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  },

  toggleSave: async (id: string, username: string) => {
    try {
      const isSaved = get().savedMemes.some((meme) => meme.id === id);

      await api.post(`/memes/${id}/save`, null, {
        params: { username, save: !isSaved },
      });

      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (user.username) {
        get().fetchSavedMemes(user.username);
      }
    } catch (error) {
      console.error("Error toggling save:", error);
    }
  },

  setPage: (page) => set({ currentPage: page }),
  setSelectedMeme: (meme) => set({ selectedMeme: meme }),

  addComment: async (
    memeId: string,
    username: string,
    text: string,
    profilePictureUrl: string,
    userId: string
  ) => {
    try {
      await api.post<Comment>(`/memes/${memeId}/comments`, {
        memeId,
        username,
        text,
        profilePictureUrl,
        userId,
      });

      const updatedMeme = await get().fetchMemeById(memeId);
      if (updatedMeme) {
        set((state) => ({
          memes: state.memes.map((meme) =>
            meme.id === memeId ? updatedMeme : meme
          ),
          userMemes: state.userMemes.map((meme) =>
            meme.id === memeId ? updatedMeme : meme
          ),
          likedMemes: state.likedMemes.map((meme) =>
            meme.id === memeId ? updatedMeme : meme
          ),
          savedMemes: state.savedMemes.map((meme) =>
            meme.id === memeId ? updatedMeme : meme
          ),
          selectedMeme:
            state.selectedMeme?.id === memeId
              ? updatedMeme
              : state.selectedMeme,
        }));
      }
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  },

  updateUserName: async (userId: string, newUsername: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.put(`/profile/${userId}/update-username`, {
        newUsername: newUsername,
      });

      if (response.status === 200) {
        const { newToken } = response.data; // Extract new token

        set({ userName: newUsername });

        // Get existing user data from localStorage
        const storedUser = localStorage.getItem("user");

        if (storedUser) {
          const user = JSON.parse(storedUser);
          user.username = newUsername; // Update username
          localStorage.setItem("user", JSON.stringify(user)); // Save updated user back to localStorage
        }

        // Replace the old token with the new one
        localStorage.removeItem("token"); // Remove old token
        localStorage.setItem("token", newToken); // Save new token

        console.log("Username updated and token refreshed.");
      }
    } catch (error) {
      set({ error: "Failed to update username" });
      console.error("Error updating username:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  handleFollowToggle: async (
    userId: string,
    followingUser: string,
    isFollowing: boolean
  ) => {
    const loggedInUser = JSON.parse(localStorage.getItem("user") || "{}");
    // const isOwnProfile = loggedInUser.userId === userId;

    // if (!followingUser || isOwnProfile) return;

    set({ isLoading: true, error: null });

    try {
      await api.post(
        `/profile/${loggedInUser.userId}/follow/${followingUser}`,
        {
          isFollowing: isFollowing,
        }
      );
      console.log("Follow request sent to backend.");
    } catch (error) {
      set({ error: "Failed to toggle follow status" });
      console.error("Error sending follow request:", error);
    } finally {
      set({ isLoading: false });
    }
  },
}));
