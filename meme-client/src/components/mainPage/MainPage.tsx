{/* Add the import at the top */}
import { NotificationPanel } from './NotificationPanel';

{/* Add the NotificationPanel component in the navigation bar */}
<div className="hidden md:flex items-center space-x-4">
  <NotificationPanel />
  <button
    className="flex items-center space-x-2 hover:text-blue-600 transition-colors"
    onClick={handleProfileNavigation}
  >
    {profilePictureUrl ? (
      <img
        src={profilePictureUrl}
        alt="User Profile"
        className="h-8 w-8 rounded-full border border-gray-300 object-cover"
      />
    ) : (
      <User className="h-5 w-5 text-gray-500" />
    )}
    <span className="text-gray-700">{user.username || "User"}</span>
  </button>
  <Button variant="secondary" icon={LogOut} onClick={handleLogout} className="ml-2">
    Logout
  </Button>
</div>