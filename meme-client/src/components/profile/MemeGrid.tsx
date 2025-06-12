"use client"

import type React from "react"
import { ImagePlus } from "lucide-react"
import { MemeCard } from "../mainPage/MemeCard"
import { SkeletonCard } from "../../components/ui/SkeletonCard"
import { TrueMasonryGrid } from "../../components/mainPage/TrueMasonryGrid"
import type { Meme } from "../../types/mems"
import { cn } from "../../hooks/utils"

interface MemeGridProps {
  memes: Meme[]
  isLoading: boolean
  isTabChanging: boolean
  animationDirection: "left" | "right"
  activeOptionsId: string | null
  onOptionsClick: (id: string | null) => void
}

export const MemeGrid: React.FC<MemeGridProps> = ({
  memes,
  isLoading,
  isTabChanging,
  animationDirection,
  activeOptionsId,
  onOptionsClick,
}) => {
  const getContentAnimationClasses = () => {
    if (isTabChanging) {
      return animationDirection === "right" ? "opacity-0 transform translate-x-8" : "opacity-0 transform -translate-x-8"
    }
    return "opacity-100 transform translate-x-0"
  }

  const renderSkeletonCards = () => {
    return Array.from({ length: 9 }, (_, index) => <SkeletonCard key={`skeleton-${index}`} index={index} />)
  }

  return (
    <div className="mt-6 sm:mt-8">
      <div className={cn("transition-all duration-300 ease-in-out", getContentAnimationClasses())}>
        {isLoading ? (
          <TrueMasonryGrid className="px-2 sm:px-4">{renderSkeletonCards()}</TrueMasonryGrid>
        ) : (
          <TrueMasonryGrid className="px-2 sm:px-4">
            {memes.map((meme, index) => (
              <div
                key={meme.id}
                className="transition-all duration-300 ease-in-out"
                style={{
                  animationDelay: `${index * 50}ms`,
                  opacity: isTabChanging ? 0 : 1,
                  transform: isTabChanging ? `translateY(20px)` : `translateY(0px)`,
                  zIndex: 2,
                }}
              >
                <MemeCard meme={meme} activeOptionsId={activeOptionsId} onOptionsClick={onOptionsClick} />
              </div>
            ))}
            {memes.length === 0 && !isLoading && (
              <div className="col-span-full bg-white rounded-xl shadow-md p-8 sm:p-12 text-center w-full">
                <ImagePlus className="mx-auto h-10 sm:h-12 w-10 sm:w-12 text-gray-400" />
                <p className="mt-4 text-gray-500 text-base sm:text-lg">No memes found in this section</p>
                <p className="text-gray-400 mt-2 text-sm sm:text-base">Start uploading or interacting with memes!</p>
              </div>
            )}
          </TrueMasonryGrid>
        )}
      </div>
    </div>
  )
}
