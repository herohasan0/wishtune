'use client';

import {
  useRef,
  useState,
  useEffect,
  type CSSProperties,
  type ChangeEvent,
} from 'react';

interface SongPlayerProps {
  /** The audio URL to play */
  audioUrl: string;
  /** Unique identifier for this song variation */
  variationId: string;
  /** Callback when play state changes */
  onPlayStateChange?: (isPlaying: boolean) => void;
  /** Whether the audio is currently unavailable */
  disabled?: boolean;
  /** The ID of the currently playing variation (to pause others) */
  currentlyPlayingId?: string | null;
}

export default function SongPlayer({
  audioUrl,
  variationId,
  onPlayStateChange,
  disabled = false,
  currentlyPlayingId = null,
}: SongPlayerProps): React.JSX.Element {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const formatTime = (seconds: number) => {
    if (!seconds || Number.isNaN(seconds)) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60)
      .toString()
      .padStart(2, '0');
    return `${minutes}:${secs}`;
  };

  useEffect(() => {
    if (currentlyPlayingId && currentlyPlayingId !== variationId && isPlaying) {
      audioRef.current?.pause();
    }
  }, [currentlyPlayingId, variationId, isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      onPlayStateChange?.(false);
    };

    const handleError = (e: ErrorEvent) => {
      console.error('Audio playback error:', e);
      setError('Error playing audio');
      setIsPlaying(false);
      onPlayStateChange?.(false);
    };

    const handlePlay = () => {
      setIsPlaying(true);
      setError(null);
      onPlayStateChange?.(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
      onPlayStateChange?.(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError as EventListener);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError as EventListener);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [onPlayStateChange]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  const handleTogglePlay = async () => {
    if (!audioRef.current || disabled) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        await audioRef.current.play();
      }
    } catch (err) {
      console.error('Play error:', err);
      setError('Unable to play audio');
      setIsPlaying(false);
      onPlayStateChange?.(false);
    }
  };

  const handleSliderChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current || disabled) return;
    const newTime = Number(event.target.value);
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;
  const sliderStyles = {
    '--progress': `${progressPercent}%`,
  } as CSSProperties;

  return (
    <div className="w-full">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      <div className="flex items-center gap-4">
        <button
          onClick={handleTogglePlay}
          disabled={disabled}
          className={`flex h-14 w-14 items-center justify-center rounded-full border-2 transition-all ${
            disabled
              ? 'border-[#E0CFC0] bg-[#F6ECE4] text-[#C4A991] cursor-not-allowed'
              : isPlaying
                ? 'border-[#FFB46A] bg-[#FF8D24] text-white'
                : 'border-[#F3C99B] bg-white text-[#D46F1C] hover:bg-[#FFF3E6]'
          }`}
          title={
            disabled
              ? 'Audio not available'
              : isPlaying
                ? 'Pause song'
                : 'Play song'
          }
        >
          {isPlaying ? (
            <svg width="16" height="20" viewBox="0 0 12 16" fill="none">
              <rect width="4" height="16" rx="1.5" fill="currentColor" />
              <rect x="8" width="4" height="16" rx="1.5" fill="currentColor" />
            </svg>
          ) : (
            <svg width="16" height="18" viewBox="0 0 14 18" fill="none">
              <path
                d="M1 1L13 9L1 17V1Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>

        <div className="flex-1 space-y-2">
          <input
            type="range"
            min={0}
            max={duration || 1}
            step="0.01"
            value={duration ? currentTime : 0}
            onChange={handleSliderChange}
            disabled={disabled}
            className="song-slider"
            style={sliderStyles}
          />
          <div className="flex justify-between text-xs font-semibold text-[#C08B63]">
            <span>{formatTime(currentTime)}</span>
            <span>
              {duration ? formatTime(duration) : disabled ? '--:--' : '0:00'}
            </span>
          </div>
        </div>
      </div>

      {error && (
        <p className="mt-2 text-xs font-medium text-red-500">{error}</p>
      )}
    </div>
  );
}

