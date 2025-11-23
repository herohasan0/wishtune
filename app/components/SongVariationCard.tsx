import SongPlayer from './SongPlayer';

interface SongVariation {
  id: string;
  title: string;
  duration: string;
  audioUrl?: string;
  videoUrl?: string;
  imageUrl?: string;
  status?: string;
}

interface SongVariationCardProps {
  variation: SongVariation;
  index: number;
  songName: string;
  isPlaying: boolean;
  isReady: boolean;
  copiedId: string | null;
  currentlyPlayingId: string | null;
  onPlayStateChange: (variationId: string, isPlaying: boolean) => void;
  onDownload: (songName: string, variationTitle: string, audioUrl?: string) => void;
  onShare: (songId: string, variationId: string, audioUrl?: string, songName?: string) => void;
  songId: string;
}

export default function SongVariationCard({
  variation,
  index,
  songName,
  isPlaying,
  isReady,
  copiedId,
  currentlyPlayingId,
  onPlayStateChange,
  onDownload,
  onShare,
  songId,
}: SongVariationCardProps) {
  return (
    <div
      className={`flex h-full flex-col rounded-[32px] border border-[#F5DCC7] bg-white/90 px-6 py-6 transition-transform sm:px-7 sm:py-7 ${
        isPlaying ? 'border-[#F39A43]' : ''
      }`}
    >
      {/* Album Cover */}
      <div className="mb-5 flex justify-center">
        <div className="relative aspect-square w-full max-w-[180px] overflow-hidden rounded-2xl shadow-lg">
          {variation.imageUrl ? (
            <img
              src={variation.imageUrl}
              alt={`Album cover for ${variation.title || `Song ${index + 1}`}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#F8E4D0] to-[#E8C4A8]">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                className="text-[#C49A6C]"
              >
                <path
                  d="M9 18V5l12-2v13"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="2" />
                <circle cx="18" cy="16" r="3" stroke="currentColor" strokeWidth="2" />
              </svg>
            </div>
          )}
          {isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <div className="flex items-end gap-1">
                <span className="h-3 w-1 animate-pulse rounded-full bg-white" style={{ animationDelay: '0ms' }} />
                <span className="h-5 w-1 animate-pulse rounded-full bg-white" style={{ animationDelay: '150ms' }} />
                <span className="h-4 w-1 animate-pulse rounded-full bg-white" style={{ animationDelay: '300ms' }} />
                <span className="h-6 w-1 animate-pulse rounded-full bg-white" style={{ animationDelay: '450ms' }} />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase text-[#C0772C]">
          {variation.title || `Song Vibe ${index + 1}`}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="text-3xl font-bold text-[#3B1E0F] sm:text-4xl">
            Song Option {index + 1}
          </h3>
          {isPlaying && (
            <span className="rounded-full bg-[#FFF2E3] px-3 py-1 text-xs font-semibold text-[#D6721E]">
              Now Playing
            </span>
          )}
        </div>
        <p className="text-sm text-[#A98267]">
          Personalized AI · {variation.duration || '—'}
        </p>
      </div>

      <div className="mt-6 rounded-[26px] border border-[#F4D8C1] bg-[#FFF8EF] p-4">
        {isReady && variation.audioUrl ? (
          <SongPlayer
            audioUrl={variation.audioUrl}
            variationId={variation.id}
            disabled={!isReady}
            onPlayStateChange={(playing) => onPlayStateChange(variation.id, playing)}
            currentlyPlayingId={currentlyPlayingId}
          />
        ) : (
          <div className="flex flex-col gap-1 text-sm font-medium text-[#B48B70]">
            <span>We&apos;re polishing this track...</span>
            <span className="text-xs text-[#C07B3F]">
              Processing · usually under a minute
            </span>
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={() => onDownload(songName, variation.title, variation.audioUrl)}
          disabled={!isReady || !variation.audioUrl}
          className={`flex h-14 flex-1 items-center justify-center gap-3 rounded-2xl text-base font-semibold transition-all ${
            isReady && variation.audioUrl
              ? 'bg-[#F28C1C] text-white hover:bg-[#E67805]'
              : 'cursor-not-allowed bg-[#F5E6D8] text-[#C7A285]'
          }`}
          title={variation.audioUrl ? 'Download song' : 'Download not available'}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 5v10m0 0 4-4m-4 4-4-4M5 19h14"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Download
        </button>

        <button
          onClick={() => onShare(songId, variation.id, variation.audioUrl, songName)}
          className={`flex h-14 w-14 items-center justify-center rounded-full border-2 transition-all ${
            copiedId === variation.id
              ? 'border-[#7AC47A] bg-[#E6F8E6] text-[#2F8F2F]'
              : 'border-[#F1C9A6] bg-white text-[#D26A1A] hover:bg-[#FFF2E3]'
          }`}
          title="Share song"
        >
          {copiedId === variation.id ? (
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path
                d="M4 10.5 8 14l8-8"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 5.4 9 8.6m6 9.9-6-3.2"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle cx="18" cy="4.5" r="2.5" stroke="currentColor" strokeWidth="1.8" />
              <circle cx="5.5" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.8" />
              <circle cx="18" cy="19.5" r="2.5" stroke="currentColor" strokeWidth="1.8" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

