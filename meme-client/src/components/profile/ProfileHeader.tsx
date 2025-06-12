"use client"

import type React from "react"
import { Edit2, User, UserPlus, UserCheck } from "lucide-react"

interface ProfileHeaderProps {
  isOwnProfile: boolean
  profilePictureUrl?: string
  viewedProfilePictureUrl?: string
  userName?: string
  viewedUserName?: string
  memeCount: number
  followersCount: number
  followingCount: number
  followersLoading: boolean
  isUserFollowing: boolean
  isViewedProfileFollowingUser: boolean
  onEditProfile: () => void
  onUpdateProfilePicture: () => void
  onOpenFollowers: () => void
  onOpenFollowing: () => void
  onFollow: () => void
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  isOwnProfile,
  profilePictureUrl,
  viewedProfilePictureUrl,
  userName,
  viewedUserName,
  memeCount,
  followersCount,
  followingCount,
  followersLoading,
  isUserFollowing,
  isViewedProfileFollowingUser,
  onEditProfile,
  onUpdateProfilePicture,
  onOpenFollowers,
  onOpenFollowing,
  onFollow,
}) => {
  const displayName = isOwnProfile ? userName : viewedUserName
  const displayPicture = isOwnProfile ? profilePictureUrl : viewedProfilePictureUrl

  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-black opacity-10"></div>
      <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12 md:py-16 relative">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start md:items-center gap-4 sm:gap-8">
            <div className="relative group">
              <div className="w-24 h-24 sm:w-32 sm:h-32 bg-white rounded-full flex items-center justify-center shadow-xl overflow-hidden">
                {displayPicture ? (
                  <img
                    src={displayPicture || "/placeholder.svg"}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl sm:text-5xl font-bold text-blue-600">
                    {displayName?.[0]?.toUpperCase() || "U"}
                  </span>
                )}
              </div>
              {isOwnProfile && (
                <button
                  onClick={onUpdateProfilePicture}
                  className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">{displayName || "User"}</h2>
              <div className="flex items-center justify-center sm:justify-start space-x-4 sm:space-x-6 mt-3 sm:mt-4">
                <div className="text-center">
                  <span className="block text-xl sm:text-2xl font-bold">{memeCount}</span>
                  <span className="text-blue-100 text-sm">Uploads</span>
                </div>
                <div
                  className="text-center cursor-pointer hover:bg-white/10 px-2 py-1 rounded-lg transition-colors"
                  onClick={onOpenFollowers}
                >
                  <span className="block text-xl sm:text-2xl font-bold">{followersCount}</span>
                  <span className="text-blue-100 text-sm">Followers</span>
                </div>
                <div
                  className="text-center cursor-pointer hover:bg-white/10 px-2 py-1 rounded-lg transition-colors"
                  onClick={onOpenFollowing}
                >
                  <span className="block text-xl sm:text-2xl font-bold">{followingCount}</span>
                  <span className="text-blue-100 text-sm">Following</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            {isOwnProfile ? (
              <button
                onClick={onEditProfile}
                className="bg-white/10 backdrop-blur-sm text-white py-2 px-4 rounded-lg flex items-center justify-center space-x-2 hover:bg-white/20 transition-colors border border-white/20 w-full sm:w-auto"
              >
                <User className="w-5 h-5" />
                <span>Edit Profile</span>
              </button>
            ) : (
              <button
                onClick={onFollow}
                disabled={followersLoading}
                className={`${isUserFollowing ? "bg-blue-700" : "bg-white/10"} backdrop-blur-sm text-white py-2 px-4 rounded-lg flex items-center justify-center space-x-2 hover:bg-blue-700 transition-colors border border-white/20 w-full sm:w-auto ${followersLoading ? "opacity-70 cursor-not-allowed" : ""}`}
              >
                {followersLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : isUserFollowing ? (
                  <>
                    <UserCheck className="w-5 h-5" />
                    <span>Following</span>
                  </>
                ) : isViewedProfileFollowingUser ? (
                  <>
                    <UserPlus className="w-5 h-5" />
                    <span>Follow Back</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    <span>Follow</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
