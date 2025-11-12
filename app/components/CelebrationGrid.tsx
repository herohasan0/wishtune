'use client';

import Image from 'next/image';

/**
 * Background grid for celebration photos.
 * Add your celebration photos to the public/grid folder
 * and update the celebrationPhotos array below.
 */

const celebrationPhotos = [
  '/grid/grid-1.jpg',
  '/grid/grid-2.jpg',
  '/grid/grid-3.jpg',
  '/grid/grid-4.jpg',
  '/grid/grid-5.jpg',
  '/grid/grid-6.jpg',
  '/grid/grid-7.jpg',
  '/grid/grid-8.jpg',
];

export default function CelebrationGrid() {
  // Responsive grid - 2 cols mobile, 3 tablet, 4 desktop
  const gridSize = 12;
  const gridItems = Array.from({ length: gridSize }, (_, i) => {
    return (
      <div
        key={i}
        className="relative w-full h-full overflow-hidden bg-white/40 backdrop-blur-[2px]"
      >
        <Image 
          src={celebrationPhotos[i % celebrationPhotos.length]} 
          alt="" 
          fill
          className="object-cover" 
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
      </div>
    );
  });

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Grid Background - no gaps, fills entire screen */}
      <div className="absolute inset-0 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 auto-rows-fr">
        {gridItems}
      </div>
      
      {/* Gradient Overlays - lighter to show the grid */}
      <div className="absolute inset-0 bg-linear-to-b from-background/70 via-background/50 to-background/70" />
      <div className="absolute inset-0 bg-linear-to-r from-background/60 via-transparent to-background/60" />
      
      {/* Center spotlight effect - lighter */}
      <div className="absolute inset-0" 
           style={{
             background: 'radial-gradient(circle at center, transparent 20%, var(--color-background) 85%)'
           }} 
      />
    </div>
  );
}

