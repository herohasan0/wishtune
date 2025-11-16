'use client';

import { useState, useEffect } from 'react';

interface PendingStatusBannerProps {
  message?: string;
  isPolling: boolean;
}

export default function PendingStatusBanner({ message, isPolling }: PendingStatusBannerProps) {
  const [timeRemaining, setTimeRemaining] = useState(20);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Reset timer when component mounts
    setTimeRemaining(20);
    setProgress(0);

    const totalDuration = 20000; // 20 seconds in milliseconds
    const interval = 100; // Update every 100ms for smooth animation
    const steps = totalDuration / interval;
    const progressIncrement = 100 / steps;

    let currentStep = 0;
    const progressInterval = setInterval(() => {
      currentStep++;
      const newProgress = Math.min(currentStep * progressIncrement, 100);
      setProgress(newProgress);
      
      // Update countdown
      const remaining = Math.max(0, 20 - (currentStep * interval / 1000));
      setTimeRemaining(Math.ceil(remaining));

      if (currentStep >= steps) {
        clearInterval(progressInterval);
      }
    }, interval);

    return () => clearInterval(progressInterval);
  }, []);

  return (
    <div className="w-full rounded-[32px] border border-[#FFD9B7] bg-white/70 px-8 py-12 shadow-[0_25px_60px_rgba(238,190,146,0.35)]">
      <div className="flex flex-col items-center justify-center gap-8">
        {/* Animated Music Notes */}
        <div className="relative flex items-center justify-center gap-3">
          {/* Floating Music Notes */}
          <div className="absolute -left-8 animate-bounce text-3xl" style={{ animationDelay: '0s', animationDuration: '1.5s' }}>
            🎵
          </div>
          <div className="absolute -left-4 animate-bounce text-3xl" style={{ animationDelay: '0.3s', animationDuration: '1.5s' }}>
            🎶
          </div>
          
          {/* Central Animated Circle */}
          <div className="relative flex h-24 w-24 items-center justify-center">
            {/* Pulsing Rings */}
            <div className="absolute h-24 w-24 rounded-full border-4 border-[#FFD9B7] animate-ping opacity-20"></div>
            <div className="absolute h-20 w-20 rounded-full border-4 border-[#F18A24] animate-pulse"></div>
            <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#F18A24] to-[#EE8220] shadow-lg">
              <svg className="h-8 w-8 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          </div>
          
          <div className="absolute -right-4 animate-bounce text-3xl" style={{ animationDelay: '0.6s', animationDuration: '1.5s' }}>
            🎵
          </div>
          <div className="absolute -right-8 animate-bounce text-3xl" style={{ animationDelay: '0.9s', animationDuration: '1.5s' }}>
            🎶
          </div>
        </div>

        {/* Animated Sound Waves */}
        <div className="flex items-end justify-center gap-1.5 h-16">
          <div className="sound-wave-bar w-2 bg-gradient-to-t from-[#F18A24] to-[#FFD9B7] rounded-full h-4" style={{ animationDelay: '0s' }}></div>
          <div className="sound-wave-bar w-2 bg-gradient-to-t from-[#F18A24] to-[#FFD9B7] rounded-full h-6" style={{ animationDelay: '0.1s' }}></div>
          <div className="sound-wave-bar w-2 bg-gradient-to-t from-[#F18A24] to-[#FFD9B7] rounded-full h-8" style={{ animationDelay: '0.2s' }}></div>
          <div className="sound-wave-bar w-2 bg-gradient-to-t from-[#F18A24] to-[#FFD9B7] rounded-full h-10" style={{ animationDelay: '0.3s' }}></div>
          <div className="sound-wave-bar w-2 bg-gradient-to-t from-[#F18A24] to-[#FFD9B7] rounded-full h-12" style={{ animationDelay: '0.4s' }}></div>
          <div className="sound-wave-bar w-2 bg-gradient-to-t from-[#F18A24] to-[#FFD9B7] rounded-full h-10" style={{ animationDelay: '0.5s' }}></div>
          <div className="sound-wave-bar w-2 bg-gradient-to-t from-[#F18A24] to-[#FFD9B7] rounded-full h-8" style={{ animationDelay: '0.6s' }}></div>
          <div className="sound-wave-bar w-2 bg-gradient-to-t from-[#F18A24] to-[#FFD9B7] rounded-full h-6" style={{ animationDelay: '0.7s' }}></div>
        </div>

        {/* Text and Progress Bar */}
        <div className="w-full space-y-4">
          <div className="text-center">
            <p className="text-lg font-semibold text-[#B95D18] animate-pulse">
              Creating your song...
            </p>
            <p className="mt-2 text-sm text-[#A76B3D]">
              {timeRemaining > 0 
                ? `Your songs will be ready in ${timeRemaining} ${timeRemaining === 1 ? 'second' : 'seconds'}`
                : 'Almost there...'}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="w-full">
            <div className="h-2 w-full overflow-hidden rounded-full bg-[#FFD9B7]/50">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#F18A24] to-[#EE8220] transition-all duration-100 ease-linear"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

