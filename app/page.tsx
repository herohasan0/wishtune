'use client';

import { useState } from 'react';
import CelebrationGrid from './components/CelebrationGrid';

export default function Home() {
  const [name, setName] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('');

  const musicStyles = [
    { id: 'pop', label: '🎵 Pop', description: 'Upbeat and catchy' },
    { id: 'classical', label: '🎹 Classical', description: 'Elegant and timeless' },
    { id: 'jazz', label: '🎷 Jazz', description: 'Smooth and sophisticated' },
    { id: 'rock', label: '🎸 Rock', description: 'Energetic and fun' },
    { id: 'lullaby', label: '🌙 Lullaby', description: 'Gentle and soothing' },
    { id: 'disco', label: '✨ Disco', description: 'Groovy and fun' },
  ];

  const handleCreate = () => {
    if (name.trim() && selectedStyle) {
      // TODO: Handle song creation
      console.log('Creating song for:', name, 'Style:', selectedStyle);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-8 sm:py-12 relative">
      <CelebrationGrid />
      <div className="w-full max-w-2xl relative z-10">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-main-text mb-2 sm:mb-4">
            🎉 WishTune
          </h1>
          <p className="text-lg sm:text-xl text-main-text/70">
            Create a special song for your celebration
          </p>
        </div>

        {/* Main Form Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 md:p-12 border-3 sm:border-4 border-accent-3/30">
          {/* Name Input */}
          <div className="mb-6 sm:mb-8">
            <label 
              htmlFor="name" 
              className="block text-xl sm:text-2xl font-semibold text-main-text mb-2 sm:mb-3"
            >
              Who is this song for?
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter a name..."
              className="w-full px-4 py-3 sm:px-6 sm:py-4 text-lg sm:text-xl rounded-xl sm:rounded-2xl border-3 border-primary/20 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/20 transition-all text-main-text placeholder:text-main-text/40"
            />
          </div>

          {/* Style Selection */}
          <div className="mb-8 sm:mb-10">
            <label className="block text-xl sm:text-2xl font-semibold text-main-text mb-3 sm:mb-4">
              Choose a music style
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {musicStyles.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style.id)}
                  className={`p-4 rounded-xl border-3 text-left transition-all active:scale-95 ${
                    selectedStyle === style.id
                      ? 'border-primary bg-primary/10 shadow-md'
                      : 'border-gray-200 hover:border-primary/40 hover:bg-primary/5'
                  }`}
                >
                  <div className="text-lg sm:text-xl font-semibold text-main-text mb-1">
                    {style.label}
                  </div>
                  <div className="text-sm text-main-text/60">
                    {style.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Create Button */}
          <button
            onClick={handleCreate}
            disabled={!name.trim() || !selectedStyle}
            className={`w-full py-4 sm:py-5 px-6 sm:px-8 rounded-xl sm:rounded-2xl text-xl sm:text-2xl font-bold text-white transition-all transform active:scale-95 ${
              name.trim() && selectedStyle
                ? 'bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl'
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            {name.trim() && selectedStyle
              ? `🎵 Create Song for ${name}`
              : '🎵 Create Song'}
          </button>
        </div>

        {/* Footer Note */}
        <p className="text-center text-main-text/50 mt-6 sm:mt-8 text-sm px-4">
          Perfect for birthdays, celebrations, and special moments
        </p>
      </div>
    </main>
  );
}
