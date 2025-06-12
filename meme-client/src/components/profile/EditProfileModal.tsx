"use client"

import type React from "react"
import { useState } from "react"
import { X } from "lucide-react"

interface EditProfileModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (name: string) => Promise<void>
  currentName: string
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose, onSave, currentName }) => {
  const [editName, setEditName] = useState(currentName)

  const handleSave = async () => {
    if (!editName.trim()) return

    try {
      await onSave(editName)
      onClose()
    } catch (error) {
      console.error("Profile update failed:", error)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-4 sm:p-6 m-4 animate-scaleIn">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Edit Profile</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              type="text"
              id="name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
            />
          </div>
          <button
            onClick={handleSave}
            disabled={!editName.trim()}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}
