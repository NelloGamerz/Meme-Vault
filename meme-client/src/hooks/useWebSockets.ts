import { create } from "zustand";

const WS_URL = import.meta.env.VITE_WEBSOCKET_URL

interface WebSocketStore {
  client: WebSocket | null;
  isConnected: boolean;
  error: string | null;
  connect: (userId: string) => void;
  disconnect: () => void;
  restoreConnection: () => void;
}

export const useWebSocketStore = create<WebSocketStore>((set, get) => ({
  client: null,
  isConnected: false,
  error: null,

  connect: (userId: string) => {
    if (get().client) {
      get().disconnect();
    }

    try {
      const socket = new WebSocket(`${WS_URL}?userId=${userId}`);

      socket.onopen = () => {
        set({ isConnected: true, error: null });
      };

      socket.onclose = (event) => {
        set({ isConnected: false, client: null });

        if (event.code !== 1000) {
          setTimeout(() => {
            if (get().client === null) {
              get().connect(userId);
            }
          }, 3000);
        }
      };

      socket.onerror = (error) => {
        console.error("WebSocket error:", error);
        set({ error: "WebSocket connection error" });
      };

      // socket.onmessage = (event) => {
      //   try {
      //     const data = JSON.parse(event.data);
      //     console.log("WebSocket message received:", data);
      //     // Handle global messages here if needed
      //   } catch (error) {
      //     console.error("Error parsing WebSocket message:", error);
      //   }
      // };

      socket.onmessage = () => {
      };

      set({ client: socket });
    } catch (error) {
      console.error("Error creating WebSocket connection:", error);
      set({ error: "Failed to establish WebSocket connection" });
    }
  },

  restoreConnection: () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user && user.userId) {
      get().connect(user.userId);
    }
  },

  disconnect: () => {
    const { client } = get();
    if (client) {
      client.close(1000, "User logged out");
      set({ client: null, isConnected: false });
    }
  },
}));
