import type React from "react"
import { useCallback, memo } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { Sidebar } from "./Sidebar"
import { ConnectionStatus } from "../ui/ConnectionStatus"

interface LayoutProps {
  children: React.ReactNode
}

// Use memo to prevent unnecessary re-renders of the entire layout
export const Layout: React.FC<LayoutProps> = memo(({ children }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const pathname = location.pathname

  const handleNavigation = useCallback(
    (path: string) => {
      navigate(path)
    },
    [navigate],
  )

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar onNavigate={handleNavigation} currentPath={pathname} />

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 pb-16 lg:pb-0">
        <div className="min-h-screen">{children}</div>
      </main>
      
      {/* Connection Status Indicator */}
      <ConnectionStatus />
    </div>
  )
})
