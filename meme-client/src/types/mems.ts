// ... (keep all existing types)

export interface Notification {
  id: string;
  type: "FOLLOW" | "LIKE" | "COMMENT" | "SAVE";
  message: string;
  timestamp: string;
  read: boolean;
  userId: string;
  triggeredBy: string;
  profilePictureUrl?: string;
}

// ... (keep all other existing types)