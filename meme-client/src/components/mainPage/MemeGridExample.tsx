"use client"

import type React from "react"
import { useState } from "react"
import { MemeCard } from "./MemeCard"
import { TrueMasonryGrid } from "./TrueMasonryGrid"
import type { Meme } from "../../types/mems"

interface MemeGridProps {
  memes: Meme[]
}

export const MemeGrid: React.FC<MemeGridProps> = ({ memes }) => {
  const [activeOptionsId, setActiveOptionsId] = useState<string | null>(null)

  const handleOptionsClick = (id: string | null) => {
    setActiveOptionsId(id)
  }

  return (
    <div className="min-h-screen bg-white">
      <TrueMasonryGrid>
        {memes.map((meme) => (
          <MemeCard key={meme.id} meme={meme} activeOptionsId={activeOptionsId} onOptionsClick={handleOptionsClick} />
        ))}
      </TrueMasonryGrid>
    </div>
  )
}
