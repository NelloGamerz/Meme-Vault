"use client"

import type React from "react"

interface TrueMasonryGridProps {
  children: React.ReactNode
  className?: string
}

export const TrueMasonryGrid: React.FC<TrueMasonryGridProps> = ({ children, className = "" }) => {
  return (
    <div className={`w-full ${className}`}>
      <div
        className="columns-2 sm:columns-2 md:columns-2 lg:columns-3 xl:columns-3 2xl:columns-3"
        style={{
          columnFill: "balance",
          columnWidth: "minmax(350px, 1fr)",
        }}
      >
        {children}
      </div>
    </div>
  )
}
