'use client'

import { useState } from 'react'
import CafeBarHero from '@/components/cafe-bar/CafeBarHero'
import MenuHighlights from '@/components/cafe-bar/MenuHighlights'
import SpeakeasyFeature from '@/components/cafe-bar/SpeakeasyFeature'
import Gallery from '@/components/cafe-bar/Gallery'

export default function CafeBarPageClient() {
  const [mode, setMode] = useState<'cafe' | 'bar'>('cafe')

  return (
    <>
      <CafeBarHero mode={mode} onModeChange={setMode} />
      {mode === 'cafe' ? <MenuHighlights /> : <SpeakeasyFeature />}
      <Gallery mode={mode} />
    </>
  )
}
