"use client"

import type React from "react"
import { useRef, useState } from "react"
import { X, ImagePlus } from "lucide-react"
import { toast } from "react-hot-toast"

type MediaType = "image" | "video" | null

interface UploadModalProps {
  isOpen: boolean
  onClose: () => void
  onUpload: (file: File, title: string) => Promise<void>
  uploadProgress: number | null
}

const validateMeme = async (file: File): Promise<{ valid: boolean; message: string }> => {
  if (file.size > 5 * 1024 * 1024) {
    return { valid: false, message: "Meme file must be less than 5MB" }
  }

  if (file.type.startsWith("image/")) {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        if (img.width < 200 || img.height < 200) {
          resolve({ valid: false, message: "Image dimensions must be at least 200x200 pixels" })
        } else {
          resolve({ valid: true, message: "" })
        }
      }
      img.onerror = () => {
        resolve({ valid: false, message: "Invalid image file" })
      }
      img.src = URL.createObjectURL(file)
    })
  }

  if (file.type.startsWith("video/")) {
    return { valid: true, message: "" }
  }

  return { valid: false, message: "Unsupported file format" }
}

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onUpload, uploadProgress }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [mediaType, setMediaType] = useState<MediaType>(null)
  const [title, setTitle] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const resetUpload = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setMediaType(null)
    setTitle("")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      if (file.type.startsWith("image/")) {
        const validation = await validateMeme(file)
        if (!validation.valid) {
          toast.error(validation.message)
          return
        }

        setMediaType("image")
        setSelectedFile(file)
        setPreviewUrl(URL.createObjectURL(file))
      } else if (file.type.startsWith("video/")) {
        const validation = await validateMeme(file)
        if (!validation.valid) {
          toast.error(validation.message)
          return
        }

        setMediaType("video")
        setSelectedFile(file)
        setPreviewUrl(URL.createObjectURL(file))
      } else {
        toast.error("Please select an image or video file")
      }
    } catch (error) {
      console.error("File validation error:", error)
      toast.error("Error validating file. Please try again.")
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !title.trim()) return

    try {
      await onUpload(selectedFile, title)
      resetUpload()
      onClose()
    } catch (error) {
      console.error("Upload failed:", error)
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
          <h3 className="text-lg sm:text-xl font-semibold">Upload Meme</h3>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          {previewUrl ? (
            <div className="relative">
              {mediaType === "image" ? (
                <div className="relative w-full h-48 sm:h-64 rounded-lg bg-gray-100 overflow-hidden">
                  <img
                    src={previewUrl || "/placeholder.svg"}
                    alt="Preview"
                    className="absolute inset-0 w-full h-full rounded-lg object-contain"
                    style={{ objectPosition: "center" }}
                  />
                </div>
              ) : mediaType === "video" ? (
                <div className="relative w-full h-48 sm:h-64 rounded-lg bg-gray-100 overflow-hidden">
                  <video
                    src={previewUrl}
                    className="absolute inset-0 w-full h-full rounded-lg object-contain"
                    style={{ objectPosition: "center" }}
                    autoPlay
                    loop
                  />
                </div>
              ) : null}
              <button
                onClick={resetUpload}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 sm:p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
            >
              <ImagePlus className="mx-auto h-10 sm:h-12 w-10 sm:w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">Click to select an image or video</p>
              <p className="mt-1 text-xs text-gray-400">Supported formats: Images and Videos</p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*, video/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <input
            type="text"
            placeholder="Enter meme title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
          />
          <button
            onClick={handleUpload}
            disabled={!selectedFile || !title.trim()}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
          >
            Upload Meme
          </button>
          {uploadProgress !== null && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
