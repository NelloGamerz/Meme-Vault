"use client"

import type React from "react"
import { useRef, useState } from "react"
import { X, CameraIcon } from "lucide-react"
import { toast } from "react-hot-toast"

interface ProfilePictureModalProps {
  isOpen: boolean
  onClose: () => void
  onUpload: (file: File) => Promise<void>
}

const validateProfilePicture = (file: File): { valid: boolean; message: string } => {
  if (file.size > 1024 * 1024) {
    return { valid: false, message: "Profile picture must be less than 1MB" }
  }

  if (!file.type.startsWith("image/")) {
    return { valid: false, message: "File must be an image" }
  }

  return { valid: true, message: "" }
}

export const ProfilePictureModal: React.FC<ProfilePictureModalProps> = ({ isOpen, onClose, onUpload }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const resetUpload = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const validation = validateProfilePicture(file)
      if (!validation.valid) {
        toast.error(validation.message)
        return
      }

      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    try {
      await onUpload(selectedFile)
      resetUpload()
      onClose()
    } catch (error) {
      console.error("Profile picture update failed:", error)
    }
  }

  const handleClose = () => {
    resetUpload()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-4 sm:p-6 m-4 animate-scaleIn">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl font-semibold">Update Profile Picture</h3>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          {previewUrl ? (
            <div className="relative">
              <img
                src={previewUrl || "/placeholder.svg"}
                alt="Profile Preview"
                className="w-24 h-24 sm:w-32 sm:h-32 mx-auto rounded-full object-cover"
              />
              <button
                onClick={resetUpload}
                className="absolute top-0 right-1/2 transform translate-x-12 sm:translate-x-16 -translate-y-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-full w-24 h-24 sm:w-32 sm:h-32 mx-auto flex items-center justify-center cursor-pointer hover:border-blue-500 transition-colors"
            >
              <CameraIcon className="w-8 h-8 text-gray-400" />
            </div>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
          <button
            onClick={handleUpload}
            disabled={!selectedFile}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
          >
            Update Profile Picture
          </button>
        </div>
      </div>
    </div>
  )
}
