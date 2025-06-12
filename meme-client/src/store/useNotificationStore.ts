import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { createSelectors } from "./createSelectors";
import api from "../hooks/api";
import type { Notification } from "../types/mems";

// Define the store interface
interface NotificationState {
  notifications: Notification[];
  isLoading: boolean;
  error: string | null;
}

interface NotificationActions {
  getNotifications: (username: string) => void;
  addNotification: (notification: Partial<Notification>) => void;
  markAsRead: (notificationId: string) => Promise<void>;
  clearAllNotifications: (username: string) => Promise<void>;
}

export type NotificationStore = NotificationState & NotificationActions;

// Create the store with immer middleware for more efficient updates
const useRawNotificationStore = create<NotificationStore>()(
  immer((set) => ({
    // Initial state
    notifications: [],
    isLoading: false,
    error: null,

    // Fetch notifications
    getNotifications: async (username: string) => {
      try {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        const response = await api.get(`/notifications/${username}`);
        
        // Convert string dates to Date objects
        const processedNotifications = response.data.map((notification: Notification) => ({
          ...notification,
          createdAt: notification.createdAt ? new Date(notification.createdAt) : new Date()
        }));
        
        set((state) => {
          state.notifications = processedNotifications;
          state.isLoading = false;
        });
      } catch (error) {
        console.error(`Error fetching notifications for ${username}:`, error);
        set((state) => {
          state.error = `Failed to fetch notifications for ${username}`;
          state.isLoading = false;
        });
      }
    },

    // Add a new notification
    addNotification: (notification: Partial<Notification>) => {
      set((state) => {
        // Create a new notification with default values for missing fields
        const newNotification: Notification = {
          id: notification.id || `temp-${Date.now()}`,
          type: notification.type || 'SYSTEM',
          message: notification.message || '',
          createdAt: notification.createdAt || new Date(), // Use Date object instead of string
          isRead: notification.isRead || false,
          userId: notification.userId || '',
          targetId: notification.targetId || '',
          sourceUserId: notification.sourceUserId || '',
          sourceUsername: notification.sourceUsername || '',
          sourceProfilePictureUrl: notification.sourceProfilePictureUrl || '',
          // Map fields for compatibility with NotificationsList component
          senderUsername: notification.senderUsername || notification.sourceUsername || '',
          profilePictureUrl: notification.profilePictureUrl || notification.sourceProfilePictureUrl || '',
          read: notification.read || notification.isRead || false,
        };
        
        // Add to the beginning of the array
        state.notifications = [newNotification, ...state.notifications];
      });
    },

    // Mark a notification as read
    markAsRead: async (notificationId: string) => {
      try {
        set((state) => {
          state.notifications = state.notifications.map((notification: Notification) =>
            notification.id === notificationId
              ? { ...notification, isRead: true }
              : notification
          );
        });

        // Update on the server
        await api.put(`/notifications/${notificationId}/read`);
      } catch (error) {
        console.error(`Error marking notification ${notificationId} as read:`, error);
        // Revert the change if the server update fails
        set((state) => {
          state.notifications = state.notifications.map((notification: Notification) =>
            notification.id === notificationId
              ? { ...notification, isRead: false }
              : notification
          );
          state.error = `Failed to mark notification as read`;
        });
      }
    },

    // Clear all notifications
    clearAllNotifications: async (username: string) => {
      try {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        await api.delete(`/notifications/${username}`);
        
        set((state) => {
          state.notifications = [];
          state.isLoading = false;
        });
      } catch (error) {
        console.error(`Error clearing notifications for ${username}:`, error);
        set((state) => {
          state.error = `Failed to clear notifications`;
          state.isLoading = false;
        });
      }
    },
  }))
);

// Create a helper for selectors
export const useNotificationStore = createSelectors<NotificationState, NotificationActions>(useRawNotificationStore);