"use client"

import type React from "react"
import { Upload, Heart, Bookmark } from "lucide-react"
import { cn } from "../../hooks/utils"

type TabType = "uploaded" | "liked" | "saved"

interface Tab {
  id: TabType
  label: string
  icon: React.ComponentType<{ className?: string }>
}

interface ProfileTabsProps {
  activeTab: TabType
  isOwnProfile: boolean
  onTabChange: (tab: TabType) => void
}

export const ProfileTabs: React.FC<ProfileTabsProps> = ({ activeTab, isOwnProfile, onTabChange }) => {
  const tabs: Tab[] = [
    { id: "uploaded", label: "Uploaded", icon: Upload },
    ...(isOwnProfile
      ? [
          { id: "liked" as TabType, label: "Liked", icon: Heart },
          { id: "saved" as TabType, label: "Saved", icon: Bookmark },
        ]
      : []),
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
      <div className="rounded-xl shadow-md backdrop-blur-lg bg-white/80">
        <nav className="flex min-w-full px-4 sm:px-6" aria-label="Tabs">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={cn(
                "py-4 sm:py-6 px-3 sm:px-6 border-b-2 font-medium text-sm whitespace-nowrap flex items-center space-x-1.5 transition-all duration-300 flex-1 sm:flex-none justify-center",
                activeTab === id
                  ? "border-blue-600 text-blue-600 scale-105"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300",
              )}
            >
              <Icon className={cn("w-4 h-4 transition-transform duration-300", activeTab === id && "scale-110")} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  )
}
