import type React from "react"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { LogOut, User, Search, Menu, X } from "lucide-react"
import { useAuth } from "../hooks/useAuth"
import { Button } from "../components/ui/Button"
import { useMemeStore } from "../store/useMemeStore"
import { MemeCard } from "../components/mainPage/MemeCard"
import { useWebSocketStore } from "../hooks/useWebSockets"

export const MainPage: React.FC = () => {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem("user") || "{}")
  const {
    memes,
    fetchMemes,
    searchMemes,
    isLoading,
    error,
    profilePictureUrl,
    fetchUserProfile
  } = useMemeStore()
  
  const [searchQuery, setSearchQuery] = useState("")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isSearchActive, setIsSearchActive] = useState(false)

  useEffect(() => {
    useWebSocketStore.getState().restoreConnection();
  }, []);

  useEffect(() => {
    fetchMemes();
    fetchUserProfile(user.userId)
  }, [fetchMemes, fetchUserProfile, user.userId])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      searchMemes(searchQuery.trim())
      setIsSearchActive(true)
    } else {
      fetchMemes()
      setIsSearchActive(false)
    }
    setMobileMenuOpen(false)
  }

  const handleLogout = () => {
    logout()
    navigate("/auth")
  }

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  const handleBackToMain = () => {
    setSearchQuery("")
    fetchMemes()
    setIsSearchActive(false)
  }

  const handleProfileNavigation = async () => {
    try {
      await fetchUserProfile(user.userId)
      navigate(`/profile/${user.userId}`)
    } catch (error) {
      console.error("Error fetching profile:", error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <nav className="shadow-sm sticky top-0 z-10 backdrop-blur-md bg-white/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo - always visible */}
            <div className="flex items-center cursor-pointer h-full" onClick={() => navigate("/")}>
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
                MemeVault
              </h1>
            </div>

            {/* Search bar - hidden on mobile, visible on medium screens and up */}
            <div className="hidden md:flex flex-1 max-w-xl mx-4 lg:mx-8 items-center">
              <form onSubmit={handleSearch} className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search memes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-20 py-2 bg-gray-50 border-2 border-blue-800 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-1 text-blue-700 rounded-full focus:outline-none"
                >
                  Search
                </button>
              </form>
            </div>

            {/* User controls - hidden on mobile, visible on medium screens and up */}
            <div className="hidden md:flex items-center space-x-4">
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

            {/* Mobile menu button - visible only on small screens */}
            <div className="flex items-center md:hidden">
              <button
                onClick={toggleMobileMenu}
                className="p-2 rounded-md text-gray-700 hover:text-blue-600 focus:outline-none"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu - slides down when open */}
        <div className={`md:hidden ${mobileMenuOpen ? "block" : "hidden"} transition-all duration-300 ease-in-out`}>
          <div className="px-4 pt-2 pb-4 space-y-4 bg-white/95 shadow-lg">
            {/* Mobile search */}
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search memes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border-2 border-blue-800 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-600 hover:text-blue-800"
              >
                Search
              </button>
            </form>

            {/* Mobile user controls */}
            <div className="flex flex-col space-y-3">
              <button
                className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-md w-full text-left"
                onClick={() => {
                  handleProfileNavigation()
                  setMobileMenuOpen(false)
                }}
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
              <Button variant="secondary" icon={LogOut} onClick={handleLogout} className="w-full justify-center">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
        {isSearchActive && (
          <button
            onClick={handleBackToMain}
            className="mb-4 flex items-center text-blue-600 hover:text-blue-800 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to all memes
          </button>
        )}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="text-center text-red-600 p-4">{error}</div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:gap-6 md:gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {memes.map((meme) => (
              <MemeCard key={meme.id} meme={meme} />
            ))}
            {memes.length === 0 && (
              <div className="col-span-full text-center py-8 sm:py-12">
                <p className="text-gray-500 text-lg">No memes found</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}