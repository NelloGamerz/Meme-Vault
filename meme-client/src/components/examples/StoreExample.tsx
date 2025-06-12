import React, { useEffect } from 'react';
import { useMemeContentStore } from '../../store/useMemeContentStore';
import { useUserStore } from '../../store/useUserStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { useWebSocketStore } from '../../hooks/useWebSockets';

/**
 * Example component demonstrating how to use the new stores with selectors
 * This component shows how to efficiently subscribe to only the state you need
 */
const StoreExample: React.FC = () => {
  // Use selectors to only subscribe to what we need from each store
  // This prevents unnecessary re-renders when other parts of the store change
  
  // MemeContentStore selectors
  const memes = useMemeContentStore.use.memes();
  const isLoading = useMemeContentStore.use.isLoading();
  const fetchMemes = useMemeContentStore.use.fetchMemes();
  
  // UserStore selectors
  const userName = useUserStore.use.userName();
  const profilePictureUrl = useUserStore.use.profilePictureUrl();
  
  // NotificationStore selectors
  const notifications = useNotificationStore.use.notifications();
  
  // WebSocketStore selector
  const wsClient = useWebSocketStore(state => state.client);
  
  // Example of subscribing to multiple properties at once
  const { searchQuery, error } = useMemeContentStore.use.state('searchQuery', 'error');
  
  // Example of subscribing to multiple actions at once
  const { toggleLike, toggleSave } = useMemeContentStore.use.actions('toggleLike', 'toggleSave');
  
  // Fetch memes when the component mounts
  useEffect(() => {
    fetchMemes();
  }, [fetchMemes]);
  
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Store Example</h2>
      
      {/* User information */}
      <div className="mb-4 p-4 border rounded">
        <h3 className="font-semibold mb-2">User Information</h3>
        <div className="flex items-center">
          {profilePictureUrl ? (
            <img 
              src={profilePictureUrl} 
              alt={userName} 
              className="w-10 h-10 rounded-full mr-2" 
            />
          ) : (
            <div className="w-10 h-10 bg-gray-200 rounded-full mr-2" />
          )}
          <span>{userName || 'Not logged in'}</span>
        </div>
      </div>
      
      {/* WebSocket status */}
      <div className="mb-4 p-4 border rounded">
        <h3 className="font-semibold mb-2">WebSocket Status</h3>
        <div className="flex items-center">
          <span className={`w-3 h-3 rounded-full mr-2 ${wsClient ? 'bg-green-500' : 'bg-red-500'}`} />
          <span>{wsClient ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>
      
      {/* Notifications */}
      <div className="mb-4 p-4 border rounded">
        <h3 className="font-semibold mb-2">Notifications ({notifications.length})</h3>
        {notifications.length > 0 ? (
          <ul className="space-y-2">
            {notifications.slice(0, 3).map(notification => (
              <li key={notification.id} className="p-2 bg-gray-100 rounded">
                {notification.message}
              </li>
            ))}
            {notifications.length > 3 && (
              <li className="text-sm text-gray-500">
                +{notifications.length - 3} more notifications
              </li>
            )}
          </ul>
        ) : (
          <p className="text-gray-500">No notifications</p>
        )}
      </div>
      
      {/* Memes */}
      <div className="p-4 border rounded">
        <h3 className="font-semibold mb-2">Memes</h3>
        
        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => useMemeContentStore.getState().setSearchQuery(e.target.value)}
            placeholder="Search memes..."
            className="w-full p-2 border rounded"
          />
        </div>
        
        {/* Error message */}
        {error && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}
        
        {/* Loading state */}
        {isLoading ? (
          <div className="flex justify-center p-4">
            <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></span>
          </div>
        ) : (
          /* Meme list */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {memes.map(meme => (
              <div key={meme.id} className="border rounded overflow-hidden">
                <img 
                  src={meme.url} 
                  alt={meme.title} 
                  className="w-full h-40 object-cover"
                />
                <div className="p-2">
                  <h4 className="font-medium">{meme.title}</h4>
                  <div className="flex justify-between mt-2">
                    <button 
                      onClick={() => toggleLike(meme.id, userName)}
                      className="text-sm flex items-center"
                    >
                      ❤️ {meme.likeCount}
                    </button>
                    <button 
                      onClick={() => toggleSave(meme.id, userName)}
                      className="text-sm flex items-center"
                    >
                      🔖 {meme.saveCount}
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {memes.length === 0 && !isLoading && (
              <p className="col-span-full text-center text-gray-500 p-4">
                No memes found
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StoreExample;